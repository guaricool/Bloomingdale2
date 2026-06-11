-- 0002_posts.sql
-- Posts / news feed. Used by the public landing page (`/`) and the
-- member dashboard. Posts can be created by admins (announcements from
-- the presidency / bishopric) or by any signed-in member.
--
-- Pinned posts float to the top of the feed and stay there regardless
-- of createdAt ordering. The presidency / bishopric role is signalled
-- by the linked User.role; we don't denormalize it on the row.

CREATE TABLE Post (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  authorId  INTEGER NOT NULL,
  title     TEXT,
  body      TEXT    NOT NULL,
  pinned    INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (authorId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_pinned_created
  ON Post (pinned DESC, createdAt DESC);

CREATE INDEX idx_post_author
  ON Post (authorId);
