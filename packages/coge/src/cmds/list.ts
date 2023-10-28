import {availableGenerators} from '../help';
import {CliCmdDefinition, Context} from '../types';

export const list: CliCmdDefinition = {
  name: 'list',
  alias: 'ls',
  description: 'List available templates',
  action,
};

async function action(context: Context) {
  const {env} = context;
  const {adapter} = env;

  adapter?.logger.log('Available Templates:\n');
  adapter?.logger.log(availableGenerators(env));
}
