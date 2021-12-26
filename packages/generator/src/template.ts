import {InstallMixin, InstallOptions} from './mixins/install';
import {BaseTemplate, BaseTemplateOptions} from './base';
import {SpawnMixin} from './mixins/spawn';

export interface Prompter<Q, T> {
  prompt: (questions: Q) => Promise<T>;
}

export interface PromptOptions {
  prompter: Prompter<any, any>;
  context: Record<string, any>;
}

export interface Templating {
  init?: () => Promise<boolean | undefined>;
  questions?: (opts: PromptOptions) => Promise<Record<string, any>[]>;
  params?: (opts: PromptOptions) => Promise<any>;
  prompt?: (opts: PromptOptions) => Promise<any>;
  locals?: (
    locals: Record<string, any>,
  ) => Promise<Record<string, any> | undefined>;
  filter?: (files: string[], locals: Record<string, any>) => Promise<string[]>;
  install?: (opts?: InstallOptions) => Promise<void>;
  end?: () => Promise<void>;
}

export interface TemplateOptions extends BaseTemplateOptions {}

export class Template
  extends InstallMixin(SpawnMixin(BaseTemplate))
  implements Templating
{
  opts: TemplateOptions;

  constructor(opts?: TemplateOptions) {
    super(opts);
  }

  async locals(
    locals: Record<string, any>,
  ): Promise<Record<string, any> | undefined> {
    return locals;
  }

  async filter(
    files: string[],
    locals: Record<string, any>,
  ): Promise<string[]> {
    return files;
  }

  async install(): Promise<void> {
    return;
  }

  async end(): Promise<void> {
    return;
  }
}
