'use strict';

const { suite } = require('uvu');
const assert = require('uvu/assert');
const detective = require('../index.js');

function test(source, dependencies, options) {
  assert.equal(detective(source, options), dependencies);
}

const errorSuite = suite('error handling');

errorSuite('does not throw for empty files', () => {
  assert.not.throws(() => {
    detective('');
  });
});

errorSuite('throws if the given content is not a string', () => {
  assert.throws(() => {
    detective(() => {});
  }, Error, 'content is not a string');
});

errorSuite('throws if called with no arguments', () => {
  assert.throws(() => {
    detective();
  }, Error, 'src not given');
});

errorSuite('does not throw on broken syntax', () => {
  assert.not.throws(() => {
    detective('@');
  });
});

errorSuite('supplies an empty object as the "parsed" ast when there is a parse error', () => {
  detective('|');
  assert.equal(detective.ast, {});
});

errorSuite.run();

const sassSuite = suite('scss');

sassSuite('dangles the parsed AST', () => {
  detective('@import "_foo.scss";');
  assert.ok(detective.ast);
});

sassSuite('returns the dependencies of the given .scss file content', () => {
  test('@import "_foo.scss";', ['_foo.scss']);
  test('@import        "_foo.scss";', ['_foo.scss']);
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

sassSuite('handles comma-separated imports (#2)', () => {
  test('@import "_foo.scss", "bar";', ['_foo.scss', 'bar']);
});

sassSuite('allows imports with no semicolon', () => {
  test('@import "_foo.scss"\n@import "_bar.scss"', ['_foo.scss', '_bar.scss']);
});

sassSuite('returns the url dependencies when enable url', () => {
  test(
    '@font-face { font-family: "Trickster"; src: local("Trickster"), url("trickster-COLRv1.otf") format("opentype") tech(color-COLRv1), url("trickster-outline.otf") format("opentype"), url("trickster-outline.woff") format("woff"); }',
    [
      'trickster-COLRv1.otf',
      'trickster-outline.otf',
      'trickster-outline.woff'
    ],
    { url: true }
  );

  test(
    'body { div {background: no-repeat center/80% url("foo.png"); }}',
    ['foo.png'],
    { url: true }
  );

  test(
    'body { div {background: no-repeat center/80% url(foo.png); }}',
    ['foo.png'],
    { url: true }
  );
});

sassSuite.run();
