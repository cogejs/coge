import * as changeCase from 'change-case';
import * as inflection from 'inflection';

import {Context} from '../types';
import {stringify, undasherize} from '../utils';

// supports kebab-case to KebabCase
(inflection as any).undasherize = undasherize;

const helpers = {
  capitalize: (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(),
  inflection,
  changeCase,
  stringify,
};

const doCapitalization = (hsh: {[x: string]: any}, [key, value]: any) => {
  hsh[key] = value;

  if (localsToCapitalize.includes(key)) hsh[helpers.capitalize(key)] = helpers.capitalize(value);

  return hsh;
};

const localsToCapitalize = ['name'];
const localsDefaults = {
  name: 'unnamed',
  group: '',
  folder: '', // the short name of templateDir
  templateFolder: '', // the folder name of the template file
  dir: '', // the short name of templateDir
  templateDir: '', // the relative directory to template root
  targetDir: '', // the target directory relative to cwd
};

const capitalizedLocals = (locals: any) => Object.entries(locals).reduce(doCapitalization, {});

export const buildContext = (locals: any, context?: Context, ...extras: Record<string, any>[]) => {
  const localsWithDefaults = Object.assign({}, localsDefaults, locals, ...extras);
  const configHelpers =
    typeof context?.helpers === 'function' ? context.helpers(locals, context) : context?.helpers ?? {};
  return Object.assign(localsWithDefaults, capitalizedLocals(localsWithDefaults), {
    h: {...helpers, ...configHelpers},
  });
};
