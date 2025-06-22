import type { Modifications } from '@kamaalio/codemod-kit';

import { compactMap } from '../../../utils/arrays.js';
import commitEditModifications from '../../utils/commit-edit-modifications.js';
import extractArgsFromCallExpression from '../../utils/extract-args-from-call-expression.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';
import getJoiPrimitive from '../utils/get-joi-primitive.js';
import getJoiProperties from '../utils/get-joi-properties.js';

async function joiCheckToEnum(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = compactMap(getJoiProperties(root, { primitive: '*', validationName: 'valid($ARGS)' }), property => {
    const primitive = getJoiPrimitive(property, joiImportIdentifierName);
    if (primitive == null) return null;

    const propertyComponents = property.text().split('.');
    const validIndex = propertyComponents.findIndex(component => component.startsWith('valid'));
    if (validIndex === -1) return null;

    const validProperty = propertyComponents.slice(validIndex).join('.');
    const validPropertyArgs = extractArgsFromCallExpression(validProperty);
    if (validPropertyArgs == null) return null;

    const replacement = property
      .text()
      .replace(validPropertyArgs, `[${validPropertyArgs} as [${primitive}, ...Array<${primitive}>]]`)
      .replace('.valid', '.enum');

    return property.replace(replacement);
  });

  return commitEditModifications(edits, modifications);
}

export default joiCheckToEnum;
