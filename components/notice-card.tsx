'use client';

import { Bell, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SavedSchool } from '@/lib/neis-types';

interface NoticeCardProps {
  school: SavedSchool;
}

// NEIS API에서는 공지사항을 직접 제공하지 않아 학교 홈페이지로 안내합니다
export function NoticeCard({ school }: NoticeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          공지사항
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <p className="text-muted-foreground mb-4">
            공지사항은 학교 홈페이지에서 확인해주세요.
          </p>
          <Button variant="outline" asChild>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(school.schoolName + ' 홈페이지')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              학교 홈페이지 찾기
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
