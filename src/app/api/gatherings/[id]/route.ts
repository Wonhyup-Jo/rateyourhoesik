import { NextResponse } from 'next/server';
import { initDb, getSQL, Gathering, checkAndCloseGathering } from '@/lib/db';

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

    // Check deadline and auto-close (shared logic)
    await checkAndCloseGathering(sql, gathering);

    // Single COUNT query (was duplicated before)
    const countResult = await sql`
      SELECT COUNT(*) as count FROM ratings WHERE "gatheringId" = ${id} AND "isComplete" = 1
    `;
    const completeCount = Number(countResult[0].count);

    // Check if max participants reached
    if (gathering.status === 'active' && completeCount >= gathering.maxParticipants) {
      await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
      gathering.status = 'closed';
    }

    return NextResponse.json({
      ...gathering,
      currentParticipants: completeCount,
    });
  } catch (error) {
    console.error('Error fetching gathering:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
