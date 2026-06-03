-- 0006_posts_body_json.sql
-- Replaces post Markdown text storage with restricted JSON document storage.

PRAGMA foreign_keys = off;

CREATE TABLE posts_new (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body_json TEXT NOT NULL,
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

DROP TABLE posts;

ALTER TABLE posts_new RENAME TO posts;

PRAGMA foreign_keys = on;

CREATE INDEX idx_posts_author_status
  ON posts(author_id, status, created_at);

CREATE INDEX idx_posts_published
  ON posts(status, published_at)
  WHERE status = 'published';

CREATE INDEX idx_posts_public
  ON posts(is_public, published_at)
  WHERE status = 'published' AND is_public = 1;
