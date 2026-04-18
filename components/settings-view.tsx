'use client';

import { useState } from 'react';
import { Moon, Sun, School, Mail, ExternalLink, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { SchoolSearch } from './school-search';
import { useTheme } from '@/hooks/use-theme';
import type { SavedSchool } from '@/lib/neis-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SettingsViewProps {
  school: SavedSchool;
  onSchoolChange: (school: SavedSchool) => void;
}

export function SettingsView({ school, onSchoolChange }: SettingsViewProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);

  const handleSchoolSelect = (newSchool: SavedSchool) => {
    onSchoolChange(newSchool);
    setSchoolDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* 현재 학교 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="h-5 w-5 text-primary" />
            학교 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="font-medium text-foreground">{school.schoolName}</p>
            <p className="text-sm text-muted-foreground mt-1">{school.address}</p>
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
              </DialogHeader>
              <SchoolSearch 
                onSelect={handleSchoolSelect} 
                selectedSchool={school}
              />
            </DialogContent>
          </Dialog>
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
          <FieldGroup>
            <Field className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <FieldLabel className="text-base font-medium cursor-pointer">다크 모드</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    {isDark ? '어두운 테마 사용 중' : '밝은 테마 사용 중'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
              />
            </Field>
          </FieldGroup>
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
    </div>
  );
}
