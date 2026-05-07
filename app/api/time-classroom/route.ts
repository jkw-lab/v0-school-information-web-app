import { NextRequest, NextResponse } from 'next/server';
import { getTimeClassroomInfo } from '@/lib/neis-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const officeCode = searchParams.get('officeCode');
  const schoolCode = searchParams.get('schoolCode');
  const grade = searchParams.get('grade');
  const year = searchParams.get('year');
  const semester = searchParams.get('semester');

  if (!officeCode || !schoolCode) {
    return NextResponse.json({ error: '학교 정보가 필요합니다.' }, { status: 400 });
  }

  try {
    const classrooms = await getTimeClassroomInfo(
      officeCode,
      schoolCode,
      grade || undefined,
      year || undefined,
      semester || undefined
    );
    return NextResponse.json(classrooms);
  } catch (error) {
    console.error('강의실 정보 조회 오류:', error);
    return NextResponse.json({ error: '강의실 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
