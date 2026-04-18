'use client';

import { useState, useEffect } from 'react';
import { MealCard } from './meal-card';
import { ScheduleCard } from './schedule-card';
import { TimetableCard } from './timetable-card';
import { SettingsView } from './settings-view';
import { useSchool } from '@/hooks/use-school';
import { useClassInfo } from '@/hooks/use-class-info';
import { Clock, UtensilsCrossed, CalendarDays, Settings, GraduationCap } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

type TabType = 'timetable' | 'meal' | 'schedule' | 'settings';

export function Dashboard() {
  const { school, setSchool, isLoading: isSchoolLoading } = useSchool();
  const { classInfo, setClassInfo, isLoading: isClassLoading } = useClassInfo();
  const [activeTab, setActiveTab] = useState<TabType>('timetable');

  // 로딩 중 표시
  if (isSchoolLoading || isClassLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // 학교가 없는 경우는 기본값이 설정되어 있으므로 발생하지 않음
  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const tabs = [
    { id: 'timetable' as const, label: '시간표', icon: Clock },
    { id: 'meal' as const, label: '급식', icon: UtensilsCrossed },
    { id: 'schedule' as const, label: '학사일정', icon: CalendarDays },
    { id: 'settings' as const, label: '설정', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-foreground truncate">{school.schoolName}</h1>
              <p className="text-xs text-muted-foreground truncate">{school.address}</p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'timetable' && (
          <TimetableCard
            school={school}
            classInfo={classInfo}
            onClassInfoChange={setClassInfo}
          />
        )}
        {activeTab === 'meal' && (
          <MealCard school={school} />
        )}
        {activeTab === 'schedule' && (
          <ScheduleCard school={school} />
        )}
        {activeTab === 'settings' && (
          <SettingsView 
            school={school} 
            onSchoolChange={setSchool}
          />
        )}
      </main>

      {/* 하단 탭 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-card border-t safe-area-pb">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex flex-col items-center gap-1 py-3 px-4 min-w-[64px] transition-colors
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
