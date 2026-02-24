'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface GatheringData {
  id: string;
  title: string;
  date: string;
  location: string;
  maxParticipants: number;
  deadline: string | null;
}

export default function CreatedPage() {
  const params = useParams();
  const id = params.id as string;
  const [gathering, setGathering] = useState<GatheringData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/gatherings/${id}`)
      .then(res => res.json())
      .then(data => setGathering(data))
      .catch(() => {});
  }, [id]);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const rateLink = `${getBaseUrl()}/rate/${id}`;
  const resultsLink = `${getBaseUrl()}/results/${id}`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for mobile
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  if (!gathering) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-2">
        <div className="text-3xl">&#10003;</div>
        <h1 className="text-xl font-bold text-green-800">평가가 생성되었습니다!</h1>
        <p className="text-sm text-green-600">아래 링크를 참여자들에게 공유하세요</p>
      </div>

      {/* Gathering Info */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900">{gathering.title}</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex gap-2">
            <span className="text-gray-400">&#x1f4c5;</span>
            <span>{new Date(gathering.date).toLocaleString('ko-KR')}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">&#x1f4cd;</span>
            <span>{gathering.location}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">&#x1f465;</span>
            <span>{gathering.maxParticipants}명</span>
          </div>
          {gathering.deadline && (
            <div className="flex gap-2">
              <span className="text-gray-400">&#x23f0;</span>
              <span>마감: {new Date(gathering.deadline).toLocaleString('ko-KR')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="space-y-4">
        {/* Rate Link */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900">평가 링크</h3>
            <p className="text-xs text-gray-400">참여자들이 별점을 매기는 페이지</p>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={rateLink}
              className="flex-1 px-3 py-2.5 rounded-lg bg-gray-50 text-xs text-gray-600 border border-gray-200"
            />
            <button
              onClick={() => copyToClipboard(rateLink, 'rate')}
              className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                copied === 'rate'
                  ? 'bg-green-500 text-white'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {copied === 'rate' ? '복사됨!' : '복사'}
            </button>
          </div>
        </div>

        {/* Results Link */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900">결과 링크</h3>
            <p className="text-xs text-gray-400">평가 현황 및 결과를 확인하는 페이지</p>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={resultsLink}
              className="flex-1 px-3 py-2.5 rounded-lg bg-gray-50 text-xs text-gray-600 border border-gray-200"
            />
            <button
              onClick={() => copyToClipboard(resultsLink, 'results')}
              className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                copied === 'results'
                  ? 'bg-green-500 text-white'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {copied === 'results' ? '복사됨!' : '복사'}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/rate/${id}`}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 px-4 rounded-xl text-center text-sm transition-colors"
        >
          평가하러 가기
        </Link>
        <Link
          href={`/results/${id}`}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-4 rounded-xl text-center text-sm transition-colors"
        >
          결과 보기
        </Link>
      </div>
    </div>
  );
}
