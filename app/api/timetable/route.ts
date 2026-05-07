import { NextRequest, NextResponse } from 'next/server';
import { getTimetable } from '@/lib/neis-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const officeCode = searchParams.get('officeCode');
  const schoolCode = searchParams.get('schoolCode');
  const schoolType = searchParams.get('schoolType');
  const grade = searchParams.get('grade');
  const classNm = searchParams.get('classNm');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const includeClassroom = searchParams.get('includeClassroom') === 'true';

  if (!officeCode || !schoolCode || !schoolType || !grade || !classNm) {
    return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
  }

  try {
    const timetable = await getTimetable(
      officeCode,
      schoolCode,
      schoolType,
      grade,
      classNm,
      fromDate || undefined,
      toDate || undefined,
      includeClassroom
    );
    return NextResponse.json(timetable);
  } catch (error) {
    console.error('시간표 조회 오류:', error);
    return NextResponse.json({ error: '시간표 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
