import { NextResponse } from 'next/server';
import { initDb, getSQL, Gathering, checkAndCloseGathering } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

function isValidRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const sql = getSQL();
    const { id } = await params;

    const rows = await sql`SELECT id, title, status, "maxParticipants", deadline FROM gatherings WHERE id = ${id}`;
    const gathering = rows[0] as Gathering | undefined;

    if (!gathering) {
      return NextResponse.json({ error: '평가를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check deadline and auto-close
    await checkAndCloseGathering(sql, gathering);

    if (gathering.status === 'closed') {
      return NextResponse.json({ error: '평가가 이미 종료되었습니다.' }, { status: 400 });
    }

    // Check participant count atomically
    const countResult = await sql`
      SELECT COUNT(*) as count FROM ratings WHERE "gatheringId" = ${id} AND "isComplete" = 1
    `;
    const completeCount = Number(countResult[0].count);

    if (completeCount >= gathering.maxParticipants) {
      await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
      return NextResponse.json({ error: '평가가 이미 종료되었습니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { nickname, foodRating, locationRating, atmosphereRating, membersRating, endTimeRating, comment } = body;

    // Validate nickname
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
    }
    if (nickname.trim().length > 20) {
      return NextResponse.json({ error: '닉네임은 20자 이내로 입력해주세요.' }, { status: 400 });
    }

    // Validate ratings — must be integers 1~5
    const ratingValues = [foodRating, locationRating, atmosphereRating, membersRating, endTimeRating];
    const allRatingsProvided = ratingValues.every(isValidRating);
    const isComplete = allRatingsProvided ? 1 : 0;

    // Validate comment length
    const sanitizedComment = (typeof comment === 'string' && comment.trim().length > 0)
      ? comment.trim().slice(0, 500)
      : null;

    // Use full UUID to prevent collision
    const ratingId = uuidv4();

    // Atomic insert: only insert if participant count is still under the limit
    // This prevents the TOCTOU race condition
    const insertResult = await sql`
      INSERT INTO ratings (id, "gatheringId", nickname, "foodRating", "locationRating", "atmosphereRating", "membersRating", "endTimeRating", comment, "isComplete")
      SELECT ${ratingId}, ${id}, ${nickname.trim()},
             ${foodRating ?? null}, ${locationRating ?? null}, ${atmosphereRating ?? null},
             ${membersRating ?? null}, ${endTimeRating ?? null}, ${sanitizedComment}, ${isComplete}
      WHERE (
        SELECT COUNT(*) FROM ratings WHERE "gatheringId" = ${id} AND "isComplete" = 1
      ) < ${gathering.maxParticipants}
    `;

    // If no row was inserted, the limit was already reached
    if (insertResult.length === 0 && isComplete) {
      await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
      return NextResponse.json({ error: '평가 인원이 초과되었습니다.' }, { status: 400 });
    }

    // Auto-close if participant count reached after this insert
    if (isComplete) {
      const newCountResult = await sql`
        SELECT COUNT(*) as count FROM ratings WHERE "gatheringId" = ${id} AND "isComplete" = 1
      `;
      if (Number(newCountResult[0].count) >= gathering.maxParticipants) {
        await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
      }
    }

    return NextResponse.json({ id: ratingId, isComplete }, { status: 201 });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ error: '평가 제출에 실패했습니다.' }, { status: 500 });
  }
}
