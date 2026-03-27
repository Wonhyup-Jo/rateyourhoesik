'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import { CATEGORIES } from '@/lib/db';

interface GatheringData {
  id: string;
  title: string;
  date: string;
  location: string;
  maxParticipants: number;
  deadline: string | null;
  status: string;
  currentParticipants: number;
}

export default function RatePage() {
  const params = useParams();
  const id = params.id as string;
  const [gathering, setGathering] = useState<GatheringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [nickname, setNickname] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetch(`/api/gatherings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(data => {
        setGathering(data);
        setLoading(false);
      })
      .catch(() => {
        setError('평가를 찾을 수 없습니다.');
        setLoading(false);
      });
  }, [id]);

  const allRated = CATEGORIES.every(c => ratings[c.key] >= 1);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (!allRated) {
      setError('모든 항목에 별점을 매겨주세요.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/gatherings/${id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          ...ratings,
          comment: comment.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '제출에 실패했습니다.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 pt-12">
        <div className="text-5xl">&#x1f389;</div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">평가 완료!</h1>
          <p className="text-gray-500 text-sm">소중한 의견 감사합니다</p>
        </div>
        <Link
          href={`/results/${id}`}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 px-8 rounded-xl transition-colors"
        >
          결과 보러 가기
        </Link>
      </div>
    );
  }

  if (!gathering) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-500">평가를 찾을 수 없습니다</p>
        <Link href="/" className="text-amber-500 underline text-sm">홈으로 돌아가기</Link>
      </div>
    );
  }

  const isClosed = gathering.status === 'closed';

  if (isClosed) {
    return (
      <div className="flex flex-col items-center gap-6 pt-12">
        <div className="text-5xl">&#x1f512;</div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">평가가 종료되었습니다</h1>
          <p className="text-gray-500 text-sm">더 이상 평가를 받지 않습니다</p>
        </div>
        <Link
          href={`/results/${id}`}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 px-8 rounded-xl transition-colors"
        >
          결과 보러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Gathering Info */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h1 className="font-bold text-lg text-gray-900">{gathering.title}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
          <span>&#x1f4c5; {new Date(gathering.date).toLocaleDateString('ko-KR')}</span>
          <span>&#x1f4cd; {gathering.location}</span>
          <span>&#x1f465; {gathering.currentParticipants}/{gathering.maxParticipants}명</span>
        </div>
      </div>

      {/* Nickname */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          닉네임 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
          maxLength={20}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
      </div>

      {/* Ratings */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-700">
          항목별 별점 <span className="text-red-400">*</span>
        </h2>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {cat.emoji} {cat.label}
                </span>
                <p className="text-xs text-gray-400">{cat.desc}</p>
              </div>
              {ratings[cat.key] && (
                <span className="text-xs text-amber-500 font-medium">
                  {ratings[cat.key]}/5
                </span>
              )}
            </div>
            <StarRating
              value={ratings[cat.key] || 0}
              onChange={(v) => setRatings({ ...ratings, [cat.key]: v })}
              size="lg"
            />
          </div>
        ))}
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          코멘트 <span className="text-gray-400 text-xs font-normal">(선택)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="솔직한 의견을 남겨주세요 (내용은 절대 노출되지 않습니다)"
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-400">
          &#x1f512; 코멘트 내용은 AI 분석에만 활용되며, 원문은 절대 공개되지 않습니다
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !nickname.trim() || !allRated}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-4 px-6 rounded-2xl transition-colors shadow-sm"
      >
        {submitting ? '제출 중...' : '평가 제출하기'}
      </button>
    </div>
  );
}
