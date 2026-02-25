'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GatheringResult {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
}

export default function Home() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<GatheringResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = searchInput.trim();
      if (trimmed.length === 0) {
        setResults([]);
        setShowResults(false);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/gatherings?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShowResults(true);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSelect = (id: string) => {
    setShowResults(false);
    router.push(`/created/${id}`);
  };

  return (
    <div className="flex flex-col items-center gap-8 pt-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">
          회식, 어땠어?
        </h1>
        <p className="text-gray-500 text-sm">
          회식 후 참여자들이 익명으로 별점을 매기는 앱
        </p>
      </div>

      {/* Create New */}
      <Link
        href="/create"
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 px-6 rounded-2xl text-center transition-colors shadow-sm"
      >
        새 평가 만들기
      </Link>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Search by title */}
      <div className="w-full space-y-3" ref={wrapperRef}>
        <label className="text-sm font-medium text-gray-700">
          평가현황/결과 찾기
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowResults(true); }}
            placeholder="회식 제목으로 검색"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full" />
            </div>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  검색 결과가 없습니다
                </div>
              ) : (
                results.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSelect(g.id)}
                    className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900">{g.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {g.location} &middot; {new Date(g.date).toLocaleDateString('ko-KR')}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="w-full bg-white rounded-2xl p-5 space-y-4 border border-gray-100">
        <h2 className="font-semibold text-gray-900">이용 방법</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">1</span>
            <p>회식 정보를 입력하고 평가를 생성합니다</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">2</span>
            <p>생성된 링크를 참여자들에게 공유합니다</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">3</span>
            <p>참여자들이 별점과 코멘트를 남깁니다</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">4</span>
            <p>결과 페이지에서 평균 별점과 AI 분석을 확인합니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
