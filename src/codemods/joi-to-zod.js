import Joi from 'joi';
import ts from 'typescript';
import joiToJson from 'joi-to-json';
import { jsonSchemaToZod } from 'json-schema-to-zod';

/**
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {{dry?: boolean}} options
 * @returns {string}
 */
function transform(fileInfo, api) {
  const j = api.jscodeshift;
  const source = j(fileInfo.source);
  /**
   * @type {Record<string, import('jscodeshift').ASTPath<import('jscodeshift').EnumDeclaration>}
   */
  const globalEnumsMappedByIdentifierName = findAllGlobalEnums(j, source)
    .paths()
    .reduce((acc, p) => {
      const id = p.value.id;
      j.Identifier.assert(id);
      acc[id.name] = p;

      return acc;
    }, {});
  source
    .find(j.VariableDeclarator, { init: i => i != null })
    .paths()
    .map(p => {
      const { init } = p.value;
      if (init == null) return null;

      const initSource = j(init).toSource();
      if (!initSource.toLowerCase().includes('joi')) return null;

      const joiSource = j(init)
        .find(j.Identifier, { name: n => globalEnumsMappedByIdentifierName[n] != null })
        .nodes()
        .map(n => j(globalEnumsMappedByIdentifierName[n.name].value).toSource())
        .concat(initSource)
        .join('\n\n');

      return { path: p, source: joiSource.trim() };
    })
    .filter(v => v != null)
    .forEach(({ source }) => {
      try {
        global.Joi = Joi;
        global.joi = Joi;
        global.JOI = Joi;
        global.J = Joi;
        global.j = Joi;

        const zodSchema = jsonSchemaToZod(joiToJson(global.eval(ts.transpile(source))));
        console.log('🐸🐸🐸', zodSchema);
      } catch {
        return;
      }
    });

  return source.toSource();
}

/**
 * @param {import('jscodeshift').JSCodeshift} j
 * @param {import('jscodeshift').Collection} source
 * @returns {import('jscodeshift').Collection<import('jscodeshift').EnumDeclaration>}
 */
function findAllGlobalEnums(j, source) {
  return source.find(j.TSEnumDeclaration).filter(p => p.scope.isGlobal);
}

export default transform;
