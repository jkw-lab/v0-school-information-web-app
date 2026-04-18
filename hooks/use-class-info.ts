'use client';

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setClassInfoState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const setClassInfo = useCallback((info: ClassInfo | null) => {
    setClassInfoState(info);
    if (info) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearClassInfo = useCallback(() => {
    setClassInfoState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    classInfo,
    setClassInfo,
    clearClassInfo,
    isLoading,
    hasClassInfo: !!classInfo,
  };
}
