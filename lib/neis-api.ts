import type { SchoolInfo, MealInfo, ScheduleInfo, TimetableInfo, TimeClassroomInfo } from './neis-types';

const NEIS_API_BASE = 'https://open.neis.go.kr/hub';

async function fetchNEIS<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T[]> {
  const apiKey = process.env.NEIS_API_KEY;
  if (!apiKey) {
    throw new Error('NEIS_API_KEY가 설정되지 않았습니다.');
  }

  const searchParams = new URLSearchParams({
    KEY: apiKey,
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ...params,
  });

  const url = `${NEIS_API_BASE}/${endpoint}?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    next: { revalidate: 300 }, // 5분 캐시
  });

  if (!response.ok) {
    throw new Error(`NEIS API 오류: ${response.status}`);
  }

  const data = await response.json();
  
  // API 응답 구조에 따라 데이터 추출
  const key = Object.keys(data).find(k => k !== 'RESULT');
  
  if (!key || !data[key]) {
    return [];
  }

  const result = data[key];
  if (Array.isArray(result) && result.length > 1 && result[1]?.row) {
    return result[1].row as T[];
  }

  return [];
}

// 학교 검색
export async function searchSchools(schoolName: string, officeCode?: string): Promise<SchoolInfo[]> {
  const params: Record<string, string> = {
    SCHUL_NM: schoolName,
  };
  
  if (officeCode) {
    params.ATPT_OFCDC_SC_CODE = officeCode;
  }

  return fetchNEIS<SchoolInfo>('schoolInfo', params);
}

// 급식 정보 조회
export async function getMealInfo(
  officeCode: string,
  schoolCode: string,
  date?: string,
  fromDate?: string,
  toDate?: string
): Promise<MealInfo[]> {
  const params: Record<string, string> = {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
  };

  if (date) {
    params.MLSV_YMD = date;
  }
  
  if (fromDate && toDate) {
    params.MLSV_FROM_YMD = fromDate;
    params.MLSV_TO_YMD = toDate;
  }

  return fetchNEIS<MealInfo>('mealServiceDietInfo', params);
}

// 학사일정 조회
export async function getScheduleInfo(
  officeCode: string,
  schoolCode: string,
  fromDate?: string,
  toDate?: string
): Promise<ScheduleInfo[]> {
  const params: Record<string, string> = {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
  };

  if (fromDate) {
    params.AA_FROM_YMD = fromDate;
  }
  
  if (toDate) {
    params.AA_TO_YMD = toDate;
  }

  return fetchNEIS<ScheduleInfo>('SchoolSchedule', params);
}

// 시간표 조회 (초등학교)
export async function getElementaryTimetable(
  officeCode: string,
  schoolCode: string,
  grade: string,
  classNm: string,
  fromDate?: string,
  toDate?: string
): Promise<TimetableInfo[]> {
  const params: Record<string, string> = {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    GRADE: grade,
    CLASS_NM: classNm,
  };

  if (fromDate) {
    params.TI_FROM_YMD = fromDate;
  }
  if (toDate) {
    params.TI_TO_YMD = toDate;
  }

  return fetchNEIS<TimetableInfo>('elsTimetable', params);
}

// 시간표 조회 (중학교)
export async function getMiddleTimetable(
  officeCode: string,
  schoolCode: string,
  grade: string,
  classNm: string,
  fromDate?: string,
  toDate?: string
): Promise<TimetableInfo[]> {
  const params: Record<string, string> = {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    GRADE: grade,
    CLASS_NM: classNm,
  };

  if (fromDate) {
    params.TI_FROM_YMD = fromDate;
  }
  if (toDate) {
    params.TI_TO_YMD = toDate;
  }

  return fetchNEIS<TimetableInfo>('misTimetable', params);
}

// 시간표 조회 (고등학교)
export async function getHighTimetable(
  officeCode: string,
  schoolCode: string,
  grade: string,
  classNm: string,
  fromDate?: string,
  toDate?: string,
  classroomName?: string
): Promise<TimetableInfo[]> {
  const params: Record<string, string> = {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    GRADE: grade,
    CLASS_NM: classNm,
  };

  if (fromDate) {
    params.TI_FROM_YMD = fromDate;
  }
  if (toDate) {
    params.TI_TO_YMD = toDate;
  }
  if (classroomName) {
    params.CLRM_NM = classroomName;
  }

  return fetchNEIS<TimetableInfo>('hisTimetable', params);
}


// 시간표 강의실 정보 조회
export async function getTimeClassroomInfo(
  officeCode: string,
  schoolCode: string,
  grade?: string,
  year?: string,
  semester?: string
): Promise<TimeClassroomInfo[]> {
  const params: Record<string, string> = {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
  };

  if (grade) params.GRADE = grade;
  if (year) params.AY = year;
  if (semester) params.SEM = semester;

  return fetchNEIS<TimeClassroomInfo>('tiClrminfo', params);
}

function getTimetableMatchKey(item: TimetableInfo) {
  return [item.ALL_TI_YMD, item.PERIO, item.ITRT_CNTNT].join('|');
}

function mergeClassroomInfo(base: TimetableInfo[], classroomRows: TimetableInfo[]) {
  const classroomByKey = new Map<string, string>();

  classroomRows.forEach((item) => {
    const classroom = item.CLRM_NM?.trim();
    if (!classroom) return;
    const key = getTimetableMatchKey(item);
    if (!classroomByKey.has(key)) classroomByKey.set(key, classroom);
  });

  return base.map((item) => ({
    ...item,
    CLRM_NM: item.CLRM_NM?.trim() || classroomByKey.get(getTimetableMatchKey(item)) || item.CLRM_NM,
  }));
}

// 학교 종류에 따른 시간표 API 선택
export async function getTimetable(
  officeCode: string,
  schoolCode: string,
  schoolType: string,
  grade: string,
  classNm: string,
  fromDate?: string,
  toDate?: string,
  includeClassroom = false
): Promise<TimetableInfo[]> {
  if (schoolType.includes('초등')) {
    return getElementaryTimetable(officeCode, schoolCode, grade, classNm, fromDate, toDate);
  } else if (schoolType.includes('중학')) {
    return getMiddleTimetable(officeCode, schoolCode, grade, classNm, fromDate, toDate);
  }

  const base = await getHighTimetable(officeCode, schoolCode, grade, classNm, fromDate, toDate);
  if (!includeClassroom || base.length === 0) return base;

  const sample = base[0];
  const rooms = await getTimeClassroomInfo(officeCode, schoolCode, grade, sample.AY, sample.SEM);
  const roomNames = Array.from(new Set(rooms.map((room) => room.CLRM_NM?.trim()).filter(Boolean))).slice(0, 80) as string[];
  if (roomNames.length === 0) return base;

  const classroomRows = (await Promise.all(
    roomNames.map((roomName) => getHighTimetable(officeCode, schoolCode, grade, classNm, fromDate, toDate, roomName).catch(() => []))
  )).flat();

  return mergeClassroomInfo(base, classroomRows);
}

// 날짜 포맷팅 유틸리티
export function formatDateToNEIS(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function getWeekRange(date: Date): { from: string; to: string } {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  
  return {
    from: formatDateToNEIS(monday),
    to: formatDateToNEIS(friday),
  };
}

export function getMonthRange(date: Date): { from: string; to: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  return {
    from: formatDateToNEIS(firstDay),
    to: formatDateToNEIS(lastDay),
  };
}
