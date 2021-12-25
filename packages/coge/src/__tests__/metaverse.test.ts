import * as fs from 'fs-extra';
import * as path from 'path';
import * as dirCompare from 'dir-compare';

import {RunnerSettings} from '../types';
import {cli} from '../cli';
import {failPrompt, preparedPrompt} from './support';

const opts = {compareContent: true};

const SKIP_ON_WINDOWS = process.platform === 'win32' ? ['shell'] : [];

const dir = (m: string) => path.join(__dirname, 'metaverse', m);
const run = async (argv: any[], settings: RunnerSettings) => cli(['node', 'coge', ...argv], settings);
const metaverse = (folder: string, cmds: any[][], promptResponse: Record<string, any>) =>
  it(
    folder,
    async () => {
      const metaDir = dir(folder);
      console.log('metaverse test in:', metaDir);
      const settings = {cwd: metaDir};
      // await fs.remove(path.join(metaDir, 'given'))
      console.log('before', fs.readdirSync(metaDir));
      for (let cmd of cmds) {
        console.log('testing', cmd);
        if (process.platform === 'win32' && SKIP_ON_WINDOWS.find(c => cmd[0] === c)) {
          console.log(`skipping ${cmd} (windows!)`);
          await fs.remove(path.join(metaDir, 'expected', <string>cmd[0]));
          continue;
        }

        let prompt = failPrompt;
        if (promptResponse) {
          const last = cmd[cmd.length - 1];
          if (typeof last === 'object') {
            cmd = cmd.slice(0, cmd.length - 1);
            prompt = preparedPrompt({...promptResponse, ...last});
          } else {
            prompt = preparedPrompt(promptResponse);
          }
        }
        const res = await run(cmd, {prompt, ...settings});
        res.actions.forEach((a: {timing: number; subject: string}) => {
          a.timing = -1;
          a.subject = a.subject.replace(/.*coge\/src/, '');
        });
        expect(res).toMatchSnapshot(cmd.join(' '));
      }
      const givenDir = path.join(metaDir, 'given');
      const expectedDir = path.join(metaDir, 'expected');
      console.log('after', {
        [givenDir]: fs.readdirSync(givenDir),
        [expectedDir]: fs.readdirSync(expectedDir),
      });
      const res = dirCompare.compareSync(givenDir, expectedDir, opts);
      res.diffSet = res.diffSet?.filter(d => d.state !== 'equal');
      if (!res.same) {
        console.log('!!! NOT THE SAME !!!');
        console.log(res);
      }
      expect(res.same).toEqual(true);
    },
    60000,
  );

describe('metaverse', () => {
  beforeAll(() => {
    fs.removeSync(dir('coge-extension/given'));
    fs.removeSync(dir('coge-generators/given'));
  });
  // metaverse('coge-extension', [['coge-js:new']], {overwrite: true})
  metaverse(
    'coge-generators',
    [
      ['init:self'],
      ['overwrite-yes:base'],
      ['overwrite-yes:over'],
      ['overwrite-no:base'],
      ['overwrite-no:over', {overwrite: 'no'}],
      ['mailer:new'],
      ['worker:new', '--name', 'foo'],
      ['shell:new', '--name', 'foo'],
      ['inflection:new', '--name', 'person'],
      ['conditional-rendering:new', '-D', 'notGiven'],
      ['add-unless-exists:new', '-D', 'message=foo'],
      ['cli-prefill-prompt-vars:new', '-D', 'message-from-cli=hello-from-cli'],
      ['cli-prefill-prompt-vars:name-is-special', 'foobar'],
      ['cli-prefill-prompt-vars:falsy-values-are-ok', 'foobar', '-D', 'include_something=false'],
      ['recursive-prompt:new'],
      ['positional-name:new', 'acmecorp'],
      ['existing-params:new', '-D', 'email=premade-email@foobar.com'],
      ['existing-params:new-params-alias', '-D', 'email=premade-email@foobar.com'],
      ['index-js-existing-params:new', '-D', 'email=premade-email@foobar.com'],
      ['index-js-existing-params:new-params-alias', '-D', 'email=premade-email@foobar.com'],
      ['filter:app'],
    ],
    // this is all of the responses enquirer gives out from _all_ tests, ever.
    // it's best to just keep it that way to be simple, and each prompt-dealing test
    // has its own set of uniquely named variables.
    {
      // generic for all tests
      name: 'message',
      message: 'foo',
      overwrite: 'yes',
      license: 'mit',

      // recursive-prompt
      email: 'some-email@foobar.com',
      emailConfirmation: 'confirmed-some-email@foobar.com',
    },
  );
});
