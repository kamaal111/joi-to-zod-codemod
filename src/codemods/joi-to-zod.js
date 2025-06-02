/**
 * @fileoverview Joi to Zod Codemod
 *
 * This jscodeshift codemod automatically transforms Joi schema definitions to their equivalent
 * Zod schemas in JavaScript and TypeScript files. It handles complex scenarios including:
 *
 * - Global variable and enum references within schemas
 * - Nested object and array schemas
 * - Validation rules and constraints
 * - Import statement management (removes Joi, adds Zod)
 *
 * The transformation process:
 * 1. Analyzes the AST to find global enums and variables that may be referenced
 * 2. Identifies Joi schema variable declarations
 * 3. Extracts schemas with their dependencies for proper evaluation
 * 4. Converts Joi schemas to JSON Schema, then to Zod using established libraries
 * 5. Replaces original declarations and updates imports
 *
 * Usage: npx jscodeshift -t joi-to-zod.js <file-pattern>
 *
 * @author Kamaal Farah
 * @license https://github.com/kamaal111/joi-to-zod-codemod/blob/main/LICENSE
 */

import Joi from 'joi';
import ts from 'typescript';
import joiToJson from 'joi-to-json';
import { jsonSchemaToZod } from 'json-schema-to-zod';

/**
 * Type definitions for jscodeshift API and AST node types used throughout this codemod.
 * These types provide IntelliSense support and help ensure type safety during development.
 *
 * @typedef {import('jscodeshift').FileInfo} FileInfo
 * @typedef {import('jscodeshift').API} API
 * @typedef {import('jscodeshift').JSCodeshift} JSCodeshift
 * @typedef {import('jscodeshift').Collection} Collection
 * @typedef {import('jscodeshift').TSEnumDeclaration} TSEnumDeclaration
 * @typedef {import('jscodeshift').Collection<import('jscodeshift').TSEnumDeclaration>} TSEnumDeclarationCollection
 * @typedef {import('jscodeshift').ASTPath<import('jscodeshift').TSEnumDeclaration>} TSEnumDeclarationPath
 * @typedef {import('jscodeshift').VariableDeclarator} VariableDeclarator
 * @typedef {import('jscodeshift').ASTPath<import('jscodeshift').VariableDeclarator>} VariableDeclaratorPath
 * @typedef {import('jscodeshift').Collection<import('jscodeshift').VariableDeclaration>} VariableDeclarationCollection
 */

/**
 * Main transformation function that converts Joi schemas to Zod schemas in a JavaScript/TypeScript file.
 * This is the entry point for the jscodeshift codemod that performs the following operations:
 * 1. Extracts global enums and variables that may be referenced by Joi schemas
 * 2. Replaces Joi schema variable declarations with equivalent Zod schemas
 * 3. Removes the original Joi import statements
 * 4. Adds a Zod import at the top of the file
 *
 * @param {FileInfo} fileInfo - The file information object containing the source code and file path
 * @param {API} api - The jscodeshift API object providing transformation utilities
 * @returns {string} The transformed source code with Joi schemas converted to Zod
 *
 * @example
 * ```js
 * // Input:
 * import Joi from 'joi';
 * const schema = Joi.string().required();
 * ```
 *
 * ```js
 * // Output:
 * import z from "zod"
 * const schema = z.string();
 * ```
 */
function transform(fileInfo, api) {
  const j = api.jscodeshift;
  const source = j(fileInfo.source);
  const globalEnums = getGlobalEnums(j, source);
  const globalVariables = getGlobalVariables(j, source);
  const globalMappings = makeGlobalMappings(j, { enums: globalEnums, variables: globalVariables });
  replaceJoiSchemas(j, source, globalMappings);
  removeJoiImport(j, source);

  return ['import z from "zod"', source.toSource()].join('\n\n');
}

/**
 * Creates mapping objects for global enums and variables to enable quick lookups during transformation.
 * This function organizes global items by their identifier names to facilitate reference resolution
 * when processing Joi schemas that may reference other global declarations.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {{enums: TSEnumDeclarationCollection, variables: VariableDeclarationCollection}} globalItems - Collections of global enums and variables found in the source
 * @returns {{enums: Record<string, TSEnumDeclarationPath>, variables: Record<string, VariableDeclarator>}} Object containing mappings from identifier names to their AST nodes
 */
function makeGlobalMappings(j, globalItems) {
  /**
   * @type {Record<string, TSEnumDeclarationPath>}
   */
  const globalEnumsMappedByIdentifierName = globalItems.enums.paths().reduce((acc, p) => {
    const id = p.value.id;
    j.Identifier.assert(id);
    acc[id.name] = p;

    return acc;
  }, {});
  /**
   * @type {Record<string, VariableDeclarator>}
   */
  const globalVariablesMappedByIdentifierName = globalItems.variables.paths().reduce((acc, p) => {
    for (const declaration of p.value.declarations) {
      const id = declaration.id;
      if (!j.Identifier.check(id)) continue;

      acc[id.name] = declaration;
    }

    return acc;
  }, {});

  return { enums: globalEnumsMappedByIdentifierName, variables: globalVariablesMappedByIdentifierName };
}

/**
 * Removes Joi import declarations from the source code.
 * This function finds and removes import statements for both '@hapi/joi' and 'joi' packages
 * as they are no longer needed after transformation to Zod.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {Collection} source - The source code collection to process
 * @returns {Collection} The collection after removing Joi imports
 */
function removeJoiImport(j, source) {
  return source.find(j.ImportDeclaration, { source: { value: v => v === '@hapi/joi' || v === 'joi' } }).remove();
}

