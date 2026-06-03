-- 0003_auth_sessions.sql
-- Creates login and refresh-token tables used by AuthApi.

CREATE TABLE refresh_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  replaced_by TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (replaced_by) REFERENCES refresh_sessions(id)
);

CREATE INDEX idx_refresh_sessions_user_active
  ON refresh_sessions(user_id, expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX idx_refresh_sessions_token_hash ON refresh_sessions(token_hash);

CREATE TABLE login_attempts (
  id TEXT PRIMARY KEY,
  username_or_email TEXT NOT NULL,
  username_or_email_normalized TEXT NOT NULL,
  success INTEGER NOT NULL CHECK (success IN (0, 1)),
  failure_code TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_login_attempts_normalized_created_at
  ON login_attempts(username_or_email_normalized, created_at);
