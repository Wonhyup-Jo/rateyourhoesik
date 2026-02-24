'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StarRating from '@/components/StarRating';

const CATEGORIES = [
  { key: 'foodRating', label: '음식', emoji: '🍽️' },
  { key: 'locationRating', label: '장소', emoji: '📍' },
  { key: 'atmosphereRating', label: '분위기', emoji: '✨' },
  { key: 'membersRating', label: '멤버', emoji: '👥' },
  { key: 'endTimeRating', label: '종료시간', emoji: '⏰' },
];

interface ResultsData {
  gathering: {
    id: string;
    title: string;
    date: string;
    location: string;
    maxParticipants: number;
    deadline: string | null;
    status: string;
    currentParticipants: number;
  };
  averages: Record<string, number>;
  overallAverage: number;
  totalRatings: number;
}

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/gatherings/${id}/results`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setError('결과를 찾을 수 없습니다.');
        setLoading(false);
      });
  }, [id]);

  const loadAiSummary = () => {
    setAiLoading(true);
    fetch(`/api/gatherings/${id}/ai-summary`)
      .then(res => res.json())
      .then(result => {
        setAiSummary(result.summary);
        setAiLoading(false);
      })
      .catch(() => {
        setAiSummary('AI 요약을 불러올 수 없습니다.');
        setAiLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-500">{error || '결과를 찾을 수 없습니다'}</p>
        <Link href="/" className="text-amber-500 underline text-sm">홈으로 돌아가기</Link>
      </div>
    );
  }

  const { gathering, averages, overallAverage, totalRatings } = data;
  const isClosed = gathering.status === 'closed';

  // Find best and worst category
  const sortedCats = [...CATEGORIES].sort((a, b) => (averages[b.key] || 0) - (averages[a.key] || 0));
  const bestCat = sortedCats[0];
  const worstCat = sortedCats[sortedCats.length - 1];

  return (
    <div className="space-y-6 pb-8">
      {/* Gathering Info */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-start justify-between">
          <h1 className="font-bold text-lg text-gray-900">{gathering.title}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isClosed
              ? 'bg-gray-100 text-gray-500'
              : 'bg-green-100 text-green-600'
          }`}>
            {isClosed ? '종료' : '진행중'}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
          <span>&#x1f4c5; {new Date(gathering.date).toLocaleDateString('ko-KR')}</span>
          <span>&#x1f4cd; {gathering.location}</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">참여 현황</span>
          <span className="text-sm font-semibold text-gray-900">
            {totalRatings} / {gathering.maxParticipants}명
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((totalRatings / gathering.maxParticipants) * 100, 100)}%` }}
          />
        </div>
      </div>

      {totalRatings === 0 ? (
        <div className="text-center py-10 space-y-3">
          <div className="text-4xl">&#x1f914;</div>
          <p className="text-gray-500 text-sm">아직 평가 결과가 없습니다</p>
          <Link
            href={`/rate/${id}`}
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-colors"
          >
            첫 번째 평가자가 되어보세요!
          </Link>
        </div>
      ) : (
        <>
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 text-center space-y-2">
            <p className="text-xs text-amber-600 font-medium">종합 평점</p>
            <p className="text-5xl font-bold text-gray-900">{overallAverage.toFixed(1)}</p>
            <StarRating value={Math.round(overallAverage)} readonly size="md" />
            <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
              <span>{bestCat.emoji} Best: {bestCat.label} ({averages[bestCat.key].toFixed(1)})</span>
              {totalRatings >= 2 && (
                <span>{worstCat.emoji} Low: {worstCat.label} ({averages[worstCat.key].toFixed(1)})</span>
              )}
            </div>
          </div>

          {/* Category Details */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">항목별 평점</h2>
            {CATEGORIES.map((cat) => {
              const avg = averages[cat.key] || 0;
              return (
                <div key={cat.key} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {cat.emoji} {cat.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{avg.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(avg / 5) * 100}%` }}
                      />
                    </div>
                    <StarRating value={Math.round(avg)} readonly size="sm" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">&#x1f916; AI 코멘트 분석</h2>
              {!aiSummary && !aiLoading && (
                <button
                  onClick={loadAiSummary}
                  className="text-xs text-amber-500 hover:text-amber-600 font-medium"
                >
                  분석하기
                </button>
              )}
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="animate-spin w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full" />
                코멘트를 분석하고 있습니다...
              </div>
            ) : aiSummary ? (
              <p className="text-sm text-gray-600 leading-relaxed">{aiSummary}</p>
            ) : (
              <p className="text-xs text-gray-400">
                참여자들의 코멘트를 AI가 익명으로 분석하여 요약합니다
              </p>
            )}
          </div>
        </>
      )}

      {/* Share / Go to rate */}
      {!isClosed && (
        <Link
          href={`/rate/${id}`}
          className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 px-6 rounded-2xl text-center transition-colors shadow-sm"
        >
          나도 평가하기
        </Link>
      )}
    </div>
  );
}
