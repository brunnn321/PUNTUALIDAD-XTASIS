# Fase 3 — Notificaciones Push y Email

**Estado:** Pendiente  
**Duración estimada:** ~1 semana

---

## Objetivo

Que los miembros reciban recordatorios automáticos en su celular cuando se acerca un evento, para que no olviden marcar su asistencia.

---

## Arquitectura de notificaciones

### Canal principal: Web Push

Funciona directamente en el celular sin necesidad de una app nativa.

**Flujo:**
1. Al primer login, el navegador pide permiso para enviar notificaciones
2. Si acepta, se genera un `PushSubscription` (token) que se guarda en la tabla `push_tokens`
3. El cron de Vercel detecta eventos próximos y envía la notificación con `web-push`
4. El Service Worker (`/public/sw.js`) muestra la notificación aunque la app esté cerrada

### Canal fallback: Email via Resend

Para usuarios que denegaron el permiso de push o cuyo token expiró.

---

## Momentos en que se envían notificaciones

| Momento | Mensaje | Canal |
|---|---|---|
| Cuando abre el check-in | "Ensayo en X min — ya puedes marcar tu asistencia" | Push + Email |
| Al inicio del evento | "El evento empezó — tienes 15 min antes de contar como falta" | Push |
| Al cierre del evento | "Se cerró la asistencia — revisa tu estado" | Push (solo a quienes no marcaron) |
| Nuevo evento creado | "Nuevo evento: [nombre] el [fecha]" | Push + Email |

---

## Lo que se construirá

### 1. Service Worker (`public/sw.js`)

Archivo JavaScript que el navegador registra para recibir notificaciones en segundo plano.

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
    })
  )
})
```

### 2. Subscripción al push en el cliente

Al hacer login, el componente solicita permiso y guarda el token:

**Archivo:** `components/PushSubscriber.tsx` (agregar al layout del miembro)

### 3. Endpoint de notificaciones

**Archivo:** `app/api/cron/notify-events/route.ts`

Lógica:
- Consultar eventos cuyo `checkin_opens_at` está a menos de 5 minutos
- Que no hayan sido notificados aún (campo `notified` en tabla `events`)
- Obtener los `push_tokens` de los miembros de las secciones target
- Enviar push con `web-push` y email con Resend

### 4. Campo `notified` en la tabla `events`

Agregar a la migración o como nueva migración:

```sql
ALTER TABLE events ADD COLUMN notified BOOLEAN NOT NULL DEFAULT false;
```

### 5. Configuración del cron en `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/close-events",   "schedule": "*/5 * * * *" },
    { "path": "/api/cron/notify-events",  "schedule": "*/5 * * * *" }
  ]
}
```

---

## Dependencias a instalar

```bash
npm install web-push resend
npm install --save-dev @types/web-push
```

---

## Variables de entorno adicionales necesarias

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # generar con: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:director@grupomusicakxtasis.com
RESEND_API_KEY=re_xxxxxxxxxxxx     # obtener en resend.com
```

---

## Tareas de implementación

- [ ] Instalar `web-push` y `resend`
- [ ] Generar claves VAPID y agregar a `.env.local`
- [ ] Crear `public/sw.js` (Service Worker)
- [ ] Registrar el Service Worker en `app/layout.tsx`
- [ ] Crear `components/PushSubscriber.tsx`
- [ ] Agregar campo `notified` a la tabla `events` (nueva migración SQL)
- [ ] Crear `app/api/cron/notify-events/route.ts`
- [ ] Crear `app/api/cron/close-events/route.ts`
- [ ] Actualizar `vercel.json` con los dos crons
- [ ] Probar en dispositivo móvil real (las notificaciones push requieren HTTPS)
