/* eslint-disable @typescript-eslint/ban-ts-comment */
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
 * - Cleanup of unused enums and variables after transformation
 *
 * The transformation process:
 * 1. Analyzes the AST to find global enums and variables that may be referenced
 * 2. Identifies Joi schema variable declarations
 * 3. Extracts schemas with their dependencies for proper evaluation
 * 4. Converts Joi schemas to JSON Schema, then to Zod using established libraries
 * 5. Replaces original declarations and updates imports
 * 6. Removes unused enums that are no longer referenced after transformation
 * 7. Removes unused variables that are no longer referenced after transformation
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
 * @typedef {import('jscodeshift').ImportDeclaration} ImportDeclaration
 * @typedef {import('jscodeshift').Collection<import('jscodeshift').ImportDeclaration>} ImportDeclarationCollection
 * @typedef {import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration>} ImportDeclarationPath
 */

/**
 * Main transformation function that converts Joi schemas to Zod schemas in a JavaScript/TypeScript file.
 * This is the entry point for the jscodeshift codemod that performs the following operations:
 * 1. Extracts global enums and variables that may be referenced by Joi schemas
 * 2. Replaces Joi schema variable declarations with equivalent Zod schemas
 * 3. Removes the original Joi import statements
 * 4. Removes unused enums that are no longer referenced after transformation
 * 5. Removes unused variables that are no longer referenced after transformation
 * 6. Adds a Zod import at the top of the file
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
  const imports = getImports(j, source);
  const globalEnums = getGlobalEnums(j, source);
  const globalVariables = getGlobalVariables(j, source);
  const globalMappings = makeGlobalMappings(j, {
    enums: globalEnums,
    variables: globalVariables,
    imports,
  });
  const { transformedSchemaNames } = replaceJoiSchemas(j, source, globalMappings);
  removeUnusedEnums(j, source);
  removeUnusedVariables(j, source, globalVariables, transformedSchemaNames);
  getJoiImports(j, source).remove();
  const finalSource = ['import z from "zod"', source.toSource()].join('\n\n');

  return finalSource;
}

/**
 * Creates mapping objects for global enums and variables to enable quick lookups during transformation.
 * This function organizes global items by their identifier names to facilitate reference resolution
 * when processing Joi schemas that may reference other global declarations.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {{
 *    enums: TSEnumDeclarationCollection,
 *    variables: VariableDeclarationCollection,
 *    imports: ImportDeclarationCollection,
 * }} globalItems - Collections of global enums, variables and imports found in the source
 * @returns {{
 *    enums: Record<string, TSEnumDeclarationPath>,
 *    variables: Record<string, VariableDeclarator>,
 *    imports: Record<string, ImportDeclarationPath>,
 * }} Object containing mappings from identifier names to their AST nodes
 */
function makeGlobalMappings(j, globalItems) {
  const globalEnumsMappedByIdentifierName = globalItems.enums.paths().reduce((acc, p) => {
    const id = p.value.id;
    if (!j.Identifier.assert(id)) return acc;

    acc[id.name] = p;

    return acc;
  }, /** @type {Record<string, TSEnumDeclarationPath>} */ ({}));
  const globalVariablesMappedByIdentifierName = globalItems.variables.paths().reduce((acc, p) => {
    for (const declaration of p.value.declarations) {
      if (!j.VariableDeclarator.assert(declaration)) continue;

      const id = declaration.id;
      if (!j.Identifier.assert(id)) continue;

      acc[id.name] = declaration;
    }

    return acc;
  }, /** @type {Record<string, VariableDeclarator>} */ ({}));
  const importDeclarationsMappedBySpecifierName = globalItems.imports.paths().reduce((acc, p) => {
    const specifiers = p.value.specifiers;
    if (specifiers == null) return acc;

    for (const specifier of specifiers) {
      const local = specifier.local;
      if (local == null) continue;
      if (!j.Identifier.assert(local)) continue;

      const name = local.name.trim();
      if (name.length === 0) continue;

      acc[name] = p;
    }

    return acc;
  }, /** @type {Record<string, ImportDeclarationPath>} */ ({}));

  return {
    enums: globalEnumsMappedByIdentifierName,
    variables: globalVariablesMappedByIdentifierName,
    imports: importDeclarationsMappedBySpecifierName,
  };
}

