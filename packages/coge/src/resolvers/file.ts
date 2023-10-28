import * as importedPath from 'path';

import {Loader} from '../types';

// inline fp methods due to perf
const uniq = (arr: any[]) => arr.filter((elem, pos, a) => a.indexOf(elem) === pos);

export const reversePathsToWalk = ({folder, path}: any) => {
  const resolved = path.resolve(folder);
  const parts = resolved.split(path.sep);
  const results = parts.map((_: any, idx: number, arr: any[]) => arr.slice(0, idx + 1).join(path.sep));
  results[0] = results[0] || '/';
  return results.reverse();
};

export const lookup = (file: string, folder: string, path: any = importedPath) =>
  uniq(reversePathsToWalk({folder, path}).map((p: any) => path.join(p, file)));

export class FileResolver {
  file: string;
  loader: Loader;

  constructor(file: string, loader: Loader) {
    this.file = file;
    this.loader = loader;
  }

  async resolve(from: string) {
    const candidates = lookup(this.file, from);
    const {exists, load, none} = this.loader;
    for (const candidate of candidates) {
      if (await exists(candidate)) {
        return load(candidate);
      }
    }
    return none(from);
  }
}
