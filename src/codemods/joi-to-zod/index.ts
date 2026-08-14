import { Lang, parseAsync, type SgNode, type SgRoot } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';
import type { Codemod, Modifications } from '@kamaalio/codemod-kit';
import type { types } from '@kamaalio/kamaal';

import joiAddManualMigrationTodo from './rules/joi-add-manual-migration-todo.js';
import joiAddOptional from './rules/joi-add-optional.js';
import joiAlternativesToUnion from './rules/joi-alternatives-to-union.js';
import joiArrayItemsUnnest from './rules/joi-array-items-unnest.js';
import joiBinaryToInstanceof from './rules/joi-binary-to-instanceof.js';
import joiCheckToEnum from './rules/joi-check-to-enum.js';
import joiConcatToIntersection from './rules/joi-concat-to-intersection.js';
import joiDateToCoerceDate from './rules/joi-date-to-coerce-date.js';
import joiForbiddenToNever from './rules/joi-forbidden-to-never.js';
import joiFormatsToZodBase from './rules/joi-formats-to-zod-base.js';
import joiObjectKeysUnnest from './rules/joi-object-keys-unnest.js';
import joiObjectPatternToRecord from './rules/joi-object-pattern-to-record.js';
import joiObjectRelationsToRefine from './rules/joi-object-relations-to-refine.js';
import joiReferenceToZod from './rules/joi-reference-to-zod.js';
import joiRemoveImport from './rules/joi-remove-import.js';
import joiRemoveOptionsFromRegex from './rules/joi-remove-options-from-regex.js';
import joiRemovePrimitiveForEnum from './rules/joi-remove-primitive-for-enum.js';
import joiRemoveRequired from './rules/joi-remove-required.js';
import joiValidationsToZodValidations from './rules/joi-validations-to-zod-validations.js';
import zodAddImport from './rules/zod-add-import.js';
import hasJoiImport from './utils/has-joi-import.js';

export const JOI_TO_ZOD_LANGUAGE = Lang.TypeScript;

function joiToZodFilter(root: SgNode<TypesMap, Kinds<TypesMap>>): boolean {
  return hasJoiImport(root);
}

export async function joiToZodModifications(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  if (!joiToZodFilter(root)) return modifications;

  return zodAddImport(modifications)
    .then(joiRemoveOptionsFromRegex)
    .then(joiObjectPatternToRecord)
    .then(joiBinaryToInstanceof)
    .then(joiConcatToIntersection)
    .then(joiForbiddenToNever)
    .then(joiFormatsToZodBase)
    .then(joiDateToCoerceDate)
    .then(joiObjectRelationsToRefine)
    .then(joiValidationsToZodValidations)
    .then(joiCheckToEnum)
    .then(joiRemovePrimitiveForEnum)
    .then(joiObjectKeysUnnest)
    .then(joiArrayItemsUnnest)
    .then(joiAlternativesToUnion)
    .then(joiAddOptional)
    .then(joiRemoveRequired)
    .then(joiAddManualMigrationTodo)
    .then(joiReferenceToZod)
    .then(joiRemoveImport);
}

export function makeJoiToZodInitialModification(
  ast: SgRoot<TypesMap>,
  filename: types.Optional<string> = null,
): Modifications {
  return {
    lang: JOI_TO_ZOD_LANGUAGE,
    report: { changesApplied: 0 },
    ast,
    filename,
    history: [ast],
  };
}

async function joiToZod(content: string, filename?: types.Optional<string>): Promise<string> {
  const ast = await parseAsync(JOI_TO_ZOD_LANGUAGE, content);

  return joiToZodModifications(makeJoiToZodInitialModification(ast, filename)).then(modifications => {
    return modifications.ast.root().text();
  });
}

export async function joiToZodTransformer(content: string, filename: types.Optional<string>): Promise<Modifications> {
  const ast = await parseAsync(JOI_TO_ZOD_LANGUAGE, content);

  return joiToZodModifications(makeJoiToZodInitialModification(ast, filename));
}

export const JOI_TO_ZOD_CODEMOD: Codemod = {
  name: 'joi-to-zod-transformer',
  languages: [JOI_TO_ZOD_LANGUAGE],
  transformer: joiToZod,
};

export default joiToZod;
