// NEIS API 응답 타입 정의

export interface SchoolInfo {
  ATPT_OFCDC_SC_CODE: string; // 시도교육청코드
  ATPT_OFCDC_SC_NM: string;   // 시도교육청명
  SD_SCHUL_CODE: string;      // 표준학교코드
  SCHUL_NM: string;           // 학교명
  ENG_SCHUL_NM: string;       // 영문학교명
  SCHUL_KND_SC_NM: string;    // 학교종류명
  LCTN_SC_NM: string;         // 소재지명
  JU_ORG_NM: string;          // 관할조직명
  FOND_SC_NM: string;         // 설립명
  ORG_RDNZC: string;          // 도로명우편번호
  ORG_RDNMA: string;          // 도로명주소
  ORG_RDNDA: string;          // 도로명상세주소
  ORG_TELNO: string;          // 전화번호
  HMPG_ADRES: string;         // 홈페이지주소
  COEDU_SC_NM: string;        // 남녀공학구분명
  ORG_FAXNO: string;          // 팩스번호
  HS_SC_NM: string;           // 고등학교구분명
  INDST_SPECL_CCCCL_EXST_YN: string; // 산업체특별학급존재여부
  HS_GNRL_BUSNS_SC_NM: string; // 고등학교일반실업구분명
  SPCLY_PURPS_HS_ORD_NM: string; // 특수목적고등학교계열명
  ENE_BFE_SEHF_SC_NM: string;  // 입시전후기구분명
  DGHT_SC_NM: string;         // 주야구분명
  FOND_YMD: string;           // 설립일자
  FOAS_MEMRD: string;         // 개교기념일
  LOAD_DTM: string;           // 수정일자
}

export interface MealInfo {
  ATPT_OFCDC_SC_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  MMEAL_SC_CODE: string;      // 식사코드 (1: 조식, 2: 중식, 3: 석식)
  MMEAL_SC_NM: string;        // 식사명
  MLSV_YMD: string;           // 급식일자
  MLSV_FGR: number;           // 급식인원수
  DDISH_NM: string;           // 요리명 (알레르기정보 포함)
  ORPLC_INFO: string;         // 원산지정보
  CAL_INFO: string;           // 칼로리정보
  NTR_INFO: string;           // 영양정보
  MLSV_FROM_YMD: string;      // 급식시작일자
  MLSV_TO_YMD: string;        // 급식종료일자
}

export interface ScheduleInfo {
  ATPT_OFCDC_SC_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  AY: string;                 // 학년도
  DGHT_CRSE_SC_NM: string;    // 주야과정명
  SCHUL_CRSE_SC_NM: string;   // 학교과정명
  SBTR_DD_SC_NM: string;      // 수업공제일명
  AA_YMD: string;             // 학사일자
  EVENT_NM: string;           // 행사명
  EVENT_CNTNT: string;        // 행사내용
  ONE_GRADE_EVENT_YN: string; // 1학년행사여부
  TW_GRADE_EVENT_YN: string;  // 2학년행사여부
  THREE_GRADE_EVENT_YN: string; // 3학년행사여부
  FR_GRADE_EVENT_YN: string;  // 4학년행사여부
  FIV_GRADE_EVENT_YN: string; // 5학년행사여부
  SIX_GRADE_EVENT_YN: string; // 6학년행사여부
  LOAD_DTM: string;
}

export interface TimetableInfo {
  ATPT_OFCDC_SC_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  AY: string;                 // 학년도
  SEM: string;                // 학기
  ALL_TI_YMD: string;         // 시간표일자
  DGHT_CRSE_SC_NM: string;    // 주야과정명
  ORD_SC_NM: string;          // 계열명
  DDDEP_NM: string;           // 학과명
  GRADE: string;              // 학년
  CLASS_NM: string;           // 반명
  PERIO: string;              // 교시
  ITRT_CNTNT: string;         // 수업내용 (과목명)
  LOAD_DTM: string;
}

export interface NEISResponse<T> {
  [key: string]: [{
    head: [{
      list_total_count: number;
    }, {
      RESULT: {
        CODE: string;
        MESSAGE: string;
      };
    }];
    row: T[];
  }];
}

// 저장된 학교 정보
export interface SavedSchool {
  schoolCode: string;
  officeCode: string;
  schoolName: string;
  schoolType: string;
  address: string;
}

// 시도교육청 코드
export const OFFICE_CODES = {
  "서울특별시": "B10",
  "부산광역시": "C10",
  "대구광역시": "D10",
  "인천광역시": "E10",
  "광주광역시": "F10",
  "대전광역시": "G10",
  "울산광역시": "H10",
  "세종특별자치시": "I10",
  "경기도": "J10",
  "강원특별자치도": "K10",
  "충청북도": "M10",
  "충청남도": "N10",
  "전북특별자치도": "P10",
  "전라남도": "Q10",
  "경상북도": "R10",
  "경상남도": "S10",
  "제주특별자치도": "T10",
} as const;

export type OfficeName = keyof typeof OFFICE_CODES;
