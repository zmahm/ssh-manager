CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 22,
  username TEXT NOT NULL,
  auth_type TEXT NOT NULL,
  encrypted_credential TEXT,
  jump_host_id TEXT,
  port_forwards TEXT DEFAULT '[]',
  env_vars TEXT DEFAULT '{}',
  keepalive_interval INTEGER DEFAULT 10000,
  connection_timeout INTEGER DEFAULT 15000,
  tags TEXT DEFAULT '[]',
  color TEXT DEFAULT '#6366f1',
  last_connected INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
