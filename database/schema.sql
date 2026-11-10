-- Учебная модель локального архива. Веб-прототип к базе не подключён.
-- В SQLite внешние ключи включаются для каждого соединения отдельно.
PRAGMA foreign_keys = ON;

CREATE TABLE qr_profiles (
  profile_id INTEGER PRIMARY KEY,
  profile_name TEXT NOT NULL UNIQUE CHECK (length(trim(profile_name)) > 0),
  error_correction TEXT NOT NULL CHECK (error_correction IN ('L', 'M', 'Q', 'H')),
  image_format TEXT NOT NULL CHECK (image_format = 'PNG'),
  image_size_px INTEGER NOT NULL CHECK (image_size_px BETWEEN 64 AND 4096),
  quiet_zone_modules INTEGER NOT NULL CHECK (quiet_zone_modules >= 4)
);

CREATE TABLE qr_entries (
  entry_id INTEGER PRIMARY KEY,
  input_kind TEXT NOT NULL CHECK (input_kind IN ('url', 'text')),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0 AND length(CAST(content AS BLOB)) <= 1000),
  profile_id INTEGER NOT NULL REFERENCES qr_profiles(profile_id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE labels (
  label_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(trim(name)) > 0)
);

CREATE TABLE entry_labels (
  entry_id INTEGER NOT NULL REFERENCES qr_entries(entry_id) ON DELETE CASCADE,
  label_id INTEGER NOT NULL REFERENCES labels(label_id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, label_id)
);

CREATE INDEX idx_entries_profile ON qr_entries(profile_id);
CREATE INDEX idx_entries_created_at ON qr_entries(created_at);
CREATE INDEX idx_entry_labels_label ON entry_labels(label_id);
