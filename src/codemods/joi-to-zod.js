/**
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @returns {string}
 */
function transform(fileInfo, api) {
  const j = api.jscodeshift;
  const source = j(fileInfo.source);

  return source.toSource();
}

export default transform;
