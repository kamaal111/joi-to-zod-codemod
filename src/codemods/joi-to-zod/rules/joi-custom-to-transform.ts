import assert from 'node:assert/strict';

import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays, type types } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import { innermostBy } from '../../utils/innermost-nodes.js';
import parseCallChain, { type ChainSegment } from '../../utils/parse-call-chain.js';
import splitArguments from '../../utils/split-arguments.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';
import getJoiProperties from '../utils/get-joi-properties.js';

const PRESENCE_SEGMENTS = new Set(['required', 'optional']);

const SHIMMABLE_HELPERS = new Set(['error', 'message']);

const ARROW_PARAMETERS_PATTERN = /^\(([^)]*)\)\s*=>/s;
const FUNCTION_PARAMETERS_PATTERN = /^function\s*[$\w]*\s*\(([^)]*)\)/s;

function parseCallbackParameters(callback: string): types.Optional<Array<string>> {
  const match = ARROW_PARAMETERS_PATTERN.exec(callback) ?? FUNCTION_PARAMETERS_PATTERN.exec(callback);
  if (match?.[1] == null) return null;

  return splitArguments(match[1])
    .map(parameter => parameter.trim())
    .filter(parameter => parameter.length > 0);
}

function referencedHelperMembers(callback: string, helpersName: string): Set<string> {
  const pattern = new RegExp(String.raw`\b${helpersName}\s*\.\s*([$\w]+)`, 'g');

  const members = Array.from(callback.matchAll(pattern), match => {
    assert(match[1] != null, 'the capture group always matches when the pattern matches');

    return match[1];
  });

  return new Set(members);
}

function buildCustomReplacement(args: string): types.Optional<string> {
  const [callback] = splitArguments(args).map(argument => argument.trim());
  if (callback == null || callback.length === 0) return null;

  const parameters = parseCallbackParameters(callback);
  const helpersName = parameters?.[1];
  if (helpersName == null) return `transform(${callback})`;

  const members = referencedHelperMembers(callback, helpersName);
  if (members.size === 0) return `transform(${callback})`;
  if (Array.from(members).some(member => !SHIMMABLE_HELPERS.has(member))) return null;

  return [
    'transform((value, ctx) => {',
    '  const helpers = {',
    "    error: (code: unknown) => { ctx.addIssue({ code: 'custom', message: String(code) }); return z.NEVER; },",
    "    message: (text: unknown) => { ctx.addIssue({ code: 'custom', message: String(text) }); return z.NEVER; },",
    '  };',
    '',
    `  return (${callback})(value, helpers);`,
    '})',
  ].join('\n');
}

function isConvertible(segments: Array<ChainSegment>, customIndex: number): boolean {
  return segments.slice(customIndex + 1).every(segment => PRESENCE_SEGMENTS.has(segment.name));
}

function rewriteCustoms(chainText: string, joiIdentifierName: string): string {
  for (let index = 0; index < chainText.length; index += 1) {
    if (!chainText.startsWith(joiIdentifierName, index)) continue;
    if (index > 0 && /[$\w.]/.test(chainText[index - 1] ?? '')) continue;

    const segments = parseCallChain(chainText, index + joiIdentifierName.length);
    const customIndex = segments.findIndex(segment => segment.name === 'custom');
    if (customIndex === -1) continue;
    if (!isConvertible(segments, customIndex)) continue;

    const segment = segments[customIndex];
    if (segment == null) continue;

    const replacement = buildCustomReplacement(segment.args);
    if (replacement == null) continue;

    return chainText.slice(0, segment.startIndex) + `.${replacement}` + chainText.slice(segment.endIndex);
  }

  return chainText;
}

async function joiCustomToTransform(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiIdentifierName = getJoiIdentifierName(root);
  if (joiIdentifierName == null) return modifications;

  const properties = getJoiProperties(root, { primitive: '*' });
  const rewrites = arrays.compactMap(properties, property => {
    const propertyText = property.text();
    const replacement = rewriteCustoms(propertyText, joiIdentifierName);
    if (replacement === propertyText) return null;

    return { property, replacement };
  });
  const edits = innermostBy(rewrites, rewrite => rewrite.property).map(rewrite => {
    return rewrite.property.replace(rewrite.replacement);
  });
  const committed = await commitEditModifications(edits, modifications);
  if (committed.ast.root().text() === modifications.ast.root().text()) return modifications;

  return joiCustomToTransform(committed);
}

export default joiCustomToTransform;
