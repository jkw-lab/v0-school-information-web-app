'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, AlertCircle, Pencil, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TimetableInfo, SavedSchool } from '@/lib/neis-types';
import type { SubjectColorMap, TimetableDisplaySettings } from '@/hooks/use-app-settings';
import { DEFAULT_SUBJECT_COLORS } from '@/hooks/use-app-settings';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimetableCardProps {
  school: SavedSchool;
  classInfo: { grade: string; classNm: string } | null;
  onClassInfoChange: (info: { grade: string; classNm: string }) => void;
  subjectColors?: SubjectColorMap;
  timetableDisplay?: TimetableDisplaySettings;
  onSubjectsFound?: (subjects: string[]) => void;
}

const SUBJECT_OVERRIDE_STORAGE_KEY = 'subject-overrides';

type SubjectOverrideMap = Record<string, string>;

function getSubjectColor(subject: string, subjectColors: SubjectColorMap = DEFAULT_SUBJECT_COLORS) {
  if (subjectColors[subject]) return subjectColors[subject];

  const normalizedSubject = subject.replace(/\s+/g, '');
  for (const [keyword, color] of Object.entries(subjectColors)) {
    if (normalizedSubject.includes(keyword.replace(/\s+/g, ''))) return color;
  }
  return 'bg-muted text-muted-foreground';
}

function getSubjectShort(subject: string) {
  if (subject.length > 6) return `${subject.slice(0, 5)}…`;
  return subject;
}

function readOverrides(): SubjectOverrideMap {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(SUBJECT_OVERRIDE_STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored) as SubjectOverrideMap;
  } catch {
    localStorage.removeItem(SUBJECT_OVERRIDE_STORAGE_KEY);
    return {};
  }
}

function getCellKey(school: SavedSchool, classInfo: { grade: string; classNm: string }, item: TimetableInfo) {
  return [school.schoolCode, classInfo.grade, classInfo.classNm, item.ALL_TI_YMD, item.PERIO, item.ITRT_CNTNT].join('|');
}

function normalizeTeacherName(item: TimetableInfo) {
  return item.TCHR_NM?.trim() || '';
}

function normalizeClassroomName(item: TimetableInfo) {
  return item.CLRM_NM?.trim() || '';
}

