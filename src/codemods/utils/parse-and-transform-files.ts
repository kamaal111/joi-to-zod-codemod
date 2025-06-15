import fs from 'node:fs/promises';
import path from 'node:path';

import type { NapiLang } from '@ast-grep/napi/types/lang.js';
import fg from 'fast-glob';

import type { Modifications } from '../types.js';
import { LANG_TO_EXTENSIONS_MAPPING } from '../../constants.js';

async function parseAndTransformFiles(
  globPattern: { searches: Array<string>; ignores: Array<string> },
  lang: NapiLang,
  options: { dryRun: boolean; log: boolean },
  transformer: (lang: NapiLang, content: string, filename: string) => Promise<Modifications>,
): Promise<void> {
  const extensions = LANG_TO_EXTENSIONS_MAPPING[lang] ?? [];
  const targets = (await fg.glob(globPattern.searches, { ignore: globPattern.ignores })).filter(filename => {
    return extensions.includes(path.extname(filename));
  });
  const transformerName = transformer.name
    .split(/(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-')
    .replace(/^-/, '');
  console.log(
    `🧉 '${transformerName}' targeting ${targets.length} ${targets.length === 1 ? 'file' : 'files'} to transform, chill and grab some maté`,
  );
  await Promise.all(
    targets.map(async filepath => {
      try {
        const content = await fs.readFile(filepath, { encoding: 'utf-8' });
        const { ast, report } = await transformer(lang, content, filepath);
        if (report.changesApplied > 0) {
          if (!options.dryRun) {
            await fs.writeFile(filepath, ast.root().text());
          }
          console.log(`🚀 finished '${transformerName}'`, { filename: filepath, report });
        }
      } catch (error) {
        console.error(`❌ '${transformerName}' failed to parse file`, error);
      }
    }),
  );
}

export default parseAndTransformFiles;
