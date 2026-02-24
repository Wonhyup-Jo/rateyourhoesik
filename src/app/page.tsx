'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [linkInput, setLinkInput] = useState('');
  const [error, setError] = useState('');

  const handleGoToLink = () => {
    setError('');
    const trimmed = linkInput.trim();

    // Extract ID from various formats
    let id = '';
    if (trimmed.includes('/rate/') || trimmed.includes('/results/')) {
      const match = trimmed.match(/\/(rate|results)\/([a-zA-Z0-9-]+)/);
      if (match) {
        id = match[2];
        router.push(`/${match[1]}/${id}`);
        return;
      }
    }

    // Try as raw ID
    if (/^[a-zA-Z0-9-]+$/.test(trimmed) && trimmed.length > 0) {
      router.push(`/rate/${trimmed}`);
      return;
    }

    setError('올바른 링크 또는 평가 ID를 입력해주세요.');
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

      {/* Go to existing */}
      <div className="w-full space-y-3">
        <label className="text-sm font-medium text-gray-700">
          평가 링크 또는 ID 입력
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGoToLink()}
            placeholder="링크 또는 ID를 붙여넣기"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <button
            onClick={handleGoToLink}
            className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            이동
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
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
