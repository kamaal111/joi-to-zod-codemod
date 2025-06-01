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
  const globalEnumsMappedByIdentifierName = source
    .find(j.TSEnumDeclaration)
    .filter(p => p.scope.isGlobal)
    .paths()
    .reduce((acc, p) => {
      const id = p.value.id;
      j.Identifier.assert(id);
      acc[id.name] = p;

      return acc;
    }, {});
  /**
   * @type {Record<string, import('jscodeshift').VariableDeclarator>}
   */
  const globalVariablesMappedByIdentifierName = source
    .find(j.VariableDeclaration)
    .filter(p => p.scope.isGlobal)
    .paths()
    .reduce((acc, p) => {
      for (const declaration of p.value.declarations) {
        const id = declaration.id;
        if (!j.Identifier.check(id)) continue;

        acc[id.name] = declaration;
      }

      return acc;
    }, {});
  const transformedDeclarations = source
    .find(j.VariableDeclarator, { init: i => i != null })
    .paths()
    .map(p => {
      if (!p.scope.isGlobal) return null;

      const { init } = p.value;
      const initCollection = j(init);
      const initSource = initCollection.toSource();
      if (!initSource.trim().toLowerCase().startsWith('joi.')) return null;

      const joiSchemaReferencedItems = initCollection
        .find(j.Identifier, {
          name: n => globalEnumsMappedByIdentifierName[n] != null || globalVariablesMappedByIdentifierName[n] != null,
        })
        .nodes()
        .map(n => {
          const value =
            globalEnumsMappedByIdentifierName[n.name]?.value ?? globalVariablesMappedByIdentifierName[n.name];

          return j(value).toSource();
        });
      const joiSource = joiSchemaReferencedItems.concat(initSource).join('\n\n');

      return { path: p, source: joiSource.trim() };
    })
    .filter(v => v != null)
    .map(({ source, path: p }) => {
      let zodSchema;
      try {
        global.Joi = Joi;
        global.joi = Joi;
        global.JOI = Joi;
        global.J = Joi;
        global.j = Joi;

        zodSchema = jsonSchemaToZod(joiToJson(global.eval(ts.transpile(source))));
      } catch {
        return null;
      }

      return `const ${p.value.id.name} = ${zodSchema}`;
    })
    .filter(v => v != null)
    .join('\n\n');
  j(transformedDeclarations)
    .find(j.VariableDeclarator, { init: i => i != null })
    .forEach(p => {
      source.findVariableDeclarators(p.value.id.name).replaceWith(p.value);
    });

  return ['import z from "zod"', source.toSource()].join('\n\n');
}

export default transform;
