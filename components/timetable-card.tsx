'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TimetableInfo, SavedSchool } from '@/lib/neis-types';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TimetableCardProps {
  school: SavedSchool;
  classInfo: { grade: string; classNm: string } | null;
  onClassInfoChange: (info: { grade: string; classNm: string }) => void;
}

const SUBJECT_COLORS: Record<string, string> = {
  '국어': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  '영어': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  '수학': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  '과학': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  '사회': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  '역사': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  '체육': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  '음악': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  '미술': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  '도덕': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  '기술': 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300',
  '가정': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  '정보': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  '물리': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  '화학': 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
  '생물': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  '지구': 'bg-stone-100 text-stone-800 dark:bg-stone-700/50 dark:text-stone-300',
};

function getSubjectColor(subject: string) {
  for (const [keyword, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject.includes(keyword)) return color;
  }
  return 'bg-muted text-muted-foreground';
}

function getSubjectShort(subject: string) {
  if (subject.length > 6) {
    return subject.slice(0, 5) + '..';
  }
  return subject;
}

export function TimetableCard({ school, classInfo, onClassInfoChange }: TimetableCardProps) {
  const [timetable, setTimetable] = useState<TimetableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState(classInfo?.grade || '1');
  const [tempClass, setTempClass] = useState(classInfo?.classNm || '1');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const grades = school.schoolType.includes('초등')
    ? ['1', '2', '3', '4', '5', '6']
    : ['1', '2', '3'];

  const classes = Array.from({ length: 15 }, (_, i) => String(i + 1));

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

        const response = await fetch(`/api/timetable?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setTimetable(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '시간표를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, [school.officeCode, school.schoolCode, school.schoolType, classInfo]);

  const getTimetableForDate = (date: Date) => {
    const dateStr = format(date, 'yyyyMMdd');
    return timetable
      .filter((t) => t.ALL_TI_YMD === dateStr)
      .sort((a, b) => Number(a.PERIO) - Number(b.PERIO));
  };

  const handleSaveClassInfo = () => {
    onClassInfoChange({ grade: tempGrade, classNm: tempClass });
  };

  // 모든 요일의 최대 교시 수 계산
  const maxPeriods = Math.max(
    ...weekDays.map(date => getTimetableForDate(date).length),
    7 // 최소 7교시
  );

  const periodNumbers = Array.from({ length: maxPeriods }, (_, i) => i + 1);

  // 학년/반 선택 UI
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
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}학년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tempClass} onValueChange={setTempClass}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}반
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleSaveClassInfo} size="lg" className="px-8">
                확인
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            시간표
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select 
              value={tempGrade} 
              onValueChange={(v) => { 
                setTempGrade(v); 
                onClassInfoChange({ grade: v, classNm: tempClass }); 
              }}
            >
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}학년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={tempClass} 
              onValueChange={(v) => { 
                setTempClass(v); 
                onClassInfoChange({ grade: tempGrade, classNm: v }); 
              }}
            >
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}반
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : timetable.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>시간표 정보가 없습니다.</p>
            <p className="text-xs mt-2">학기 시작 전이거나 데이터가 아직 등록되지 않았을 수 있습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[320px] border-collapse">
              <thead>
                <tr>
                  <th className="w-10 p-1.5 text-xs font-medium text-muted-foreground border-b" />
                  {weekDays.map((date) => (
                    <th
                      key={format(date, 'yyyy-MM-dd')}
                      className={`p-1.5 text-center border-b ${isToday(date) ? 'bg-primary/10' : ''}`}
                    >
                      <div className="text-xs text-muted-foreground">{format(date, 'E', { locale: ko })}</div>
                      <div className={`text-sm font-semibold ${isToday(date) ? 'text-primary' : 'text-foreground'}`}>
                        {format(date, 'd')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periodNumbers.map((period) => (
                  <tr key={period}>
                    <td className="p-1.5 text-center text-xs font-medium text-muted-foreground border-r">
                      {period}
                    </td>
                    {weekDays.map((date) => {
                      const dayTimetable = getTimetableForDate(date);
                      const periodData = dayTimetable.find(t => Number(t.PERIO) === period);
                      
                      return (
                        <td
                          key={format(date, 'yyyy-MM-dd')}
                          className={`p-1 text-center ${isToday(date) ? 'bg-primary/5' : ''}`}
                        >
                          {periodData ? (
                            <div
                              className={`px-1 py-1.5 rounded text-xs font-medium truncate ${getSubjectColor(periodData.ITRT_CNTNT)}`}
                              title={periodData.ITRT_CNTNT}
                            >
                              {getSubjectShort(periodData.ITRT_CNTNT)}
                            </div>
                          ) : (
                            <div className="px-1 py-1.5 text-xs text-muted-foreground/50">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
