import {Environment} from '@coge/environment';
import {Context} from '../../types';

export class MockContext implements Context {
  cwd: string;
  env: Environment;

  constructor(options?: Partial<Context>) {
    Object.assign(
      this,
      {
        cwd: process.cwd(),
        env: new Environment(),
      },
      options,
    );
  }
}
