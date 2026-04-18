'use client';

import { useState } from 'react';
import { Search, School, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import type { SchoolInfo, SavedSchool } from '@/lib/neis-types';
import { OFFICE_CODES, type OfficeName } from '@/lib/neis-types';

interface SchoolSearchProps {
  onSelect: (school: SavedSchool) => void;
  selectedSchool?: SavedSchool | null;
}

export function SchoolSearch({ onSelect, selectedSchool }: SchoolSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [results, setResults] = useState<SchoolInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setError('학교명을 2자 이상 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({ name: searchQuery });
      if (selectedOffice) {
        params.set('officeCode', selectedOffice);
      }

      const response = await fetch(`/api/schools/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '검색 중 오류가 발생했습니다.');
      }

      setResults(data);
      if (data.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (school: SchoolInfo) => {
    const saved: SavedSchool = {
      schoolCode: school.SD_SCHUL_CODE,
      officeCode: school.ATPT_OFCDC_SC_CODE,
      schoolName: school.SCHUL_NM,
      schoolType: school.SCHUL_KND_SC_NM,
      address: school.ORG_RDNMA,
    };
    onSelect(saved);
    setOpen(false);
    setSearchQuery('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={selectedSchool ? "outline" : "default"}
          className="w-full justify-start gap-2 h-auto py-3"
        >
          <School className="h-5 w-5 shrink-0" />
          <div className="flex flex-col items-start text-left">
            {selectedSchool ? (
              <>
                <span className="font-medium">{selectedSchool.schoolName}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedSchool.schoolType} · {selectedSchool.address}
                </span>
              </>
            ) : (
              <span>학교를 선택해주세요</span>
            )}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            학교 검색
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedOffice} onValueChange={setSelectedOffice}>
            <SelectTrigger>
              <SelectValue placeholder="시/도 선택 (선택사항)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(OFFICE_CODES).map(([name, code]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              placeholder="학교명을 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {results.length > 0 && (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {results.map((school) => (
                  <button
                    key={`${school.ATPT_OFCDC_SC_CODE}-${school.SD_SCHUL_CODE}`}
                    onClick={() => handleSelect(school)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{school.SCHUL_NM}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {school.ORG_RDNMA}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {school.SCHUL_KND_SC_NM} · {school.ATPT_OFCDC_SC_NM}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
