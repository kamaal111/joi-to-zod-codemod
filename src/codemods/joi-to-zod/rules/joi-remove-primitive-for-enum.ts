import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.ts';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.ts';
import getJoiPrimitive from '../utils/get-joi-primitive.ts';
import getJoiProperties from '../utils/get-joi-properties.ts';

async function joiRemovePrimitiveForEnum(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = arrays.compactMap(
    getJoiProperties(root, { primitive: '*', validationName: 'enum($ARGS)' }),
    property => {
      const primitive = getJoiPrimitive(property, joiImportIdentifierName);
      if (primitive == null) return null;

      const replacement = property.text().replace(`.${primitive}()`, '');

      return property.replace(replacement);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiRemovePrimitiveForEnum;
