import * as fs from 'fs-extra';

import {Loader} from './types';

export const FileLoader: Loader = {
  exists: fs.pathExists,
  // $FlowFixMe
  load: f => Promise.resolve(require(f)),

  none: _ => ({}),
};
