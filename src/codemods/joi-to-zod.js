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

  return j(fileInfo.source)
    .find(j.VariableDeclarator, { init: i => i != null })
    .forEach(p => {
      const { init } = p.value;
      if (init == null) return;

      const initSource = j(init).toSource();
      if (!initSource.toLowerCase().includes('joi')) return;

      // Actually collect all that is necessary for the Joi object
      const initSourceWithExtraThings = `
        enum Job {
          Developer = 'developer',
          DevOps = 'devops',
          Designer = 'designer',
        }

        ${initSource}
      `;

      try {
        global.Joi = Joi;
        global.joi = Joi;
        global.JOI = Joi;
        global.J = Joi;
        global.j = Joi;

        const zodSchema = jsonSchemaToZod(joiToJson(global.eval(ts.transpile(initSourceWithExtraThings))));
        console.log('🐸🐸🐸', zodSchema);
      } catch {
        return;
      }
    })
    .toSource();
}

export default transform;
