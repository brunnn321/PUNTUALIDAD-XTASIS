-- Pantalla de bienvenida única en el primer ingreso del miembro
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcomed BOOLEAN NOT NULL DEFAULT true;

-- Los miembros nuevos (creados desde ahora) deben verla una vez:
-- lib/actions/members.ts -> createMember ya pasa welcomed: false al crearlos.

-- El nombre solo puede editarse una vez por el propio miembro
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_edited BOOLEAN NOT NULL DEFAULT false;
