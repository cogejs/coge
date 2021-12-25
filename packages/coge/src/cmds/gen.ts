import {CliCmdDefinition, Context} from '../types';
import {generate} from '../generate';
import {AttrsResolver} from '../resolvers/attrs';

export const gen: CliCmdDefinition = {
  name: 'gen',
  description: 'Generate code in efficient way',
  default: true,
  action,
  arguments: [
    {
      flags: '<generator>',
      description: 'The template used to generate with formula <generator[:group][:pattern]>',
    },
    {
      flags: '[name]',
      description: 'Specify name attribute',
    },
  ],
  options: [
    {
      flags: '--dry',
      description: 'Perform a dry run. files will be generated but not saved.',
    },
    {
      flags: '-g --global',
      description: 'Lookup templates from global and local',
    },
    {
      flags: '-f --force',
      description: 'Overwrite files that already exist without confirmation',
    },
    {
      flags: '--name <name>',
      description: 'Simplified definition of `name` attribute',
    },
    {
      flags: '--group <group>',
      description: 'Simplified definition of `group` attribute',
    },
    {
      flags: '-D --data <var>=<value>',
      description: 'Set data <var> to <value>',
      type: 'repeatable',
    },
    {
      flags: '--skip-install',
      description: 'Skip install for the generators that support npm/yarn installation after code generating',
    },
  ],
};

async function action(context: Context, args: {[p: string]: any}, opts: {[p: string]: any}) {
  const {generator} = args;
  const {group} = opts;
  const name = opts.name || args.name;
  opts.attrs = Object.assign({name, group}, AttrsResolver.resolve(opts.data));
  return generate(context, generator, opts);
}
