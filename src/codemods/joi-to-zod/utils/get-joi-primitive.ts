import type { SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';

import extractNameFromCallExpression from '../../utils/extract-name-from-call-expression.js';
import type { Optional } from '../../../utils/type-utils.js';

function getJoiPrimitive(
  property: SgNode<TypesMap, Kinds<TypesMap>>,
  joiImportIdentifierName: string,
): Optional<string> {
  return extractNameFromCallExpression(
    property
      .text()
      .split(joiImportIdentifierName)
      .filter(value => value.length > 0)[0]
      ?.split('.')
      .filter(value => value.length > 0)[0],
  );
}

export default getJoiPrimitive;
