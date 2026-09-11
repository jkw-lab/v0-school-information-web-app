'use client';

import { readStorage, writeStorage, removeStorage, isRecord, readStringMap } from '@/lib/storage';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type SubjectColorMap = Record<string, string>;

export interface TimetableDisplaySettings {
  showClassroom: boolean;
  showTeacher: boolean;
}

export interface AppSettings {
  subjectColors: SubjectColorMap;
  timetableDisplay: TimetableDisplaySettings;
}

export const SUBJECT_COLOR_OPTIONS = [
  { name: '빨강', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { name: '주황', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { name: '노랑', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { name: '초록', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { name: '청록', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
  { name: '파랑', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { name: '하늘', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' },
  { name: '보라', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { name: '분홍', className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
  { name: '회색', className: 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300' },
] as const;

export const DEFAULT_SUBJECT_COLORS: SubjectColorMap = {
  국어: SUBJECT_COLOR_OPTIONS[0].className,
  영어: SUBJECT_COLOR_OPTIONS[5].className,
  수학: SUBJECT_COLOR_OPTIONS[2].className,
  과학: SUBJECT_COLOR_OPTIONS[3].className,
  사회: SUBJECT_COLOR_OPTIONS[7].className,
  역사: SUBJECT_COLOR_OPTIONS[1].className,
  체육: SUBJECT_COLOR_OPTIONS[4].className,
  음악: SUBJECT_COLOR_OPTIONS[8].className,
  미술: SUBJECT_COLOR_OPTIONS[6].className,
  도덕: SUBJECT_COLOR_OPTIONS[7].className,
  기술: SUBJECT_COLOR_OPTIONS[9].className,
  가정: SUBJECT_COLOR_OPTIONS[8].className,
  정보: SUBJECT_COLOR_OPTIONS[7].className,
  물리: SUBJECT_COLOR_OPTIONS[6].className,
  화학: SUBJECT_COLOR_OPTIONS[3].className,
  생물: SUBJECT_COLOR_OPTIONS[4].className,
  지구: SUBJECT_COLOR_OPTIONS[9].className,
};


function pickAutoColor(subject: string, index: number) {
  const normalized = subject.replace(/\s+/g, '');
  const keywordMatch = Object.entries(DEFAULT_SUBJECT_COLORS).find(([keyword]) => normalized.includes(keyword));
  if (keywordMatch) return keywordMatch[1];
  return SUBJECT_COLOR_OPTIONS[index % SUBJECT_COLOR_OPTIONS.length].className;
}

const SUBJECT_COLOR_STORAGE_KEY = 'subject-colors';
const SUBJECT_NAME_STORAGE_KEY = 'subject-names';
const TIMETABLE_DISPLAY_STORAGE_KEY = 'timetable-display-settings';

export const KNOWN_LOCAL_STORAGE_ITEMS = [
  { key: 'selected-school', label: '선택한 학교' },
  { key: 'class-info', label: '학년/반' },
  { key: 'theme', label: '테마' },
  { key: SUBJECT_COLOR_STORAGE_KEY, label: '과목 색상' },
  { key: SUBJECT_NAME_STORAGE_KEY, label: '실제 과목 목록' },
  { key: TIMETABLE_DISPLAY_STORAGE_KEY, label: '시간표 표시 설정' },
  { key: 'subject-overrides', label: '선택과목 수정값' },
] as const;

const DEFAULT_TIMETABLE_DISPLAY: TimetableDisplaySettings = {
  showClassroom: false,
  showTeacher: false,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  const stored = readStorage(key);
  if (!stored) return fallback;

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(fallback)) return (Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : fallback) as T;
    if (!isRecord(parsed)) return fallback;
    if (key === SUBJECT_COLOR_STORAGE_KEY) return { ...fallback, ...readStringMap(key) };
    if (key === TIMETABLE_DISPLAY_STORAGE_KEY) return {
      ...fallback,
      showClassroom: parsed.showClassroom === true,
      showTeacher: parsed.showTeacher === true,
    };
    return fallback;
  } catch {
    removeStorage(key);
    return fallback;
  }
}

export function useAppSettings() {
  const [subjectColors, setSubjectColorsState] = useState<SubjectColorMap>(DEFAULT_SUBJECT_COLORS);
  const [timetableDisplay, setTimetableDisplayState] = useState<TimetableDisplaySettings>(DEFAULT_TIMETABLE_DISPLAY);
  const [subjectNames, setSubjectNames] = useState<string[]>([]);
  const [storageVersion, setStorageVersion] = useState(0);

  useEffect(() => {
    setSubjectColorsState(readJson(SUBJECT_COLOR_STORAGE_KEY, DEFAULT_SUBJECT_COLORS));
    setSubjectNames(readJson(SUBJECT_NAME_STORAGE_KEY, [] as string[]));
    setTimetableDisplayState(readJson(TIMETABLE_DISPLAY_STORAGE_KEY, DEFAULT_TIMETABLE_DISPLAY));
  }, []);

  const persistSubjectColors = useCallback((next: SubjectColorMap) => {
    setSubjectColorsState(next);
    writeStorage(SUBJECT_COLOR_STORAGE_KEY, JSON.stringify(next));
    setStorageVersion((v) => v + 1);
  }, []);

  const setSubjectColor = useCallback((subject: string, colorClassName: string) => {
    persistSubjectColors({ ...subjectColors, [subject]: colorClassName });
  }, [persistSubjectColors, subjectColors]);


  const registerSubjects = useCallback((subjects: string[]) => {
    const cleanedSubjects = Array.from(new Set(subjects.map((subject) => subject.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko'));
    if (cleanedSubjects.length === 0) return;

    setSubjectNames((current) => {
      const merged = Array.from(new Set([...current, ...cleanedSubjects])).sort((a, b) => a.localeCompare(b, 'ko'));
      if (merged.length !== current.length || merged.some((subject, index) => subject !== current[index])) {
        writeStorage(SUBJECT_NAME_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return current;
    });

    setSubjectColorsState((current) => {
      let changed = false;
      const next: SubjectColorMap = { ...current };
      cleanedSubjects.forEach((subject, index) => {
        if (!next[subject]) {
          next[subject] = pickAutoColor(subject, Object.keys(next).length + index);
          changed = true;
        }
      });

      if (changed) {
        writeStorage(SUBJECT_COLOR_STORAGE_KEY, JSON.stringify(next));
      }

      return changed ? next : current;
    });
  }, []);

  const resetSubjectColors = useCallback(() => {
    const resetColors = { ...DEFAULT_SUBJECT_COLORS };
    subjectNames.forEach((subject, index) => {
      resetColors[subject] = pickAutoColor(subject, index);
    });
    persistSubjectColors(resetColors);
  }, [persistSubjectColors, subjectNames]);

  const setTimetableDisplay = useCallback((next: Partial<TimetableDisplaySettings>) => {
    const merged = { ...timetableDisplay, ...next };
    setTimetableDisplayState(merged);
    writeStorage(TIMETABLE_DISPLAY_STORAGE_KEY, JSON.stringify(merged));
    setStorageVersion((v) => v + 1);
  }, [timetableDisplay]);

  const clearLocalStorageKeys = useCallback((keys: string[]) => {
    keys.forEach((key) => removeStorage(key));
    setSubjectColorsState(readJson(SUBJECT_COLOR_STORAGE_KEY, DEFAULT_SUBJECT_COLORS));
    setSubjectNames(readJson(SUBJECT_NAME_STORAGE_KEY, [] as string[]));
    setTimetableDisplayState(readJson(TIMETABLE_DISPLAY_STORAGE_KEY, DEFAULT_TIMETABLE_DISPLAY));
    setStorageVersion((v) => v + 1);
  }, []);

  const clearAllLocalData = useCallback(() => {
    KNOWN_LOCAL_STORAGE_ITEMS.forEach(({ key }) => removeStorage(key));
    setSubjectColorsState(DEFAULT_SUBJECT_COLORS);
    setSubjectNames([]);
    setTimetableDisplayState(DEFAULT_TIMETABLE_DISPLAY);
    setStorageVersion((v) => v + 1);
  }, []);

  return useMemo(() => ({
    subjectColors,
    subjectNames,
    setSubjectColor,
    resetSubjectColors,
    registerSubjects,
    timetableDisplay,
    setTimetableDisplay,
    clearLocalStorageKeys,
    clearAllLocalData,
    storageVersion,
  }), [
    subjectColors,
    subjectNames,
    setSubjectColor,
    resetSubjectColors,
    registerSubjects,
    timetableDisplay,
    setTimetableDisplay,
    clearLocalStorageKeys,
    clearAllLocalData,
    storageVersion,
  ]);
}
