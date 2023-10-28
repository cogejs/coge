import * as toml from '@iarna/toml';
import * as fs from 'fs-extra';

export interface TemplateSpecs {
  params?: {
    type?: string;
    name: string;
    message: string;
  }[];

  [p: string]: any;
}

export function loadTemplateSpecs(file: string): TemplateSpecs {
  return toml.parse(fs.readFileSync(file).toString('utf8'));
}
