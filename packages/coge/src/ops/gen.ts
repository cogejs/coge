import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';

import {Environment} from '@coge/environment';
import {GenerateOptions} from '../generate';
import {OpResult, OpSession, Prompter, RenderedAction} from '../types';

import {createResult} from '../utils';

export async function gen(
  session: OpSession,
  action: RenderedAction,
  opts: GenerateOptions,
): Promise<OpResult> {
  const {
    context: {cwd, env},
  } = session;
  const {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    attributes: {to, inject, unless_exists},
  } = action;
  const {logger} = env.adapter!;
  const prompter = env.adapter;
  const result = createResult('add', to);
  if (!to || inject) {
    return result('ignored');
  }
  const absTo = path.resolve(cwd, to);
  const shouldNotOverwrite =
    unless_exists !== undefined && unless_exists === true;
  const exists = await fs.pathExists(absTo);
  const content = exists
    ? (await fs.readFile(absTo)).toString('utf8')
    : undefined;
  const identical = exists && content === action.body;

  if (exists && !identical) {
    if (!process.env.COGE_OVERWRITE && !opts.force && !session.overwrite) {
      let overwrite = shouldNotOverwrite ? 'no' : '';
      if (!overwrite) {
        logger.conflict(to);
        overwrite = await resolveConflict(
          env,
          prompter,
          to,
          exists,
          action.body,
        );
        session.overwrite = overwrite === 'all';
      }

      if (overwrite === 'no') {
        logger.skip(to);
        return result('skipped');
      }

      if (overwrite === 'quit') {
        return process.exit(1);
      }
    }
  }

  if (!opts.dry) {
    await fs.ensureDir(path.dirname(absTo));
    await fs.writeFile(absTo, action.body);
  }
  if (identical) {
    logger.identical(to);
  } else if (exists) {
    logger.force(to);
  } else {
    logger.create(to);
  }
  return result('generated');
}

async function resolveConflict(
  env: Environment,
  prompter: any,
  to: any,
  oldBody: any,
  newBody: any,
): Promise<any> {
  const overwrite = await overwritePrompt(
    prompter,
    chalk.red(`Conflict on ${to}.`),
    to,
  );
  if (overwrite !== 'diff') {
    return overwrite;
  }
  env.adapter!.diff(oldBody, newBody);
  return resolveConflict(env, prompter, to, oldBody, newBody);
}

async function overwritePrompt(
  prompter: Prompter<any, any>,
  message: string,
  to: string,
) {
  return prompter
    .prompt({
      type: 'expand',
      name: 'overwrite',
      message,
      choices: [
        {
          key: 'y',
          name: 'Overwrite',
          value: 'yes',
        },
        {
          key: 'n',
          name: 'Do not overwrite',
          value: 'no',
        },
        {
          key: 'a',
          name: 'Overwrite this and all others',
          value: 'all',
        },
        {
          key: 'q',
          name: 'Quit',
          value: 'quit',
        },
        {
          key: 'd',
          name: 'Show the differences between the old and the new',
          value: 'diff',
        },
      ],
    })
    .then(({overwrite}) => overwrite);
}
