import type { Modifications } from '@kamaalio/codemod-kit';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import extractArgsFromCallExpression from '../../utils/extract-args-from-call-expression.js';
import getJoiProperties from '../utils/get-joi-properties.js';

async function joiRemoveOptionsFromRegex(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const edits = getJoiProperties(root, { primitive: 'string', validationName: 'regex($REGEX,$$$OPTIONS)' }).map(
    property => {
      const replacement = property
        .text()
        .split('.')
        .map(validation => {
          const trimmed = validation.trim();
          if (!trimmed.startsWith('regex')) return validation;

          const argsComponents = extractArgsFromCallExpression(trimmed)?.split(',');
          if (argsComponents == null) return validation;
          if (argsComponents.length < 2) return validation;

          return `regex(${argsComponents[0]})`;
        })
        .join('.');

      return property.replace(replacement);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiRemoveOptionsFromRegex;
