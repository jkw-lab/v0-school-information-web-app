'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import type { TimetableInfo, SavedSchool } from '@/lib/neis-types';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TimetableCardProps {
  school: SavedSchool;
  classInfo: { grade: string; classNm: string } | null;
  onClassInfoChange: (info: { grade: string; classNm: string }) => void;
}

const SUBJECT_COLORS: Record<string, string> = {
  '국어': 'bg-red-100 text-red-700 border-red-200',
  '영어': 'bg-blue-100 text-blue-700 border-blue-200',
  '수학': 'bg-amber-100 text-amber-700 border-amber-200',
  '과학': 'bg-green-100 text-green-700 border-green-200',
  '사회': 'bg-purple-100 text-purple-700 border-purple-200',
  '역사': 'bg-orange-100 text-orange-700 border-orange-200',
  '체육': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '음악': 'bg-pink-100 text-pink-700 border-pink-200',
  '미술': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '도덕': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  '기술': 'bg-slate-100 text-slate-700 border-slate-200',
  '가정': 'bg-rose-100 text-rose-700 border-rose-200',
  '정보': 'bg-violet-100 text-violet-700 border-violet-200',
};

function getSubjectColor(subject: string) {
  for (const [keyword, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject.includes(keyword)) return color;
  }
  return 'bg-muted text-foreground border-border';
}

export function TimetableCard({ school, classInfo, onClassInfoChange }: TimetableCardProps) {
  const [timetable, setTimetable] = useState<TimetableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempGrade, setTempGrade] = useState(classInfo?.grade || '1');
  const [tempClass, setTempClass] = useState(classInfo?.classNm || '1');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const grades = school.schoolType.includes('초등')
    ? ['1', '2', '3', '4', '5', '6']
    : ['1', '2', '3'];

  const classes = Array.from({ length: 20 }, (_, i) => String(i + 1));

  useEffect(() => {
    if (!classInfo) return;

    const fetchTimetable = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fromDate = format(weekStart, 'yyyyMMdd');
        const toDate = format(addDays(weekStart, 4), 'yyyyMMdd');

        // 주간 시간표를 가져오기 위해 각 날짜별로 요청
        const params = new URLSearchParams({
          officeCode: school.officeCode,
          schoolCode: school.schoolCode,
          schoolType: school.schoolType,
          grade: classInfo.grade,
          classNm: classInfo.classNm,
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
    setSettingsOpen(false);
  };

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
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">학년과 반을 설정해주세요.</p>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  학년/반 설정
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>학년/반 설정</DialogTitle>
                </DialogHeader>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel>학년</FieldLabel>
                    <Select value={tempGrade} onValueChange={setTempGrade}>
                      <SelectTrigger>
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
                  </Field>
                  <Field>
                    <FieldLabel>반</FieldLabel>
                    <Select value={tempClass} onValueChange={setTempClass}>
                      <SelectTrigger>
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
                  </Field>
                </FieldGroup>
                <Button onClick={handleSaveClassInfo} className="mt-4">
                  저장
                </Button>
              </DialogContent>
            </Dialog>
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
            <Badge variant="secondary">
              {classInfo.grade}학년 {classInfo.classNm}반
            </Badge>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>학년/반 설정</DialogTitle>
                </DialogHeader>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel>학년</FieldLabel>
                    <Select value={tempGrade} onValueChange={setTempGrade}>
                      <SelectTrigger>
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
                  </Field>
                  <Field>
                    <FieldLabel>반</FieldLabel>
                    <Select value={tempClass} onValueChange={setTempClass}>
                      <SelectTrigger>
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
                  </Field>
                </FieldGroup>
                <Button onClick={handleSaveClassInfo} className="mt-4">
                  저장
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={format(selectedDate, 'yyyy-MM-dd')}
          onValueChange={(v) => setSelectedDate(new Date(v))}
        >
          <TabsList className="w-full grid grid-cols-5 mb-4">
            {weekDays.map((date) => (
              <TabsTrigger
                key={format(date, 'yyyy-MM-dd')}
                value={format(date, 'yyyy-MM-dd')}
                className="flex flex-col gap-0.5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="text-xs">{format(date, 'E', { locale: ko })}</span>
                <span className="text-sm font-medium">{format(date, 'd')}</span>
                {isToday(date) && (
                  <span className="h-1 w-1 rounded-full bg-current" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {weekDays.map((date) => (
            <TabsContent key={format(date, 'yyyy-MM-dd')} value={format(date, 'yyyy-MM-dd')}>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              ) : getTimetableForDate(date).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  시간표 정보가 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {getTimetableForDate(date).map((period) => (
                    <div
                      key={`${period.ALL_TI_YMD}-${period.PERIO}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${getSubjectColor(period.ITRT_CNTNT)}`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/50 text-sm font-bold">
                        {period.PERIO}
                      </div>
                      <span className="font-medium">{period.ITRT_CNTNT}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
