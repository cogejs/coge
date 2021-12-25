import {buildContext} from '../rendering';
import {MockContext} from './mocks/context';

describe('context', () => {
  it('should populate with capitalized keys', () => {
    expect(buildContext({name: 'foobar'})).toMatchSnapshot();
  });
  it('allows helpers to be initialized with current context', () => {
    const helpers = (args: any, context: any) => ({
      testArgs: () => args,
      testCtx: () => context,
    });
    const locals = {};
    const context = new MockContext({
      helpers,
    });
    const ctx = buildContext(locals, context);
    expect(typeof ctx.h.testArgs).toBe('function');
    expect(typeof ctx.h.testCtx).toBe('function');
    expect(ctx.h.testArgs()).toBe(locals);
    expect(ctx.h.testCtx()).toBe(context);
  });
});
