import fs from 'node:fs/promises';
import path from 'node:path';

import type { NapiLang } from '@ast-grep/napi/types/lang.js';
import fg from 'fast-glob';

import type { Modifications } from '../types.js';
import { LANG_TO_EXTENSIONS_MAPPING } from '../../constants.js';

async function parseAndTransformFiles(
  globPattern: { searches: Array<string>; ignores: Array<string> },
  lang: NapiLang,
  options: { dryRun: boolean; noLog: boolean; cwd: string },
  transformer: (content: string, filename: string) => Promise<Modifications>,
): Promise<Array<Modifications | Error>> {
  const extensions = LANG_TO_EXTENSIONS_MAPPING[lang] ?? [];
  const globItems = await fg.glob(globPattern.searches, { ignore: globPattern.ignores, cwd: options.cwd });
  const targets = globItems.filter(filename => extensions.includes(path.extname(filename)));
  const transformerName = transformer.name
    .split(/(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-')
    .replace(/^-/, '');
  if (!options.noLog) {
    console.log(
      `🧉 '${transformerName}' targeting ${targets.length} ${targets.length === 1 ? 'file' : 'files'} to transform, chill and grab some maté`,
    );
  }

  return Promise.all(
    targets.map(async filepath => {
      const fullPath = path.join(options.cwd, filepath);
      try {
        const content = await fs.readFile(fullPath, { encoding: 'utf-8' });
        const modifications = await transformer(content, fullPath);
        if (modifications.report.changesApplied > 0) {
          if (!options.dryRun) {
            await fs.writeFile(fullPath, modifications.ast.root().text());
            if (!options.noLog) {
              console.log(`🚀 finished '${transformerName}'`, { filename: filepath, report: modifications.report });
            }
          }
        }

        return modifications;
      } catch (error) {
        if (!options.noLog) {
          console.error(`❌ '${transformerName}' failed to parse file`, error);
        }

        return error as Error;
      }
    }),
  );
}

export default parseAndTransformFiles;
