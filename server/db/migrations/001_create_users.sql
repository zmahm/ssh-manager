CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
