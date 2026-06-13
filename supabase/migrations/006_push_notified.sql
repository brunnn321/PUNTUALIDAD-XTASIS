-- Campo para evitar doble notificación al abrir un evento
ALTER TABLE events ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT false;
