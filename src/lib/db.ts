import { neon } from '@neondatabase/serverless';

export function getSQL() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
  }
  return neon(process.env.DATABASE_URL);
}

// Promise singleton pattern to prevent race condition on concurrent cold starts
let initPromise: Promise<void> | null = null;

export function initDb() {
  if (!initPromise) {
    initPromise = doInit();
  }
  return initPromise;
}

async function doInit() {
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

  // Index for fast lookup by gatheringId (prevents full table scan)
  await sql`
    CREATE INDEX IF NOT EXISTS idx_ratings_gathering_id ON ratings("gatheringId")
  `;

  // AI summary cache columns (serverless-safe, persists across instances)
  await sql`
    ALTER TABLE gatherings
    ADD COLUMN IF NOT EXISTS "aiSummary" TEXT,
    ADD COLUMN IF NOT EXISTS "aiSummaryCount" INTEGER DEFAULT 0
  `;
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
  { key: 'foodRating', label: '음식', emoji: '🍽️', desc: '음식의 맛과 질' },
  { key: 'locationRating', label: '장소', emoji: '📍', desc: '장소의 접근성과 환경' },
  { key: 'atmosphereRating', label: '분위기', emoji: '✨', desc: '전반적인 회식 분위기' },
  { key: 'membersRating', label: '멤버', emoji: '👥', desc: '함께한 사람들과의 시간' },
  { key: 'endTimeRating', label: '종료시간', emoji: '⏰', desc: '적절한 마무리 시간' },
] as const;

export type CategoryKey = typeof CATEGORIES[number]['key'];

/**
 * Check if a gathering should be auto-closed (deadline passed) and update in-place.
 * Shared logic to avoid DRY violation across API routes.
 */
export async function checkAndCloseGathering(
  sql: ReturnType<typeof getSQL>,
  gathering: Gathering
): Promise<void> {
  if (gathering.status === 'active' && gathering.deadline) {
    const now = new Date();
    const deadline = new Date(gathering.deadline);
    if (now > deadline) {
      await sql`UPDATE gatherings SET status = 'closed' WHERE id = ${gathering.id}`;
      gathering.status = 'closed';
    }
  }
}
