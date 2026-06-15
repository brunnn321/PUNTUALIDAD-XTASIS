# Fase 2 — Multas, Reportes y Mejoras de UX

**Estado:** Completada  
**Fecha:** 15 de junio de 2026

---

## Objetivo

Completar el sistema de multas, construir reportes completos y agregar funcionalidades de gestión avanzada para el director y los miembros.

---

## Lo que se construyó

### 1. Multas agrupadas por evento

**Ruta:** `/reportes/multas`  
**Archivo:** `app/(director)/reportes/multas/page.tsx`

Las multas pendientes se muestran agrupadas por evento (en lugar de por miembro). Cada evento es un bloque `<details>` expandible que muestra nombre, fecha, tipo y al expandir la lista de miembros deudores con su monto.

### 2. Ranking con podio (top 3)

**Ruta:** `/reportes`  
**Archivo:** `app/(director)/reportes/page.tsx`

El ranking de asistencia muestra un podio con 🥇🥈🥉 para los tres primeros. Fondo ámbar para el primero, gris para el segundo, naranja para el tercero. El resto de miembros se muestra en un bloque colapsado "Ver todos". Cada entrada muestra porcentaje, conteo de presentes/tardanzas/faltas y multas.

### 3. Filtro de período y rango de fechas

**Componente:** `components/director/DateRangeFilter.tsx`

Nuevo componente cliente reutilizable con:
- Tres botones pill: "Esta semana", "Este mes", "Todo"
- Panel "Rango personalizado" con inputs Desde/Hasta (por defecto fecha de hoy)
- Estado persistido en URL (`?periodo=month` o `?desde=...&hasta=...`)
- Disponible en `/reportes` y en `/reportes/miembro/[id]` (via prop `basePath`)

### 4. Reporte individual de miembro con botón "Saldar"

**Ruta:** `/reportes/miembro/[id]`  
**Archivos:** `app/(director)/reportes/miembro/[id]/page.tsx`, `lib/actions/fines.ts`

Historial filtrable de cada miembro. Por cada asistencia con multa > 0 aparece el monto y un botón "Saldar" que pone `fine_amount = 0` vía Server Action.

### 5. Vista calendario de eventos

**Archivos:** `components/director/EventsCalendarView.tsx`, `components/director/EventsViewToggle.tsx`

Toggle "Lista | Calendario" en `/eventos`. El calendario muestra un grid mensual con puntos de color por tipo de evento. Colores: Ensayo=azul, Presentación=violeta, Viaje=naranja, Medios=amarillo, Seccional=verde. Navegación entre meses con flechas. Al hacer clic en un día aparece el listado de eventos de ese día.

### 6. Multi-selección de eventos para eliminar

**Archivo:** `components/director/EventsViewToggle.tsx`

Botón "Seleccionar" en la cabecera de `/eventos`. Al activarlo aparecen checkboxes. Una barra inferior muestra el conteo de seleccionados y el botón "Eliminar" con confirmación "Sí / No".

### 7. Desactivar y reactivar miembros

**Archivos:** `components/director/MembersList.tsx`, `lib/actions/members.ts`

El modo selección en `/miembros` cambió de "eliminar" a "desactivar/reactivar". Los miembros desactivados no aparecen en eventos nuevos. En eventos cerrados, aparecen al final con badge "Inactivo".

Server action `setMembersActive(ids, active)` actualiza el campo `profiles.active`.

### 8. Foto de perfil personalizable

**Archivos:** `components/member/ProfileForm.tsx`, `supabase/migrations/010_profile_photos.sql`

Los miembros pueden subir una foto de perfil desde `/perfil`. El avatar muestra un badge de cámara. Al hacer clic se abre el selector de archivos. La foto se sube a `profile-photos/{userId}/avatar.jpg` en Supabase Storage con `upsert: true`. La URL pública se guarda en `profiles.photo_url`.

### 9. Sección e instrumento de solo lectura para miembros

**Archivo:** `components/member/ProfileForm.tsx`

Los campos "sección" e "instrumento" se muestran como texto estático en el formulario del miembro (fondo gris). Solo el director puede modificarlos desde `/miembros/[id]`.

### 10. Vista de eventos del miembro con toggle y secciones

**Archivos:** `app/(member)/mis-eventos/page.tsx`, `components/member/MemberEventsToggle.tsx`

La página `/mis-eventos` se reescribió para mostrar dos secciones: "Próximos" y "Pasados". Incluye el mismo toggle Lista/Calendario que el director. El calendario reutiliza `EventsCalendarView`.

### 11. Confirmación "Sí / No" en acciones destructivas

En lugar de `confirm()` del navegador, las acciones de eliminar y desactivar usan botones "Sí" y "No" inline en la barra de acción inferior.

### 12. Configuración de multas movida a Eventos

La ruta `/configuracion` fue renombrada y movida a `/eventos/multas`. El ítem "Config" fue eliminado de la barra de navegación del director. Ahora se accede desde el ícono de recibo en la cabecera de `/eventos`.

### 13. Foto de check-in obligatoria

**Archivo:** `components/member/CheckInButton.tsx`

El check-in requiere una foto. El componente abre la cámara o galería, muestra preview y sube a Supabase Storage antes de registrar la asistencia.

### 14. Miniatura de foto de check-in con lightbox

**Archivo:** `components/director/AttendancePhoto.tsx`

En el detalle del evento y en el historial del miembro, cada asistencia con foto muestra una miniatura de 40×40px. Al hacer clic se abre un overlay de pantalla completa.

### 15. Tolerancia de 1 minuto para marcar como "presente"

**Archivo:** `supabase/migrations/009_fix_attendance_status_tolerance.sql`

La función `resolve_attendance_status()` fue actualizada: llegar con menos de 1 minuto de diferencia cuenta como "presente".

---

## Tareas completadas

- [x] Multas agrupadas por evento en `/reportes/multas`
- [x] Ranking top 3 con podio y emojis de medallas
- [x] Botón "Saldar multa" en reporte de miembro
- [x] Componente `DateRangeFilter` reutilizable con URL state
- [x] Filtro de fechas en `/reportes` y `/reportes/miembro/[id]`
- [x] Vista calendario de eventos (director y miembro)
- [x] Multi-selección de eventos para eliminar
- [x] Multi-selección de miembros para desactivar/reactivar
- [x] Foto de perfil personalizable para miembros
- [x] Sección e instrumento de solo lectura en perfil del miembro
- [x] Toggle "Próximos / Pasados" en `/mis-eventos`
- [x] Config de multas movida a `/eventos/multas`
- [x] Foto obligatoria al hacer check-in
- [x] Miniatura de foto con lightbox en evento y perfil
- [x] Tolerancia de 1 minuto en `resolve_attendance_status()`
- [x] Confirmaciones inline "Sí / No" (sin `confirm()`)

## Pendiente (postergado para Fase 3 o backlog)

- [ ] Cierre automático de eventos (Vercel Cron)
- [ ] Exportación CSV de asistencias por evento
- [ ] Historial de ediciones del director (campo `edited_by`)
