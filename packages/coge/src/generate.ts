/* eslint-disable @typescript-eslint/no-explicit-any */

import * as chalk from 'chalk';
import {InstallOptions} from '@coge/generator';
import {render} from './rendering';
import {resolveOps} from './ops';
import {ErrorWithInstruction} from './errors';

import {assign} from './utils';
import {Context, OpResult, OpSession} from './types';
import {prompt} from './prompt';
import {loadTemplate} from './template';

export interface GenerateOptions {
  global?: boolean;
  force?: boolean;
  dry?: boolean;
  attrs?: Record<string, any>;
  skipInstall?: boolean;
}

export async function generate(context: Context, generator: string, opts: GenerateOptions) {
  const {logger} = context.env.adapter!;
  try {
    const actions = await doGenerate(context, generator, opts);
    return {success: true, actions, time: 0};
  } catch (err) {
    logger.log(chalk.red(err.toString()));
    if (err instanceof ErrorWithInstruction) {
      logger.log(err.instruction);
    }
    if (context.debug) {
      logger.log('');
      logger.log('-------------------');
      logger.log(err.stack);
      logger.log('-------------------');
    }
    return {success: false, actions: [], time: 0};
  }
}

async function doGenerate(context: Context, generator: string, opts: GenerateOptions & InstallOptions) {
  const {cwd, env} = context;
  const {logger} = env.adapter!;

  if (opts.dry) {
    logger.log('(dry mode)');
  }
  if (!generator) {
    throw new Error('Please specify a generator.');
  }

  const template = loadTemplate(env, generator, opts);

  if (template.init) {
    const initialized = await template.init();
    if (!initialized && initialized != null) {
      return [];
    }
  }

  const attrs = assign({cwd}, opts.attrs);

  // 1. prompt locals
  const answers = await prompt(env.adapter!, template, attrs);
  let locals: Record<string, any> = Object.assign({}, answers, attrs, {cwd});

  // 2. hook locals
  if (template.locals) {
    locals = (await template.locals(locals)) ?? locals;
  }

  // 3. render templates
  const renderedActions = await render(context, template, locals);

  const messages: string[] = [];
  const results: OpResult[] = [];
  const session: OpSession = {context};

  // 4. perform operations
  for (const action of renderedActions) {
    const {message} = action.attributes;
    if (message) {
      messages.push(message);
    }
    const ops = resolveOps(action.attributes);
    for (const op of ops) {
      results.push(await op(session, action, opts));
    }
  }
  if (messages.length > 0) {
    logger.colorful(`${generator}:\n${messages.join('\n')}`);
  }

  if (template.install) {
    await template.install(opts);
  }

  if (template.end) {
    await template.end();
  }

  return results;
}
