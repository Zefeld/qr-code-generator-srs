'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateInput } = require('../validation.js');

test('validates URLs without silently changing the input', () => {
  for (const value of ['https://example.com/a?q=X#Part', 'HTTP://EXAMPLE.COM/A', 'https://:secret@example.com/']) {
    assert.deepEqual(validateInput('link', value).value, value);
  }
  for (const value of ['', 'https://', 'ftp://example.com', 'https://:8080/', ' https://example.com', 'https://example.com/a b', 'https://example.com/\n']) {
    assert.equal(validateInput('link', value).ok, false, JSON.stringify(value));
  }
});

test('validates UTF-8 byte boundaries and preserves Unicode text', () => {
  for (const value of ['x'.repeat(1000), 'я'.repeat(500), '😀'.repeat(250), '  Привет\nмир  ']) {
    const result = validateInput('text', value);
    assert.equal(result.ok, true); assert.equal(result.value, value);
  }
  for (const value of ['', '  \n ', 'x'.repeat(1001), 'я'.repeat(500) + 'x', '😀'.repeat(250) + 'x']) {
    assert.equal(validateInput('text', value).ok, false);
  }
  assert.equal(validateInput('link', 'https://a.co/' + 'x'.repeat(987)).bytes, 1000);
  assert.equal(validateInput('link', 'https://a.co/' + 'x'.repeat(987)).ok, true);
  assert.equal(validateInput('link', 'https://a.co/' + 'x'.repeat(988)).ok, false);
});
