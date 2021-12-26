import values from 'tily/object/values';

import * as commands from './cmds';
import {CliCmdActionCallback, CliCmdDefinition, RunnerSettings} from './types';
import {DefaultContext} from './context';

const Program = require('caporal/lib/program');

const pkg = require('../package.json');

const DEBUG_LEVELS = ['debug', 'verbose', 'silly'];

type Caporal = any;

interface PerformOptions {
  args: {[k: string]: any};
  opts: {[k: string]: any};
  debug?: boolean;
  settings?: RunnerSettings;
}

export async function cli(argv: any[], settings?: RunnerSettings) {
  return createProgram(argv, settings);
}

async function createProgram(argv: any[], settings?: RunnerSettings) {
  const program: Caporal = new Program();
  program.version(pkg.version);
  values(commands).forEach(def => registerCommand(program, def, settings));
  return program.parse(argv);
}

function registerCommand(
  program: Caporal,
  def: CliCmdDefinition,
  settings?: RunnerSettings,
) {
  const cmd = def.default
    ? program.description(def.description)
    : program.command(def.name, def.description);
  if (def.alias) {
    cmd.alias(def.alias);
  }
  cmd.action((args: any, opts: any, logger: any) => {
    const debug = DEBUG_LEVELS.includes(
      logger?.transports?.caporal?.level?.toLowerCase(),
    );
    return perform(def.action, {settings, args, opts, debug});
  });

  if (def.help) {
    cmd.help(def.help);
  }

  if (def.arguments) {
    for (const a of def.arguments) {
      const arg = cmd.argument(
        a.flags,
        a.description,
        a.validator,
        a.defaultValue,
      );
      if (a.complete) {
        arg.complete(a.complete);
      }
    }
  }

  if (def.options) {
    for (const o of def.options) {
      const opt = cmd.option(
        o.flags,
        o.description,
        o.validator || (o.type && program[o.type.toUpperCase()]),
        o.defaultValue,
        o.required,
      );
      if (o.complete) {
        opt.complete(o.complete);
      }
    }
  }
}

async function perform(
  action: CliCmdActionCallback,
  {args, opts, debug, settings}: PerformOptions,
) {
  settings = settings ?? {};
  return action(
    await DefaultContext.create({
      ...settings,
      debug,
      lookup: {},
    }),
    args,
    opts,
  );
}

if (require.main === module) {
  cli(process.argv).catch(console.error);
}
