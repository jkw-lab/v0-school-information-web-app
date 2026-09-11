'use client';

import { readStorage, writeStorage, removeStorage, isRecord } from '@/lib/storage';

import { useState, useEffect, useCallback } from 'react';
import type { SavedSchool } from '@/lib/neis-types';

const STORAGE_KEY = 'selected-school';

// 북일고등학교 기본값 (충청남도 천안시)
const DEFAULT_SCHOOL: SavedSchool = {
  officeCode: 'N10',
  schoolCode: '8140270',
  schoolName: '북일고등학교',
  schoolType: '고등학교',
  address: '충청남도 천안시 동남구 단대로 69',
};

export function useSchool() {
  const [school, setSchoolState] = useState<SavedSchool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEY);
    if (stored) {
      try {
        
        const parsed: unknown = JSON.parse(stored);
        if (!isRecord(parsed) || !['officeCode', 'schoolCode', 'schoolName', 'schoolType', 'address'].every((key) => typeof parsed[key] === 'string')) throw new Error('Invalid school');
        const saved = parsed as unknown as SavedSchool;
        const isWrongBukilDefault = saved.schoolName === '북일고등학교' && saved.address.includes('세종');
        if (isWrongBukilDefault) {
          setSchoolState(DEFAULT_SCHOOL);
          writeStorage(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL));
        } else {
          setSchoolState(saved);
        }
      } catch {
        removeStorage(STORAGE_KEY);
        setSchoolState(DEFAULT_SCHOOL);
        writeStorage(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL));
      }
    } else {
      // 저장된 학교가 없으면 기본값 사용
      setSchoolState(DEFAULT_SCHOOL);
      writeStorage(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL));
    }
    setIsLoading(false);
  }, []);

  const setSchool = useCallback((newSchool: SavedSchool | null) => {
    setSchoolState(newSchool);
    if (newSchool) {
      writeStorage(STORAGE_KEY, JSON.stringify(newSchool));
    } else {
      removeStorage(STORAGE_KEY);
    }
  }, []);

  const clearSchool = useCallback(() => {
    setSchoolState(null);
    removeStorage(STORAGE_KEY);
  }, []);

  return {
    school,
    setSchool,
    clearSchool,
    isLoading,
    hasSchool: !!school,
  };
}
