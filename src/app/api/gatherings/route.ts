import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, date, location, maxParticipants, deadline } = body;

    if (!title || !date || !location || !maxParticipants) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO gatherings (id, title, date, location, maxParticipants, deadline)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, date, location, maxParticipants, deadline || null);

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error creating gathering:', error);
    return NextResponse.json(
      { error: '평가 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
