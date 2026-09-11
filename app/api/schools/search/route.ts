import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { searchSchools } from '@/lib/neis-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name')?.trim();
  const officeCode = searchParams.get('officeCode');

  if (!name || name.length < 2) {
    return NextResponse.json({ error: '학교명은 2자 이상 입력해주세요.' }, { status: 400 });
  }

  try {
    const schools = await searchSchools(name, officeCode && officeCode !== 'all' ? officeCode : undefined);
    return NextResponse.json(schools);
  } catch (error) {
    return apiError(error);
  }
}
