'use client';

import { readStorage, writeStorage, removeStorage, isRecord } from '@/lib/storage';

import { useState, useEffect, useCallback } from 'react';

interface ClassInfo {
  grade: string;
  classNm: string;
}

const STORAGE_KEY = 'class-info';

export function useClassInfo() {
  const [classInfo, setClassInfoState] = useState<ClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (!isRecord(parsed) || typeof parsed.grade !== 'string' || typeof parsed.classNm !== 'string' || !/^[1-6]$/.test(parsed.grade) || !/^\d{1,3}$/.test(parsed.classNm)) throw new Error('Invalid class');
        setClassInfoState({ grade: parsed.grade, classNm: parsed.classNm });
      } catch {
        removeStorage(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const setClassInfo = useCallback((info: ClassInfo | null) => {
    setClassInfoState(info);
    if (info) {
      writeStorage(STORAGE_KEY, JSON.stringify(info));
    } else {
      removeStorage(STORAGE_KEY);
    }
  }, []);

  const clearClassInfo = useCallback(() => {
    setClassInfoState(null);
    removeStorage(STORAGE_KEY);
  }, []);

  return {
    classInfo,
    setClassInfo,
    clearClassInfo,
    isLoading,
    hasClassInfo: !!classInfo,
  };
}
