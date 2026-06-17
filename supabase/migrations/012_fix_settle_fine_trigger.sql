-- Fix: el trigger calculate_fine no debe recalcular cuando solo cambia fine_amount (saldar multa).
-- Solo recalcula en INSERT o cuando el status cambia en UPDATE.
CREATE OR REPLACE FUNCTION calculate_fine()
RETURNS TRIGGER AS $$
DECLARE
  v_fine_absent DECIMAL(10,2);
  v_fine_late   DECIMAL(10,2);
  v_starts_at   TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT e.starts_at, et.fine_absent, et.fine_late
  INTO v_starts_at, v_fine_absent, v_fine_late
  FROM events e
  JOIN event_types et ON et.id = e.event_type_id
  WHERE e.id = NEW.event_id;

  IF NEW.status = 'present' THEN
    NEW.fine_amount := 0;
  ELSIF NEW.status = 'late' THEN
    NEW.fine_amount := v_fine_late;
  ELSE
    NEW.fine_amount := v_fine_absent;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
