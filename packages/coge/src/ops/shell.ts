import isEmpty from 'tily/is/empty';
import {OpResult, RenderedAction, OpSession} from '../types';
import {createResult} from '../utils';
import {GenerateOptions} from '../generate';

export async function shell(
  {context: {cwd, env, exec}}: OpSession,
  {attributes: {sh}, body}: RenderedAction,
  opts: GenerateOptions,
): Promise<OpResult> {
  const {logger} = env.adapter!;
  const result = createResult('shell', sh);
  if (!isEmpty(sh)) {
    if (!opts.dry) {
      await exec(sh, body);
    }
    logger.status('shell', sh);

    return result('executed');
  }
  return result('ignored');
}
