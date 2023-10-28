import * as json5 from 'json5';

import {set, undasherize} from '../utils';

export class AttrsResolver {
  static resolve(attrs?: string[]): {[name: string]: any} {
    if (!attrs) attrs = [];
    if (!Array.isArray(attrs)) attrs = [attrs];
    return attrs.reduce((answer, s) => {
      const parts = s.trim().split(/[=]/);
      let value = parts[1] === undefined ? 'true' : parts[1];
      try {
        value = json5.parse(value);
      } catch (e) {
        // no-op
      }
      set(answer, parts[0], value);
      set(answer, undasherize(parts[0], true), value);
      return answer;
    }, {});
  }
}
