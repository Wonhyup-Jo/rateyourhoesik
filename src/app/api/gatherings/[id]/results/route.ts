import { NextResponse } from 'next/server';
import { getDb, Gathering, CATEGORIES } from '@/lib/db';

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

    // Check deadline and auto-close
    if (gathering.status === 'active' && gathering.deadline) {
      const now = new Date();
      const deadline = new Date(gathering.deadline);
      if (now > deadline) {
        db.prepare('UPDATE gatherings SET status = ? WHERE id = ?').run('closed', id);
        gathering.status = 'closed';
      }
    }

    const completeRatings = db.prepare(
      'SELECT * FROM ratings WHERE gatheringId = ? AND isComplete = 1'
    ).all(id) as Array<Record<string, number | string | null>>;

    const totalComplete = completeRatings.length;

    // Calculate averages per category
    const averages: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      if (totalComplete > 0) {
        const sum = completeRatings.reduce((acc, r) => acc + (Number(r[cat.key]) || 0), 0);
        averages[cat.key] = Math.round((sum / totalComplete) * 10) / 10;
      } else {
        averages[cat.key] = 0;
      }
    }

    // Overall average
    const overallAvg = totalComplete > 0
      ? Math.round(
          (Object.values(averages).reduce((a, b) => a + b, 0) / CATEGORIES.length) * 10
        ) / 10
      : 0;

    // Check if max participants reached
    if (gathering.status === 'active' && totalComplete >= gathering.maxParticipants) {
      db.prepare('UPDATE gatherings SET status = ? WHERE id = ?').run('closed', id);
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
