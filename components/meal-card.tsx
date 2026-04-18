'use client';

import { useEffect, useState } from 'react';
import { UtensilsCrossed, Calendar, Flame, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { MealInfo, SavedSchool } from '@/lib/neis-types';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MealCardProps {
  school: SavedSchool;
}

const MEAL_TYPES: Record<string, string> = {
  '1': '조식',
  '2': '중식',
  '3': '석식',
};

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
  // 메뉴 항목 분리 및 알레르기 정보 파싱
  const items = menu.split('<br/>').filter(Boolean);
  return items.map((item) => {
    const allergenMatch = item.match(/\(([0-9.,]+)\)/);
    const name = item.replace(/\([0-9.,]+\)/g, '').trim();
    const allergens = allergenMatch
      ? allergenMatch[1].split('.').map((n) => ALLERGENS[n]).filter(Boolean)
      : [];
    return { name, allergens };
  });
}

export function MealCard({ school }: MealCardProps) {
  const [meals, setMeals] = useState<MealInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const fetchMeals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fromDate = format(weekStart, 'yyyyMMdd');
        const toDate = format(addDays(weekStart, 4), 'yyyyMMdd');

        const params = new URLSearchParams({
          officeCode: school.officeCode,
          schoolCode: school.schoolCode,
          fromDate,
          toDate,
        });

        const response = await fetch(`/api/meals?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setMeals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '급식 정보를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeals();
  }, [school.officeCode, school.schoolCode]);

  const getMealsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyyMMdd');
    return meals.filter((meal) => meal.MLSV_YMD === dateStr);
  };

  const selectedMeals = getMealsForDate(selectedDate);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          급식 메뉴
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 주간 날짜 탭 */}
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
