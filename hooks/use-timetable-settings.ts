'use client';

import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'timetable-settings';
const COLORS_KEY = 'subject-colors';

export interface TimetableSettings {
  showClassroom: boolean;
  showTeacher: boolean;
}

export interface SubjectColors {
  [subject: string]: string;
}

const DEFAULT_SETTINGS: TimetableSettings = {
  showClassroom: false,
  showTeacher: false,
};

// 기본 과목 색상 팔레트
export const COLOR_PALETTE = [
  { name: '빨강', light: 'bg-red-100 text-red-800', dark: 'dark:bg-red-900/30 dark:text-red-300', hex: '#ef4444' },
  { name: '주황', light: 'bg-orange-100 text-orange-800', dark: 'dark:bg-orange-900/30 dark:text-orange-300', hex: '#f97316' },
  { name: '노랑', light: 'bg-amber-100 text-amber-800', dark: 'dark:bg-amber-900/30 dark:text-amber-300', hex: '#f59e0b' },
  { name: '연두', light: 'bg-lime-100 text-lime-800', dark: 'dark:bg-lime-900/30 dark:text-lime-300', hex: '#84cc16' },
  { name: '초록', light: 'bg-green-100 text-green-800', dark: 'dark:bg-green-900/30 dark:text-green-300', hex: '#22c55e' },
  { name: '청록', light: 'bg-teal-100 text-teal-800', dark: 'dark:bg-teal-900/30 dark:text-teal-300', hex: '#14b8a6' },
  { name: '하늘', light: 'bg-sky-100 text-sky-800', dark: 'dark:bg-sky-900/30 dark:text-sky-300', hex: '#0ea5e9' },
  { name: '파랑', light: 'bg-blue-100 text-blue-800', dark: 'dark:bg-blue-900/30 dark:text-blue-300', hex: '#3b82f6' },
  { name: '남색', light: 'bg-indigo-100 text-indigo-800', dark: 'dark:bg-indigo-900/30 dark:text-indigo-300', hex: '#6366f1' },
  { name: '보라', light: 'bg-violet-100 text-violet-800', dark: 'dark:bg-violet-900/30 dark:text-violet-300', hex: '#8b5cf6' },
  { name: '분홍', light: 'bg-pink-100 text-pink-800', dark: 'dark:bg-pink-900/30 dark:text-pink-300', hex: '#ec4899' },
  { name: '회색', light: 'bg-slate-100 text-slate-800', dark: 'dark:bg-slate-700/50 dark:text-slate-300', hex: '#64748b' },
];

// 기본 과목별 색상 매핑 (인덱스 기준)
const DEFAULT_SUBJECT_COLOR_INDICES: Record<string, number> = {
  '국어': 0,   // 빨강
  '영어': 7,   // 파랑
  '수학': 2,   // 노랑
  '과학': 4,   // 초록
  '사회': 9,   // 보라
  '역사': 1,   // 주황
  '체육': 5,   // 청록
  '음악': 10,  // 분홍
  '미술': 6,   // 하늘
  '도덕': 8,   // 남색
  '기술': 11,  // 회색
  '가정': 10,  // 분홍
  '정보': 9,   // 보라
  '물리': 6,   // 하늘
  '화학': 3,   // 연두
  '생물': 5,   // 청록
  '지구': 11,  // 회색
  '한문': 1,   // 주황
  '일본어': 0, // 빨강
  '중국어': 0, // 빨강
  '자습': 11,  // 회색
  '창체': 4,   // 초록
  '동아리': 4, // 초록
  '진로': 8,   // 남색
};

export function useTimetableSettings() {
  const [settings, setSettingsState] = useState<TimetableSettings>(DEFAULT_SETTINGS);
  const [subjectColors, setSubjectColorsState] = useState<SubjectColors>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 설정 로드
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        setSettingsState(JSON.parse(storedSettings));
      } catch {
        localStorage.removeItem(SETTINGS_KEY);
      }
    }

    // 색상 로드
    const storedColors = localStorage.getItem(COLORS_KEY);
    if (storedColors) {
      try {
        setSubjectColorsState(JSON.parse(storedColors));
      } catch {
        localStorage.removeItem(COLORS_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  const setSettings = useCallback((newSettings: Partial<TimetableSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setSubjectColor = useCallback((subject: string, colorIndex: number) => {
    setSubjectColorsState(prev => {
      const updated = { ...prev, [subject]: String(colorIndex) };
      localStorage.setItem(COLORS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getSubjectColorIndex = useCallback((subject: string): number => {
    // 저장된 색상이 있으면 사용
    if (subjectColors[subject] !== undefined) {
      return Number(subjectColors[subject]);
    }
    // 기본 과목 매핑 확인
    for (const [keyword, index] of Object.entries(DEFAULT_SUBJECT_COLOR_INDICES)) {
      if (subject.includes(keyword)) {
        return index;
      }
    }
    // 없으면 해시 기반으로 자동 배정
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % COLOR_PALETTE.length;
  }, [subjectColors]);

  const getSubjectColorClass = useCallback((subject: string): string => {
    const index = getSubjectColorIndex(subject);
    const color = COLOR_PALETTE[index];
    return `${color.light} ${color.dark}`;
  }, [getSubjectColorIndex]);

  const clearColors = useCallback(() => {
    setSubjectColorsState({});
    localStorage.removeItem(COLORS_KEY);
  }, []);

  return {
    settings,
    setSettings,
    subjectColors,
    setSubjectColor,
    getSubjectColorIndex,
    getSubjectColorClass,
    clearColors,
    isLoading,
  };
}
