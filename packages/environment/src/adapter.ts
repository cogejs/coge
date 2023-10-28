import chalk from 'chalk';
import {Console} from 'console';
import * as diff from 'diff';
import inquirer from 'inquirer';
import {ReadStream, WriteStream} from 'tty';

import {Logger} from './logger';

export type Answers = Record<string, any>;
export interface PromptModule {
  (questions: object | object[], answers?: Answers): Promise<Answers>;
}

export type PromptCallback<T> = (answers: T) => void;

export interface ColorsByOptions {
  added: chalk.Chalk;
  removed: chalk.Chalk;
}

export type ColorOptions = keyof ColorsByOptions;

export interface Adapter {
  prompt<T>(questions: object | object[], cb?: PromptCallback<T>): Promise<T>;

  prompt<T>(questions: object | object[], answers: T, cb?: PromptCallback<T>): Promise<T>;

  diff(actual: string, expected: string): string;
}

export interface TerminalAdapterOptions {
  prompt?: PromptModule;
  stdin?: ReadStream;
  stdout?: WriteStream;
  stderr?: WriteStream;
  console?: Console;
}

/**
 * `TerminalAdapter` is the default implementation of `Adapter`, an abstraction
 * layer that defines the I/O interactions.
 *
 * It provides a CLI interaction
 *
 * @constructor
 */
export class TerminalAdapter implements Adapter {
  promptModule: PromptModule;
  console: Console;
  logger: Logger;

  colorDiff: ColorsByOptions = {
    added: chalk.black.bgGreen,
    removed: chalk.bgRed,
  };

  constructor(options?: TerminalAdapterOptions) {
    options = options ?? {};
    const stdout = options.stdout ?? process.stdout;
    const stderr = options.stderr ?? options.stdout ?? process.stderr;

    this.promptModule = options.prompt ?? inquirer.createPromptModule({input: options.stdin, output: stdout});
    this.console = options.console ?? new Console(stdout, stderr);
    this.logger = new Logger({console: this.console, stdout: options.stdout});
  }

  protected colorLines(name: ColorOptions, str: string) {
    return str
      .split('\n')
      .map((line: string) => this.colorDiff[name](line))
      .join('\n');
  }

  /**
   * Prompt a user for one or more questions and pass
   * the answer(s) to the provided callback.
   *
   * It shares its interface with `Base.prompt`
   *
   * (Defined inside the constructor to keep interfaces separated between
   * instances)
   *
   */
  prompt(
    questions: object | object[],
    answers?: Answers | PromptCallback<Answers>,
    cb?: PromptCallback<Answers>,
  ): Promise<Answers> {
    if (typeof answers === 'function') {
      cb = <PromptCallback<Answers>>answers;
      answers = undefined;
    }
    const promise = this.promptModule(questions, answers);
    // eslint-disable-next-line no-void
    void promise.then(cb);
    return promise;
  }

  /**
   * Shows a color-based diff of two strings
   *
   * @param {string} actual
   * @param {string} expected
   */
  diff(actual: string, expected: string) {
    let msg = diff
      .diffLines(actual, expected)
      .map((str: diff.Change) => {
        if (str.added) {
          return this.colorLines('added', str.value);
        }

        if (str.removed) {
          return this.colorLines('removed', str.value);
        }

        return str.value;
      })
      .join('');

    // Legend
    msg = '\n' + this.colorDiff.removed('removed') + ' ' + this.colorDiff.added('added') + '\n\n' + msg + '\n';

    console.log(msg);
    return msg;
  }
}
