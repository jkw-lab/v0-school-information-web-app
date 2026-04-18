import { NextRequest, NextResponse } from 'next/server';
import { getScheduleInfo } from '@/lib/neis-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const officeCode = searchParams.get('officeCode');
  const schoolCode = searchParams.get('schoolCode');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  if (!officeCode || !schoolCode) {
    return NextResponse.json({ error: '학교 정보가 필요합니다.' }, { status: 400 });
  }

  try {
    const schedules = await getScheduleInfo(
      officeCode,
      schoolCode,
      fromDate || undefined,
      toDate || undefined
    );
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('학사일정 조회 오류:', error);
    return NextResponse.json({ error: '학사일정 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
