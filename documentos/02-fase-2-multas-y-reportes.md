# Fase 2 — Multas y Reportes

**Estado:** Pendiente  
**Duración estimada:** ~1 semana

---

## Objetivo

Completar el sistema de multas automáticas y construir todos los reportes del director con datos reales.

---

## Lo que se construirá

### 1. Cierre automático de eventos (Vercel Cron)

Actualmente el director cierra los eventos manualmente con el botón "Cerrar y registrar ausentes". La Fase 2 agrega un cron job que lo hace automáticamente.

**Archivo a crear:** `app/api/cron/close-events/route.ts`

```typescript
// Lógica: cada 5 minutos revisar si hay eventos cuyo starts_at
// + 15 minutos de gracia ya pasó y aún están en estado 'open' o 'scheduled'
// Si los encuentra, llamar a la función close_event() de Supabase
```

**Configuración en `vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/close-events", "schedule": "*/5 * * * *" }
  ]
}
```

### 2. Verificación de multas en el trigger

El trigger `calculate_fine` ya existe en `supabase/migrations/003_triggers.sql`. En la Fase 2 se prueba end-to-end con datos reales:

- Crear evento → check-in a tiempo → multa = 0 ✓
- Check-in 10 min tarde → multa = `fine_late` del tipo de evento ✓
- No marcar → cierre → multa = `fine_absent` ✓

### 3. Reportes ampliados

Los reportes básicos ya están construidos en la Fase 1. La Fase 2 agrega:

#### Filtros por período en el ranking
- Selector de rango de fechas (esta semana / este mes / personalizado)
- Archivo: `app/(director)/reportes/page.tsx` (ampliar el existente)

#### Reporte de multas por cobrar detallado
- Vista separada con lista de todos los miembros que tienen multas pendientes
- Subtotal por miembro
- Total general del grupo
- Archivo: `app/(director)/reportes/multas/page.tsx` (nuevo)

#### Exportar datos
- Botón para exportar asistencias de un evento en CSV
- Útil para llevar a Excel o compartir con la directiva

### 4. Historial de ediciones del director

Cuando el director edita manualmente una asistencia (campo `edited_by` en la tabla `attendances`), mostrar un indicador visual en el detalle del evento.

---

## Tareas de implementación

- [ ] Crear `vercel.json` con configuración del cron
- [ ] Crear `app/api/cron/close-events/route.ts`
- [ ] Proteger el endpoint del cron con `CRON_SECRET` en headers
- [ ] Agregar filtros de período a la página de reportes
- [ ] Crear página `app/(director)/reportes/multas/page.tsx`
- [ ] Agregar exportación CSV al detalle de eventos
- [ ] Probar el ciclo completo de multas con datos reales en Supabase

---

## Variables de entorno adicionales necesarias

```
CRON_SECRET=un-valor-secreto-largo
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key  # para el cron (bypasa RLS)
```
