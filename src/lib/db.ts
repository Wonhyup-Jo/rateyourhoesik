import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'hoesik.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS gatherings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        maxParticipants INTEGER NOT NULL,
        deadline TEXT,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        gatheringId TEXT NOT NULL,
        nickname TEXT NOT NULL,
        foodRating INTEGER,
        locationRating INTEGER,
        atmosphereRating INTEGER,
        membersRating INTEGER,
        endTimeRating INTEGER,
        comment TEXT,
        isComplete INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (gatheringId) REFERENCES gatherings(id)
      );
    `);
  }
  return db;
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
