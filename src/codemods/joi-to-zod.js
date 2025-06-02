import Joi from 'joi';
import ts from 'typescript';
import joiToJson from 'joi-to-json';
import { jsonSchemaToZod } from 'json-schema-to-zod';

/**
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
 * @param {FileInfo} fileInfo
 * @param {API} api
 * @returns {string}
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
 * @param {JSCodeshift} j
 * @param {{enums: TSEnumDeclarationCollection, variables: VariableDeclarationCollection}} globalItems
 * @returns {{enums: Record<string, TSEnumDeclarationPath>, variables: Record<string, VariableDeclarator>}}
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
 * @param {JSCodeshift} j
 * @param {Collection} source
 * @returns {Collection}
 */
function removeJoiImport(j, source) {
  return source.find(j.ImportDeclaration, { source: { value: v => v === '@hapi/joi' || v === 'joi' } }).remove();
}

/**
 * @param {JSCodeshift} j
 * @param {Collection} source
 * @param {{enums: Record<string, TSEnumDeclarationPath>, variables: Record<string, VariableDeclarator>}} globalMappings
 * @returns {boolean}
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

      return `const ${p.value.id.name} = ${zodSchema}`;
    })
    .filter(v => v != null)
    .join('\n\n');
  let hasChanges = false;
  j(transformedDeclarations)
    .find(j.VariableDeclarator)
    .forEach(p => {
      source.findVariableDeclarators(p.value.id.name).replaceWith(p.value);
      hasChanges = true;
    });

  return hasChanges;
}

/**
 * @param {string} joiSchemaString
 * @returns {string | null}
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
 * @param {JSCodeshift} j
 * @param {VariableDeclaratorPath} declaratorPath
 * @param {{enums: Record<string, TSEnumDeclarationPath>, variables: Record<string, VariableDeclarator>}} globalMappings
 * @returns {string | null}
 */
function extractJoiSchemaWithReferences(j, declaratorPath, globalMappings) {
  const { init } = declaratorPath.value;
  if (init == null) return null;

  const initCollection = j(init);
  const initSource = initCollection.toSource();
  if (!initSource.trim().toLowerCase().startsWith('joi.')) return null;

  /**
   * @param {string} name
   * @returns {TSEnumDeclaration | VariableDeclarator}
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
 * @param {JSCodeshift} j
 * @param {Collection} source
 * @returns {VariableDeclarationCollection}
 */
function getGlobalVariables(j, source) {
  return source.find(j.VariableDeclaration).filter(p => p.scope.isGlobal);
}

/**
 * @param {JSCodeshift} j
 * @param {Collection} source
 * @returns {TSEnumDeclarationCollection}
 */
function getGlobalEnums(j, source) {
  return source.find(j.TSEnumDeclaration).filter(p => p.scope.isGlobal);
}

export default transform;
