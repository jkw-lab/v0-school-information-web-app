'use client';

import { useState } from 'react';
import { Moon, Sun, School, Mail, Database, MapPin, Trash2, Palette, Clock, Eye, EyeOff, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SchoolSearch } from './school-search';
import { useTheme } from '@/hooks/use-theme';
import { useTimetableSettings, COLOR_PALETTE } from '@/hooks/use-timetable-settings';
import type { SavedSchool } from '@/lib/neis-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface SettingsViewProps {
  school: SavedSchool;
  onSchoolChange: (school: SavedSchool) => void;
  subjects?: string[];
}

const CACHE_ITEMS = [
  { key: 'selected-school', name: '학교 정보' },
  { key: 'class-info', name: '학년/반 정보' },
  { key: 'timetable-settings', name: '시간표 설정' },
  { key: 'subject-colors', name: '과목 색상' },
  { key: 'theme', name: '테마 설정' },
];

const APP_VERSION = '1.0.0';

export function SettingsView({ school, onSchoolChange, subjects = [] }: SettingsViewProps) {
  const { isDark, toggleTheme } = useTheme();
  const { settings, setSettings, getSubjectColorIndex, setSubjectColor, clearColors } = useTimetableSettings();
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [cacheOpen, setCacheOpen] = useState(false);

  const handleSchoolSelect = (newSchool: SavedSchool) => {
    onSchoolChange(newSchool);
    setSchoolDialogOpen(false);
  };

  const handleClearAllCache = () => {
    CACHE_ITEMS.forEach(item => localStorage.removeItem(item.key));
    window.location.reload();
  };

  const handleClearCache = (key: string) => {
    localStorage.removeItem(key);
    window.location.reload();
  };

  const handleColorSelect = (subject: string, colorIndex: number) => {
    setSubjectColor(subject, colorIndex);
    setSelectedSubject(null);
  };

  // 유니크한 과목 목록
  const uniqueSubjects = Array.from(new Set(subjects)).sort();

  return (
    <div className="space-y-4 pb-4">
      {/* 현재 학교 정보 */}
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
          <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <School className="h-4 w-4 mr-2" />
                학교 변경
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>학교 검색</DialogTitle>
                <DialogDescription>
                  학교 이름을 검색하여 선택하세요.
                </DialogDescription>
              </DialogHeader>
              <SchoolSearch 
                onSelect={handleSchoolSelect} 
                selectedSchool={school}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* 시간표 설정 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            시간표 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="show-classroom" className="cursor-pointer">
                <span className="text-base font-medium">교실 정보 표시</span>
                <p className="text-sm text-muted-foreground font-normal">
                  시간표에 교실 위치 표시
                </p>
              </Label>
            </div>
            <Switch
              id="show-classroom"
              checked={settings.showClassroom}
              onCheckedChange={(checked) => setSettings({ showClassroom: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="show-teacher" className="cursor-pointer">
                <span className="text-base font-medium">교사 정보 표시</span>
                <p className="text-sm text-muted-foreground font-normal">
                  시간표에 담당 교사 표시
                </p>
              </Label>
            </div>
            <Switch
              id="show-teacher"
              checked={settings.showTeacher}
              onCheckedChange={(checked) => setSettings({ showTeacher: checked })}
            />
          </div>
          
          {/* 과목 색상 설정 */}
          <div className="pt-2 border-t">
            <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Palette className="h-4 w-4 mr-2" />
                  과목 색상 설정
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>과목 색상 설정</DialogTitle>
                  <DialogDescription>
                    각 과목의 색상을 선택하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  {uniqueSubjects.length > 0 ? (
                    uniqueSubjects.map((subject) => {
                      const colorIndex = getSubjectColorIndex(subject);
                      const color = COLOR_PALETTE[colorIndex];
                      return (
                        <div key={subject} className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium truncate flex-1">{subject}</span>
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 gap-2"
                                onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
                              >
                                <div 
                                  className="w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span className="text-xs">{color.name}</span>
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="absolute right-4 mt-1 z-50 bg-popover border rounded-lg p-2 shadow-lg">
                              <div className="grid grid-cols-4 gap-1.5">
                                {COLOR_PALETTE.map((c, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleColorSelect(subject, idx)}
                                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
                                    style={{ backgroundColor: c.hex, borderColor: idx === colorIndex ? '#000' : 'transparent' }}
                                    title={c.name}
                                  >
                                    {idx === colorIndex && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                                  </button>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      시간표를 먼저 불러와주세요.
                    </p>
                  )}
                  {uniqueSubjects.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={clearColors}
                    >
                      색상 초기화
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* 테마 설정 */}
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
            <Switch
              id="dark-mode"
              checked={isDark}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* 캐시 관리 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trash2 className="h-5 w-5 text-primary" />
            데이터 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={cacheOpen} onOpenChange={setCacheOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  개별 캐시 삭제
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${cacheOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2">
              {CACHE_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <span className="text-sm">{item.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive">
                        삭제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{item.name} 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          {item.name}을(를) 삭제하시겠습니까? 페이지가 새로고침됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleClearCache(item.key)}>
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                모든 캐시 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>모든 캐시 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  모든 저장된 데이터(학교 정보, 시간표 설정, 테마 등)가 삭제됩니다. 계속하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllCache}>
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* 정보 */}
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
                <a 
                  href="mailto:kw09.jeon@gmail.com" 
                  className="text-primary hover:underline"
                >
                  kw09.jeon@gmail.com
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 버전 정보 */}
      <div className="text-center text-xs text-muted-foreground pt-4 pb-2">
        <p>학교알리미 v{APP_VERSION}</p>
      </div>
    </div>
  );
}
