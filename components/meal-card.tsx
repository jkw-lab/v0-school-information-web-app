'use client';

import { fetchArray } from '@/lib/client-api';

import { useEffect, useMemo, useState } from 'react';
import { UtensilsCrossed, Flame, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { MealInfo, SavedSchool } from '@/lib/neis-types';
import { format, addDays, startOfWeek, isToday, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MealCardProps {
  school: SavedSchool;
}

const ALLERGENS: Record<string, string> = {
  '1': '난류',
  '2': '우유',
  '3': '메밀',
  '4': '땅콩',
  '5': '대두',
  '6': '밀',
  '7': '고등어',
  '8': '게',
  '9': '새우',
  '10': '돼지고기',
  '11': '복숭아',
  '12': '토마토',
  '13': '아황산류',
  '14': '호두',
  '15': '닭고기',
  '16': '쇠고기',
  '17': '오징어',
  '18': '조개류',
  '19': '잣',
};

function parseMealMenu(menu: string) {
  const items = menu.split(/<br\s*\/?\s*>/i).filter(Boolean);
  return items.map((item) => {
    const allergenMatch = item.match(/\(([0-9.,]+)\)/);
    const name = item.replace(/\([0-9.,]+\)/g, '').trim();
    const allergens = allergenMatch
      ? allergenMatch[1].split(/[.,]/).map((n) => ALLERGENS[n]).filter(Boolean)
      : [];
    return { name, allergens };
  });
}

export function MealCard({ school }: MealCardProps) {
  const [meals, setMeals] = useState<MealInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(currentWeekStart, i)), [currentWeekStart]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMeals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fromDate = format(currentWeekStart, 'yyyyMMdd');
        const toDate = format(addDays(currentWeekStart, 4), 'yyyyMMdd');

        const params = new URLSearchParams({
          officeCode: school.officeCode,
          schoolCode: school.schoolCode,
          fromDate,
          toDate,
        });

        const data = await fetchArray<MealInfo>(`/api/meals?${params}`, controller.signal);
        if (controller.signal.aborted) return;
        setMeals(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : '급식 정보를 불러올 수 없습니다.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchMeals();
    return () => controller.abort();
  }, [retryCount, school.officeCode, school.schoolCode, currentWeekStart]);

  // 주가 바뀌면 첫번째 날짜로 선택 변경
  useEffect(() => {
    const todayInWeek = weekDays.find(d => isToday(d));
    if (todayInWeek) {
      setSelectedDate(todayInWeek);
    } else {
      setSelectedDate(weekDays[0]);
    }
  }, [weekDays]);

  const getMealsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyyMMdd');
    return meals.filter((meal) => meal.MLSV_YMD === dateStr);
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            급식 메뉴
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="이전 주 급식"
              onClick={handlePrevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(currentWeekStart, 'M월 d일', { locale: ko })} ~
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="다음 주 급식"
              onClick={handleNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 주간 날짜 탭 */}
        <Tabs
          value={format(selectedDate, 'yyyy-MM-dd')}
          onValueChange={(v) => setSelectedDate(parseISO(v))}
        >
          <TabsList className="w-full grid grid-cols-5 mb-4 h-auto">
            {weekDays.map((date) => (
              <TabsTrigger
                key={format(date, 'yyyy-MM-dd')}
                value={format(date, 'yyyy-MM-dd')}
                className="flex flex-col gap-0.5 py-2.5 px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="text-xs">{format(date, 'E', { locale: ko })}</span>
                <span className="text-sm font-medium">{format(date, 'd')}</span>
                {isToday(date) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
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
                <div className="flex flex-wrap items-center justify-center gap-2 py-8 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span role="alert">{error}</span><Button variant="outline" size="sm" onClick={() => setRetryCount((count) => count + 1)}>다시 시도</Button>
                </div>
              ) : getMealsForDate(date).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  급식 정보가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {getMealsForDate(date).map((meal) => (
                    <div key={`${meal.MLSV_YMD}-${meal.MMEAL_SC_CODE}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{meal.MMEAL_SC_NM}</Badge>
                        {meal.CAL_INFO && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {meal.CAL_INFO}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {parseMealMenu(meal.DDISH_NM).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground">•</span>
                            <span>{item.name}</span>
                            {item.allergens.length > 0 && (
                              <span className="text-xs text-orange-500">
                                ({item.allergens.join(', ')})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
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
