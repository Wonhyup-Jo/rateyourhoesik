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

    if (!title || !date || !location || !maxParticipants) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const id = uuidv4().slice(0, 8);

    await sql`
      INSERT INTO gatherings (id, title, date, location, "maxParticipants", deadline)
      VALUES (${id}, ${title}, ${date}, ${location}, ${maxParticipants}, ${deadline || null})
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
