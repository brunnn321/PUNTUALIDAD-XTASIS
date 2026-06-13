-- =========================================================
-- Datos de prueba: 20 eventos con asistencias (Abril–Junio 2026)
-- Ejecutar en Supabase SQL Editor
-- =========================================================

DO $$
DECLARE
  v_director   UUID;
  v_ensayo     UUID;
  v_presenta   UUID;
  v_viaje      UUID;
  v_medios     UUID;
  v_seccional  UUID;

  -- Vientos
  v_carlos   UUID;
  v_rosa     UUID;
  v_luis     UUID;
  -- Voces
  v_ana      UUID;
  v_sofia    UUID;
  -- Bailarines
  v_marco    UUID;
  v_valeria  UUID;
  v_diego    UUID;
  -- Armonía
  v_jorge    UUID;
  v_patricia UUID;
  -- Percusión
  v_miguel   UUID;
  v_andres   UUID;
  -- Staff
  v_gabriela UUID;
  v_roberto  UUID;

  v_evt UUID;
BEGIN
  -- Cargar IDs
  SELECT id INTO v_director  FROM profiles WHERE role = 'director' LIMIT 1;
  SELECT id INTO v_ensayo    FROM event_types WHERE name = 'Ensayo';
  SELECT id INTO v_presenta  FROM event_types WHERE name = 'Presentación';
  SELECT id INTO v_viaje     FROM event_types WHERE name = 'Viaje';
  SELECT id INTO v_medios    FROM event_types WHERE name = 'Medios';
  SELECT id INTO v_seccional FROM event_types WHERE name = 'Seccional';

  SELECT id INTO v_carlos   FROM auth.users WHERE email = 'carlos.vientos@xtasis.test';
  SELECT id INTO v_rosa     FROM auth.users WHERE email = 'rosa.vientos@xtasis.test';
  SELECT id INTO v_luis     FROM auth.users WHERE email = 'luis.vientos@xtasis.test';
  SELECT id INTO v_ana      FROM auth.users WHERE email = 'ana.voces@xtasis.test';
  SELECT id INTO v_sofia    FROM auth.users WHERE email = 'sofia.voces@xtasis.test';
  SELECT id INTO v_marco    FROM auth.users WHERE email = 'marco.baile@xtasis.test';
  SELECT id INTO v_valeria  FROM auth.users WHERE email = 'valeria.baile@xtasis.test';
  SELECT id INTO v_diego    FROM auth.users WHERE email = 'diego.baile@xtasis.test';
  SELECT id INTO v_jorge    FROM auth.users WHERE email = 'jorge.armonia@xtasis.test';
  SELECT id INTO v_patricia FROM auth.users WHERE email = 'patricia.armonia@xtasis.test';
  SELECT id INTO v_miguel   FROM auth.users WHERE email = 'miguel.percusion@xtasis.test';
  SELECT id INTO v_andres   FROM auth.users WHERE email = 'andres.percusion@xtasis.test';
  SELECT id INTO v_gabriela FROM auth.users WHERE email = 'gabriela.staff@xtasis.test';
  SELECT id INTO v_roberto  FROM auth.users WHERE email = 'roberto.staff@xtasis.test';

  -- -------------------------------------------------------
  -- EVENTO 1: Ensayo General — 5 Abr (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 5 Abril', v_ensayo, NULL, '2026-04-05 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-04-05 14:25:00-04'),
    (v_evt, v_rosa,     'present', '2026-04-05 14:30:00-04'),
    (v_evt, v_luis,     'late',    '2026-04-05 15:08:00-04'),
    (v_evt, v_ana,      'present', '2026-04-05 14:20:00-04'),
    (v_evt, v_sofia,    'present', '2026-04-05 14:45:00-04'),
    (v_evt, v_marco,    'present', '2026-04-05 14:35:00-04'),
    (v_evt, v_valeria,  'absent',  NULL),
    (v_evt, v_diego,    'late',    '2026-04-05 15:12:00-04'),
    (v_evt, v_jorge,    'present', '2026-04-05 14:40:00-04'),
    (v_evt, v_patricia, 'present', '2026-04-05 14:50:00-04'),
    (v_evt, v_miguel,   'present', '2026-04-05 14:15:00-04'),
    (v_evt, v_andres,   'late',    '2026-04-05 15:05:00-04'),
    (v_evt, v_gabriela, 'present', '2026-04-05 14:30:00-04'),
    (v_evt, v_roberto,  'absent',  NULL);

  -- -------------------------------------------------------
  -- EVENTO 2: Seccional Vientos y Armonía — 10 Abr
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Seccional Vientos y Armonía', v_seccional, ARRAY['vientos','armonia']::section_name[], '2026-04-10 18:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-04-10 17:30:00-04'),
    (v_evt, v_rosa,     'present', '2026-04-10 17:45:00-04'),
    (v_evt, v_luis,     'absent',  NULL),
    (v_evt, v_jorge,    'present', '2026-04-10 17:40:00-04'),
    (v_evt, v_patricia, 'late',    '2026-04-10 18:10:00-04');

  -- -------------------------------------------------------
  -- EVENTO 3: Ensayo General — 12 Abr (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 12 Abril', v_ensayo, NULL, '2026-04-12 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-04-12 14:20:00-04'),
    (v_evt, v_rosa,     'late',    '2026-04-12 15:07:00-04'),
    (v_evt, v_luis,     'present', '2026-04-12 14:50:00-04'),
    (v_evt, v_ana,      'present', '2026-04-12 14:15:00-04'),
    (v_evt, v_sofia,    'absent',  NULL),
    (v_evt, v_marco,    'present', '2026-04-12 14:40:00-04'),
    (v_evt, v_valeria,  'present', '2026-04-12 14:55:00-04'),
    (v_evt, v_diego,    'late',    '2026-04-12 15:14:00-04'),
    (v_evt, v_jorge,    'present', '2026-04-12 14:35:00-04'),
    (v_evt, v_patricia, 'absent',  NULL),
    (v_evt, v_miguel,   'present', '2026-04-12 14:10:00-04'),
    (v_evt, v_andres,   'present', '2026-04-12 14:45:00-04'),
    (v_evt, v_gabriela, 'present', '2026-04-12 14:30:00-04'),
    (v_evt, v_roberto,  'late',    '2026-04-12 15:09:00-04');

  -- -------------------------------------------------------
  -- EVENTO 4: Presentación — Feria Municipal — 19 Abr (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Presentación — Feria Municipal', v_presenta, NULL, '2026-04-19 19:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-04-19 18:20:00-04'),
    (v_evt, v_rosa,     'present', '2026-04-19 18:30:00-04'),
    (v_evt, v_luis,     'present', '2026-04-19 18:15:00-04'),
    (v_evt, v_ana,      'present', '2026-04-19 18:10:00-04'),
    (v_evt, v_sofia,    'present', '2026-04-19 18:25:00-04'),
    (v_evt, v_marco,    'present', '2026-04-19 18:05:00-04'),
    (v_evt, v_valeria,  'late',    '2026-04-19 19:06:00-04'),
    (v_evt, v_diego,    'present', '2026-04-19 18:40:00-04'),
    (v_evt, v_jorge,    'present', '2026-04-19 18:35:00-04'),
    (v_evt, v_patricia, 'present', '2026-04-19 18:50:00-04'),
    (v_evt, v_miguel,   'present', '2026-04-19 18:00:00-04'),
    (v_evt, v_andres,   'present', '2026-04-19 18:20:00-04'),
    (v_evt, v_gabriela, 'present', '2026-04-19 18:10:00-04'),
    (v_evt, v_roberto,  'absent',  NULL);

  -- -------------------------------------------------------
  -- EVENTO 5: Medios — Canal 5 Bolivia (vientos, voces)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Medios — Canal 5 Bolivia', v_medios, ARRAY['vientos','voces']::section_name[], '2026-04-24 10:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-04-24 09:15:00-04'),
    (v_evt, v_rosa,     'present', '2026-04-24 09:30:00-04'),
    (v_evt, v_luis,     'late',    '2026-04-24 10:08:00-04'),
    (v_evt, v_ana,      'present', '2026-04-24 09:20:00-04'),
    (v_evt, v_sofia,    'absent',  NULL);

  -- -------------------------------------------------------
  -- EVENTO 6: Ensayo General — 26 Abr (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 26 Abril', v_ensayo, NULL, '2026-04-26 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-04-26 14:30:00-04'),
    (v_evt, v_rosa,     'present', '2026-04-26 14:40:00-04'),
    (v_evt, v_luis,     'present', '2026-04-26 14:50:00-04'),
    (v_evt, v_ana,      'present', '2026-04-26 14:20:00-04'),
    (v_evt, v_sofia,    'late',    '2026-04-26 15:10:00-04'),
    (v_evt, v_marco,    'absent',  NULL),
    (v_evt, v_valeria,  'present', '2026-04-26 14:35:00-04'),
    (v_evt, v_diego,    'late',    '2026-04-26 15:13:00-04'),
    (v_evt, v_jorge,    'present', '2026-04-26 14:45:00-04'),
    (v_evt, v_patricia, 'present', '2026-04-26 14:55:00-04'),
    (v_evt, v_miguel,   'present', '2026-04-26 14:25:00-04'),
    (v_evt, v_andres,   'absent',  NULL),
    (v_evt, v_gabriela, 'present', '2026-04-26 14:40:00-04'),
    (v_evt, v_roberto,  'present', '2026-04-26 14:50:00-04');

  -- -------------------------------------------------------
  -- EVENTO 7: Ensayo General — 3 May (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 3 Mayo', v_ensayo, NULL, '2026-05-03 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-05-03 14:35:00-04'),
    (v_evt, v_rosa,     'absent',  NULL),
    (v_evt, v_luis,     'present', '2026-05-03 14:20:00-04'),
    (v_evt, v_ana,      'present', '2026-05-03 14:10:00-04'),
    (v_evt, v_sofia,    'present', '2026-05-03 14:45:00-04'),
    (v_evt, v_marco,    'present', '2026-05-03 14:30:00-04'),
    (v_evt, v_valeria,  'late',    '2026-05-03 15:11:00-04'),
    (v_evt, v_diego,    'present', '2026-05-03 14:50:00-04'),
    (v_evt, v_jorge,    'present', '2026-05-03 14:40:00-04'),
    (v_evt, v_patricia, 'present', '2026-05-03 14:55:00-04'),
    (v_evt, v_miguel,   'present', '2026-05-03 14:15:00-04'),
    (v_evt, v_andres,   'late',    '2026-05-03 15:07:00-04'),
    (v_evt, v_gabriela, 'absent',  NULL),
    (v_evt, v_roberto,  'present', '2026-05-03 14:30:00-04');

  -- -------------------------------------------------------
  -- EVENTO 8: Seccional Percusión y Armonía — 8 May
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Seccional Percusión y Armonía', v_seccional, ARRAY['percusion','armonia']::section_name[], '2026-05-08 18:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_miguel,   'present', '2026-05-08 17:20:00-04'),
    (v_evt, v_andres,   'present', '2026-05-08 17:40:00-04'),
    (v_evt, v_jorge,    'absent',  NULL),
    (v_evt, v_patricia, 'present', '2026-05-08 17:50:00-04');

  -- -------------------------------------------------------
  -- EVENTO 9: Ensayo General — 10 May (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 10 Mayo', v_ensayo, NULL, '2026-05-10 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-05-10 14:25:00-04'),
    (v_evt, v_rosa,     'present', '2026-05-10 14:35:00-04'),
    (v_evt, v_luis,     'late',    '2026-05-10 15:09:00-04'),
    (v_evt, v_ana,      'present', '2026-05-10 14:15:00-04'),
    (v_evt, v_sofia,    'present', '2026-05-10 14:50:00-04'),
    (v_evt, v_marco,    'present', '2026-05-10 14:40:00-04'),
    (v_evt, v_valeria,  'present', '2026-05-10 14:30:00-04'),
    (v_evt, v_diego,    'absent',  NULL),
    (v_evt, v_jorge,    'present', '2026-05-10 14:45:00-04'),
    (v_evt, v_patricia, 'late',    '2026-05-10 15:12:00-04'),
    (v_evt, v_miguel,   'present', '2026-05-10 14:10:00-04'),
    (v_evt, v_andres,   'present', '2026-05-10 14:55:00-04'),
    (v_evt, v_gabriela, 'present', '2026-05-10 14:20:00-04'),
    (v_evt, v_roberto,  'absent',  NULL);

  -- -------------------------------------------------------
  -- EVENTO 10: Medios — Radio Fides (voces, vientos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Medios — Radio Fides', v_medios, ARRAY['voces','vientos']::section_name[], '2026-05-14 09:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-05-14 08:15:00-04'),
    (v_evt, v_rosa,     'present', '2026-05-14 08:30:00-04'),
    (v_evt, v_luis,     'present', '2026-05-14 08:40:00-04'),
    (v_evt, v_ana,      'present', '2026-05-14 08:10:00-04'),
    (v_evt, v_sofia,    'late',    '2026-05-14 09:05:00-04');

  -- -------------------------------------------------------
  -- EVENTO 11: Viaje — Santa Cruz (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Viaje — Santa Cruz', v_viaje, NULL, '2026-05-16 06:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-05-16 05:20:00-04'),
    (v_evt, v_rosa,     'present', '2026-05-16 05:30:00-04'),
    (v_evt, v_luis,     'present', '2026-05-16 05:15:00-04'),
    (v_evt, v_ana,      'present', '2026-05-16 05:10:00-04'),
    (v_evt, v_sofia,    'present', '2026-05-16 05:25:00-04'),
    (v_evt, v_marco,    'present', '2026-05-16 05:00:00-04'),
    (v_evt, v_valeria,  'absent',  NULL),
    (v_evt, v_diego,    'present', '2026-05-16 05:40:00-04'),
    (v_evt, v_jorge,    'present', '2026-05-16 05:35:00-04'),
    (v_evt, v_patricia, 'present', '2026-05-16 05:50:00-04'),
    (v_evt, v_miguel,   'present', '2026-05-16 05:05:00-04'),
    (v_evt, v_andres,   'late',    '2026-05-16 06:08:00-04'),
    (v_evt, v_gabriela, 'present', '2026-05-16 05:15:00-04'),
    (v_evt, v_roberto,  'present', '2026-05-16 05:45:00-04');

  -- -------------------------------------------------------
  -- EVENTO 12: Ensayo General — 17 May (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 17 Mayo', v_ensayo, NULL, '2026-05-17 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'late',    '2026-05-17 15:06:00-04'),
    (v_evt, v_rosa,     'present', '2026-05-17 14:30:00-04'),
    (v_evt, v_luis,     'present', '2026-05-17 14:50:00-04'),
    (v_evt, v_ana,      'present', '2026-05-17 14:20:00-04'),
    (v_evt, v_sofia,    'present', '2026-05-17 14:40:00-04'),
    (v_evt, v_marco,    'absent',  NULL),
    (v_evt, v_valeria,  'present', '2026-05-17 14:55:00-04'),
    (v_evt, v_diego,    'late',    '2026-05-17 15:11:00-04'),
    (v_evt, v_jorge,    'present', '2026-05-17 14:35:00-04'),
    (v_evt, v_patricia, 'present', '2026-05-17 14:45:00-04'),
    (v_evt, v_miguel,   'present', '2026-05-17 14:15:00-04'),
    (v_evt, v_andres,   'present', '2026-05-17 14:25:00-04'),
    (v_evt, v_gabriela, 'present', '2026-05-17 14:50:00-04'),
    (v_evt, v_roberto,  'absent',  NULL);

  -- -------------------------------------------------------
  -- EVENTO 13: Seccional Bailarines y Voces — 21 May
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Seccional Bailarines y Voces', v_seccional, ARRAY['bailarines','voces']::section_name[], '2026-05-21 18:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_marco,   'present', '2026-05-21 17:25:00-04'),
    (v_evt, v_valeria, 'present', '2026-05-21 17:40:00-04'),
    (v_evt, v_diego,   'late',    '2026-05-21 18:09:00-04'),
    (v_evt, v_ana,     'present', '2026-05-21 17:15:00-04'),
    (v_evt, v_sofia,   'absent',  NULL);

  -- -------------------------------------------------------
  -- EVENTO 14: Presentación — Aniversario Ciudad — 24 May (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Presentación — Aniversario Ciudad', v_presenta, NULL, '2026-05-24 20:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-05-24 19:10:00-04'),
    (v_evt, v_rosa,     'present', '2026-05-24 19:20:00-04'),
    (v_evt, v_luis,     'present', '2026-05-24 19:30:00-04'),
    (v_evt, v_ana,      'present', '2026-05-24 19:05:00-04'),
    (v_evt, v_sofia,    'present', '2026-05-24 19:25:00-04'),
    (v_evt, v_marco,    'present', '2026-05-24 19:00:00-04'),
    (v_evt, v_valeria,  'present', '2026-05-24 19:15:00-04'),
    (v_evt, v_diego,    'present', '2026-05-24 19:40:00-04'),
    (v_evt, v_jorge,    'present', '2026-05-24 19:35:00-04'),
    (v_evt, v_patricia, 'late',    '2026-05-24 20:07:00-04'),
    (v_evt, v_miguel,   'present', '2026-05-24 18:50:00-04'),
    (v_evt, v_andres,   'present', '2026-05-24 19:10:00-04'),
    (v_evt, v_gabriela, 'present', '2026-05-24 19:00:00-04'),
    (v_evt, v_roberto,  'present', '2026-05-24 19:20:00-04');

  -- -------------------------------------------------------
  -- EVENTO 15: Ensayo General — 31 May (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 31 Mayo', v_ensayo, NULL, '2026-05-31 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-05-31 14:30:00-04'),
    (v_evt, v_rosa,     'late',    '2026-05-31 15:13:00-04'),
    (v_evt, v_luis,     'present', '2026-05-31 14:45:00-04'),
    (v_evt, v_ana,      'present', '2026-05-31 14:20:00-04'),
    (v_evt, v_sofia,    'present', '2026-05-31 14:50:00-04'),
    (v_evt, v_marco,    'present', '2026-05-31 14:35:00-04'),
    (v_evt, v_valeria,  'absent',  NULL),
    (v_evt, v_diego,    'present', '2026-05-31 14:55:00-04'),
    (v_evt, v_jorge,    'present', '2026-05-31 14:40:00-04'),
    (v_evt, v_patricia, 'present', '2026-05-31 14:25:00-04'),
    (v_evt, v_miguel,   'present', '2026-05-31 14:10:00-04'),
    (v_evt, v_andres,   'late',    '2026-05-31 15:08:00-04'),
    (v_evt, v_gabriela, 'absent',  NULL),
    (v_evt, v_roberto,  'present', '2026-05-31 14:30:00-04');

  -- -------------------------------------------------------
  -- EVENTO 16: Medios — Radio AM — 4 Jun (voces, vientos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Medios — Radio AM La Paz', v_medios, ARRAY['voces','vientos']::section_name[], '2026-06-04 08:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-06-04 07:10:00-04'),
    (v_evt, v_rosa,     'present', '2026-06-04 07:20:00-04'),
    (v_evt, v_luis,     'absent',  NULL),
    (v_evt, v_ana,      'present', '2026-06-04 07:05:00-04'),
    (v_evt, v_sofia,    'present', '2026-06-04 07:30:00-04');

  -- -------------------------------------------------------
  -- EVENTO 17: Ensayo General — 7 Jun (todos)
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 7 Junio', v_ensayo, NULL, '2026-06-07 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-06-07 14:25:00-04'),
    (v_evt, v_rosa,     'present', '2026-06-07 14:40:00-04'),
    (v_evt, v_luis,     'present', '2026-06-07 14:50:00-04'),
    (v_evt, v_ana,      'present', '2026-06-07 14:15:00-04'),
    (v_evt, v_sofia,    'late',    '2026-06-07 15:09:00-04'),
    (v_evt, v_marco,    'present', '2026-06-07 14:30:00-04'),
    (v_evt, v_valeria,  'present', '2026-06-07 14:55:00-04'),
    (v_evt, v_diego,    'absent',  NULL),
    (v_evt, v_jorge,    'present', '2026-06-07 14:35:00-04'),
    (v_evt, v_patricia, 'present', '2026-06-07 14:45:00-04'),
    (v_evt, v_miguel,   'present', '2026-06-07 14:20:00-04'),
    (v_evt, v_andres,   'present', '2026-06-07 14:50:00-04'),
    (v_evt, v_gabriela, 'present', '2026-06-07 14:40:00-04'),
    (v_evt, v_roberto,  'late',    '2026-06-07 15:11:00-04');

  -- -------------------------------------------------------
  -- EVENTO 18: Seccional Armonía y Percusión — 10 Jun
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Seccional Armonía y Percusión', v_seccional, ARRAY['armonia','percusion']::section_name[], '2026-06-10 18:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_jorge,    'present', '2026-06-10 17:30:00-04'),
    (v_evt, v_patricia, 'late',    '2026-06-10 18:07:00-04'),
    (v_evt, v_miguel,   'present', '2026-06-10 17:20:00-04'),
    (v_evt, v_andres,   'absent',  NULL);

  -- -------------------------------------------------------
  -- EVENTO 19: Ensayo General — 12 Jun (todos) — cerrado
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Ensayo General — 12 Junio', v_ensayo, NULL, '2026-06-12 15:00:00-04', 60, 'closed', v_director)
  RETURNING id INTO v_evt;

  INSERT INTO attendances (event_id, user_id, status, checked_in_at) VALUES
    (v_evt, v_carlos,   'present', '2026-06-12 14:20:00-04'),
    (v_evt, v_rosa,     'present', '2026-06-12 14:35:00-04'),
    (v_evt, v_luis,     'late',    '2026-06-12 15:14:00-04'),
    (v_evt, v_ana,      'present', '2026-06-12 14:10:00-04'),
    (v_evt, v_sofia,    'present', '2026-06-12 14:45:00-04'),
    (v_evt, v_marco,    'present', '2026-06-12 14:30:00-04'),
    (v_evt, v_valeria,  'late',    '2026-06-12 15:06:00-04'),
    (v_evt, v_diego,    'absent',  NULL),
    (v_evt, v_jorge,    'present', '2026-06-12 14:40:00-04'),
    (v_evt, v_patricia, 'present', '2026-06-12 14:50:00-04'),
    (v_evt, v_miguel,   'present', '2026-06-12 14:15:00-04'),
    (v_evt, v_andres,   'present', '2026-06-12 14:25:00-04'),
    (v_evt, v_gabriela, 'present', '2026-06-12 14:30:00-04'),
    (v_evt, v_roberto,  'absent',  NULL);

  -- -------------------------------------------------------
  -- EVENTO 20: Presentación — Festival de Invierno — 28 Jun (todos) — futuro
  -- -------------------------------------------------------
  INSERT INTO events (id, title, event_type_id, target_sections, starts_at, checkin_window_min, status, created_by)
  VALUES (gen_random_uuid(), 'Presentación — Festival de Invierno', v_presenta, NULL, '2026-06-28 19:00:00-04', 60, 'scheduled', v_director);

END;
$$;
