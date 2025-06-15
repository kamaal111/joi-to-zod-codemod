import type { SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';

import getJoiImport, { JOI_IMPORT_META_IDENTIFIER } from './get-joi-import.js';
import type { Optional } from '../../../utils/type-utils.js';

function getJoiIdentifierName(root: SgNode<TypesMap, Kinds<TypesMap>>): Optional<string> {
  return getJoiImport(root)?.getMatch(JOI_IMPORT_META_IDENTIFIER)?.text();
}

export default getJoiIdentifierName;
