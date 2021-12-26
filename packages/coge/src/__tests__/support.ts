import * as path from 'path';

export const fixture = (dir: string) =>
  path.join(__dirname, 'fixtures/templates', dir);

export const failPrompt = async (): Promise<any> => {
  throw new Error('set up prompt in testing');
};

export const preparedPrompt =
  (answers: Record<string, any>) => async (): Promise<any> => {
    return answers;
  };
