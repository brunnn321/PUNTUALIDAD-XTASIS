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
| `/eventos` | `app/(director)/eventos/page.tsx` | Lista de eventos (próximos y pasados) |
| `/eventos/nuevo` | `app/(director)/eventos/nuevo/page.tsx` | Formulario para crear evento |
| `/eventos/[id]` | `app/(director)/eventos/[id]/page.tsx` | Detalle del evento + lista de asistentes |
| `/miembros` | `app/(director)/miembros/page.tsx` | Lista de miembros activos e inactivos |
| `/reportes` | `app/(director)/reportes/page.tsx` | Ranking de asistencia + total de multas |
| `/reportes/miembro/[id]` | `app/(director)/reportes/miembro/[id]/page.tsx` | Historial completo de un miembro |
| `/configuracion` | `app/(director)/configuracion/page.tsx` | Configurar montos de multas por tipo de evento |

### 7. Pantallas del Miembro

| Ruta | Archivo | Descripción |
|---|---|---|
| `/home` | `app/(member)/home/page.tsx` | Próximos eventos + botón de check-in |
| `/mis-eventos` | `app/(member)/mis-eventos/page.tsx` | Historial personal con estados y % de asistencia |
| `/mis-multas` | `app/(member)/mis-multas/page.tsx` | Total acumulado + desglose por evento |
| `/perfil` | `app/(member)/perfil/page.tsx` | Editar nombre, sección e instrumento |

### 8. Componentes

| Archivo | Función |
|---|---|
| `components/director/DirectorNav.tsx` | Barra de navegación inferior del director |
| `components/director/EventControls.tsx` | Botones "Abrir check-in" y "Cerrar evento" |
| `components/director/EventForm.tsx` | Formulario de creación de evento |
| `components/director/FineConfigForm.tsx` | Formulario de configuración de multas |
| `components/member/MemberNav.tsx` | Barra de navegación inferior del miembro |
| `components/member/CheckInButton.tsx` | Botón de check-in con validación de ventana de tiempo |
| `components/member/ProfileForm.tsx` | Formulario de edición de perfil |

### 9. Utilidades (`lib/utils.ts`)

- `cn()` — combina clases de Tailwind
- `formatDate()`, `formatDateTime()`, `formatTime()`, `fromNow()` — fechas en español
- `formatCurrency()` — formato COP (pesos colombianos)
- `SECTION_LABELS` — mapa de códigos de sección a nombres en español
- `STATUS_CONFIG` — mapa de estados de asistencia a estilos visuales

### 10. PWA

- `public/manifest.json` — manifiesto para instalación en móvil
- `app/layout.tsx` — metadatos de la PWA (nombre, color de tema, viewport móvil)

---

## Verificación realizada

- `npm run build` — pasa sin errores de TypeScript
- 17 rutas generadas correctamente
- Build limpio en Next.js 16 con Turbopack

---

## Pendiente para activar

1. Crear proyecto Supabase y ejecutar las 3 migraciones
2. Configurar Google OAuth
3. Completar `.env.local`
4. Asignar rol director al primer usuario
