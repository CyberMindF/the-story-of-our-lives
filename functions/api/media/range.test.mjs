import assert from 'node:assert/strict';
import test from 'node:test';
import { applyByteRangeHeaders, parseByteRange } from './_range.mjs';

test('normalizza intervalli byte aperti, chiusi e suffix', () => {
  assert.deepEqual(parseByteRange('bytes=10-19', 100), { offset: 10, length: 10 });
  assert.deepEqual(parseByteRange('bytes=95-', 100), { offset: 95, length: 5 });
  assert.deepEqual(parseByteRange('bytes=-12', 100), { offset: 88, length: 12 });
  assert.deepEqual(parseByteRange('bytes=90-999', 100), { offset: 90, length: 10 });
  assert.equal(parseByteRange('bytes=100-', 100), null);
  assert.equal(parseByteRange('bytes=0-1,4-5', 100), null);
});

test('prepara gli header di una risposta parziale', () => {
  const headers = new Headers();
  applyByteRangeHeaders(headers, { offset: 10, length: 10 }, 100);
  assert.equal(headers.get('Content-Range'), 'bytes 10-19/100');
  assert.equal(headers.get('Content-Length'), '10');
});
