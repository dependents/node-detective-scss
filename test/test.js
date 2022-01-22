/* eslint-env mocha */

'use strict';

const assert = require('assert');
const detective = require('../index.js');

function test(source, dependencies, options) {
  assert.deepEqual(detective(source, options), dependencies);
}

describe('detective-scss', () => {
  describe('error handling', () => {
    it('does not throw for empty files', () => {
      assert.doesNotThrow(() => {
        detective('');
      });
    });

    it('throws if the given content is not a string', () => {
      assert.throws(() => {
        detective(() => {});
      }, Error, 'content is not a string');
    });

    it('throws if called with no arguments', () => {
      assert.throws(() => {
        detective();
      }, Error, 'src not given');
    });

    it('does not throw on broken syntax', () => {
      assert.doesNotThrow(() => {
        detective('@');
      });
    });

    it('supplies an empty object as the "parsed" ast when there is a parse error', () => {
      detective('|');
      assert.deepEqual(detective.ast, {});
    });
  });

  describe('scss', () => {
    it('dangles the parsed AST', () => {
      detective('@import "_foo.scss";');
      assert.ok(detective.ast);
    });

    it('returns the dependencies of the given .scss file content', () => {
      test('@import "_foo.scss";', ['_foo.scss']);
      test('@import          "_foo.scss";', ['_foo.scss']);
      test('@import "_foo";', ['_foo']);
      test('body { color: blue; } @import "_foo";', ['_foo']);
      test('@import "bar";', ['bar']);
      test('@import "bar"; @import "foo";', ['bar', 'foo']);
      test('@import \'bar\';', ['bar']);
      test('@import \'bar.scss\';', ['bar.scss']);
      test('@import "_foo.scss";\n@import "_bar.scss";', ['_foo.scss', '_bar.scss']);
      test('@import "_foo.scss";\n@import "_bar.scss";\n@import "_baz";\n@import "_buttons";', ['_foo.scss', '_bar.scss', '_baz', '_buttons']);
      test('@import "_nested.scss"; body { color: blue; a { text-decoration: underline; }}', ['_nested.scss']);
    });

    it('handles comma-separated imports (#2)', () => {
      test('@import "_foo.scss", "bar";', ['_foo.scss', 'bar']);
    });

    it('allows imports with no semicolon', () => {
      test('@import "_foo.scss"\n@import "_bar.scss"', ['_foo.scss', '_bar.scss']);
    });
  });
});
