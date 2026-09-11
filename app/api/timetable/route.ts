import { apiError, validateDates } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { getTimetable } from '@/lib/neis-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateError = validateDates(searchParams);
  if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });
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
    return apiError(error);
  }
}
