import type { SchoolInfo, MealInfo, ScheduleInfo, TimetableInfo, TimeClassroomInfo } from './neis-types';

const NEIS_API_BASE = 'https://open.neis.go.kr/hub';

export class NeisError extends Error {
  constructor(public code: string, message: string, public status = 502) {
    super(message);
    this.name = 'NeisError';
  }
}

async function fetchNEIS<T>(endpoint: string, params: Record<string, string>, signal = AbortSignal.timeout(15000)): Promise<T[]> {
  const apiKey = process.env.NEIS_API_KEY?.trim();
  if (!apiKey) {
    throw new NeisError('NOT_CONFIGURED', '학교 정보 서비스가 아직 설정되지 않았습니다. 관리자에게 문의해주세요.', 503);
  }
  const rows: T[] = [];
  // Page through full results instead of silently truncating them to 100 rows.
  for (let page = 1; page <= 100; page++) {
    const searchParams = new URLSearchParams({ ...params, KEY: apiKey, Type: 'json', pIndex: String(page), pSize: '100' });
    let data;
    try {
      const response = await fetch(`${NEIS_API_BASE}/${endpoint}?${searchParams}`, {
        next: { revalidate: 300 },
        signal,
      });
      if (!response.ok) throw new NeisError('HTTP_ERROR', '나이스 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      data = await response.json();
    } catch (error) {
      if (error instanceof NeisError) throw error;
      throw new NeisError('UPSTREAM_UNAVAILABLE', '나이스 응답이 지연되거나 연결이 끊겼습니다. 다시 시도해주세요.');
    }
    const sections = data?.[endpoint];
    const head = Array.isArray(sections) ? sections.find((section) => Array.isArray(section?.head))?.head : undefined;
    const result = data?.RESULT ?? head?.find((entry: { RESULT?: unknown }) => entry.RESULT)?.RESULT;
    if (result?.CODE === 'INFO-200') return rows;
    if (result?.CODE && result.CODE !== 'INFO-000') {
      throw new NeisError('UPSTREAM_ERROR', '나이스에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해주세요.');
    }
    const pageRows = Array.isArray(sections) ? sections.find((section) => Array.isArray(section?.row))?.row : undefined;
    if (!Array.isArray(pageRows)) throw new NeisError('INVALID_RESPONSE', '나이스에서 올바르지 않은 정보를 받았습니다.');
    rows.push(...pageRows);
    const total = Number(head?.find((entry: { list_total_count?: unknown }) => entry.list_total_count !== undefined)?.list_total_count);
    if (pageRows.length === 0 || (Number.isFinite(total) && rows.length >= total) || (!Number.isFinite(total) && pageRows.length < 100)) return rows;
  }
  throw new NeisError('TOO_MANY_RESULTS', '조회 결과가 너무 많습니다. 검색 범위를 좁혀주세요.', 422);
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
  classroomName?: string,
  signal?: AbortSignal
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

  return fetchNEIS<TimetableInfo>('hisTimetable', params, signal);
}


// 시간표 강의실 정보 조회
export async function getTimeClassroomInfo(
  officeCode: string,
  schoolCode: string,
  grade?: string,
  year?: string,
  semester?: string,
  signal?: AbortSignal
): Promise<TimeClassroomInfo[]> {
  const params: Record<string, string> = {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
  };

  if (grade) params.GRADE = grade;
  if (year) params.AY = year;
  if (semester) params.SEM = semester;

  return fetchNEIS<TimeClassroomInfo>('tiClrminfo', params, signal);
}

function getTimetableMatchKey(item: TimetableInfo) {
  return [item.AY, item.SEM, item.GRADE, item.CLASS_NM, item.ALL_TI_YMD, item.PERIO, item.ITRT_CNTNT].join('|');
}

function mergeClassroomInfo(base: TimetableInfo[], classroomRows: TimetableInfo[]) {
  const classroomByKey = new Map<string, Set<string>>();

  classroomRows.forEach((item) => {
    const classroom = item.CLRM_NM?.trim();
    if (!classroom) return;
    const key = getTimetableMatchKey(item);
    if (!classroomByKey.has(key)) classroomByKey.set(key, new Set());
    classroomByKey.get(key)!.add(classroom);
  });

  return base.map((item) => ({
    ...item,
    CLRM_NM: item.CLRM_NM?.trim() || (classroomByKey.get(getTimetableMatchKey(item))?.size === 1 ? [...classroomByKey.get(getTimetableMatchKey(item))!][0] : item.CLRM_NM),
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
  if (!includeClassroom || base.length === 0 || base.every((item) => item.CLRM_NM?.trim())) return base;

  const sample = base[0];
  const roomDeadline = AbortSignal.timeout(8000);
  const rooms = await getTimeClassroomInfo(officeCode, schoolCode, grade, sample.AY, sample.SEM, roomDeadline).catch(() => []);
  const roomNames = Array.from(new Set(rooms.map((room) => room.CLRM_NM?.trim()).filter(Boolean))).slice(0, 80) as string[];
  if (roomNames.length === 0) return base;

  const classroomRows: TimetableInfo[] = [];
  // Limit concurrent optional lookups; a room lookup failure must not hide the timetable.
  for (let i = 0; i < roomNames.length; i += 4) {
    if (roomDeadline.aborted) break;
    const batch = await Promise.all(roomNames.slice(i, i + 4).map((roomName) =>
      getHighTimetable(officeCode, schoolCode, grade, classNm, fromDate, toDate, roomName, roomDeadline).catch(() => [])
    ));
    classroomRows.push(...batch.flat());
  }

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
