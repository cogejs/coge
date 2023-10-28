import {Environment} from '@coge/environment';

import {NoGenerators} from './instructions';

export function printAvailableGenerators(env: Environment) {
  const {logger} = env.adapter!;
  if (env.namespaces().length) {
    logger.log('Available Generators:\n');
    logger.log(availableGenerators(env));
  } else {
    logger.log(NoGenerators());
  }
}

export function availableGenerators(env: Environment, prefix?: string) {
  const generators = Object.keys(env.getGenerators())
    .filter(name => (prefix ? name.startsWith(prefix) : true))
    .reduce((namesByGenerator: any, template) => {
      const parts = template.split(':');
      const templateName = <string>parts.shift();

      // If first time we found this template, prepare to save all its sub-templates
      if (!namesByGenerator[templateName]) {
        namesByGenerator[templateName] = [];
      }

      // If sub-template (!== app), save it
      if (parts[0] !== 'app') {
        namesByGenerator[templateName].push(parts.join(':'));
      }

      return namesByGenerator;
    }, {});

  if (Object.keys(generators).length === 0) {
    return "  Couldn't find any generator, did you install any?"; // 'Troubleshoot issues by running\n\n  $ coge doctor';
  }

  return Object.keys(generators)
    .map(generator => {
      const groups = generators[generator].map((group: any) => `    ${group}`).join('\n');
      return `  ${generator}${groups.trim() ? '\n' + groups : ''}`;
    })
    .join('\n');
}
