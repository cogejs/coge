import * as path from 'path';
import {render} from '../rendering';
import {MockContext} from './mocks/context';
import {mockTemplate} from './mocks/template';

const fixture = (name: string) => path.join(__dirname, './fixtures', name);

describe('render ng', () => {
  it('should provide correct file name and body should be empty if template is empty', async () => {
    // setup
    const expectedFile = /empty/;
    const expectedBody = '';
    // act
    const actual = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-empty'),
      }),
    );
    const actualFile = actual[0].file;
    const actualBody = actual[0].body;
    // assert
    expect(actualFile).toMatch(expectedFile);
    expect(actualBody).toEqual(expectedBody);
  });
  it('should provide correct file name full and apply variable correctly ', async () => {
    // setup
    const expectedVariableText = /You owe 17/;
    const expectedFileName = /full/;
    const expectedFilePath = 'foo/someone/bar';
    // act
    const actual = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-full'),
      }),
      {
        bill: 17,
        name: 'someone',
      },
    );
    // get template that was loaded
    const actualFile = actual[0].file;
    // get the To that was generated
    const actualTo = actual[0].attributes.to;
    // get body that was generated from template
    const actualBody = actual[0].body;
    // assert
    // is correct template file
    expect(actualFile).toMatch(expectedFileName);
    // generated the correct To file
    expect(actualTo).toMatch(expectedFilePath);
    // i guess just testing this text is still there
    expect(actualBody).toMatch('Find me at <i>app/mailers/hello/html.ejs</i>');
    // applied bill variable correctly
    expect(actualBody).toMatch(expectedVariableText);
  });

  it('should capitalize', async () => {
    // setup
    const expectedFile = /capitalized/;
    const expectedBody = /someone and Someone/;
    // act
    const response = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-capitalized'),
      }),
      {
        name: 'someone',
      },
    );
    const actualFile = response[0].file;
    const actualBody = response[0].body;
    // assert
    expect(actualFile).toMatch(expectedFile);
    expect(actualBody).toMatch(expectedBody);
  });

  it('capitalized with default locals', async () => {
    // setup
    const expectedFile = /capitalized/;
    const expectedBody = /unnamed and Unnamed/;
    // act
    const response = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-capitalized-defaults'),
      }),
    );
    const actualFile = response[0].file;
    const actualBody = response[0].body;
    // assert
    expect(actualFile).toMatch(expectedFile);
    expect(actualBody).toMatch(expectedBody);
  });

  it('should render all files in an group folder ', async () => {
    // setup
    const expectedFileCount = 2;
    const expectedFileOne = /capitalized/;
    const expectedFileTwo = /full/;
    // act
    const response = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-multifiles'),
      }),
      {
        bill: 17,
      },
    );
    const actualFileCount = response.length;
    const actualFileOne = response[0].file;
    const actualFileTwo = response[1].file;
    // assert
    expect(actualFileCount).toEqual(expectedFileCount);
    expect(actualFileOne).toMatch(expectedFileOne);
    expect(actualFileTwo).toMatch(expectedFileTwo);
  });

  it('should include files nested subfolders', async () => {
    // setup
    const expectedFileCount = 2;
    const expectedFileOne = /capitalized/;
    const expectedFileTwo = /full/;
    // act
    const response = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-multifiles-nest'),
      }),
      {
        bill: 17,
      },
    );
    const actualFileCount = response.length;
    const actualFileOne = response[0].file;
    const actualFileTwo = response[1].file;
    // assert
    expect(actualFileCount).toEqual(expectedFileCount);
    expect(actualFileOne).toMatch(expectedFileOne);
    expect(actualFileTwo).toMatch(expectedFileTwo);
  });

  it('should filter what will be rendered only to that subaction value', async () => {
    // setup
    const expectedFileCount = 1;
    const expectedFile = /capitalized/;
    // act
    const response = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-multifiles'),
        pattern: 'capitalized',
      }),
      {
        bill: 17,
      },
    );
    const actualFileCount = response.length;
    const actualFile = response[0].file;
    // assert
    expect(actualFileCount).toEqual(expectedFileCount);
    expect(actualFile).toMatch(expectedFile);
  });

  // FIXME this test doesn't seem to be actually testing injection unless i'm missing something
  it('inject', async () => {
    const res = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-inject'),
      }),
      {
        name: 'devise',
      },
    );
    expect(res[0].file).toMatch(/inject/);
    res[0].file = 'inject.ejs.t';
    expect(res[0].body).toMatch("gem 'devise'");
  });

  it('should allows to use changeCase helpers in templates', async () => {
    // setup
    const expectedFile = /nake/;
    const expectedBody = /foo_bar/;
    // act
    const response = await render(
      new MockContext(),
      mockTemplate({
        dir: fixture('app/group-change-case'),
      }),
      {
        name: 'FooBar',
      },
    );
    const actualFile = response[0].file;
    const actualBody = response[0].body;
    // assert
    expect(actualFile).toMatch(expectedFile);
    expect(actualBody).toMatch(expectedBody);
  });
});
