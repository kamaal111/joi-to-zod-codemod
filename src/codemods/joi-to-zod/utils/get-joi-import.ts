import type { SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';
import type { types } from '@kamaalio/kamaal';

export const JOI_IMPORT_META_IDENTIFIER = 'J';

function getJoiImport(root: SgNode<TypesMap, Kinds<TypesMap>>): types.Optional<SgNode<TypesMap, Kinds<TypesMap>>> {
  const joiImport =
    root.find(`import $${JOI_IMPORT_META_IDENTIFIER} from 'joi'`) ??
    root.find(`import $${JOI_IMPORT_META_IDENTIFIER} from "joi"`);

  return joiImport;
}

export default getJoiImport;
