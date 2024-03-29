import * as fs from 'fs-extra';
import * as path from 'path';
import toArray from 'tily/array/toArray';
import identity from 'tily/function/identity';
import untildify from 'untildify';

import {execaOutput} from './util';

const os = process.platform;

function resolve(paths: Record<string, (opts: any) => string | string[]>, opts: any) {
  return paths[os] ? toArray(paths[os](opts)).map(p => path.resolve(untildify(p))) : [];
}

// https://github.com/yarnpkg/yarn/issues/2049#issuecomment-263183768
const YARN_BASES = {
  win32: ({APPDATA}: any) => `${APPDATA}/Yarn/config/global`,
  darwin: () => '~/.config/yarn/global',
  linux: () => '/usr/local/share/.config/yarn/global',
};

const NPM_ROOTS = {
  win32: ({APPDATA}: any) => [`${APPDATA}/npm/node_modules`, `${APPDATA}/roaming/npm/node_modules`],
  darwin: () => '/usr/local/lib/node_modules',
  linux: () => '/usr/local/lib/node_modules',
};

export const resolveYarnBase = (ask?: boolean): string[] => {
  let result: string[];
  if (ask) {
    result = toArray(execaOutput('yarn', ['global', 'dir'], {encoding: 'utf8'}));
  } else {
    result = resolve(YARN_BASES, process.env);
  }
  return result.filter(identity).filter(f => fs.existsSync(f));
};
export const resolveNpmRoot = (ask?: boolean): string[] => {
  let result: string[];
  if (ask) {
    result = toArray(execaOutput('npm', ['root', '-g'], {encoding: 'utf8'}));
  } else {
    result = resolve(NPM_ROOTS, process.env);
  }
  return result.filter(identity).filter(f => fs.existsSync(f));
};
