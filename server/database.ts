import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sqlite3 from 'sqlite3';
import {open, type Database} from 'sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.resolve(__dirname, '..', 'data', 'app.sqlite');

export type AppDb = Database<sqlite3.Database, sqlite3.Statement>;

export async function openDatabase() {
  const filename = process.env.DATABASE_URL?.replace(/^sqlite:/, '') || defaultDbPath;
  fs.mkdirSync(path.dirname(filename), {recursive: true});
  const db = await open({filename, driver: sqlite3.Database});
  await db.exec('PRAGMA foreign_keys = ON');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS game_states (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK(mode IN ('TOURNAMENT','LEAGUE')),
      slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 3),
      profile_json TEXT NOT NULL,
      teams_json TEXT NOT NULL,
      fixtures_json TEXT NOT NULL,
      tipsters_json TEXT NOT NULL,
      tipster_tickets_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, mode, slot)
    );
    CREATE TABLE IF NOT EXISTS wallet_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK(mode IN ('TOURNAMENT','LEAGUE')),
      slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 3),
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bet_audit (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK(mode IN ('TOURNAMENT','LEAGUE')),
      slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 3),
      ticket_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt).split(':')[1];
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
