# Documentación — App de Asistencia Xtasis

Documentación técnica y de producto del proyecto.

---

## Índice

| Archivo | Descripción |
|---|---|
| [00-plan-general.md](./00-plan-general.md) | El plan completo: stack, modelo de datos, roles, lógica de asistencia y fases |
| [01-fase-1-setup-y-estructura.md](./01-fase-1-setup-y-estructura.md) | **Completada** — Setup del proyecto, migraciones SQL, todas las pantallas y componentes |
| [02-fase-2-multas-y-reportes.md](./02-fase-2-multas-y-reportes.md) | **Completada** — Multas agrupadas, ranking, filtros de fecha, botón "Saldar", config movida a Eventos |
| [03-fase-3-notificaciones.md](./03-fase-3-notificaciones.md) | **Pendiente** — Notificaciones push en celular + email de respaldo |
| [04-guia-de-configuracion.md](./04-guia-de-configuracion.md) | Paso a paso para conectar Supabase, Google OAuth, variables de entorno y deploy en Vercel |
| [05-historias-de-usuario.md](./05-historias-de-usuario.md) | Todos los flujos y componentes descritos como historias de usuario (HU-01 a HU-30) |

---

## Estado actual del proyecto

- **Fase 1:** Completada — setup, autenticación, check-in, 17+ rutas funcionando, 53 tests pasando
- **Fase 2:** Completada — multas agrupadas por evento, ranking con podio, filtros de fecha, botón Saldar, calendario de eventos, multi-selección, fotos de perfil, miembros desactivables
- **Fase 3:** Pendiente — notificaciones push y email

## Funcionalidades implementadas

### Director
- Dashboard con resumen del día
- Eventos en vista lista o calendario mensual (con colores por tipo)
- Crear, abrir, cerrar y eliminar eventos (incluyendo multi-selección)
- Detalle de evento con lista de asistentes, fotos de check-in y hora exacta
- Lista de miembros con modo selección: desactivar, reactivar, crear evento seccional
- Ranking de asistencia con podio (🥇🥈🥉) y filtro por período / rango de fechas
- Reporte individual por miembro con botón "Saldar multa"
- Multas agrupadas por evento en `/reportes/multas`
- Configuración de montos de multa en `/eventos/multas`

### Miembro
- Lista de próximos eventos + check-in con foto obligatoria
- Vista de mis eventos en lista o calendario (Próximos / Pasados)
- Historial de mis multas acumuladas
- Edición de perfil: nombre + foto personalizable (sección e instrumento: solo lectura)

## Próximo paso

Implementar la [Fase 3 — Notificaciones](./03-fase-3-notificaciones.md) para que los miembros reciban recordatorios en su celular cuando se abre el check-in de un evento.
