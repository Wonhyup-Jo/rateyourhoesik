import { NextResponse } from 'next/server';
import { initDb, getSQL, Gathering } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const sql = getSQL();
    const { id } = await params;

    const rows = await sql`SELECT * FROM gatherings WHERE id = ${id}`;
    const gathering = rows[0] as Gathering | undefined;

    if (!gathering) {
      return NextResponse.json({ error: '평가를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check deadline
    if (gathering.deadline) {
      const now = new Date();
      const deadline = new Date(gathering.deadline);
      if (now > deadline) {
        await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
        return NextResponse.json({ error: '평가 기한이 종료되었습니다.' }, { status: 400 });
      }
    }

    // Check participant count
    const countResult = await sql`
      SELECT COUNT(*) as count FROM ratings WHERE "gatheringId" = ${id} AND "isComplete" = 1
    `;
    const completeCount = Number(countResult[0].count);

    if (gathering.status === 'closed' || completeCount >= gathering.maxParticipants) {
      if (gathering.status !== 'closed') {
        await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
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
    await sql`
      INSERT INTO ratings (id, "gatheringId", nickname, "foodRating", "locationRating", "atmosphereRating", "membersRating", "endTimeRating", comment, "isComplete")
      VALUES (${ratingId}, ${id}, ${nickname}, ${foodRating || null}, ${locationRating || null}, ${atmosphereRating || null}, ${membersRating || null}, ${endTimeRating || null}, ${comment || null}, ${isComplete})
    `;

    // Auto-close if participant count reached
    if (isComplete) {
      const newCount = completeCount + 1;
      if (newCount >= gathering.maxParticipants) {
        await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
      }
    }

    return NextResponse.json({ id: ratingId, isComplete }, { status: 201 });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ error: '평가 제출에 실패했습니다.' }, { status: 500 });
  }
}
