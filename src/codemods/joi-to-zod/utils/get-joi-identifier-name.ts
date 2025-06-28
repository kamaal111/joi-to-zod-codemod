import type { SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';
import type { types } from '@kamaalio/kamaal';

import getJoiImport, { JOI_IMPORT_META_IDENTIFIER } from './get-joi-import.js';

function getJoiIdentifierName(root: SgNode<TypesMap, Kinds<TypesMap>>): types.Optional<string> {
  return getJoiImport(root)?.getMatch(JOI_IMPORT_META_IDENTIFIER)?.text();
}

export default getJoiIdentifierName;
