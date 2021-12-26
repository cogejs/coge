import {RenderedAction} from './types';
import identity from 'tily/function/identity';

const getPragmaticIndex = (
  pattern: string | RegExp,
  lines: any[],
  isBefore: boolean,
) => {
  const oneLineMatchIndex = lines.findIndex(l => l.match(pattern));

  if (oneLineMatchIndex < 0) {
    const fullText = lines.join('\n');
    const fullMatch = fullText.match(new RegExp(pattern, 'm'));

    if (fullMatch?.length) {
      if (isBefore) {
        const fullTextUntilMatchStart = fullText.substring(0, fullMatch.index);
        return fullTextUntilMatchStart.split('\n').length - 1;
      }
      const matchEndIndex =
        (fullMatch.index ?? 0) + fullMatch.toString().length;
      const fullTextUntilMatchEnd = fullText.substring(0, matchEndIndex);
      return fullTextUntilMatchEnd.split('\n').length;
    }
  }

  return oneLineMatchIndex + (isBefore ? 0 : 1);
};
const locations = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  at_line: identity,
  prepend: () => 0,
  append: (_: any, lines: string | any[]) => lines.length - 1,
  before: (_: string | RegExp, lines: any[]) =>
    getPragmaticIndex(_, lines, true),
  after: (_: string | RegExp, lines: any[]) =>
    getPragmaticIndex(_, lines, false),
};

const indexByLocation = (attributes: any, lines: string[]): number => {
  const pair = Object.entries(attributes).find(
    ([k, _]) => (locations as any)[k],
  );
  if (pair) {
    const [k, v] = pair;
    return (locations as any)[k](v, lines);
  }
  return -1;
};

export const injector = (action: RenderedAction, content: string): string => {
  const {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    attributes: {skip_if, eof_last},
    attributes,
    body,
  } = action;
  const lines = content.split('\n');
  const shouldSkip = skip_if && !!content.match(skip_if);

  if (!shouldSkip) {
    const idx = indexByLocation(attributes, lines);
    const trimEOF = idx >= 0 && eof_last === false && /\r?\n$/.test(body);
    const insertEOF = idx >= 0 && eof_last === true && !/\r?\n$/.test(body);

    if (trimEOF) {
      lines.splice(idx, 0, body.replace(/\r?\n$/, ''));
    } else if (insertEOF) {
      lines.splice(idx, 0, `${body}\n`);
    } else if (idx >= 0) {
      lines.splice(idx, 0, body);
    }
  }

  return lines.join('\n');
};