/**
 * Replaces Joi schema variable declarations with their Zod equivalents.
 * This is the core transformation function that:
 * 1. Finds all global variable declarations with initializers
 * 2. Identifies those that contain Joi schemas
 * 3. Extracts the Joi schema code along with any referenced dependencies
 * 4. Transforms the Joi schema to a Zod schema
 * 5. Replaces the original variable declarator with the new Zod version
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {Collection} source - The source code collection to process
 * @param {{enums: Record<string, TSEnumDeclarationPath>, variables: Record<string, VariableDeclarator>}} globalMappings - Mappings of global identifiers to their AST nodes
 * @returns {{hasChanges: boolean, collection: Collection}} Object containing transformation results - hasChanges indicates if any schemas were transformed, collection contains the transformed declarations
 */
function replaceJoiSchemas(j, source, globalMappings) {
  const transformedDeclarations = source
    .find(j.VariableDeclarator, { init: i => i != null })
    .filter(p => p.scope.isGlobal)
    .paths()
    .map(p => {
      const joiSource = extractJoiSchemaWithReferences(j, p, globalMappings);
      if (joiSource == null) return null;

      const zodSchema = transformJoiSchemaStringToZodSchemaString(joiSource);

      return `const ${p.value.id.name} = ${zodSchema};`;
    })
    .filter(v => v != null)
    .join('\n\n');
  let hasChanges = false;
  const transformedDeclarationsCollection = j(transformedDeclarations);
  transformedDeclarationsCollection.find(j.VariableDeclarator).forEach(p => {
    source.findVariableDeclarators(p.value.id.name).replaceWith(p.value);
    hasChanges = true;
  });

  return { hasChanges, collection: transformedDeclarationsCollection };
}

/**
 * Transforms a Joi schema string into its equivalent Zod schema string.
 * This function performs the actual schema conversion by:
 * 1. Setting up global Joi references with various common aliases
 * 2. Transpiling TypeScript to JavaScript if needed
 * 3. Evaluating the Joi schema to get a live schema object
 * 4. Converting the Joi schema to JSON Schema using joi-to-json
 * 5. Converting the JSON Schema to Zod using json-schema-to-zod
 *
 * @param {string} joiSchemaString - The string representation of a Joi schema definition
 * @returns {string | null} The equivalent Zod schema string, or null if transformation fails
 *
 * @note This function uses eval() which can be dangerous. It's used here in a controlled
 * environment for code transformation purposes only.
 */
function transformJoiSchemaStringToZodSchemaString(joiSchemaString) {
  try {
    global.Joi = Joi;
    global.joi = Joi;
    global.JOI = Joi;
    global.J = Joi;
    global.j = Joi;

    return jsonSchemaToZod(joiToJson(global.eval(ts.transpile(joiSchemaString))));
  } catch {
    return null;
  }
}

/**
 * Extracts a Joi schema along with all its referenced dependencies from a variable declaration.
 * This function analyzes a variable declarator to:
 * 1. Verify it contains a Joi schema (starts with 'joi.')
 * 2. Find all identifiers referenced within the schema
 * 3. Resolve those identifiers to their global enum or variable declarations
 * 4. Combine the referenced items with the main schema into a complete code string
 *
 * This ensures that when a Joi schema references other variables or enums, those dependencies
 * are included in the transformation context so the schema can be properly evaluated.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {VariableDeclaratorPath} declaratorPath - The AST path to a variable declarator
 * @param {{enums: Record<string, TSEnumDeclarationPath>, variables: Record<string, VariableDeclarator>}} globalMappings - Mappings of global identifiers to their AST nodes
 * @returns {string | null} Combined source code of the schema and its dependencies, or null if not a Joi schema
 */
function extractJoiSchemaWithReferences(j, declaratorPath, globalMappings) {
  const { init } = declaratorPath.value;
  if (init == null) return null;

  const initCollection = j(init);
  const initSource = initCollection.toSource();
  if (!initSource.trim().toLowerCase().startsWith('joi.')) return null;

  /**
   * @param {string} name
   * @returns {TSEnumDeclaration | VariableDeclarator | undefined}
   */
  function referenceByName(name) {
    return globalMappings.enums[name]?.value ?? globalMappings.variables[name];
  }

  const joiSchemaReferencedItems = initCollection
    .find(j.Identifier, { name: n => referenceByName(n) != null })
    .nodes()
    .map(n => j(referenceByName(n.name)).toSource());

  return joiSchemaReferencedItems.concat(initSource).join('\n\n').trim();
}

/**
 * Finds and returns all global variable declarations in the source code.
 * Global variables are those declared at the top level of the file (not inside functions,
 * classes, or other blocks). These may be referenced by Joi schemas and need to be
 * available during transformation.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {Collection} source - The source code collection to search
 * @returns {VariableDeclarationCollection} Collection of global variable declarations
 */
function getGlobalVariables(j, source) {
  return source.find(j.VariableDeclaration).filter(p => p.scope.isGlobal);
}

/**
 * Finds and returns all global TypeScript enum declarations in the source code.
 * Global enums are those declared at the top level of the file and may be referenced
 * by Joi schemas for validation purposes (e.g., using enum values in .valid() calls).
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {Collection} source - The source code collection to search
 * @returns {TSEnumDeclarationCollection} Collection of global TypeScript enum declarations
 */
function getGlobalEnums(j, source) {
  return source.find(j.TSEnumDeclaration).filter(p => p.scope.isGlobal);
}

export default transform;
