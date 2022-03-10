import * as fs from 'fs-extra';
import * as ejs from 'ejs';
import * as path from 'path';
import * as walk from 'ignore-walk';
import last from 'tily/array/last';

import {Context, RenderedAction} from '../types';
import {buildContext} from './context';
import {Template} from '../template';

const fm = require('front-matter');

const ignores = [
  'template.toml',
  'prompt.js',
  'index.js',
  'main.js',
  '.cogeignore',
  '.DS_Store',
  '.Spotlight-V100',
  '.Trashes',
  'ehthumbs.db',
  'Thumbs.db',
];

export const render = async (
  context: Context,
  template: Template,
  locals?: Record<string, any>,
): Promise<RenderedAction[]> => {
  locals = locals ?? {};
  const info = template._info;

  // prepare templates
  let files = (await listFiles(info.dir))
    .sort((a: string, b: string) => a.localeCompare(b)) // TODO: add a test to verify this sort
    .filter((file: string) => !ignores.find(ig => file.endsWith(ig)));

  if (info.pattern) {
    files = files.filter((file: any) => file.match(info.pattern));
  }

  if (template.filter) {
    files = await template.filter(files, locals);
  }

  // read templates
  const entries = await Promise.all(
    files.map((file: number | fs.PathLike) => fs.readFile(file).then(text => ({file, text: text.toString()}))),
  );

  // parse and render templates
  return entries
    .map(({file, text}: any) => ({file, ...fm(text, {allowUnsafe: true})}))
    .map(({file, attributes, body}: any) => {
      const extra = extractFilePath(info.dir, file);
      return {
        file,
        attributes: Object.entries(attributes).reduce(
          (obj, [key, value]) => ({
            ...obj,
            [key]: renderTemplate(value, locals, context, extra),
          }),
          {},
        ),
        body: renderTemplate(body, locals, context, extra),
      };
    });
};

async function listFiles(dir: string) {
  return walk.sync({path: dir, ignoreFiles: ['.cogeignore']}).map((f: string) => path.join(dir, f));
}

function extractFilePath(root: string, file: string) {
  const templateDir = path.relative(root, path.dirname(file)) || '.';
  const templateFolder = last(templateDir.split(path.sep));
  return {
    templateDir,
    templateFolder,
    dir: templateDir,
    folder: templateFolder,
  };
}

function renderTemplate(tmpl: any, locals?: Record<string, any>, context?: Context, extra?: Record<string, any>) {
  return typeof tmpl === 'string' ? ejs.render(tmpl, buildContext(locals, context, extra ?? {})) : tmpl;
}
