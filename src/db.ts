import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface ProfileRow {
  id: number;
  label: string;
  discord_channel_id: string;
  titres: string;
  keywords: string;
  rome_codes: string | null;
  appellations: string | null;
  communes: string | null;
  departements: string | null;
  regions: string | null;
  rayon_km: number | null;
  teletravail: number | null;
  type_contrat: string | null;
  enabled: number;
  created_at: string;
}

export function openDb(path = "data/jobscout.db"): Database.Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
CREATE TABLE IF NOT EXISTS profiles (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  label              TEXT    NOT NULL,
  discord_channel_id TEXT    NOT NULL,
  titres             TEXT    NOT NULL,
  keywords           TEXT    NOT NULL,
  rome_codes         TEXT,
  appellations       TEXT,
  communes           TEXT,
  departements       TEXT,
  regions            TEXT,
  rayon_km           INTEGER,
  teletravail        INTEGER,
  type_contrat       TEXT,
  enabled            INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seen_offers (
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_id   TEXT    NOT NULL,
  posted_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, offer_id)
);

CREATE INDEX IF NOT EXISTS idx_seen_posted_at  ON seen_offers(posted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_enabled ON profiles(enabled);
`);
}

export function listEnabledProfiles(db: Database.Database): ProfileRow[] {
  return db.prepare("SELECT * FROM profiles WHERE enabled = 1").all() as ProfileRow[];
}

export function listProfiles(db: Database.Database): ProfileRow[] {
  return db.prepare("SELECT * FROM profiles").all() as ProfileRow[];
}

export function getProfile(db: Database.Database, id: number): ProfileRow | undefined {
  return db.prepare("SELECT * FROM profiles WHERE id = ?").get(id) as ProfileRow | undefined;
}

export function hasSeen(db: Database.Database, profileId: number, offerId: string): boolean {
  return !!db.prepare("SELECT 1 FROM seen_offers WHERE profile_id = ? AND offer_id = ?")
    .get(profileId, offerId);
}

export function markSeen(db: Database.Database, profileId: number, offerId: string): void {
  db.prepare("INSERT OR IGNORE INTO seen_offers (profile_id, offer_id) VALUES (?, ?)")
    .run(profileId, offerId);
}

export function purgeSeen(db: Database.Database, retentionDays: number): number {
  const res = db.prepare(
    "DELETE FROM seen_offers WHERE posted_at < datetime('now', ?)"
  ).run(`-${retentionDays} days`);
  return res.changes;
}
