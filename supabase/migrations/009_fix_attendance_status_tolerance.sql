-- Corrección: tolerancia de 1 minuto para marcar "presente"
-- Antes: solo era presente si checked_in_at <= starts_at (exacto)
-- Ahora: es presente si la diferencia es menor a 1 minuto
CREATE OR REPLACE FUNCTION resolve_attendance_status(
  p_event_id UUID,
  p_checked_in_at TIMESTAMPTZ
)
RETURNS attendance_status AS $$
DECLARE
  v_starts_at    TIMESTAMPTZ;
  v_diff_minutes FLOAT;
BEGIN
  SELECT starts_at INTO v_starts_at FROM events WHERE id = p_event_id;

  v_diff_minutes := EXTRACT(EPOCH FROM (p_checked_in_at - v_starts_at)) / 60;

  IF v_diff_minutes < 1 THEN
    RETURN 'present';   -- llegó antes o dentro del primer minuto
  ELSIF v_diff_minutes <= 15 THEN
    RETURN 'late';      -- entre 1 y 15 minutos tarde
  ELSE
    RETURN 'absent';    -- más de 15 minutos
  END IF;
END;
$$ LANGUAGE plpgsql;
