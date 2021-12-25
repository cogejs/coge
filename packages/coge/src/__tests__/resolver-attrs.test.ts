import {AttrsResolver} from '../resolvers/attrs';

describe('resolver/attrs', () => {
  it('should resolve multi-type values', () => {
    const resolved = AttrsResolver.resolve([
      'a',
      'b=1',
      "c='1'",
      'd=hello',
      "e='hello'",
      "f={foo: 'bar'}",
      "g=[1, 'hello']",
      "h='{cool: 1}'",
      'i.j.k=hello world',
    ]);
    expect(resolved).toEqual({
      a: true,
      b: 1,
      c: '1',
      d: 'hello',
      e: 'hello',
      f: {foo: 'bar'},
      g: [1, 'hello'],
      h: '{cool: 1}',
      i: {j: {k: 'hello world'}},
    });
  });
});
