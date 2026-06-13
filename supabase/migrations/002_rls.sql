-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Función auxiliar: saber si el usuario autenticado es director
CREATE OR REPLACE FUNCTION is_director()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'director'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Función auxiliar: sección del usuario autenticado
CREATE OR REPLACE FUNCTION my_section()
RETURNS section_name AS $$
  SELECT section FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ===================== PROFILES =====================
-- Lectura: director ve todos; miembro solo se ve a sí mismo
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (auth.uid() = id OR is_director());

-- Inserción: el trigger de auth lo maneja (service role)
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Actualización: director puede editar cualquiera; miembro solo el suyo
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_director())
  WITH CHECK (auth.uid() = id OR is_director());

-- ===================== EVENT_TYPES =====================
-- Todos pueden leer tipos de evento
CREATE POLICY "event_types_select" ON event_types FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo el director puede crear/modificar
CREATE POLICY "event_types_insert" ON event_types FOR INSERT
  WITH CHECK (is_director());

CREATE POLICY "event_types_update" ON event_types FOR UPDATE
  USING (is_director());

-- ===================== EVENTS =====================
-- Todos los autenticados ven los eventos (el cliente filtra "No aplica")
CREATE POLICY "events_select" ON events FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo el director puede crear/editar/eliminar eventos
CREATE POLICY "events_insert" ON events FOR INSERT
  WITH CHECK (is_director());

CREATE POLICY "events_update" ON events FOR UPDATE
  USING (is_director());

CREATE POLICY "events_delete" ON events FOR DELETE
  USING (is_director());

-- ===================== ATTENDANCES =====================
-- Director ve todas las asistencias
-- Miembro solo ve las suyas
CREATE POLICY "attendances_select" ON attendances FOR SELECT
  USING (user_id = auth.uid() OR is_director());

-- Inserción: el miembro puede registrar su propia asistencia
-- La validación de ventana de tiempo la hacemos en la función/trigger
CREATE POLICY "attendances_insert" ON attendances FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_director());

-- Actualización: solo el director puede editar asistencias
CREATE POLICY "attendances_update" ON attendances FOR UPDATE
  USING (is_director());

-- ===================== PUSH_TOKENS =====================
CREATE POLICY "push_tokens_select" ON push_tokens FOR SELECT
  USING (user_id = auth.uid() OR is_director());

CREATE POLICY "push_tokens_insert" ON push_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_delete" ON push_tokens FOR DELETE
  USING (user_id = auth.uid());
