import { NextRequest, NextResponse } from 'next/server';
import { searchSchools } from '@/lib/neis-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name');
  const officeCode = searchParams.get('officeCode');

  if (!name || name.length < 2) {
    return NextResponse.json({ error: '학교명은 2자 이상 입력해주세요.' }, { status: 400 });
  }

  try {
    const schools = await searchSchools(name, officeCode || undefined);
    return NextResponse.json(schools);
  } catch (error) {
    console.error('학교 검색 오류:', error);
    return NextResponse.json({ error: '학교 검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
