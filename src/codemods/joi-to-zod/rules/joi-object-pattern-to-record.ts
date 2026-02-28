import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

const KEY_META_IDENTIFIER = 'KEY';
const VALUE_META_IDENTIFIER = 'VALUE';

async function joiObjectPatternToRecord(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const patternRule = `${joiImportIdentifierName}.object().pattern($${KEY_META_IDENTIFIER}, $${VALUE_META_IDENTIFIER})`;

  const edits = arrays.compactMap(root.findAll({ rule: { pattern: patternRule } }), node => {
    const keyNode = node.getMatch(KEY_META_IDENTIFIER);
    const valueNode = node.getMatch(VALUE_META_IDENTIFIER);
    if (keyNode == null || valueNode == null) return null;

    const keyText = keyNode.text();
    const valueText = valueNode.text();

    // When the key is a regex literal, rewrite it to Joi.string().regex(regex)
    // so the downstream joiReferenceToZod step produces z.record(z.string().regex(...), ...)
    const finalKeyText = keyText.startsWith('/') ? `${joiImportIdentifierName}.string().regex(${keyText})` : keyText;

    return node.replace(`${joiImportIdentifierName}.record(${finalKeyText}, ${valueText})`);
  });

  return commitEditModifications(edits, modifications);
}

export default joiObjectPatternToRecord;
