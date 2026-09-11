'use client';

import { useMemo, useState } from 'react';
import { Moon, Sun, School, Mail, Database, MapPin, Trash2, Palette, Clock, Info } from 'lucide-react';
import packageInfo from '@/package.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SchoolSearch } from './school-search';
import { useTheme } from '@/hooks/use-theme';
import type { SavedSchool } from '@/lib/neis-types';
import type { useAppSettings } from '@/hooks/use-app-settings';
import { KNOWN_LOCAL_STORAGE_ITEMS, SUBJECT_COLOR_OPTIONS } from '@/hooks/use-app-settings';

import { cn } from '@/lib/utils';

interface SettingsViewProps {
  school: SavedSchool;
  onSchoolChange: (school: SavedSchool) => void;
  appSettings: ReturnType<typeof useAppSettings>;
}

export function SettingsView({ school, onSchoolChange, appSettings }: SettingsViewProps) {
  const { isDark, toggleTheme } = useTheme();
  const [selectedCacheKeys, setSelectedCacheKeys] = useState<string[]>([]);

  const subjectNames = useMemo(() => appSettings.subjectNames, [appSettings.subjectNames]);

  const handleSchoolSelect = (newSchool: SavedSchool) => {
    onSchoolChange(newSchool);
  };

  const toggleCacheKey = (key: string) => {
    setSelectedCacheKeys((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  };

  const handleClearSelected = () => {
    if (selectedCacheKeys.length === 0) return;
    appSettings.clearLocalStorageKeys(selectedCacheKeys);
    setSelectedCacheKeys([]);
    window.location.reload();
  };

  const handleClearAll = () => {
    appSettings.clearAllLocalData();
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="h-5 w-5 text-primary" />
            학교 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
            <p className="font-medium text-foreground">{school.schoolName}</p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{school.address}</p>
            </div>
          </div>
          <SchoolSearch onSelect={handleSchoolSelect} selectedSchool={school} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            화면 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
              <Label htmlFor="dark-mode" className="cursor-pointer">
                <span className="text-base font-medium">다크 모드</span>
                <p className="text-sm text-muted-foreground font-normal">
                  {isDark ? '어두운 테마 사용 중' : '밝은 테마 사용 중'}
                </p>
              </Label>
            </div>
            <Switch id="dark-mode" checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            시간표 표시 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="show-classroom" className="cursor-pointer">
              <span className="font-medium">교실 정보 표시</span>
              <p className="text-sm text-muted-foreground font-normal">강의실 정보가 있으면 과목 아래에 표시합니다.</p>
            </Label>
            <Switch
              id="show-classroom"
              checked={appSettings.timetableDisplay.showClassroom}
              onCheckedChange={(checked) => appSettings.setTimetableDisplay({ showClassroom: checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="show-teacher" className="cursor-pointer">
              <span className="font-medium">교사 표시</span>
              <p className="text-sm text-muted-foreground font-normal">API에 교사명이 포함된 경우 과목 아래에 표시합니다.</p>
            </Label>
            <Switch
              id="show-teacher"
              checked={appSettings.timetableDisplay.showTeacher}
              onCheckedChange={(checked) => appSettings.setTimetableDisplay({ showTeacher: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            과목 색상 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">처음에는 자동 색상을 사용하고, 원하는 과목은 직접 바꿀 수 있습니다. 설정은 새로고침 후에도 유지됩니다.</p>
          {subjectNames.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              시간표를 한 번 불러오면 실제 과목 목록이 여기에 표시됩니다.
            </div>
          ) : (
            <div className="space-y-3">
              {subjectNames.map((subject) => (
              <div key={subject} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{subject}</span>
                  <Badge className={cn('border-transparent', appSettings.subjectColors[subject])}>{subject}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => appSettings.setSubjectColor(subject, option.className)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs transition ring-offset-background',
                        option.className,
                        appSettings.subjectColors[subject] === option.className && 'ring-2 ring-primary ring-offset-2'
                      )}
                      aria-label={`${subject} 색상을 ${option.name}(으)로 변경`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={appSettings.resetSubjectColors}>과목 색상 초기화</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trash2 className="h-5 w-5 text-primary" />
            캐시 삭제
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">로컬에 저장된 학교, 반, 테마, 시간표 표시, 과목 색상, 선택과목 수정값을 삭제할 수 있습니다.</p>
          <div className="grid gap-2">
            {KNOWN_LOCAL_STORAGE_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={selectedCacheKeys.includes(item.key)}
                onClick={() => toggleCacheKey(item.key)}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 text-left transition',
                  selectedCacheKeys.includes(item.key) ? 'border-primary bg-primary/10' : 'hover:bg-secondary/50'
                )}
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{selectedCacheKeys.includes(item.key) ? '선택됨' : '선택'}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleClearSelected} disabled={selectedCacheKeys.length === 0}>선택 삭제</Button>
            <Button variant="destructive" onClick={handleClearAll}>전체 삭제</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">데이터 출처</p>
                <p className="text-muted-foreground">교육부 나이스(NEIS) 교육정보 개방 포털</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">문의</p>
                <a href="mailto:kw09.jeon@gmail.com" className="text-primary hover:underline">kw09.jeon@gmail.com</a>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">버전 정보</p>
                <p className="text-muted-foreground">v{packageInfo.version}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
