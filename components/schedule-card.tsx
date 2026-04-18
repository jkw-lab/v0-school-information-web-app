'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { ScheduleInfo, SavedSchool } from '@/lib/neis-types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ScheduleCardProps {
  school: SavedSchool;
}

const EVENT_COLORS: Record<string, string> = {
  '휴업일': 'bg-red-100 text-red-700',
  '시험': 'bg-amber-100 text-amber-700',
  '방학': 'bg-sky-100 text-sky-700',
  '개학': 'bg-green-100 text-green-700',
  '졸업': 'bg-purple-100 text-purple-700',
  '입학': 'bg-emerald-100 text-emerald-700',
};

function getEventColor(eventName: string) {
  for (const [keyword, color] of Object.entries(EVENT_COLORS)) {
    if (eventName.includes(keyword)) return color;
  }
  return 'bg-primary/10 text-primary';
}

export function ScheduleCard({ school }: ScheduleCardProps) {
  const [schedules, setSchedules] = useState<ScheduleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fromDate = format(startOfMonth(currentMonth), 'yyyyMMdd');
        const toDate = format(endOfMonth(currentMonth), 'yyyyMMdd');

        const params = new URLSearchParams({
          officeCode: school.officeCode,
          schoolCode: school.schoolCode,
          fromDate,
          toDate,
        });

        const response = await fetch(`/api/schedule?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setSchedules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '학사일정을 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, [school.officeCode, school.schoolCode, currentMonth]);

  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyyMMdd');
    return schedules.filter((s) => s.AA_YMD === dateStr);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 달력 시작 요일 맞추기 (일요일 = 0)
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const selectedSchedules = selectedDate ? getSchedulesForDate(selectedDate) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            학사일정
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-24 text-center">
              {format(currentMonth, 'yyyy년 M월', { locale: ko })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 달력 헤더 */}
            <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
              <div className="text-red-500">일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div className="text-blue-500">토</div>
            </div>

            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {/* 빈 칸 */}
              {emptyDays.map((i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* 날짜 */}
              {calendarDays.map((day) => {
                const daySchedules = getSchedulesForDate(day);
                const hasEvent = daySchedules.length > 0;
                const dayOfWeek = getDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                      transition-colors relative
                      ${isToday(day) ? 'bg-primary text-primary-foreground font-bold' : ''}
                      ${isSelected && !isToday(day) ? 'bg-accent' : ''}
                      ${!isToday(day) && !isSelected ? 'hover:bg-muted' : ''}
                      ${dayOfWeek === 0 ? 'text-red-500' : ''}
                      ${dayOfWeek === 6 ? 'text-blue-500' : ''}
                      ${isToday(day) ? 'text-primary-foreground' : ''}
                    `}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasEvent && (
                      <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isToday(day) ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 선택된 날짜의 일정 */}
            {selectedDate && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-sm mb-2">
                  {format(selectedDate, 'M월 d일 (E)', { locale: ko })} 일정
                </h4>
                {selectedSchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">일정이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSchedules.map((schedule, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Badge className={getEventColor(schedule.EVENT_NM)}>
                          {schedule.EVENT_NM}
                        </Badge>
                        {schedule.EVENT_CNTNT && (
                          <span className="text-sm text-muted-foreground">
                            {schedule.EVENT_CNTNT}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 이번 달 주요 일정 목록 */}
            {!selectedDate && schedules.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-sm mb-2">이번 달 주요 일정</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {schedules.slice(0, 5).map((schedule, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-12">
                        {schedule.AA_YMD.slice(4, 6)}/{schedule.AA_YMD.slice(6, 8)}
                      </span>
                      <Badge className={getEventColor(schedule.EVENT_NM)} variant="secondary">
                        {schedule.EVENT_NM}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
