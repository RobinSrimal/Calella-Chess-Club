-- 0005_events.sql
-- Creates member event tables used by the App API Worker.

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description_markdown TEXT NOT NULL,
  location TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deleted')),
  is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  deleted_by TEXT,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (deleted_by) REFERENCES users(id)
);

CREATE INDEX idx_events_author_status
  ON events(author_id, status, starts_at);

CREATE INDEX idx_events_published_starts_at
  ON events(status, starts_at)
  WHERE status = 'published';

CREATE INDEX idx_events_public_starts_at
  ON events(is_public, starts_at)
  WHERE status = 'published' AND is_public = 1;
