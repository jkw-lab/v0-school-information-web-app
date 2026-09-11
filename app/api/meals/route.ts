import { apiError, validateDates } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { getMealInfo } from '@/lib/neis-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateError = validateDates(searchParams);
  if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });
  const officeCode = searchParams.get('officeCode');
  const schoolCode = searchParams.get('schoolCode');
  const date = searchParams.get('date');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  if (!officeCode || !schoolCode) {
    return NextResponse.json({ error: '학교 정보가 필요합니다.' }, { status: 400 });
  }

  try {
    const meals = await getMealInfo(
      officeCode,
      schoolCode,
      date || undefined,
      fromDate || undefined,
      toDate || undefined
    );
    return NextResponse.json(meals);
  } catch (error) {
    return apiError(error);
  }
}
