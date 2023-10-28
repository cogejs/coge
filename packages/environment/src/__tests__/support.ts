import {sync as execaSync} from 'execa';
import fs from 'fs-extra';
import path from 'path';
import toArray from 'tily/array/toArray';

import {Meta} from '../types';

export function assertGenerator(real: Meta, resolved: string) {
  expect(real).toBeTruthy();
  expect(real.resolved).toBe(path.resolve(__dirname, resolved));
}

export function exec(cmd: string) {
  execaSync(cmd, {shell: true});
}

export function npmLinkFixtures(pkgs: string | string[]) {
  const cwd = process.cwd();
  try {
    for (const pkg of toArray(pkgs)) {
      process.chdir(path.resolve(__dirname, 'fixtures', pkg));
      exec('npm link');
    }
  } finally {
    process.chdir(cwd);
  }
}

export function npmUnlinkFixtures(pkgs: string | string[]) {
  const cwd = process.cwd();
  try {
    for (const pkg of toArray(pkgs)) {
      const p = path.resolve(__dirname, 'fixtures', pkg);
      process.chdir(p);
      exec('npm unlink ' + require(path.resolve(p, 'package.json')).name);
    }
  } finally {
    process.chdir(cwd);
  }
}

export function fslinkDir(source: string, target: string) {
  if (!fs.existsSync(path.resolve(target))) {
    fs.symlinkSync(path.resolve(source), path.resolve(target), 'dir');
    return target;
  }
  return '';
}

export function fsunlink(target: string | string[]) {
  for (const t of toArray(target)) {
    try {
      fs.unlinkSync(path.resolve(t));
    } catch (e) {
      //
    }
  }
}
