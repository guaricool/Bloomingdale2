-- db/schema.sql
-- Snapshot of the current database schema.
-- Generated automatically by scripts/db-migrate.ts.
-- DO NOT EDIT BY HAND — edit db/migrations/*.sql and run `npm run db:migrate`.
-- Generated at: 2026-06-11T12:55:18.319Z

PRAGMA foreign_keys = ON;

CREATE TABLE Agenda (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD, debe ser domingo
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  createdBy   INTEGER NOT NULL,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE RESTRICT
);

CREATE TABLE AgendaItem (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  agendaId    INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('hymn', 'speaker', 'prayer', 'announcement')),
  "order"     INTEGER NOT NULL DEFAULT 0,
  refId       INTEGER,         -- hymn.number | member.id | event.id | null
  note        TEXT,            -- tema del discurso, texto del anuncio, etc.
  FOREIGN KEY (agendaId) REFERENCES Agenda(id) ON DELETE CASCADE
);

CREATE TABLE DiscourseLog (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  memberId        INTEGER NOT NULL,
  agendaId        INTEGER NOT NULL,
  discourseDate   TEXT NOT NULL,  -- YYYY-MM-DD
  topic           TEXT,
  FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE CASCADE,
  FOREIGN KEY (agendaId) REFERENCES Agenda(id) ON DELETE CASCADE
);

CREATE TABLE Event (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  description   TEXT,
  eventDate     TEXT NOT NULL,  -- YYYY-MM-DD
  type          TEXT NOT NULL DEFAULT 'actividad' CHECK (type IN ('actividad', 'evento_especial', 'servicio', 'reunion', 'otro')),
  createdBy     INTEGER NOT NULL,
  createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE RESTRICT
);

CREATE TABLE FamilyGroup (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  headMemberId  INTEGER,
  createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (headMemberId) REFERENCES Member(id) ON DELETE SET NULL
);

CREATE TABLE Hymn (
  number    INTEGER PRIMARY KEY,  -- 1..341
  titleEs   TEXT NOT NULL,
  titleEn   TEXT
);

CREATE TABLE Member (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName           TEXT NOT NULL,
  lastName            TEXT NOT NULL,
  membershipNumber    TEXT,
  familyGroupId       INTEGER,
  createdAt           TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt           TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (familyGroupId) REFERENCES FamilyGroup(id) ON DELETE SET NULL
);

CREATE TABLE User (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  passwordHash  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  memberId      INTEGER,
  createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE SET NULL
);

CREATE TABLE _migrations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

CREATE INDEX idx_agenda_createdBy ON Agenda(createdBy);

CREATE INDEX idx_agenda_date ON Agenda(date);

CREATE INDEX idx_agenda_status ON Agenda(status);

CREATE INDEX idx_agendaitem_agendaId ON AgendaItem(agendaId);

CREATE INDEX idx_agendaitem_type ON AgendaItem(type);

CREATE INDEX idx_discourselog_agendaId ON DiscourseLog(agendaId);

CREATE INDEX idx_discourselog_date ON DiscourseLog(discourseDate);

CREATE INDEX idx_discourselog_memberId ON DiscourseLog(memberId);

CREATE INDEX idx_event_eventDate ON Event(eventDate);

CREATE INDEX idx_event_type ON Event(type);

CREATE INDEX idx_familygroup_headMemberId ON FamilyGroup(headMemberId);

CREATE INDEX idx_member_familyGroupId ON Member(familyGroupId);

CREATE INDEX idx_member_firstName ON Member(firstName);

CREATE INDEX idx_member_lastName ON Member(lastName);

CREATE INDEX idx_user_email ON User(email);

CREATE INDEX idx_user_memberId ON User(memberId);
