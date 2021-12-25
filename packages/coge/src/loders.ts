import {Loader} from './types';
import * as fs from 'fs-extra';

export const FileLoader: Loader = {
  exists: fs.pathExists,
  // $FlowFixMe
  load: f => Promise.resolve(require(f)),

  none: _ => ({}),
};
