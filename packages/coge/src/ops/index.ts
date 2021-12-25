import {Op} from '../types';
import {gen} from './gen';
import {inject} from './inject';
import {shell} from './shell';

export const resolveOps = (attributes: {to: any; inject: any; sh: any}) => {
  const ops: Op[] = [];
  if (attributes.to && !attributes.inject) {
    ops.push(gen);
  }
  if (attributes.to && attributes.inject) {
    ops.push(inject);
  }
  if (attributes.sh) {
    ops.push(shell);
  }
  return ops;
};