/**
 * Finds and returns all import declarations for Joi in the source code.
 * This function locates import statements that import from either 'joi' or '@hapi/joi',
 * which are the two common package names for Joi. It is used to identify and later remove
 * Joi imports as part of the codemod transformation process.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {Collection} source - The source code collection to process
 * @returns {ImportDeclarationCollection} Collection of Joi import declarations
 */
function getJoiImports(j, source) {
  return source.find(j.ImportDeclaration, {
    source: { value: /** @param {string} v */ v => v === '@hapi/joi' || v === 'joi' },
  });
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
 * @param {{
 *    enums: Record<string, TSEnumDeclarationPath>,
 *    variables: Record<string, VariableDeclarator>,
 *    imports: Record<string, ImportDeclarationPath>,
 * }} globalMappings - Mappings of global identifiers to their AST nodes
 * @returns {{
 *    hasChanges: boolean,
 *    collection: Collection,
 *    transformedSchemaNames: Set<string>
 * }} Object containing transformation results - hasChanges indicates if any schemas were transformed, collection contains the transformed declarations, transformedSchemaNames contains the names of transformed schema variables
 */
function replaceJoiSchemas(j, source, globalMappings) {
  const joiImportsNames = new Set([
    ...getJoiImports(j, source)
      .nodes()
      .flatMap(n => {
        return (
          n.specifiers
            ?.map(s => {
              const local = s.local;
              if (local == null) return null;
              if (!j.Identifier.assert(local)) return null;

              const name = local.name.trim();
              if (name.length === 0) return null;

              return name;
            })
            .filter(n => n != null) ?? []
        );
      }),
  ]);
  const transformedSchemaNames = new Set();
  const transformedDeclarations = source
    .find(j.VariableDeclarator, { init: i => i != null })
    .filter(p => p.scope.isGlobal)
    .paths()
    .map(p => {
      const transformedValue = extractJoiSchemaWithReferences(j, p, globalMappings);
      if (transformedValue == null) return null;

      const zodSchema = transformJoiSchemaStringToZodSchemaString(transformedValue.source, joiImportsNames);
      const id = p.value.id;
      if (!j.Identifier.assert(id)) return null;

      transformedSchemaNames.add(id.name);

      return `const ${id.name} = ${zodSchema};`;
    })
    .filter(v => v != null)
    .join('\n\n');
  let hasChanges = false;
  const transformedDeclarationsCollection = j(transformedDeclarations, {});
  transformedDeclarationsCollection.find(j.VariableDeclarator).forEach(p => {
    const id = p.value.id;
    if (!j.Identifier.assert(id)) return;

    source.findVariableDeclarators(id.name).replaceWith(p.value);
    hasChanges = true;
  });

  return { hasChanges, collection: transformedDeclarationsCollection, transformedSchemaNames };
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
 * @param {Set<string>} joiImportsNames - The names of joi imports
 * @returns {string | null} The equivalent Zod schema string, or null if transformation fails
 *
 * @note This function uses eval() which can be dangerous. It's used here in a controlled
 * environment for code transformation purposes only.
 */
function transformJoiSchemaStringToZodSchemaString(joiSchemaString, joiImportsNames) {
  try {
    for (const importName of joiImportsNames) {
      // @ts-ignore
      global[importName] = Joi;
    }

    // @ts-ignore
    return jsonSchemaToZod(joiToJson(global.eval(ts.transpile(joiSchemaString))));
  } catch {
    return null;
  }
}

/**
 * Removes method calls that reference imported variables from a Joi schema string.
 * This function processes the schema to remove any method calls that use imported variables
 * as arguments, effectively cleaning up references that can't be resolved during transformation.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {string} schemaSource - The Joi schema source code as a string
 * @param {Set<string>} importedVariableNames - Set of imported variable names to remove
 * @returns {{source: string, removedReferences: string[]}} The cleaned schema source and list of removed references
 */
function removeImportedVariableReferences(j, schemaSource, importedVariableNames) {
  const ast = j(schemaSource);
  const removedReferences = [];

  ast.find(j.CallExpression).forEach(path => {
    const { arguments: args } = path.value;
    if (!args || args.length === 0) return;

    const importedVariableArgs = args.filter(arg => j.Identifier.check(arg) && importedVariableNames.has(arg.name));

    if (importedVariableArgs.length > 0) {
      const methodName = j.MemberExpression.check(path.value.callee) ? path.value.callee.property.name : 'unknown';
      const variableNames = importedVariableArgs.map(arg => arg.name);
      removedReferences.push(`${methodName}(${variableNames.join(', ')})`);

      const callee = path.value.callee;
      if (j.MemberExpression.check(callee)) {
        j(path).replaceWith(callee.object);
      }
    }
  });

  return {
    source: ast.toSource(),
    removedReferences,
  };
}

/**
 * Extracts a Joi schema along with all its referenced dependencies from a variable declaration.
 * This function analyzes a variable declarator to:
 * 1. Verify it contains a Joi schema (starts with 'joi.')
 * 2. Find all identifiers referenced within the schema
 * 3. Resolve those identifiers to their global enum or variable declarations
 * 4. Remove any references to imported variables from the schema
 * 5. Combine the referenced items with the main schema into a complete code string
 *
 * This ensures that when a Joi schema references other variables or enums, those dependencies
 * are included in the transformation context, while imported variable references are removed.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {VariableDeclaratorPath} declaratorPath - The AST path to a variable declarator
 * @param {{
 *    enums: Record<string, TSEnumDeclarationPath>,
 *    variables: Record<string, VariableDeclarator>,
 *    imports: Record<string, ImportDeclarationPath>,
 * }} globalMappings - Mappings of global identifiers to their AST nodes
 * @returns {{source: string} | null} Combined source code of the schema and its dependencies, or null if not a Joi schema
 */
function extractJoiSchemaWithReferences(j, declaratorPath, globalMappings) {
  const { init } = declaratorPath.value;
  if (init == null) return null;

  const initCollection = j(init);
  let initSource = initCollection.toSource();
  if (!initSource.trim().toLowerCase().startsWith('joi.')) return null;

  /**
   * @param {string} name
   * @returns {TSEnumDeclaration | VariableDeclarator  | undefined}
   */
  function referenceByName(name) {
    return globalMappings.enums[name]?.value ?? globalMappings.variables[name];
  }

  /**
   * @param {string} name
   * @returns {ImportDeclaration  | undefined}
   */
  function importByName(name) {
    return globalMappings.imports[name]?.value;
  }

  const importedVariableNames = new Set();
  const joiSchemaReferencedItems = [];

  initCollection
    .find(j.Identifier, { name: n => referenceByName(n) != null || importByName(n) != null })
    .nodes()
    .forEach(n => {
      const reference = referenceByName(n.name);
      if (reference != null) {
        joiSchemaReferencedItems.push(j(reference).toSource());
        return;
      }

      const importReference = importByName(n.name);
      if (importReference != null && n.name.toLowerCase() !== 'joi') {
        importedVariableNames.add(n.name);
      }
    });

  if (importedVariableNames.size > 0) {
    const result = removeImportedVariableReferences(j, initSource, importedVariableNames);
    initSource = result.source;
  }

  return {
    source: joiSchemaReferencedItems.concat(initSource).join('\n\n').trim(),
  };
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
 * Finds and returns all import declarations in the source code.
 * This function locates all import statements, regardless of source, and is used to gather
 * a collection of all imports present in the file for further analysis or transformation.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {Collection} source - The source code collection to search
 * @returns {ImportDeclarationCollection} Collection of all import declarations
 */
function getImports(j, source) {
  return source.find(j.ImportDeclaration).filter(p => p.scope.isGlobal);
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

/**
 * Removes unused TypeScript enum declarations from the source code.
 * After transforming Joi schemas to Zod, some enums that were previously referenced
 * by Joi schemas may no longer be used anywhere in the code. This function identifies
 * and removes such unused enums to clean up the code.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {Collection} source - The source code collection to process
 * @returns {Collection} The collection after removing unused enums
 */
function removeUnusedEnums(j, source) {
  const globalEnums = getGlobalEnums(j, source);
  const enumNames = new Set();
  globalEnums.forEach(path => {
    const id = path.value.id;
    if (!j.Identifier.assert(id)) return;

    enumNames.add(id.name);
  });

  const usedEnumNames = new Set();
  source.find(j.Identifier).forEach(path => {
    if (enumNames.has(path.value.name)) {
      const parent = path.parent;
      // Skip if this is the enum declaration itself
      if (j.TSEnumDeclaration.check(parent.value) && parent.value.id === path.value) return;
      // Skip if this is an enum member declaration
      if (j.TSEnumMember.check(parent.value) && parent.value.id === path.value) return;
      // This is a reference to the enum
      usedEnumNames.add(path.value.name);
    }
  });

  globalEnums.forEach(path => {
    const id = path.value.id;
    if (!j.Identifier.assert(id)) return;
    if (usedEnumNames.has(id.name)) return;

    j(path).remove();
  });

  return source;
}

/**
 * Removes unused global variable declarations from the source code.
 * After transforming Joi schemas to Zod, some variables that were previously referenced
 * by Joi schemas may no longer be used anywhere in the code. This function identifies
 * and removes such unused variables to clean up the code.
 *
 * @param {JSCodeshift} j - The jscodeshift instance for AST manipulation
 * @param {Collection} source - The source code collection to process
 * @param {VariableDeclarationCollection} originalVariables - The original global variables before transformation
 * @param {Set<string>} transformedSchemaNames - Names of variables that were transformed from Joi to Zod schemas
 * @returns {Collection} The collection after removing unused variables
 */
function removeUnusedVariables(j, source, originalVariables, transformedSchemaNames) {
  const originalVariableNames = new Set();
  originalVariables.forEach(path => {
    path.value.declarations.forEach(declaration => {
      if (!j.VariableDeclarator.assert(declaration)) return;

      const id = declaration.id;
      if (!j.Identifier.assert(id)) return;

      originalVariableNames.add(id.name);
    });
  });

  const usedOriginalVariableNames = new Set();
  source.find(j.Identifier).forEach(path => {
    if (originalVariableNames.has(path.value.name)) {
      const parent = path.parent;
      // Skip if this is the variable declaration itself
      if (j.VariableDeclarator.check(parent.value) && parent.value.id === path.value) return;
      // This is a reference to the original variable
      usedOriginalVariableNames.add(path.value.name);
    }
  });

  const currentGlobalVariables = getGlobalVariables(j, source);
  currentGlobalVariables.forEach(path => {
    const unusedDeclarations = path.value.declarations.filter(declaration => {
      if (!j.VariableDeclarator.assert(declaration)) return false;

      const id = declaration.id;

      return (
        j.Identifier.check(id) &&
        originalVariableNames.has(id.name) &&
        !usedOriginalVariableNames.has(id.name) &&
        !transformedSchemaNames.has(id.name)
      );
    });

    if (unusedDeclarations.length === path.value.declarations.length) {
      // All declarations in this statement are unused original variables, remove the entire statement
      j(path).remove();
    } else if (unusedDeclarations.length > 0) {
      // Some declarations are unused original variables, remove only those
      path.value.declarations = path.value.declarations.filter(declaration => {
        if (!j.VariableDeclarator.assert(declaration)) return false;

        const id = declaration.id;

        return (
          !j.Identifier.check(id) ||
          !originalVariableNames.has(id.name) ||
          usedOriginalVariableNames.has(id.name) ||
          transformedSchemaNames.has(id.name)
        );
      });
    }
  });

  return source;
}

export default transform;
