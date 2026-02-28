import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';
import getJoiPrimitive from '../utils/get-joi-primitive.js';
import getJoiProperties from '../utils/get-joi-properties.js';

function extractBalancedCallArgs(text: string): string | null {
  const openIndex = text.indexOf('(');
  if (openIndex === -1) return null;

  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') {
      if (--depth === 0) return text.slice(openIndex + 1, i);
    }
  }

  return null;
}

async function joiCheckToEnum(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = arrays.compactMap(
    getJoiProperties(root, { primitive: '*', validationName: 'valid($ARGS)' }),
    property => {
      const primitive = getJoiPrimitive(property, joiImportIdentifierName);
      if (primitive == null) return null;

      const propertyComponents = property.text().split('.');
      const validIndex = propertyComponents.findIndex(component => component.startsWith('valid'));
      if (validIndex === -1) return null;

      const validProperty = propertyComponents.slice(validIndex).join('.');
      const validPropertyArgs = extractBalancedCallArgs(validProperty);
      if (validPropertyArgs == null) return null;

      const wrappedArgs = validPropertyArgs.trimStart().startsWith('...')
        ? `[${validPropertyArgs} as [${primitive}, ...Array<${primitive}>]]`
        : `[${validPropertyArgs}] as [${primitive}, ...Array<${primitive}>]`;

      const replacement = property
        .text()
        .replace(validPropertyArgs, wrappedArgs)
        .replace('.valid', '.enum');

      return property.replace(replacement);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiCheckToEnum;
