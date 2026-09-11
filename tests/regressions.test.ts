import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { NextRequest } from 'next/server';
import { getMealInfo, getTimetable, searchSchools } from '../lib/neis-api';
import { validateDates } from '../lib/api-response';
import { GET as searchRoute } from '../app/api/schools/search/route';
import { GET as mealRoute } from '../app/api/meals/route';
import { fetchArray } from '../lib/client-api';
import { readStorage, readStringMap, writeStorage } from '../lib/storage';

const originalFetch = globalThis.fetch;
const originalKey = process.env.NEIS_API_KEY;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

beforeEach(() => { process.env.NEIS_API_KEY = 'test-key-only'; });
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.NEIS_API_KEY;
  else process.env.NEIS_API_KEY = originalKey;
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

function payload(endpoint: string, rows: unknown[], total = rows.length) {
  return Response.json({ [endpoint]: [{ head: [{ list_total_count: total }, { RESULT: { CODE: 'INFO-000' } }] }, { row: rows }] });
}

test('school search fetches the second page instead of dropping results after 100', async () => {
  const pages: string[] = [];
  globalThis.fetch = async (input) => {
    const page = new URL(String(input)).searchParams.get('pIndex')!;
    pages.push(page);
    return payload('schoolInfo', Array.from({ length: page === '1' ? 100 : 1 }, () => ({ SCHUL_NM: '테스트학교' })), 101);
  };
  assert.equal((await searchSchools('학교')).length, 101);
  assert.deepEqual(pages, ['1', '2']);
});

test('NEIS no-data result is empty but invalid key result is an error', async () => {
  globalThis.fetch = async () => Response.json({ RESULT: { CODE: 'INFO-200' } });
  assert.deepEqual(await getMealInfo('N10', '8140270'), []);
  globalThis.fetch = async () => Response.json({ RESULT: { CODE: 'ERROR-290', MESSAGE: 'test-key-only' } });
  await assert.rejects(getMealInfo('N10', '8140270'), { code: 'UPSTREAM_ERROR' });
});

test('missing key returns a useful 503 response without exposing configuration values', async () => {
  delete process.env.NEIS_API_KEY;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('must not fetch'); };
  const response = await mealRoute(new NextRequest('https://example.test/api/meals?officeCode=N10&schoolCode=8140270'));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /설정/);
  assert.equal(called, false);
});

test('network errors do not expose upstream URL credentials', async () => {
  globalThis.fetch = async () => { throw new Error('https://example.test?KEY=test-key-only'); };
  await assert.rejects(searchSchools('학교'), (error: Error) => !error.message.includes('test-key-only') && /연결/.test(error.message));
});

test('malformed successful upstream response is not treated as no-data', async () => {
  globalThis.fetch = async () => Response.json({ unexpected: [] });
  await assert.rejects(searchSchools('학교'), { code: 'INVALID_RESPONSE' });
});

test('all-regions search omits the office filter and trims the school name', async () => {
  let url: URL | undefined;
  globalThis.fetch = async (input) => { url = new URL(String(input)); return payload('schoolInfo', []); };
  const response = await searchRoute(new NextRequest('https://example.test/api/schools/search?name=%20학교%20&officeCode=all'));
  assert.equal(response.status, 200);
  assert.equal(url!.searchParams.get('ATPT_OFCDC_SC_CODE'), null);
  assert.equal(url!.searchParams.get('SCHUL_NM'), '학교');
});

test('invalid dates and reversed or incomplete ranges are rejected', async () => {
  for (const query of ['date=20260230', 'date=abc', 'fromDate=20260908', 'fromDate=20260909&toDate=20260908', 'date=20260908&fromDate=20260908&toDate=20260909']) {
    assert.ok(validateDates(new URLSearchParams(query)), query);
  }
  assert.equal(validateDates(new URLSearchParams('date=20240229')), null);
  const response = await mealRoute(new NextRequest('https://example.test/api/meals?officeCode=N10&schoolCode=8140270&date=20260230'));
  assert.equal(response.status, 400);
});

test('optional classroom failure preserves an otherwise valid timetable', async () => {
  globalThis.fetch = async (input) => new URL(String(input)).pathname.endsWith('hisTimetable')
    ? payload('hisTimetable', [{ AY: '2026', SEM: '2', GRADE: '2', CLASS_NM: '1', ALL_TI_YMD: '20260908', PERIO: '1', ITRT_CNTNT: '수학' }])
    : Response.json({ RESULT: { CODE: 'ERROR-500' } });
  const result = await getTimetable('N10', '8140270', '고등학교', '2', '1', '20260907', '20260911', true);
  assert.equal(result.length, 1);
  assert.equal(result[0].ITRT_CNTNT, '수학');
});

test('known classrooms do not trigger extra room requests', async () => {
  let count = 0;
  globalThis.fetch = async () => { count++; return payload('hisTimetable', [{ CLRM_NM: '과학실' }]); };
  const result = await getTimetable('N10', '8140270', '고등학교', '2', '1', undefined, undefined, true);
  assert.equal(result[0].CLRM_NM, '과학실');
  assert.equal(count, 1);
});

test('client rejects non-array payloads and forwards cancellation', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (_input, options) => { assert.equal(options?.signal, controller.signal); return Response.json({ unexpected: true }); };
  await assert.rejects(fetchArray('/api/meals', controller.signal), /올바르지 않은/);
});

test('blocked browser storage does not crash reads or saves', () => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { get localStorage() { throw new Error('blocked'); } } });
  assert.equal(readStorage('selected-school'), null);
  assert.equal(writeStorage('subject-overrides', '{}'), false);
  assert.deepEqual(readStringMap('subject-overrides'), {});
});

test('malformed and non-string stored overrides are ignored', () => {
  let value = 'null';
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { getItem: () => value } } });
  assert.deepEqual(readStringMap('subject-overrides'), {});
  value = '{"subject":42,"valid":"물리학"}';
  assert.deepEqual(readStringMap('subject-overrides'), { valid: '물리학' });
  value = 'not json';
  assert.deepEqual(readStringMap('subject-overrides'), {});
});
