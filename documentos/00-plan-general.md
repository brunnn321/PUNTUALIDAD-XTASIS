# Plan General — App de Asistencia Xtasis

## Contexto del proyecto

El director de un grupo de cumbia de 20-22 miembros necesita una app web **mobile-first** para registrar la asistencia a ensayos, presentaciones, viajes, seccionales y otros eventos. Cada miembro marca su propia asistencia desde el celular dentro de una ventana de tiempo. El sistema calcula multas automáticamente y el director accede a reportes completos.

---

## Stack tecnológico

| Capa | Tecnología | Razón |
|---|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind CSS 4 | PWA mobile-first, routing por roles |
| Backend / BaaS | Supabase | Auth Google, DB PostgreSQL, RLS por filas |
| Autenticación | Google OAuth via Supabase Auth | Login sin contraseñas |
| Hosting | Vercel | Deploy gratuito, Cron jobs integrados |
| Notificaciones push | Web Push API + librería `web-push` | Sin costo, funciona con PWA |
| Email fallback | Resend | Tier gratuito 3.000 emails/mes |

---

## Modelo de datos (resumen)

### Enums (tipos fijos)
- `user_role`: `director` | `member`
- `section_name`: `vientos` | `voces` | `bailarines` | `armonia` | `percusion` | `staff`
- `attendance_status`: `present` | `late` | `absent`
- `event_status`: `scheduled` | `open` | `closed`

### Tablas principales
- **`profiles`** — datos de cada usuario (nombre, foto, sección, instrumento, rol)
- **`event_types`** — tipos de evento con sus montos de multa configurables
- **`events`** — eventos con fecha, tipo, secciones target y ventana de check-in
- **`attendances`** — registro de asistencia por usuario y evento, incluye monto de multa
- **`push_tokens`** — tokens de notificación push por usuario

---

## Lógica de asistencia

| Momento del check-in | Estado registrado | Multa |
|---|---|---|
| Antes de la hora de inicio | `present` (Presente) | Sin multa |
| 1 a 15 minutos tarde | `late` (Tardanza) | Multa por tardanza |
| Más de 15 minutos tarde | `absent` (Falta) | Multa por falta |
| No marcó (al cerrar evento) | `absent` (Falta automática) | Multa por falta |

---

## Roles y permisos

| Acción | Director | Miembro |
|---|---|---|
| Ver todos los perfiles | ✅ | ❌ |
| Crear/editar eventos | ✅ | ❌ |
| Marcar asistencia propia | ✅ | ✅ (solo en ventana) |
| Ver asistencia de todos | ✅ | ❌ |
| Ver asistencia propia | ✅ | ✅ |
| Ver multas de todos | ✅ | ❌ |
| Ver multas propias | ✅ | ✅ |
| Configurar montos de multas | ✅ | ❌ |

---

## Seccionales

Cuando un evento es seccional (solo para "Vientos", por ejemplo):
- **Todos los miembros ven el evento** en su lista.
- Los que no pertenecen a esa sección ven el chip "No aplica para tu sección".
- Solo los miembros de las secciones target pueden hacer check-in.
- El evento **no genera falta** para quienes no aplican.

---

## Lógica de asistencia (detalle)

| Momento del check-in | Estado registrado | Multa |
|---|---|---|
| Antes de la hora de inicio (tolerancia < 1 min) | `present` (Presente) | Sin multa |
| 1 a 15 minutos tarde | `late` (Tardanza) | Multa por tardanza |
| Más de 15 minutos tarde | `absent` (Falta) | Multa por falta |
| No marcó (al cerrar evento) | `absent` (Falta automática) | Multa por falta |

El cálculo lo realiza el trigger `calculate_fine` en PostgreSQL mediante la función `resolve_attendance_status()`.

---

## Fases de implementación

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 1** | Setup + estructura base + check-in + vista de asistencia | ✅ Completada |
| **Fase 2** | Multas + reportes + ranking + calendario + multi-selección + fotos | ✅ Completada |
| **Fase 3** | Notificaciones push + email + cron de cierre automático | ⏳ Pendiente |

---

## Para activar la app (pasos de configuración)

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ejecutar los 10 archivos SQL de `supabase/migrations/` en el editor SQL de Supabase (en orden)
3. Activar Google OAuth en Supabase → Authentication → Providers
4. Copiar `.env.local.example` a `.env.local` y completar las variables
5. Asignar `role = 'director'` al primer usuario en la tabla `profiles`
6. Ejecutar `npm run dev` y abrir `localhost:3000`
