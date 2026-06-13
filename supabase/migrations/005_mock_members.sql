-- =========================================================
-- Datos de prueba: miembros del grupo Xtasis
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- Insertar usuarios falsos en auth.users (el trigger crea el perfil automáticamente)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_user_meta_data, role, aud
) VALUES
  -- Vientos
  (gen_random_uuid(), 'carlos.vientos@xtasis.test',  '', now(), now(), now(), '{"full_name": "Carlos Mamani"}',    'authenticated', 'authenticated'),
  (gen_random_uuid(), 'rosa.vientos@xtasis.test',    '', now(), now(), now(), '{"full_name": "Rosa Quispe"}',      'authenticated', 'authenticated'),
  (gen_random_uuid(), 'luis.vientos@xtasis.test',    '', now(), now(), now(), '{"full_name": "Luis Condori"}',     'authenticated', 'authenticated'),
  -- Voces
  (gen_random_uuid(), 'ana.voces@xtasis.test',       '', now(), now(), now(), '{"full_name": "Ana Flores"}',       'authenticated', 'authenticated'),
  (gen_random_uuid(), 'sofia.voces@xtasis.test',     '', now(), now(), now(), '{"full_name": "Sofía Torrez"}',     'authenticated', 'authenticated'),
  -- Bailarines
  (gen_random_uuid(), 'marco.baile@xtasis.test',     '', now(), now(), now(), '{"full_name": "Marco Choque"}',     'authenticated', 'authenticated'),
  (gen_random_uuid(), 'valeria.baile@xtasis.test',   '', now(), now(), now(), '{"full_name": "Valeria Apaza"}',    'authenticated', 'authenticated'),
  (gen_random_uuid(), 'diego.baile@xtasis.test',     '', now(), now(), now(), '{"full_name": "Diego Rojas"}',      'authenticated', 'authenticated'),
  -- Armonía
  (gen_random_uuid(), 'jorge.armonia@xtasis.test',   '', now(), now(), now(), '{"full_name": "Jorge Vargas"}',     'authenticated', 'authenticated'),
  (gen_random_uuid(), 'patricia.armonia@xtasis.test','', now(), now(), now(), '{"full_name": "Patricia Salinas"}', 'authenticated', 'authenticated'),
  -- Percusión
  (gen_random_uuid(), 'miguel.percusion@xtasis.test','', now(), now(), now(), '{"full_name": "Miguel Atahuichi"}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), 'andres.percusion@xtasis.test','', now(), now(), now(), '{"full_name": "Andrés Huanca"}',    'authenticated', 'authenticated'),
  -- Staff
  (gen_random_uuid(), 'gabriela.staff@xtasis.test',  '', now(), now(), now(), '{"full_name": "Gabriela Cruz"}',   'authenticated', 'authenticated'),
  (gen_random_uuid(), 'roberto.staff@xtasis.test',   '', now(), now(), now(), '{"full_name": "Roberto Lima"}',    'authenticated', 'authenticated')
;

-- Actualizar perfiles con sección e instrumento
UPDATE profiles SET section = 'vientos',   instrument = 'Trompeta'        WHERE id IN (SELECT id FROM auth.users WHERE email = 'carlos.vientos@xtasis.test');
UPDATE profiles SET section = 'vientos',   instrument = 'Saxofón'          WHERE id IN (SELECT id FROM auth.users WHERE email = 'rosa.vientos@xtasis.test');
UPDATE profiles SET section = 'vientos',   instrument = 'Trombón'          WHERE id IN (SELECT id FROM auth.users WHERE email = 'luis.vientos@xtasis.test');
UPDATE profiles SET section = 'voces',     instrument = 'Voz principal'    WHERE id IN (SELECT id FROM auth.users WHERE email = 'ana.voces@xtasis.test');
UPDATE profiles SET section = 'voces',     instrument = 'Coros'            WHERE id IN (SELECT id FROM auth.users WHERE email = 'sofia.voces@xtasis.test');
UPDATE profiles SET section = 'bailarines',instrument = 'Bailarín'         WHERE id IN (SELECT id FROM auth.users WHERE email = 'marco.baile@xtasis.test');
UPDATE profiles SET section = 'bailarines',instrument = 'Bailarina'        WHERE id IN (SELECT id FROM auth.users WHERE email = 'valeria.baile@xtasis.test');
UPDATE profiles SET section = 'bailarines',instrument = 'Bailarín'         WHERE id IN (SELECT id FROM auth.users WHERE email = 'diego.baile@xtasis.test');
UPDATE profiles SET section = 'armonia',   instrument = 'Teclado'          WHERE id IN (SELECT id FROM auth.users WHERE email = 'jorge.armonia@xtasis.test');
UPDATE profiles SET section = 'armonia',   instrument = 'Bajo eléctrico'   WHERE id IN (SELECT id FROM auth.users WHERE email = 'patricia.armonia@xtasis.test');
UPDATE profiles SET section = 'percusion', instrument = 'Batería'          WHERE id IN (SELECT id FROM auth.users WHERE email = 'miguel.percusion@xtasis.test');
UPDATE profiles SET section = 'percusion', instrument = 'Congas'           WHERE id IN (SELECT id FROM auth.users WHERE email = 'andres.percusion@xtasis.test');
UPDATE profiles SET section = 'staff',     instrument = 'Producción'       WHERE id IN (SELECT id FROM auth.users WHERE email = 'gabriela.staff@xtasis.test');
UPDATE profiles SET section = 'staff',     instrument = 'Sonido'           WHERE id IN (SELECT id FROM auth.users WHERE email = 'roberto.staff@xtasis.test');
