import path from 'node:path';

import ts from 'typescript';
import fg from 'fast-glob';

const TARGET_FILE_EXTENSIONS = ['ts', 'js', 'jsx', 'tsx'];
const JOI_IMPORT_TERMS = ['@hapi/joi', 'joi'];

export async function findSourcePathsWithJoi(
  targetRootDirectory: string,
  config: { glob?: Array<string> } = {},
): Promise<Array<string>> {
  const importSources = await findImportSourcesWithJoi(targetRootDirectory, config);

  return importSources.map(({ path: filepath }) => filepath);
}

async function findImportSourcesWithJoi(
  targetRootDirectory: string,
  config: { glob?: Array<string> },
): Promise<Array<{ importSources: Array<ts.StringLiteral>; path: string }>> {
  const filepaths = await getAllTargetFilepaths(targetRootDirectory, config);

  return filepaths
    .map(filepath => ({ importSources: findImportSources(filepath, JOI_IMPORT_TERMS), path: filepath }))
    .filter(({ importSources }) => importSources.length > 0);
}

function findImportSources(filepath: string, searchImport: string | Array<string>): Array<ts.StringLiteral> {
  return getAllImportSources(filepath).filter(importSource => searchImport.includes(importSource.text));
}

function getAllImportSources(filepath: string): Array<ts.StringLiteral> {
  // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
  const program = ts.createProgram([filepath], { allowJs: true });
  const sourceFile = program.getSourceFile(filepath);
  if (isUndefinedOrNull(sourceFile)) {
    throw new Error(`Failed to get source file for '${filepath}'`);
  }

  const importSources: Array<ts.StringLiteral> = [];
  ts.forEachChild(sourceFile, node => {
    if (!ts.isImportDeclaration(node)) return;

    const { moduleSpecifier } = node;
    if (!ts.isStringLiteral(moduleSpecifier)) return;

    importSources.push(moduleSpecifier);
  });

  return importSources;
}

function isUndefinedOrNull<T>(maybeValue: T | undefined | null): maybeValue is undefined | null {
  return !isNotUndefinedOrNull(maybeValue);
}

function isNotUndefinedOrNull<T>(maybeValue: T | undefined | null): maybeValue is T {
  return maybeValue != null;
}

function getAllTargetFilepaths(targetRootDirectory: string, config: { glob?: Array<string> }): Promise<Array<string>> {
  const globSearchPath = path.join(targetRootDirectory, `**/*.(${TARGET_FILE_EXTENSIONS.join('|')})`);
  const extraGlobs = config.glob ?? [];
  const globPatterns = [globSearchPath].concat(extraGlobs);

  return fg(globPatterns);
}
