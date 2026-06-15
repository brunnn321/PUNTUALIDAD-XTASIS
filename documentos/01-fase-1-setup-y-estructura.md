# Fase 1 — Setup y Estructura Base

**Estado:** Completada  
**Fecha:** 13 de junio de 2026

---

## Objetivo

Tener una app funcional donde:
- El director pueda crear eventos y ver quién asistió
- Los miembros puedan hacer check-in desde su celular
- El acceso esté protegido por rol (director vs miembro)
- El login funcione con Google

---

## Lo que se construyó

### 1. Proyecto Next.js

- Next.js 16 con App Router y TypeScript
- Tailwind CSS 4
- Dependencias instaladas: `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `clsx`, `tailwind-merge`, `date-fns`

### 2. Migraciones SQL (carpeta `supabase/migrations/`)

| Archivo | Contenido |
|---|---|
| `001_schema.sql` | Todas las tablas: `profiles`, `event_types`, `events`, `attendances`, `push_tokens`. Datos iniciales de tipos de evento con montos de multa. |
| `002_rls.sql` | Políticas de Row Level Security para cada tabla. Funciones auxiliares `is_director()` y `my_section()`. |
| `003_triggers.sql` | Trigger de creación automática de perfil al registrarse. Trigger `updated_at`. Trigger de cálculo de multa al insertar/actualizar asistencia. Función `resolve_attendance_status()`. Función `close_event()`. |
| `004–008_*.sql` | Ajustes incrementales a RLS, índices y datos de prueba. |
| `009_fix_attendance_status_tolerance.sql` | Actualiza `resolve_attendance_status()` para dar 1 minuto de tolerancia antes de marcar como tardanza. |
| `010_profile_photos.sql` | Crea bucket `profile-photos` en Supabase Storage (público, 5 MB, jpeg/png/webp). Políticas RLS: solo el propio usuario puede subir/eliminar en su carpeta; todos los autenticados pueden leer. |

### 3. Clientes Supabase (carpeta `lib/supabase/`)

- `client.ts` — cliente para componentes del lado del navegador (Client Components)
- `server.ts` — cliente para Server Components y Server Actions
- `types.ts` — tipos TypeScript para todas las tablas y enums

### 4. Protección de rutas (`proxy.ts`)

Reemplaza al `middleware.ts` clásico (renombrado en Next.js 16). Redirige:
- Sin sesión → `/login`
- Miembro que intenta entrar a rutas de director → `/home`
- Director que intenta entrar a rutas de miembro → `/dashboard`

### 5. Autenticación

- `app/(auth)/login/page.tsx` — pantalla de login con botón "Continuar con Google"
- `app/api/auth/callback/route.ts` — recibe el código de OAuth y redirige según rol
- `app/api/auth/logout/route.ts` — cierra sesión

### 6. Pantallas del Director

| Ruta | Archivo | Descripción |
|---|---|---|
| `/dashboard` | `app/(director)/dashboard/page.tsx` | Stats del día, próximo evento, accesos rápidos |
| `/eventos` | `app/(director)/eventos/page.tsx` | Lista/Calendario de eventos con toggle y multi-selección |
| `/eventos/nuevo` | `app/(director)/eventos/nuevo/page.tsx` | Formulario para crear evento (acepta `?sections=` para pre-rellenar secciones) |
| `/eventos/[id]` | `app/(director)/eventos/[id]/page.tsx` | Detalle del evento + lista de asistentes con foto y hora |
| `/eventos/multas` | `app/(director)/eventos/multas/page.tsx` | Configurar montos de multas por tipo de evento |
| `/miembros` | `app/(director)/miembros/page.tsx` | Lista de miembros con modo selección (desactivar/reactivar/crear evento) |
| `/miembros/[id]` | `app/(director)/miembros/[id]/page.tsx` | Detalle y edición de un miembro con historial de asistencia |
| `/reportes` | `app/(director)/reportes/page.tsx` | Ranking con podio top 3, total de multas, filtro de fecha |
| `/reportes/miembro/[id]` | `app/(director)/reportes/miembro/[id]/page.tsx` | Historial filtrable de un miembro con botón "Saldar multa" |
| `/reportes/multas` | `app/(director)/reportes/multas/page.tsx` | Multas pendientes agrupadas por evento |

### 7. Pantallas del Miembro

| Ruta | Archivo | Descripción |
|---|---|---|
| `/home` | `app/(member)/home/page.tsx` | Próximos eventos + botón de check-in con foto obligatoria |
| `/mis-eventos` | `app/(member)/mis-eventos/page.tsx` | Eventos en lista (Próximos/Pasados) o calendario mensual |
| `/mis-multas` | `app/(member)/mis-multas/page.tsx` | Total acumulado + desglose por evento |
| `/perfil` | `app/(member)/perfil/page.tsx` | Editar nombre y foto (sección e instrumento: solo lectura) |

### 8. Componentes del Director

| Archivo | Función |
|---|---|
| `components/director/DirectorNav.tsx` | Barra de navegación inferior: Inicio, Eventos, Miembros, Reportes |
| `components/director/EventControls.tsx` | Botones "Abrir check-in" y "Cerrar evento" |
| `components/director/EventForm.tsx` | Formulario de creación de evento (acepta `initialSections`) |
| `components/director/EventsViewToggle.tsx` | Toggle Lista/Calendario + modo multi-selección con Sí/No |
| `components/director/EventsCalendarView.tsx` | Grid mensual con puntos de color por tipo de evento |
| `components/director/FineConfigForm.tsx` | Formulario de configuración de montos de multa |
| `components/director/MembersList.tsx` | Lista de miembros con modo selección (desactivar/reactivar/crear evento) |
| `components/director/AttendancePhoto.tsx` | Miniatura 40×40 de foto de check-in con lightbox de pantalla completa |
| `components/director/DateRangeFilter.tsx` | Pills de período + inputs Desde/Hasta con `basePath` prop |

### 9. Componentes del Miembro

| Archivo | Función |
|---|---|
| `components/member/MemberNav.tsx` | Barra de navegación inferior del miembro |
| `components/member/CheckInButton.tsx` | Check-in con foto obligatoria (cámara o galería), preview y upload |
| `components/member/ProfileForm.tsx` | Editar nombre y foto de perfil; sección e instrumento de solo lectura |
| `components/member/MemberEventsToggle.tsx` | Toggle Lista/Calendario para `/mis-eventos` (reutiliza EventsCalendarView) |

### 10. Server Actions (`lib/actions/`)

| Archivo | Funciones |
|---|---|
| `lib/actions/events.ts` | `createEvent()`, `openEvent()`, `closeEvent()`, `deleteEventById()` |
| `lib/actions/members.ts` | `createMember()`, `updateMember()`, `deleteMember()`, `setMembersActive()` |
| `lib/actions/fines.ts` | `settleFine()` — pone `fine_amount = 0` para una asistencia |
| `lib/actions/profile.ts` | `updateProfile()` — actualiza nombre y foto del miembro |

### 11. Utilidades (`lib/utils.ts`)

- `cn()` — combina clases de Tailwind
- `formatDate()`, `formatDateTime()`, `formatTime()`, `fromNow()` — fechas en español
- `formatCurrency()` — formato COP (pesos colombianos)
- `SECTION_LABELS` — mapa de códigos de sección a nombres en español
- `STATUS_CONFIG` — mapa de estados de asistencia a estilos visuales

### 12. PWA

- `public/manifest.json` — manifiesto para instalación en móvil
- `app/layout.tsx` — metadatos de la PWA (nombre, color de tema, viewport móvil)

---

## Verificación realizada

- `npm run build` — pasa sin errores de TypeScript
- 20+ rutas generadas correctamente (incluyendo nuevas rutas de Fase 2)
- Suite de 53 tests (Vitest v4.1.9, 5 archivos) — todos pasando
- Build limpio en Next.js 16 con Turbopack

---

## Activo en producción

La app está desplegada en Vercel con:
- Supabase conectado (PostgreSQL + Auth Google + Storage)
- 10 migraciones SQL ejecutadas
- Bucket `profile-photos` en Supabase Storage
- Bucket `attendance-photos` en Supabase Storage
