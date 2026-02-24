import { NextResponse } from 'next/server';
import { getDb, Gathering } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const gathering = db.prepare('SELECT * FROM gatherings WHERE id = ?').get(id) as Gathering | undefined;

    if (!gathering) {
      return NextResponse.json({ error: '평가를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check if deadline has passed and update status
    if (gathering.status === 'active' && gathering.deadline) {
      const now = new Date();
      const deadline = new Date(gathering.deadline);
      if (now > deadline) {
        db.prepare('UPDATE gatherings SET status = ? WHERE id = ?').run('closed', id);
        gathering.status = 'closed';
      }
    }

    // Check if max participants reached (only count complete ratings)
    if (gathering.status === 'active') {
      const completeCount = db.prepare(
        'SELECT COUNT(*) as count FROM ratings WHERE gatheringId = ? AND isComplete = 1'
      ).get(id) as { count: number };

      if (completeCount.count >= gathering.maxParticipants) {
        db.prepare('UPDATE gatherings SET status = ? WHERE id = ?').run('closed', id);
        gathering.status = 'closed';
      }
    }

    const ratingCount = db.prepare(
      'SELECT COUNT(*) as count FROM ratings WHERE gatheringId = ? AND isComplete = 1'
    ).get(id) as { count: number };

    return NextResponse.json({
      ...gathering,
      currentParticipants: ratingCount.count,
    });
  } catch (error) {
    console.error('Error fetching gathering:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
