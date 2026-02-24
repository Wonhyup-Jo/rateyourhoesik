import { NextResponse } from 'next/server';
import { getDb, Gathering, Rating } from '@/lib/db';

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

    const ratings = db.prepare(
      'SELECT comment FROM ratings WHERE gatheringId = ? AND isComplete = 1 AND comment IS NOT NULL AND comment != ?'
    ).all(id, '') as Array<{ comment: string }>;

    if (ratings.length === 0) {
      return NextResponse.json({
        summary: '아직 코멘트가 없어 분석할 내용이 없습니다.',
      });
    }

    const comments = ratings.map(r => r.comment);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: simple summary without AI
      return NextResponse.json({
        summary: `총 ${comments.length}개의 코멘트가 접수되었습니다. AI 분석을 위해 API 키를 설정해주세요.`,
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `다음은 회식 "${gathering.title}" (장소: ${gathering.location})에 대한 익명 참여자들의 코멘트입니다. 개별 코멘트 내용을 절대 직접 인용하지 말고, 전체적인 분위기와 느낌만 한두 줄로 요약해주세요. 특정 개인을 식별할 수 있는 내용은 제외해주세요.

코멘트들:
${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}

요약:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        summary: `총 ${comments.length}개의 코멘트가 접수되었습니다.`,
      });
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text || '분석 결과를 가져올 수 없습니다.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return NextResponse.json({
      summary: 'AI 요약 생성 중 오류가 발생했습니다.',
    });
  }
}
