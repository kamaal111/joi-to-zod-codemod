import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import parseCallChain from '../../utils/parse-call-chain.js';
import type { JoiPrimitives } from '../types.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';
import getJoiProperties from '../utils/get-joi-properties.js';

const FORMAT_BASE_TRANSFORMATIONS: Array<{ primitive: JoiPrimitives; joi: string; zod: string }> = [
  { primitive: 'string', joi: 'guid', zod: 'uuid()' },
  { primitive: 'string', joi: 'uuid', zod: 'uuid()' },
  { primitive: 'string', joi: 'uri', zod: 'url()' },
  { primitive: 'string', joi: 'url', zod: 'url()' },
  { primitive: 'string', joi: 'email', zod: 'email()' },
  { primitive: 'string', joi: 'domain', zod: 'hostname()' },
  { primitive: 'string', joi: 'hostname', zod: 'hostname()' },
  { primitive: 'string', joi: 'hex', zod: 'hex()' },
  { primitive: 'string', joi: 'base64', zod: 'base64()' },
  { primitive: 'string', joi: 'isoDate', zod: 'iso.datetime()' },
  { primitive: 'string', joi: 'datetime', zod: 'iso.datetime()' },
  { primitive: 'string', joi: 'isoDuration', zod: 'iso.duration()' },
];

function hoistFormatToBase(
  chainText: string,
  joiIdentifierName: string,
  params: { primitive: JoiPrimitives; joi: string; zod: string },
): string {
  let result = chainText;

  for (let index = 0; index < result.length; index += 1) {
    if (!result.startsWith(joiIdentifierName, index)) continue;
    if (index > 0 && /[$\w.]/.test(result[index - 1] ?? '')) continue;

    const segments = parseCallChain(result, index + joiIdentifierName.length);
    const baseSegment = segments[0];
    if (baseSegment == null || baseSegment.name !== params.primitive) continue;

    const formatSegment = segments.find(segment => segment.name === params.joi && segment.args.trim().length === 0);
    if (formatSegment == null) continue;

    const withoutFormat = result.slice(0, formatSegment.startIndex) + result.slice(formatSegment.endIndex);

    return (
      withoutFormat.slice(0, baseSegment.startIndex) + `.${params.zod}` + withoutFormat.slice(baseSegment.endIndex)
    );
  }

  return result;
}

async function joiFormatsToZodBase(modifications: Modifications): Promise<Modifications> {
  return transformFormats(modifications, 0);
}

async function transformFormats(modifications: Modifications, transformationIndex: number): Promise<Modifications> {
  const transformation = FORMAT_BASE_TRANSFORMATIONS[transformationIndex];
  if (transformation == null) return modifications;

  const applied = await applyFormatTransformation(modifications, transformation);

  return transformFormats(applied, transformationIndex + 1);
}

async function applyFormatTransformation(
  modifications: Modifications,
  transformation: { primitive: JoiPrimitives; joi: string; zod: string },
): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiIdentifierName = getJoiIdentifierName(root);
  if (joiIdentifierName == null) return modifications;

  const properties = getJoiProperties(root, {
    primitive: transformation.primitive,
    validationName: `${transformation.joi}()`,
  });
  const edits = arrays.compactMap(properties, property => {
    const propertyText = property.text();
    const replacement = hoistFormatToBase(propertyText, joiIdentifierName, transformation);
    if (replacement === propertyText) return null;

    return property.replace(replacement);
  });
  const committed = await commitEditModifications(edits, modifications);
  if (committed.ast.root().text() === modifications.ast.root().text()) return modifications;

  return applyFormatTransformation(committed, transformation);
}

export default joiFormatsToZodBase;
