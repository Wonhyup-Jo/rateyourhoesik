import { NextResponse } from 'next/server';
import { initDb, getSQL, Gathering } from '@/lib/db';

export async function GET(
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

    // Check if deadline has passed and update status
    if (gathering.status === 'active' && gathering.deadline) {
      const now = new Date();
      const deadline = new Date(gathering.deadline);
      if (now > deadline) {
        await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
        gathering.status = 'closed';
      }
    }

    // Check if max participants reached (only count complete ratings)
    if (gathering.status === 'active') {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM ratings WHERE "gatheringId" = ${id} AND "isComplete" = 1
      `;
      const completeCount = Number(countResult[0].count);

      if (completeCount >= gathering.maxParticipants) {
        await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
        gathering.status = 'closed';
      }
    }

    const countResult = await sql`
      SELECT COUNT(*) as count FROM ratings WHERE "gatheringId" = ${id} AND "isComplete" = 1
    `;

    return NextResponse.json({
      ...gathering,
      currentParticipants: Number(countResult[0].count),
    });
  } catch (error) {
    console.error('Error fetching gathering:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
