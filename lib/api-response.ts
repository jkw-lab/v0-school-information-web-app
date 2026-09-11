import { NextResponse } from 'next/server';
import { NeisError } from './neis-api';

export function apiError(error: unknown) {
  if (error instanceof NeisError) {
    // Never log request URLs: NEIS puts its key in the query string.
    console.error('NEIS request failed:', error.code);
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error('School API request failed');
  return NextResponse.json({ error: '정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 });
}

export function validateDates(params: URLSearchParams): string | null {
  const dates = ['date', 'fromDate', 'toDate'].map((key) => params.get(key));
  for (const value of dates) {
    if (value === null) continue;
    if (!/^\d{8}$/.test(value)) return '날짜는 YYYYMMDD 형식으로 입력해주세요.';
    const date = new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10).replaceAll('-', '') !== value) return '올바른 날짜를 입력해주세요.';
  }
  const [date, from, to] = dates;
  if (date && (from || to)) return '하루 조회와 기간 조회는 함께 사용할 수 없습니다.';
  if (!!from !== !!to) return '시작일과 종료일을 함께 입력해주세요.';
  if (from && to && from > to) return '종료일은 시작일 이후여야 합니다.';
  return null;
}
