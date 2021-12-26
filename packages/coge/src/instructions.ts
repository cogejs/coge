import chalk from 'chalk';
import {Environment} from '@coge/environment';
import {availableGenerators} from './help';

export const NoGenerators = () => `No generators found.

This means 'coge' didn't find a generators folder right here,
or anywhere up the folder tree starting here.

Here's how to start using coge:

$ coge init
$ coge generator:new coco

(edit your generator in generators/gen-coco)

$ coge coco:gen

See https://github.com/cogejs/coge for more.
`;

export const GeneratorNotFound = (
  env: Environment,
  name: string,
  module: string,
) => `
Help is on the way:

  1. You can see available generators via ${chalk.yellow(
    'npm search @coge/generator',
  )}.
     Install them with ${chalk.yellow('npm install ' + module)}.

  2. You can try:
     1) ${chalk.yellow('coge init')} to initialize your project, and
     2) ${chalk.yellow(
       'coge generator:new ' + name,
     )} to build the generator you wanted.

To see all your installed generators run ${chalk.yellow('coge list')}.

If ${chalk.yellow('coge list')} cannot find the generator, run ${chalk.yellow(
  'coge doctor',
)} to troubleshoot your system.
`;

export const AvailableTemplatesForGenerator = (
  env: Environment,
  name: string,
  module: string,
) => `
Available Generators in ${chalk.yellow(module)}:
${availableGenerators(env, name)}`;
