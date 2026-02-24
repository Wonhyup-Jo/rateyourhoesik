'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    maxParticipants: '',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/gatherings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxParticipants: parseInt(form.maxParticipants),
          deadline: form.deadline || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '생성에 실패했습니다.');
        return;
      }

      const { id } = await res.json();
      router.push(`/created/${id}`);
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">새 평가 만들기</h1>
        <p className="text-sm text-gray-500 mt-1">회식 정보를 입력하고 평가를 시작하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            회식 주제 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="예: 2월 팀 회식"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            회식 날짜/시간 <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            회식 장소 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="예: 강남역 근처 고기집"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        {/* Max Participants */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            인원수 <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            required
            min="2"
            max="100"
            value={form.maxParticipants}
            onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
            placeholder="참여 인원 수"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <p className="text-xs text-gray-400">설정된 인원 수만큼 평가가 완료되면 자동으로 종료됩니다</p>
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            평가 기한 <span className="text-gray-400 text-xs font-normal">(선택)</span>
          </label>
          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <p className="text-xs text-gray-400">기한이 지나면 자동으로 평가가 종료됩니다</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-4 px-6 rounded-2xl transition-colors shadow-sm"
        >
          {loading ? '생성 중...' : '평가 생성하기'}
        </button>
      </form>
    </div>
  );
}
