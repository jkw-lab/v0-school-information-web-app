'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedSchool } from '@/lib/neis-types';

const STORAGE_KEY = 'selected-school';

// 북일고등학교 기본값 (세종특별자치시교육청)
const DEFAULT_SCHOOL: SavedSchool = {
  officeCode: 'N10',
  schoolCode: '8140270',
  schoolName: '북일고등학교',
  schoolType: '고등학교',
  address: '세종특별자치시 도움4로 50',
};

export function useSchool() {
  const [school, setSchoolState] = useState<SavedSchool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSchoolState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setSchoolState(DEFAULT_SCHOOL);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL));
      }
    } else {
      // 저장된 학교가 없으면 기본값 사용
      setSchoolState(DEFAULT_SCHOOL);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL));
    }
    setIsLoading(false);
  }, []);

  const setSchool = useCallback((newSchool: SavedSchool | null) => {
    setSchoolState(newSchool);
    if (newSchool) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchool));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearSchool = useCallback(() => {
    setSchoolState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    school,
    setSchool,
    clearSchool,
    isLoading,
    hasSchool: !!school,
  };
}
