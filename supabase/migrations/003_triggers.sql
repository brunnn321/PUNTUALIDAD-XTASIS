-- =========================================================
-- Trigger 0: Calcular checkin_opens_at al crear/editar evento
-- =========================================================
CREATE OR REPLACE FUNCTION set_checkin_opens_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.checkin_opens_at := NEW.starts_at - (NEW.checkin_window_min * INTERVAL '1 minute');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_checkin_opens_at
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_checkin_opens_at();

-- =========================================================
-- Trigger 1: Crear perfil automáticamente al registrarse
-- =========================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =========================================================
-- Trigger 2: updated_at automático
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER attendances_updated_at BEFORE UPDATE ON attendances
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Trigger 3: Calcular multa al insertar/actualizar asistencia
-- =========================================================
CREATE OR REPLACE FUNCTION calculate_fine()
RETURNS TRIGGER AS $$
DECLARE
  v_fine_absent DECIMAL(10,2);
  v_fine_late   DECIMAL(10,2);
  v_starts_at   TIMESTAMPTZ;
BEGIN
  -- Obtener datos del evento y tipo
  SELECT e.starts_at, et.fine_absent, et.fine_late
  INTO v_starts_at, v_fine_absent, v_fine_late
  FROM events e
  JOIN event_types et ON et.id = e.event_type_id
  WHERE e.id = NEW.event_id;

  -- Calcular multa según estado
  IF NEW.status = 'present' THEN
    NEW.fine_amount := 0;
  ELSIF NEW.status = 'late' THEN
    NEW.fine_amount := v_fine_late;
  ELSE -- absent
    NEW.fine_amount := v_fine_absent;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_fine_calc
  BEFORE INSERT OR UPDATE ON attendances
  FOR EACH ROW EXECUTE FUNCTION calculate_fine();

-- =========================================================
-- Función: Determinar estado de asistencia según hora
-- Regla: 0 min → present | 1-15 min → late | >15 min → absent
-- =========================================================
CREATE OR REPLACE FUNCTION resolve_attendance_status(
  p_event_id UUID,
  p_checked_in_at TIMESTAMPTZ
)
RETURNS attendance_status AS $$
DECLARE
  v_starts_at TIMESTAMPTZ;
  v_diff_minutes FLOAT;
BEGIN
  SELECT starts_at INTO v_starts_at FROM events WHERE id = p_event_id;

  v_diff_minutes := EXTRACT(EPOCH FROM (p_checked_in_at - v_starts_at)) / 60;

  IF v_diff_minutes <= 0 THEN
    RETURN 'present';
  ELSIF v_diff_minutes <= 15 THEN
    RETURN 'late';
  ELSE
    RETURN 'absent';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- Función: Cerrar evento y marcar ausentes a quienes no marcaron
-- Llamar desde el servidor (Vercel Cron o manualmente)
-- =========================================================
CREATE OR REPLACE FUNCTION close_event(p_event_id UUID)
RETURNS void AS $$
DECLARE
  v_member RECORD;
  v_section section_name[];
BEGIN
  -- Obtener secciones target del evento
  SELECT target_sections INTO v_section FROM events WHERE id = p_event_id;

  -- Marcar como ausente a todos los miembros activos que aplican y no marcaron
  FOR v_member IN
    SELECT p.id
    FROM profiles p
    WHERE p.active = true
      AND p.role = 'member'
      AND (
        v_section IS NULL  -- aplica a todos
        OR p.section = ANY(v_section)
      )
      AND NOT EXISTS (
        SELECT 1 FROM attendances a
        WHERE a.event_id = p_event_id AND a.user_id = p.id
      )
  LOOP
    INSERT INTO attendances (event_id, user_id, status, checked_in_at)
    VALUES (p_event_id, v_member.id, 'absent', NULL);
  END LOOP;

  -- Cambiar estado del evento a cerrado
  UPDATE events SET status = 'closed' WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
