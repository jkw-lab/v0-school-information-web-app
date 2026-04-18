'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedSchool } from '@/lib/neis-types';

const STORAGE_KEY = 'selected-school';

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
      }
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
