-- Bloomingdale2 v0.1 — Postgres schema for Supabase (clean re-run with Case-Sensitivity)
-- https://supabase.com/dashboard/project/xamdjvwhzxkgnwuhskhe/sql/new
-- Safe to re-run: drops everything first, then recreates from scratch.

-- Drop indexes first to avoid naming conflicts
DROP INDEX IF EXISTS idx_familygroup_headMemberId;
DROP INDEX IF EXISTS idx_member_familyGroupId;
DROP INDEX IF EXISTS idx_member_lastName;
DROP INDEX IF EXISTS idx_member_firstName;
DROP INDEX IF EXISTS idx_user_email;
DROP INDEX IF EXISTS idx_user_memberId;
DROP INDEX IF EXISTS idx_agenda_date;
DROP INDEX IF EXISTS idx_agenda_status;
DROP INDEX IF EXISTS idx_agenda_createdBy;
DROP INDEX IF EXISTS idx_agendaitem_agendaId;
DROP INDEX IF EXISTS idx_agendaitem_type;
DROP INDEX IF EXISTS idx_event_eventDate;
DROP INDEX IF EXISTS idx_event_type;
DROP INDEX IF EXISTS idx_discourselog_memberId;
DROP INDEX IF EXISTS idx_discourselog_agendaId;
DROP INDEX IF EXISTS idx_discourselog_date;
DROP INDEX IF EXISTS idx_post_pinned_created;
DROP INDEX IF EXISTS idx_post_author;

-- Drop in dependency order (children first because of FKs)
DROP TABLE IF EXISTS "Post" CASCADE;
DROP TABLE IF EXISTS "DiscourseLog" CASCADE;
DROP TABLE IF EXISTS "AgendaItem" CASCADE;
DROP TABLE IF EXISTS "Agenda" CASCADE;
DROP TABLE IF EXISTS "Event" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Member" CASCADE;
DROP TABLE IF EXISTS "FamilyGroup" CASCADE;
DROP TABLE IF EXISTS "Hymn" CASCADE;

-- ============================================================
-- FamilyGroup (created first since Member references it)
-- ============================================================
CREATE TABLE "FamilyGroup" (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL,
  "headMemberId"  INTEGER,
  "createdAt"     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_familygroup_headMemberId ON "FamilyGroup"("headMemberId");

-- ============================================================
-- Member
-- ============================================================
CREATE TABLE "Member" (
  id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "firstName"           TEXT NOT NULL,
  "middleName"          TEXT,
  "lastName"            TEXT NOT NULL,
  "membershipNumber"    TEXT,
  "familyGroupId"       INTEGER,
  "createdAt"           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_member_familyGroupId ON "Member"("familyGroupId");
CREATE INDEX idx_member_lastName ON "Member"("lastName");
CREATE INDEX idx_member_firstName ON "Member"("firstName");

-- ============================================================
-- User
-- ============================================================
CREATE TABLE "User" (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  "passwordHash"  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  "memberId"      INTEGER,
  "createdAt"     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_memberId ON "User"("memberId");

-- ============================================================
-- Agenda
-- ============================================================
CREATE TABLE "Agenda" (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  "createdBy"   INTEGER NOT NULL,
  "createdAt"   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_agenda_date ON "Agenda"(date);
CREATE INDEX idx_agenda_status ON "Agenda"(status);
CREATE INDEX idx_agenda_createdBy ON "Agenda"("createdBy");

-- ============================================================
-- AgendaItem
-- ============================================================
CREATE TABLE "AgendaItem" (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "agendaId"    INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('hymn', 'speaker', 'prayer', 'announcement')),
  "order"     INTEGER NOT NULL DEFAULT 0,
  "refId"       INTEGER,
  note        TEXT
);
CREATE INDEX idx_agendaitem_agendaId ON "AgendaItem"("agendaId");
CREATE INDEX idx_agendaitem_type ON "AgendaItem"(type);

-- ============================================================
-- Hymn
-- ============================================================
CREATE TABLE "Hymn" (
  number    INTEGER PRIMARY KEY,
  "titleEs"   TEXT NOT NULL,
  "titleEn"   TEXT
);

-- ============================================================
-- Event
-- ============================================================
CREATE TABLE "Event" (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  "eventDate"     TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'actividad' CHECK (type IN ('actividad', 'evento_especial', 'servicio', 'reunion', 'otro')),
  "createdBy"     INTEGER NOT NULL,
  "createdAt"     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_event_eventDate ON "Event"("eventDate");
CREATE INDEX idx_event_type ON "Event"(type);

-- ============================================================
-- DiscourseLog
-- ============================================================
CREATE TABLE "DiscourseLog" (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "memberId"        INTEGER NOT NULL,
  "agendaId"        INTEGER NOT NULL,
  "discourseDate"   TEXT NOT NULL,
  topic           TEXT
);
CREATE INDEX idx_discourselog_memberId ON "DiscourseLog"("memberId");
CREATE INDEX idx_discourselog_agendaId ON "DiscourseLog"("agendaId");
CREATE INDEX idx_discourselog_date ON "DiscourseLog"("discourseDate");

-- ============================================================
-- Post
-- ============================================================
CREATE TABLE "Post" (
  id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "authorId"  INTEGER NOT NULL,
  title     TEXT,
  body      TEXT NOT NULL,
  pinned    INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_post_pinned_created ON "Post" (pinned DESC, "createdAt" DESC);
CREATE INDEX idx_post_author ON "Post" ("authorId");

-- ============================================================
-- Foreign keys (added last so referenced tables exist)
-- ============================================================
ALTER TABLE "FamilyGroup"
  ADD CONSTRAINT familygroup_head_fk
  FOREIGN KEY ("headMemberId") REFERENCES "Member"(id) ON DELETE SET NULL;

ALTER TABLE "Member"
  ADD CONSTRAINT member_familygroup_fk
  FOREIGN KEY ("familyGroupId") REFERENCES "FamilyGroup"(id) ON DELETE SET NULL;

ALTER TABLE "User"
  ADD CONSTRAINT user_member_fk
  FOREIGN KEY ("memberId") REFERENCES "Member"(id) ON DELETE SET NULL;

ALTER TABLE "Agenda"
  ADD CONSTRAINT agenda_user_fk
  FOREIGN KEY ("createdBy") REFERENCES "User"(id) ON DELETE RESTRICT;

ALTER TABLE "AgendaItem"
  ADD CONSTRAINT agendaitem_agenda_fk
  FOREIGN KEY ("agendaId") REFERENCES "Agenda"(id) ON DELETE CASCADE;

ALTER TABLE "Event"
  ADD CONSTRAINT event_user_fk
  FOREIGN KEY ("createdBy") REFERENCES "User"(id) ON DELETE RESTRICT;

ALTER TABLE "DiscourseLog"
  ADD CONSTRAINT discourselog_member_fk
  FOREIGN KEY ("memberId") REFERENCES "Member"(id) ON DELETE CASCADE;

ALTER TABLE "DiscourseLog"
  ADD CONSTRAINT discourselog_agenda_fk
  FOREIGN KEY ("agendaId") REFERENCES "Agenda"(id) ON DELETE CASCADE;

ALTER TABLE "Post"
  ADD CONSTRAINT post_user_fk
  FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE;
