import { neon } from '@neondatabase/serverless';

export function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

let initialized = false;

export async function initDb() {
  if (initialized) return;

  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS gatherings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      "maxParticipants" INTEGER NOT NULL,
      deadline TEXT,
      status TEXT DEFAULT 'active',
      "createdAt" TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      "gatheringId" TEXT NOT NULL REFERENCES gatherings(id),
      nickname TEXT NOT NULL,
      "foodRating" INTEGER,
      "locationRating" INTEGER,
      "atmosphereRating" INTEGER,
      "membersRating" INTEGER,
      "endTimeRating" INTEGER,
      comment TEXT,
      "isComplete" INTEGER DEFAULT 0,
      "createdAt" TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  initialized = true;
}

export interface Gathering {
  id: string;
  title: string;
  date: string;
  location: string;
  maxParticipants: number;
  deadline: string | null;
  status: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  gatheringId: string;
  nickname: string;
  foodRating: number | null;
  locationRating: number | null;
  atmosphereRating: number | null;
  membersRating: number | null;
  endTimeRating: number | null;
  comment: string | null;
  isComplete: number;
  createdAt: string;
}

export const CATEGORIES = [
  { key: 'foodRating', label: '음식', emoji: '🍽️' },
  { key: 'locationRating', label: '장소', emoji: '📍' },
  { key: 'atmosphereRating', label: '분위기', emoji: '✨' },
  { key: 'membersRating', label: '멤버', emoji: '👥' },
  { key: 'endTimeRating', label: '종료시간', emoji: '⏰' },
] as const;

export type CategoryKey = typeof CATEGORIES[number]['key'];
