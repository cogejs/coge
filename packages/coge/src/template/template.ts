import * as path from 'path';
import isScoped from 'is-scoped';
import * as globby from 'globby';
import {Templating} from '@coge/generator';
import {Environment, Meta} from '@coge/environment';
import {loadTemplateSpecs, TemplateSpecs} from './specs';
import {ErrorWithInstruction} from '../errors';
import {AvailableTemplatesForGenerator, GeneratorNotFound} from '../instructions';

export interface TemplateInfo {
  dir: string;
  meta: Meta;
  specs: TemplateSpecs;
  pattern?: string;
}

export interface Template extends Templating {
  _info: TemplateInfo;
}

export function loadTemplate(env: Environment, namespace: string, opts: any): Template {
  let generator = '';
  let pattern: string | undefined = undefined;
  let meta = env.get(namespace);
  if (!meta) {
    const parts = namespace.split(':');
    generator = parts[0];
    if (parts.length >= 2) {
      pattern = parts.pop();
      meta = env.get(parts.join(':'));
    }
  }
  if (!meta) {
    throw notFoundTemplate(env, namespace, generator);
  }

  const dir = path.dirname(meta.resolved);
  const specs = loadTemplateSpecs(meta.resolved);

  const info = {meta, specs, dir, pattern};
  const template = create(dir, {env, ...info, ...opts});
  template._info = info;
  return template;
}

function create(cwd: string, opts: any): Template {
  // TODO prompt.js will be removed
  const file = globby.sync('{index,main,prompt}.js', {
    cwd,
    absolute: true,
  })[0];

  if (file) {
    try {
      const Module = require(file);
      if (typeof Module === 'function') {
        return new Module(opts);
      }
      if (Array.isArray(Module)) {
        return <Template>(<unknown>{questions: async (_: any) => Module});
      }
      return <Template>Module;
    } catch (e) {
      console.warn(e);
    }
  }
  return <Template>{};
}

function notFoundTemplate(env: Environment, namespace: string, generator: string) {
  const installed = !!env.namespaces().find(n => n.startsWith(generator));
  const name = getTemplateName(namespace);
  const hint = getTemplateHint(name);
  if (installed) {
    return new ErrorWithInstruction(
      `Generator '${hint}' doesn\'t have an template with namespace '${namespace}'.`,
      AvailableTemplatesForGenerator(env, name, hint),
    );
  } else {
    return new ErrorWithInstruction(
      `You don't seem to have a generator with the name '${hint}' installed.`,
      GeneratorNotFound(env, name, hint),
    );
  }
}

function getTemplateName(namespace: string) {
  return namespace.split(':')[0];
}

function getTemplateHint(namespace: string) {
  if (isScoped(namespace)) {
    const splitName = namespace.split('/');
    return `${splitName[0]}/gen-${splitName[1]}`;
  }
  return `gen-${namespace}`;
}
