import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays, type types } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import { innermostBy } from '../../utils/innermost-nodes.js';
import parseCallChain from '../../utils/parse-call-chain.js';
import splitArguments from '../../utils/split-arguments.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';
import getJoiProperties from '../utils/get-joi-properties.js';
import { buildValueAccessor, parseJoiReferencePath, referenceToAccessor } from '../utils/object-path-accessor.js';

function buildAssertReplacement(args: string, joiIdentifierName: string): types.Optional<string> {
  const parsedArgs = splitArguments(args).map(argument => argument.trim());
  const [subject, schema, message] = parsedArgs;
  if (subject == null || schema == null) return null;

  const subjectSegments = parseJoiReferencePath(subject);
  if (subjectSegments == null) return null;

  const subjectAccessor = buildValueAccessor(subjectSegments);
  const referenceAccessor = referenceToAccessor(schema);
  const predicate =
    referenceAccessor != null
      ? `${subjectAccessor} === ${referenceAccessor}`
      : `${schema}.safeParse(${subjectAccessor}).success`;
  if (referenceAccessor == null && !schema.startsWith(joiIdentifierName)) return null;

  const path = subjectSegments.map(segment => `'${segment}'`).join(', ');
  const options = message == null ? `{ path: [${path}] }` : `{ message: ${message}, path: [${path}] }`;

  return `refine(value => ${predicate}, ${options})`;
}

function rewriteAsserts(chainText: string, joiIdentifierName: string): string {
  for (let index = 0; index < chainText.length; index += 1) {
    if (!chainText.startsWith(joiIdentifierName, index)) continue;
    if (index > 0 && /[$\w.]/.test(chainText[index - 1] ?? '')) continue;

    const segments = parseCallChain(chainText, index + joiIdentifierName.length);
    const baseSegment = segments[0];
    if (baseSegment == null || baseSegment.name !== 'object') continue;

    const assertSegments = segments
      .slice(1)
      .filter(segment => segment.name === 'assert')
      .reverse();
    if (assertSegments.length === 0) continue;

    return assertSegments.reduce((accumulator, segment) => {
      const replacement = buildAssertReplacement(segment.args, joiIdentifierName);
      if (replacement == null) return accumulator;

      return accumulator.slice(0, segment.startIndex) + `.${replacement}` + accumulator.slice(segment.endIndex);
    }, chainText);
  }

  return chainText;
}

async function joiAssertToRefine(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiIdentifierName = getJoiIdentifierName(root);
  if (joiIdentifierName == null) return modifications;

  const properties = getJoiProperties(root, { primitive: 'object' });
  const rewrites = arrays.compactMap(properties, property => {
    const propertyText = property.text();
    const replacement = rewriteAsserts(propertyText, joiIdentifierName);
    if (replacement === propertyText) return null;

    return { property, replacement };
  });
  const edits = innermostBy(rewrites, rewrite => rewrite.property).map(rewrite => {
    return rewrite.property.replace(rewrite.replacement);
  });
  const committed = await commitEditModifications(edits, modifications);
  if (committed.ast.root().text() === modifications.ast.root().text()) return modifications;

  return joiAssertToRefine(committed);
}

export default joiAssertToRefine;
