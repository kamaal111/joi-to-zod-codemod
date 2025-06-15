import { Lang } from '@ast-grep/napi';

export const DEFAULT_IGNORES = ['node_modules', 'dist'];
export const DEFAULT_SEARCHES = ['**/*'];
export const DEFAULT_DRY_RUN_OPTION = false;
export const DEFAULT_NO_LOG_OPTION = false;

export const LANG_TO_EXTENSIONS_MAPPING: Partial<Record<string, Array<string>>> = {
  [Lang.TypeScript]: ['.ts'],
};
