'use client';

import { MealCard } from './meal-card';
import { ScheduleCard } from './schedule-card';
import { TimetableCard } from './timetable-card';
import { NoticeCard } from './notice-card';
import { SchoolSearch } from './school-search';
import { useSchool } from '@/hooks/use-school';
import { useClassInfo } from '@/hooks/use-class-info';
import { GraduationCap, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function Dashboard() {
  const { school, setSchool, isLoading: isSchoolLoading } = useSchool();
  const { classInfo, setClassInfo, isLoading: isClassLoading } = useClassInfo();

  if (isSchoolLoading || isClassLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">학교알리미</h1>
            <p className="text-muted-foreground">
              학교를 검색하여 급식, 시간표, 학사일정을 확인하세요.
            </p>
          </div>
          <SchoolSearch onSelect={setSchool} selectedSchool={school} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">{school.schoolName}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {school.address}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSchool(null);
                setClassInfo(null);
              }}
              className="text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              학교 변경
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* 급식 카드 - 전체 너비 */}
          <div className="md:col-span-2">
            <MealCard school={school} />
          </div>

          {/* 시간표 카드 */}
          <TimetableCard
            school={school}
            classInfo={classInfo}
            onClassInfoChange={setClassInfo}
          />

          {/* 학사일정 카드 */}
          <ScheduleCard school={school} />

          {/* 공지사항 카드 - 전체 너비 */}
          <div className="md:col-span-2">
            <NoticeCard school={school} />
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <p>데이터 출처: 교육부 나이스(NEIS) 교육정보 개방 포털</p>
        </div>
      </footer>
    </div>
  );
}
