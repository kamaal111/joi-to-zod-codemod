import { parseAsync, type SgNode, type SgRoot } from '@ast-grep/napi';
import type { NapiLang } from '@ast-grep/napi/types/lang.js';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';

import type { Modifications } from '../types.js';
import type { Optional } from '../../utils/type-utils.js';
import zodAddImport from './rules/zod-add-import.js';
import hasJoiImport from './utils/has-joi-import.js';
import joiRemoveRequired from './rules/joi-remove-required.js';
import joiReferenceToZod from './rules/joi-reference-to-zod.js';
import joiCheckToEnum from './rules/joi-check-to-enum.js';
import joiRemoveImport from './rules/joi-remove-import.js';
import joiRemovePrimitiveForEnum from './rules/joi-remove-primitive-for-enum.js';
import joiObjectKeysUnnest from './rules/joi-object-keys-unnest.js';
import joiAddOptional from './rules/joi-add-optional.js';
import joiRemoveOptionsFromRegex from './rules/joi-remove-options-from-regex.js';
import joiValidationsToZodValidations from './rules/joi-validations-to-zod-validations.js';

function joiToZodFilter(root: SgNode<TypesMap, Kinds<TypesMap>>): boolean {
  return hasJoiImport(root);
}

export async function joiToZodModifications(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  if (!joiToZodFilter(root)) return modifications;

  return zodAddImport(modifications)
    .then(joiRemoveOptionsFromRegex)
    .then(joiValidationsToZodValidations)
    .then(joiCheckToEnum)
    .then(joiRemovePrimitiveForEnum)
    .then(joiObjectKeysUnnest)
    .then(joiAddOptional)
    .then(joiRemoveRequired)
    .then(joiReferenceToZod)
    .then(joiRemoveImport);
}

export async function joiToZod(lang: NapiLang, content: SgRoot<TypesMap> | string): Promise<SgRoot<TypesMap>> {
  const ast = typeof content === 'string' ? await parseAsync(lang, content) : content;
  const modifications = await joiToZodModifications({
    lang,
    report: { changesApplied: 0 },
    ast,
    filename: null,
    history: [ast],
  });

  return modifications.ast;
}

async function joiToZodTransformer(
  lang: NapiLang,
  content: string,
  filename: Optional<string>,
): Promise<Modifications> {
  const ast = await parseAsync(lang, content);

  return joiToZodModifications({ lang, report: { changesApplied: 0 }, ast, filename, history: [ast] });
}

export default joiToZodTransformer;
