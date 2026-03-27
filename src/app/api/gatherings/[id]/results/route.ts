import { NextResponse } from 'next/server';
import { initDb, getSQL, Gathering, CATEGORIES, checkAndCloseGathering } from '@/lib/db';

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

    // Compute averages in SQL instead of loading all rows into memory
    const avgResult = await sql`
      SELECT
        COUNT(*) as total,
        ROUND(AVG("foodRating")::numeric, 1) as "foodRating",
        ROUND(AVG("locationRating")::numeric, 1) as "locationRating",
        ROUND(AVG("atmosphereRating")::numeric, 1) as "atmosphereRating",
        ROUND(AVG("membersRating")::numeric, 1) as "membersRating",
        ROUND(AVG("endTimeRating")::numeric, 1) as "endTimeRating"
      FROM ratings
      WHERE "gatheringId" = ${id} AND "isComplete" = 1
    `;

    const row = avgResult[0];
    const totalComplete = Number(row.total);

    const averages: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      averages[cat.key] = Number(row[cat.key]) || 0;
    }

    const overallAvg = totalComplete > 0
      ? Math.round(
          (Object.values(averages).reduce((a, b) => a + b, 0) / CATEGORIES.length) * 10
        ) / 10
      : 0;

    // Check if max participants reached
    if (gathering.status === 'active' && totalComplete >= gathering.maxParticipants) {
      await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${id}`;
      gathering.status = 'closed';
    }

    return NextResponse.json({
      gathering: {
        ...gathering,
        currentParticipants: totalComplete,
      },
      averages,
      overallAverage: overallAvg,
      totalRatings: totalComplete,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
