import merge from 'tily/object/merge';
import spawn from 'cross-spawn-promise';
import {CrossSpawnOptions} from 'cross-spawn-promise';
import {Constructor, Spawnable} from '../types';

export function SpawnMixin<T extends Constructor<any>>(superClass: T) {
  return class extends superClass implements Spawnable {
    constructor(...args: any[]) {
      super(...args);
    }

    /**
     * Normalize a command across OS and spawn it (asynchronously).
     *
     * @param {String} cmd program to execute
     * @param {Array} args list of arguments to pass to the program
     * @param {object} [opt] any cross-spawn options
     * @return {Promise<String>} spawned process reference
     */
    async spawn(
      cmd: string,
      args?: any[],
      opt?: Partial<CrossSpawnOptions>,
    ): Promise<Uint8Array> {
      opt = opt ?? {};
      return spawn(cmd, args, merge(opt, {stdio: 'inherit'}));
    }
  };
}
