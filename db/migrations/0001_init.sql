-- 0001_init.sql
-- Bloomingdale2 v0.1 — initial schema
-- Ver spec/docs/spec/v0.1-mvp.md sección 6

PRAGMA foreign_keys = ON;

-- ============================================================
-- User: cuentas que pueden iniciar sesión. Independientes de Member
-- (un Member puede o no tener un User asociado).
-- ============================================================
CREATE TABLE IF NOT EXISTS User (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  passwordHash  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  memberId      INTEGER,
  createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_memberId ON User(memberId);

-- ============================================================
-- FamilyGroup: grupo familiar
-- ============================================================
CREATE TABLE IF NOT EXISTS FamilyGroup (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  headMemberId  INTEGER,
  createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (headMemberId) REFERENCES Member(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_familygroup_headMemberId ON FamilyGroup(headMemberId);

-- ============================================================
-- Member: persona miembro de la rama
-- ============================================================
CREATE TABLE IF NOT EXISTS Member (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName           TEXT NOT NULL,
  lastName            TEXT NOT NULL,
  membershipNumber    TEXT,
  familyGroupId       INTEGER,
  createdAt           TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt           TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (familyGroupId) REFERENCES FamilyGroup(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_member_familyGroupId ON Member(familyGroupId);
CREATE INDEX IF NOT EXISTS idx_member_lastName ON Member(lastName);
CREATE INDEX IF NOT EXISTS idx_member_firstName ON Member(firstName);

-- ============================================================
-- Agenda: agenda dominical. Una por domingo.
-- ============================================================
CREATE TABLE IF NOT EXISTS Agenda (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD, debe ser domingo
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  createdBy   INTEGER NOT NULL,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_agenda_date ON Agenda(date);
CREATE INDEX IF NOT EXISTS idx_agenda_status ON Agenda(status);
CREATE INDEX IF NOT EXISTS idx_agenda_createdBy ON Agenda(createdBy);

-- ============================================================
-- AgendaItem: items de la agenda (hymn, speaker, prayer, announcement)
-- ============================================================
CREATE TABLE IF NOT EXISTS AgendaItem (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  agendaId    INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('hymn', 'speaker', 'prayer', 'announcement')),
  "order"     INTEGER NOT NULL DEFAULT 0,
  refId       INTEGER,         -- hymn.number | member.id | event.id | null
  note        TEXT,            -- tema del discurso, texto del anuncio, etc.
  FOREIGN KEY (agendaId) REFERENCES Agenda(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agendaitem_agendaId ON AgendaItem(agendaId);
CREATE INDEX IF NOT EXISTS idx_agendaitem_type ON AgendaItem(type);

-- ============================================================
-- Hymn: himnos en español (1..341)
-- ============================================================
CREATE TABLE IF NOT EXISTS Hymn (
  number    INTEGER PRIMARY KEY,  -- 1..341
  titleEs   TEXT NOT NULL,
  titleEn   TEXT
);

-- ============================================================
-- Event: eventos / actividades de la rama
-- ============================================================
CREATE TABLE IF NOT EXISTS Event (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  description   TEXT,
  eventDate     TEXT NOT NULL,  -- YYYY-MM-DD
  type          TEXT NOT NULL DEFAULT 'actividad' CHECK (type IN ('actividad', 'evento_especial', 'servicio', 'reunion', 'otro')),
  createdBy     INTEGER NOT NULL,
  createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_event_eventDate ON Event(eventDate);
CREATE INDEX IF NOT EXISTS idx_event_type ON Event(type);

-- ============================================================
-- DiscourseLog: registro histórico de discursos
-- ============================================================
CREATE TABLE IF NOT EXISTS DiscourseLog (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  memberId        INTEGER NOT NULL,
  agendaId        INTEGER NOT NULL,
  discourseDate   TEXT NOT NULL,  -- YYYY-MM-DD
  topic           TEXT,
  FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE CASCADE,
  FOREIGN KEY (agendaId) REFERENCES Agenda(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_discourselog_memberId ON DiscourseLog(memberId);
CREATE INDEX IF NOT EXISTS idx_discourselog_agendaId ON DiscourseLog(agendaId);
CREATE INDEX IF NOT EXISTS idx_discourselog_date ON DiscourseLog(discourseDate);

-- ============================================================
-- Tabla de migraciones (control del runner)
-- ============================================================
CREATE TABLE IF NOT EXISTS _migrations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  appliedAt   TEXT NOT NULL DEFAULT (datetime('now'))
);
