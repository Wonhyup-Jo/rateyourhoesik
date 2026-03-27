import { NextRequest, NextResponse } from 'next/server';
import { initDb, getSQL } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const sql = getSQL();
    const query = request.nextUrl.searchParams.get('q') || '';

    const gatherings = query
      ? await sql`
          SELECT id, title, date, location, status
          FROM gatherings
          WHERE LOWER(title) LIKE ${'%' + query.toLowerCase() + '%'}
          ORDER BY "createdAt" DESC
          LIMIT 10
        `
      : await sql`
          SELECT id, title, date, location, status
          FROM gatherings
          ORDER BY "createdAt" DESC
          LIMIT 10
        `;

    return NextResponse.json(gatherings);
  } catch (error) {
    console.error('Error searching gatherings:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const sql = getSQL();
    const body = await request.json();
    const { title, date, location, maxParticipants, deadline } = body;

    // --- Server-side input validation ---
    if (!title || !date || !location || !maxParticipants) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // Validate string lengths
    if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100) {
      return NextResponse.json({ error: '제목은 1~100자 이내로 입력해주세요.' }, { status: 400 });
    }
    if (typeof location !== 'string' || location.trim().length === 0 || location.trim().length > 200) {
      return NextResponse.json({ error: '장소는 1~200자 이내로 입력해주세요.' }, { status: 400 });
    }

    // Validate maxParticipants is a positive integer 2~100
    const parsedMax = Number(maxParticipants);
    if (!Number.isInteger(parsedMax) || parsedMax < 2 || parsedMax > 100) {
      return NextResponse.json({ error: '인원수는 2~100 사이의 정수여야 합니다.' }, { status: 400 });
    }

    // Validate date format
    if (typeof date !== 'string' || isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: '올바른 날짜 형식을 입력해주세요.' }, { status: 400 });
    }

    // Validate optional deadline
    const sanitizedDeadline = deadline && typeof deadline === 'string' && !isNaN(new Date(deadline).getTime())
      ? deadline
      : null;

    // Use full UUID to prevent collision (was slice(0,8) = only 32-bit entropy)
    const id = uuidv4();

    await sql`
      INSERT INTO gatherings (id, title, date, location, "maxParticipants", deadline)
      VALUES (${id}, ${title.trim()}, ${date}, ${location.trim()}, ${parsedMax}, ${sanitizedDeadline})
    `;

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error creating gathering:', error);
    return NextResponse.json(
      { error: '평가 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
