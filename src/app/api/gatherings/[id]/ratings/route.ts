import { NextResponse } from 'next/server';
import { getDb, Gathering } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
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

    // Check deadline
    if (gathering.deadline) {
      const now = new Date();
      const deadline = new Date(gathering.deadline);
      if (now > deadline) {
        db.prepare('UPDATE gatherings SET status = ? WHERE id = ?').run('closed', id);
        return NextResponse.json({ error: '평가 기한이 종료되었습니다.' }, { status: 400 });
      }
    }

    // Check participant count
    const completeCount = db.prepare(
      'SELECT COUNT(*) as count FROM ratings WHERE gatheringId = ? AND isComplete = 1'
    ).get(id) as { count: number };

    if (gathering.status === 'closed' || completeCount.count >= gathering.maxParticipants) {
      if (gathering.status !== 'closed') {
        db.prepare('UPDATE gatherings SET status = ? WHERE id = ?').run('closed', id);
      }
      return NextResponse.json({ error: '평가가 이미 종료되었습니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { nickname, foodRating, locationRating, atmosphereRating, membersRating, endTimeRating, comment } = body;

    if (!nickname) {
      return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
    }

    // Check if all ratings are provided
    const allRatingsProvided = [foodRating, locationRating, atmosphereRating, membersRating, endTimeRating]
      .every(r => r !== null && r !== undefined && r >= 1 && r <= 5);

    const isComplete = allRatingsProvided ? 1 : 0;

    const ratingId = uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO ratings (id, gatheringId, nickname, foodRating, locationRating, atmosphereRating, membersRating, endTimeRating, comment, isComplete)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ratingId, id, nickname,
      foodRating || null, locationRating || null, atmosphereRating || null,
      membersRating || null, endTimeRating || null,
      comment || null, isComplete
    );

    // Auto-close if participant count reached
    if (isComplete) {
      const newCount = completeCount.count + 1;
      if (newCount >= gathering.maxParticipants) {
        db.prepare('UPDATE gatherings SET status = ? WHERE id = ?').run('closed', id);
      }
    }

    return NextResponse.json({ id: ratingId, isComplete }, { status: 201 });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ error: '평가 제출에 실패했습니다.' }, { status: 500 });
  }
}
