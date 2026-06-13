-- Un miembro solo puede tener un registro de asistencia por evento
ALTER TABLE attendances
  ADD CONSTRAINT attendances_event_user_unique UNIQUE (event_id, user_id);