export function TimetableCard({
  school,
  classInfo,
  onClassInfoChange,
  subjectColors = DEFAULT_SUBJECT_COLORS,
  timetableDisplay = { showClassroom: false, showTeacher: false },
  onSubjectsFound,
}: TimetableCardProps) {
  const [timetable, setTimetable] = useState<TimetableInfo[]>([]);
  const [overrides, setOverrides] = useState<SubjectOverrideMap>({});
  const [editing, setEditing] = useState<{ key: string; original: string; value: string } | null>(null);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState(classInfo?.grade || '1');
  const [tempClass, setTempClass] = useState(classInfo?.classNm || '1');

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const grades = school.schoolType.includes('초등')
    ? ['1', '2', '3', '4', '5', '6']
    : ['1', '2', '3'];

  const classes = Array.from({ length: 15 }, (_, i) => String(i + 1));

  useEffect(() => {
    setOverrides(readOverrides());
  }, []);

  useEffect(() => {
    if (!classInfo) return;
    setTempGrade(classInfo.grade);
    setTempClass(classInfo.classNm);
  }, [classInfo]);

  useEffect(() => {
    if (!classInfo) return;

    const fetchTimetable = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fromDate = format(weekStart, 'yyyyMMdd');
        const toDate = format(addDays(weekStart, 4), 'yyyyMMdd');

        const params = new URLSearchParams({
          officeCode: school.officeCode,
          schoolCode: school.schoolCode,
          schoolType: school.schoolType,
          grade: classInfo.grade,
          classNm: classInfo.classNm,
          fromDate,
          toDate,
        });
        if (timetableDisplay.showClassroom) params.set('includeClassroom', 'true');

        const response = await fetch(`/api/timetable?${params}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);
        setTimetable(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '시간표를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, [school.officeCode, school.schoolCode, school.schoolType, classInfo, weekStart, timetableDisplay.showClassroom]);

  useEffect(() => {
    if (timetable.length === 0) return;
    const subjects = timetable.map((item) => overrides[getCellKey(school, classInfo ?? { grade: item.GRADE, classNm: item.CLASS_NM }, item)] || item.ITRT_CNTNT);
    onSubjectsFound?.(subjects);
  }, [timetable, overrides, school, classInfo, onSubjectsFound]);

  const getTimetableForDate = (date: Date) => {
    const dateStr = format(date, 'yyyyMMdd');
    return timetable
      .filter((t) => t.ALL_TI_YMD === dateStr)
      .sort((a, b) => Number(a.PERIO) - Number(b.PERIO));
  };

  const getDisplaySubject = (item: TimetableInfo) => {
    if (!classInfo) return item.ITRT_CNTNT;
    const key = getCellKey(school, classInfo, item);
    return overrides[key] || item.ITRT_CNTNT;
  };

  const saveOverride = () => {
    if (!editing) return;

    const next = { ...overrides };
    const trimmed = editing.value.trim();
    if (!trimmed || trimmed === editing.original) {
      delete next[editing.key];
    } else {
      next[editing.key] = trimmed;
    }

    setOverrides(next);
    localStorage.setItem(SUBJECT_OVERRIDE_STORAGE_KEY, JSON.stringify(next));
    setEditing(null);
  };

  const handleSaveClassInfo = () => {
    onClassInfoChange({ grade: tempGrade, classNm: tempClass });
  };

  const maxPeriods = Math.max(
    ...timetable.map((item) => Number(item.PERIO) || 0),
    7
  );
  const periodNumbers = Array.from({ length: maxPeriods }, (_, i) => i + 1);

  if (!classInfo) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            시간표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">학년과 반을 선택해주세요</p>
              <p className="text-xs text-muted-foreground">설정은 저장되어 다음에도 유지됩니다</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Select value={tempGrade} onValueChange={setTempGrade}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}학년</SelectItem>)}</SelectContent>
              </Select>
              <Select value={tempClass} onValueChange={setTempClass}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>{c}반</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleSaveClassInfo} size="lg" className="px-8">확인</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            시간표
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={tempGrade} onValueChange={(v) => { setTempGrade(v); onClassInfoChange({ grade: v, classNm: tempClass }); }}>
              <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}학년</SelectItem>)}</SelectContent>
            </Select>
            <Select value={tempClass} onValueChange={(v) => { setTempClass(v); onClassInfoChange({ grade: tempGrade, classNm: v }); }}>
              <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>{c}반</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Spinner className="h-6 w-6" /></div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>
        ) : timetable.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>시간표 정보가 없습니다.</p>
            <p className="text-xs mt-2">학기 시작 전이거나 데이터가 아직 등록되지 않았을 수 있습니다.</p>
          </div>
        ) : (
          <div className="-mx-2 px-2">
            <table className="w-full table-fixed border-collapse text-[10px] sm:text-xs">
              <thead>
                <tr>
                  <th className="w-7 p-1 font-medium text-muted-foreground border-b" />
                  {weekDays.map((date) => (
                    <th key={format(date, 'yyyy-MM-dd')} className={cn('p-1 text-center border-b', isToday(date) && 'bg-primary/10')}>
                      <div className="text-[10px] text-muted-foreground">{format(date, 'E', { locale: ko })}</div>
                      <div className={cn('text-xs font-semibold', isToday(date) ? 'text-primary' : 'text-foreground')}>{format(date, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periodNumbers.map((period) => (
                  <tr key={period}>
                    <td className="p-1 text-center font-medium text-muted-foreground border-r align-top">{period}</td>
                    {weekDays.map((date) => {
                      const dayTimetable = getTimetableForDate(date);
                      const periodData = dayTimetable.find((t) => Number(t.PERIO) === period);
                      const dateKey = format(date, 'yyyy-MM-dd');

                      if (!periodData) {
                        return <td key={dateKey} className={cn('p-0.5 text-center align-top', isToday(date) && 'bg-primary/5')}><div className="px-0.5 py-1.5 text-muted-foreground/50">-</div></td>;
                      }

                      const cellKey = getCellKey(school, classInfo, periodData);
                      const subject = getDisplaySubject(periodData);
                      const classroom = timetableDisplay.showClassroom ? normalizeClassroomName(periodData) : '';
                      const teacher = timetableDisplay.showTeacher ? normalizeTeacherName(periodData) : '';
                      const isExpanded = expandedCell === cellKey;

                      return (
                        <td key={dateKey} className={cn('p-0.5 text-center align-top', isToday(date) && 'bg-primary/5')}>
                          <button
                            type="button"
                            onClick={() => setExpandedCell(isExpanded ? null : cellKey)}
                            className={cn(
                              'w-full rounded px-0.5 py-1 text-center font-medium leading-tight transition',
                              'min-h-[38px] sm:min-h-[42px]',
                              getSubjectColor(subject, subjectColors)
                            )}
                            title={subject}
                          >
                            <span className={cn('block break-words', !isExpanded && 'truncate')}>{isExpanded ? subject : getSubjectShort(subject)}</span>
                            {(classroom || teacher) && (
                              <span className="mt-0.5 block text-[9px] font-normal opacity-80 leading-tight">
                                {[classroom, teacher].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </button>
                          {isExpanded && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-6 w-full px-1 text-[10px]"
                              onClick={() => setEditing({ key: cellKey, original: periodData.ITRT_CNTNT, value: subject })}
                            >
                              <Pencil className="mr-1 h-3 w-3" /> 수정
                            </Button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">과목명이 잘리면 한 번 터치해서 전체 이름을 볼 수 있습니다. 선택과목은 펼친 뒤 수정할 수 있습니다.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>과목명 수정</DialogTitle>
            <DialogDescription>선택과목명처럼 실제 표시명을 바꾸고 싶을 때 사용하세요. 이 값은 로컬에 저장됩니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editing?.value || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, value: e.target.value } : prev)} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setEditing((prev) => prev ? { ...prev, value: prev.original } : prev)}>
                <X className="mr-1 h-4 w-4" /> 기본값
              </Button>
              <Button onClick={saveOverride}>저장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
