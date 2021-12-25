import * as fs from 'fs-extra';
import * as path from 'path';
import {OpResult, RenderedAction} from '../types';
import {createResult} from '../utils';
import {injector} from '../injector';
import {GenerateOptions} from '../generate';
import {OpSession} from '../types';

export async function inject(
  {context: {cwd, env}}: OpSession,
  action: RenderedAction,
  opts: GenerateOptions,
): Promise<OpResult> {
  const {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    attributes: {to, inject},
  } = action;
  const {logger} = env.adapter!;

  const result = createResult('inject', to);

  if (!(inject && to)) {
    return result('ignored');
  }

  const absTo = path.resolve(cwd, to);

  if (!(await fs.pathExists(absTo))) {
    logger.error(`Cannot inject to ${to}: doesn't exist.`);
    return result('error', {
      error: `Cannot inject to ${to}: doesn't exist.`,
    });
  }

  const content = (await fs.readFile(absTo)).toString();
  const injectResult = injector(action, content);

  if (!opts.dry) {
    await fs.writeFile(absTo, injectResult);
  }
  logger.inject(to);

  return result('inject');
}
