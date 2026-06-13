-- Tipos enumerados
CREATE TYPE user_role AS ENUM ('director', 'member');
CREATE TYPE section_name AS ENUM ('vientos', 'voces', 'bailarines', 'armonia', 'percusion', 'staff');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent');
CREATE TYPE event_status AS ENUM ('scheduled', 'open', 'closed');

-- Perfiles de usuario (extiende auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  photo_url   TEXT,
  role        user_role NOT NULL DEFAULT 'member',
  section     section_name,
  instrument  TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tipos de evento con configuración de multas
CREATE TABLE event_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  fine_absent DECIMAL(10,2) NOT NULL DEFAULT 0,
  fine_late   DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Datos iniciales de tipos de evento
INSERT INTO event_types (name, fine_absent, fine_late) VALUES
  ('Ensayo',        10000, 5000),
  ('Presentación',  50000, 25000),
  ('Viaje',         30000, 15000),
  ('Medios',        20000, 10000),
  ('Seccional',     10000, 5000);

-- Eventos
CREATE TABLE events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  event_type_id       UUID NOT NULL REFERENCES event_types(id),
  target_sections     section_name[], -- NULL = aplica a todos
  starts_at           TIMESTAMPTZ NOT NULL,
  checkin_window_min  INT NOT NULL DEFAULT 60, -- minutos antes que abre el check-in
  checkin_opens_at    TIMESTAMPTZ, -- se calcula con trigger al insertar/actualizar
  status              event_status NOT NULL DEFAULT 'scheduled',
  notes               TEXT,
  created_by          UUID NOT NULL REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asistencias
CREATE TABLE attendances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        attendance_status NOT NULL,
  checked_in_at TIMESTAMPTZ,
  fine_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
  edited_by     UUID REFERENCES profiles(id), -- si el director la editó
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Tokens de notificación push
CREATE TABLE push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de rendimiento
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_attendances_event_id ON attendances(event_id);
CREATE INDEX idx_attendances_user_id ON attendances(user_id);
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
