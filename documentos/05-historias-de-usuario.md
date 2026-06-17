# Historias de Usuario — App de Asistencia Xtasis

Descripción de todos los componentes y flujos de la aplicación desde el punto de vista de los usuarios.

---

## Roles

- **Director** — administrador del grupo, accede desde `/dashboard`
- **Miembro** — integrante del grupo, accede desde `/home`

---

## Autenticación

### HU-01 · Login con Google
> Como usuario (director o miembro), quiero entrar a la app con mi cuenta de Google para no tener que recordar una contraseña.

**Flujo:** El usuario ve la pantalla `/login` con el botón "Continuar con Google". Al hacer clic se abre el popup de Google. Al autorizar, el sistema lee su rol y estado en la base de datos:
- Si es director → `/dashboard`
- Si es miembro → `/home`
- Si el usuario está **inactivo** (`active = false`) → se cierra la sesión inmediatamente y se redirige a `/login?error=inactive`
- Si aún no tiene perfil creado → se crea automáticamente con rol `member`

**Archivos:** `app/(auth)/login/page.tsx`, `app/api/auth/callback/route.ts`

---

### HU-01b · Bienvenida para nuevos miembros
> Como miembro que acaba de ser agregado al sistema, quiero ver una pantalla de bienvenida al entrar por primera vez para confirmar que mi cuenta está correctamente configurada.

**Flujo:** Cuando un miembro nuevo (cuyo perfil fue creado por el director) inicia sesión con Google por primera vez, el sistema lo redirige a `/bienvenida`. La pantalla muestra su foto, nombre y sección preguntando "¿Eres tú?". Al confirmar con el botón "Sí, soy yo → entrar", se marca `welcomed = true` en el perfil y el miembro accede normalmente a la app. Si hay un error en los datos, se le indica que contacte al director.

**Campo de BD:** `profiles.welcomed` (boolean, default `false`). Se verifica en el callback de auth para redirigir a `/bienvenida`.

**Archivos:** `app/(member)/bienvenida/page.tsx`, `lib/actions/profile.ts`

---

## Flujos del Director

### HU-02 · Ver dashboard con resumen del día
> Como director, quiero ver un resumen al entrar a la app para saber de un vistazo si hay un evento hoy o próximamente.

**Flujo:** La pantalla `/dashboard` muestra:
- **Miembros activos** (count de `profiles` con `role='member'` y `active=true`)
- **Multas pendientes** (suma de `attendances.fine_amount > 0`)
- **Próximo evento** (siguiente evento con estado ≠ `closed`) con botón "Ver asistencia →"
- Eventos del día actual (00:00:00 a 23:59:59 hora local)

**Archivo:** `app/(director)/dashboard/page.tsx`

---

### HU-03 · Ver todos los eventos en lista
> Como director, quiero ver todos los eventos organizados en "Próximos" y "Pasados" para saber qué hay planeado y qué ya ocurrió.

**Flujo:** La página `/eventos` muestra dos secciones. Cada evento muestra nombre, tipo con chip de color, fecha y estado (Programado / Abierto / Cerrado). El director puede hacer clic en cualquier evento para ver su detalle. En la cabecera aparece un ícono de recibo que lleva a `/eventos/multas` (configuración de montos de multa).

**Archivo:** `app/(director)/eventos/page.tsx`, `components/director/EventsViewToggle.tsx`

---

### HU-04 · Ver eventos en calendario
> Como director, quiero cambiar la vista de eventos a un calendario mensual para ver la distribución de actividades en el tiempo.

**Flujo:** En la parte superior de `/eventos` hay un toggle "Lista | Calendario". Al seleccionar Calendario aparece un grid del mes actual con puntos de color por tipo de evento. Los colores son: Ensayo=azul, Presentación=violeta, Viaje=naranja, Medios=amarillo, Seccional=verde. Al hacer clic en un día con eventos aparece la lista de eventos de ese día con link al detalle. El director puede navegar entre meses con flechas ← →.

**Archivos:** `components/director/EventsViewToggle.tsx`, `components/director/EventsCalendarView.tsx`

---

### HU-05 · Crear un evento nuevo
> Como director, quiero crear un evento completando un formulario para que los miembros puedan ver y registrar su asistencia.

**Flujo:** Desde `/eventos` el director hace clic en "+" y llega a `/eventos/nuevo`. El formulario pide:
- Nombre del evento
- Tipo (Ensayo, Presentación, Viaje, Medios, Seccional)
- Fecha y hora de inicio
- Secciones objetivo (si aplica para todo el grupo o solo algunas secciones; vacío = todos)
- Notas (información adicional, opcional)

Al guardar, el evento queda en estado `scheduled`. La ventana de check-in se calcula automáticamente: `checkin_opens_at = starts_at - 60 minutos` (hardcodeado). Todos los miembros de las secciones target lo verán en su lista.

**Archivos:** `app/(director)/eventos/nuevo/page.tsx`, `components/director/EventForm.tsx`

---

### HU-06 · Ver detalle de un evento y lista de asistentes
> Como director, quiero ver quién asistió a un evento específico para saber el estado de asistencia de cada miembro.

**Flujo:** Al hacer clic en un evento se abre `/eventos/[id]`. Muestra la cabecera con nombre, tipo, fecha y estado. Debajo, la lista de todos los miembros que pertenecen a las secciones target con su estado: Presente (verde), Tardanza (amarillo), Falta (rojo) o **Pendiente** (gris, si aún no marcaron). Para los registros con foto de check-in, aparece una miniatura (40×40). Para los registros presentes o tardanzas, aparece la hora exacta del check-in.

En eventos **cerrados**: los miembros desactivados aparecen al final de la lista con un badge "Inactivo".

El encabezado muestra contadores: Presentes, Tardanzas, Faltas, Pendientes.

**Archivos:** `app/(director)/eventos/[id]/page.tsx`, `components/director/AttendancePhoto.tsx`

---

### HU-07 · Estado automático del check-in y cierre manual
> Como director, quiero que el check-in se abra automáticamente a la hora configurada y poder cerrarlo manualmente cuando lo necesite.

**Flujo:** El check-in se gestiona de forma automática. En el detalle del evento (`EventControls`) se muestra un indicador de estado según el momento actual:
- Antes de `checkin_opens_at`: chip gris "Check-in abre a las HH:MM" (no hay botón de apertura manual)
- Durante la ventana (`checkin_opens_at` → `starts_at + 1 hora`): chip verde "Check-in abierto automáticamente"
- Ventana expirada pero evento sin cerrar: chip ámbar "Ventana de check-in cerrada"

En cualquier estado no cerrado siempre aparece el botón **"Cerrar y registrar ausentes"** → llama a `close_event()` que marca como `absent` a quienes no marcaron y calcula sus multas.

Adicionalmente aparece el botón **"🔔 Notificar miembros"** que envía una push notification a los miembros de las secciones objetivo con un enlace a `/home`.

> El botón "Abrir check-in" manual fue eliminado. La transición `scheduled → open` la hace el sistema automáticamente.

**Archivos:** `components/director/EventControls.tsx`, `app/api/push/notify/route.ts`

---

### HU-08 · Eliminar uno o varios eventos
> Como director, quiero poder seleccionar varios eventos y eliminarlos juntos para limpiar eventos creados por error.

**Flujo:** En `/eventos` hay un botón "Seleccionar" en la cabecera. Al activarlo, aparecen checkboxes en cada evento. Una barra inferior muestra "Eliminar X eventos" con confirmación "Sí / No" antes de proceder.

**Archivo:** `components/director/EventsViewToggle.tsx`

---

### HU-09 · Ver lista de miembros y agregar uno nuevo
> Como director, quiero ver todos los miembros del grupo con su foto, sección e instrumento para tener un directorio del grupo, y poder agregar miembros nuevos.

**Flujo:** La página `/miembros` muestra todos los miembros activos con avatar, nombre, sección e instrumento. Los miembros inactivos aparecen al final con un badge "Inactivo". Cada miembro es clickeable para ver su detalle.

Desde la cabecera de `/miembros`, el botón "+" lleva a `/miembros/nuevo` donde el director completa un formulario con:
- Nombre completo
- Correo electrónico (con el que el miembro iniciará sesión con Google)
- Sección
- Instrumento (opcional)

Al guardar, el perfil queda creado con `welcomed = false` y el miembro podrá iniciar sesión con Google usando ese correo (verá la pantalla de bienvenida la primera vez).

**Archivos:** `app/(director)/miembros/page.tsx`, `components/director/MembersList.tsx`, `app/(director)/miembros/nuevo/page.tsx`, `lib/actions/members.ts`

---

### HU-10 · Ver detalle y editar un miembro
> Como director, quiero ver el perfil completo de un miembro y poder editar su sección o instrumento, ya que los miembros no pueden modificar esos campos por sí solos.

**Flujo:** Al hacer clic en un miembro en `/miembros` se abre `/miembros/[id]`. Muestra foto, nombre, sección, instrumento, estado activo/inactivo, estadísticas de asistencia (% asistencia, presentes, tardanzas, faltas, multas) y el historial de los últimos 20 eventos con miniatura de foto por cada registro. El director puede ir a `/miembros/[id]/editar` para editar nombre, sección, instrumento y estado activo/inactivo. También hay una zona de peligro para eliminar al miembro permanentemente.

**Archivo:** `app/(director)/miembros/[id]/page.tsx`, `app/(director)/miembros/[id]/editar/page.tsx`

---

### HU-11 · Desactivar o reactivar uno o varios miembros
> Como director, quiero desactivar un miembro que se fue del grupo para que no aparezca en eventos futuros, y reactivarlo si regresa.

**Flujo:** En `/miembros` el director activa el modo selección con el botón "Seleccionar", elige uno o más miembros y la barra inferior muestra:
- "Desactivar" (ámbar) si al menos un seleccionado está activo
- "Reactivar" (verde) si al menos un seleccionado está inactivo

Los miembros desactivados no aparecen en los eventos **nuevos** que se creen después de desactivarlos. En eventos ya cerrados aparecen al final de la lista con badge "Inactivo".

Si un miembro inactivo intenta iniciar sesión con Google, el sistema detecta `active = false`, cierra su sesión automáticamente y lo redirige a `/login?error=inactive`.

**Archivos:** `components/director/MembersList.tsx`, `lib/actions/members.ts`, `app/api/auth/callback/route.ts`

---

### HU-12 · Crear evento preseleccionando secciones desde la lista de miembros
> Como director, quiero seleccionar miembros de una sección específica y crear un evento seccional directamente para ahorrar pasos.

**Flujo:** En modo selección de `/miembros`, el director elige varios miembros y hace clic en "Crear evento". El sistema extrae las secciones únicas de los seleccionados y navega a `/eventos/nuevo?sections=vientos,percusion`. El formulario de nuevo evento pre-rellena las secciones objetivo.

**Archivos:** `components/director/MembersList.tsx`, `app/(director)/eventos/nuevo/page.tsx`

---

### HU-13 · Ver ranking de asistencia con podio
> Como director, quiero ver un ranking de asistencia con los tres mejores en un podio destacado para reconocer a los más puntuales del grupo.

**Flujo:** La página `/reportes` muestra:
- Un card con el total de multas acumuladas en el período activo
- Un podio con 🥇🥈🥉 para los 3 miembros con mayor porcentaje de asistencia
  - Oro: fondo ámbar
  - Plata: fondo gris
  - Bronce: fondo naranja
  - Cada card muestra foto, nombre, sección, conteo de presentes/tardanzas/faltas y porcentaje
  - Código de color del porcentaje: verde (≥80%), amarillo (60-79%), rojo (<60%)
- El resto de miembros en un `<details>` colapsado "Ver todos"

Cada miembro es clickeable para ir a su reporte individual.

**Archivo:** `app/(director)/reportes/page.tsx`

---

### HU-14 · Filtrar reportes por período o rango de fechas
> Como director, quiero filtrar los datos del ranking y multas por período (esta semana, este mes, todo) o por un rango de fechas personalizado para analizar períodos específicos.

**Flujo:** En la parte superior de `/reportes` hay:
- 3 botones pill: "Esta semana", "Este mes", "Todo" (el activo se resalta en violeta)
- Un panel "Rango personalizado" con inputs Desde/Hasta (por defecto con la fecha de hoy)
- Botón "Aplicar" para activar el rango; botón "Limpiar" para volver al período

El filtro activo se refleja en la URL con `?periodo=week` o `?desde=2026-06-01&hasta=2026-06-15`. El mismo filtro aplica al total de multas mostrado en el card.

**Archivos:** `app/(director)/reportes/page.tsx`, `components/director/DateRangeFilter.tsx`

---

### HU-15 · Ver reporte individual de un miembro con filtro de fechas
> Como director, quiero ver el historial completo de asistencia y multas de un miembro específico, filtrado por período, para tener una vista detallada de su comportamiento.

**Flujo:** Al hacer clic en un miembro en el ranking se abre `/reportes/miembro/[id]`. Muestra:
- Foto y nombre del miembro
- El mismo componente `DateRangeFilter` (con `basePath` apuntando a esta ruta)
- Cards de resumen: porcentaje de asistencia y total de multas
- Contadores: Presentes, Tardanzas, Faltas
- Historial cronológico de cada evento con nombre, tipo, fecha y estado
- Por cada fila con multa: monto en rojo + botón "Saldar"

**Archivos:** `app/(director)/reportes/miembro/[id]/page.tsx`

---

### HU-16 · Saldar una multa desde el reporte de un miembro
> Como director, quiero marcar una multa como saldada directamente desde el historial del miembro cuando el miembro la ha pagado en efectivo.

**Flujo:** En `/reportes/miembro/[id]`, cada fila de asistencia con `fine_amount > 0` muestra el monto y un botón "Saldar". Al hacer clic, el sistema actualiza `fine_amount = 0` para esa asistencia y recarga la página. El botón desaparece al saldar.

> **Nota técnica:** El trigger `calculate_fine` solo recalcula `fine_amount` en INSERT o cuando cambia el `status`. Un UPDATE que solo cambia `fine_amount` no es sobreescrito por el trigger, lo que permite saldar correctamente.

**Archivos:** `app/(director)/reportes/miembro/[id]/page.tsx`, `lib/actions/fines.ts`

---

### HU-17 · Ver multas agrupadas por evento
> Como director, quiero ver en `/reportes/multas` todas las multas pendientes agrupadas por evento para saber cuánto debe cobrar en cada actividad.

**Flujo:** La página `/reportes/multas` (accesible desde el ícono de recibo en `/eventos`) muestra:
- Total pendiente del grupo
- Eventos con multas agrupados en bloques expandibles (`<details>`)
- Cada bloque muestra: nombre del evento, tipo, fecha, total del evento
- Al expandir: lista de miembros deudores con nombre, sección y monto
- Los eventos se ordenan del más reciente al más antiguo

**Archivo:** `app/(director)/reportes/multas/page.tsx`

---

### HU-18 · Configurar montos de multas por tipo de evento
> Como director, quiero poder ajustar cuánto se cobra por tardanza o por falta en cada tipo de evento para adaptarlo a las reglas del grupo.

**Flujo:** La configuración de multas está en `/eventos/multas` (accesible desde el ícono de recibo en la cabecera de `/eventos`). Muestra una lista de tipos de evento con sus montos actuales de multa por tardanza (`fine_late`) y por falta (`fine_absent`). El director puede editar los valores y guardar.

**Archivos:** `app/(director)/eventos/multas/page.tsx`, `components/director/FineConfigForm.tsx`

---

## Flujos del Miembro

### HU-19 · Ver próximos eventos, check-in y ranking de multas
> Como miembro, quiero ver los eventos que se aproximan y poder marcar mi asistencia cuando llegue el momento para no olvidarme ni llegar tarde.

**Flujo:** La pantalla `/home` muestra:
- El total de mis multas acumuladas pendientes
- El podio de 🥇🥈🥉 con los **3 miembros con menos multas** del grupo (ranking gamificado)
- Los próximos eventos del grupo filtrados a las secciones del miembro

Para cada evento cuya ventana de check-in está activa (`checkin_opens_at` ≤ ahora ≤ `starts_at + 1 hora`) aparece el botón de check-in. Al hacer clic, la cámara se abre para tomar una foto obligatoria como evidencia. La app sube la foto y registra la asistencia con el estado correspondiente.

El botón de check-in desaparece una vez marcado.

**Archivos:** `app/(member)/home/page.tsx`, `components/member/CheckInButton.tsx`, `lib/actions/rankings.ts`

---

### HU-20 · Hacer check-in con foto obligatoria
> Como miembro, quiero marcar mi asistencia tomando una foto para que el director pueda verificar que realmente estaba en el lugar.

**Flujo:** Al presionar el botón de check-in:
1. Se muestra un botón para abrir la cámara (o galería)
2. El miembro toma o selecciona la foto
3. Aparece una previsualización de la foto
4. Al confirmar, la app sube la foto a Supabase Storage (`attendance-photos/`) y registra la asistencia
5. El estado se calcula automáticamente:
   - Llegó antes de la hora de inicio (con tolerancia de 1 minuto) → Presente
   - Llegó 1-15 minutos tarde → Tardanza
   - Llegó más de 15 minutos tarde → Falta
6. El botón de check-in desaparece una vez marcado

**Archivo:** `components/member/CheckInButton.tsx`

---

### HU-21 · Ver historial de eventos propios en lista o calendario
> Como miembro, quiero ver todos mis eventos pasados y futuros en una lista organizada, y poder cambiar a vista de calendario para orientarme mejor en el tiempo.

**Flujo:** La página `/mis-eventos` muestra en la parte superior un resumen de asistencia (% asistencia, Presentes, Tardanzas, Faltas, Multas). Hay un toggle "Lista | Calendario":

**Vista Calendario** (default): calendario mensual con puntos de color por tipo de evento, navegable con ← →.

**Vista Lista**: dos secciones:
- **Próximos:** eventos en estado `scheduled` u `open` de mis secciones
- **Pasados:** eventos cerrados con mi estado de asistencia (Presente / Tardanza / Falta)

**Archivos:** `app/(member)/mis-eventos/page.tsx`, `components/member/MemberEventsToggle.tsx`, `components/director/EventsCalendarView.tsx` (reutilizado)

---

### HU-22 · Ver mis multas acumuladas
> Como miembro, quiero ver cuánto debo en total y el desglose por evento para saber cuánto tengo que pagar al director.

**Flujo:** La página `/mis-multas` muestra:
- **Total acumulado** en rojo (si hay multas) o verde (si no hay)
- Si el total es 0: mensaje motivacional "¡Sin multas! Sigue así."
- Lista desglosada de cada multa con: nombre del evento, tipo, fecha, estado de asistencia (Tardanza/Falta) y monto

**Archivo:** `app/(member)/mis-multas/page.tsx`

---

### HU-23 · Editar mi perfil y subir foto de perfil
> Como miembro, quiero actualizar mi nombre y subir una foto para que el director y los compañeros me reconozcan en la app.

**Flujo:** La página `/perfil` muestra:
- El avatar actual con un badge de cámara encima para indicar que es clickeable
- Al hacer clic en el avatar, se abre el selector de archivos (cámara o galería)
- La foto seleccionada se previsualiza inmediatamente
- Campo editable para el nombre completo — **solo disponible la primera vez** (flag `profiles.name_edited`). Una vez guardado el cambio, el campo pasa a ser de solo lectura con el mensaje "Ya usaste tu cambio de nombre. Solo el director puede modificarlo de nuevo."
- Sección e instrumento mostrados como texto de solo lectura (el director los edita desde `/miembros/[id]/editar`)
- Botón "Guardar" que sube la foto a Supabase Storage (`profile-photos/`) y actualiza el perfil

**Archivo:** `components/member/ProfileForm.tsx`

---

## Componentes compartidos

### HU-24 · Foto de check-in como miniatura con lightbox
> Como director o miembro, quiero poder ver la foto del check-in en grande al hacer clic en la miniatura para verificar la asistencia con más detalle.

**Flujo:** En el detalle de un evento (`/eventos/[id]`) y en el detalle de un miembro (`/miembros/[id]`), cada registro de asistencia con foto muestra una miniatura de 40×40px con borde violeta. Al hacer clic en la miniatura, aparece un overlay de pantalla completa con la foto y el nombre del miembro. Se cierra al hacer clic fuera o en el botón ×.

**Archivo:** `components/director/AttendancePhoto.tsx`

---

### HU-25 · Filtro de rango de fechas reutilizable
> Como director, quiero que el filtro de fechas funcione de forma consistente tanto en el ranking general como en el reporte individual para no tener que aprender dos interfaces distintas.

**Flujo:** El componente `DateRangeFilter` recibe una prop `basePath` y funciona igual en:
- `/reportes` (basePath por defecto)
- `/reportes/miembro/[id]`

Siempre que el estado del filtro cambia, la página se recarga con los nuevos parámetros en la URL.

**Archivo:** `components/director/DateRangeFilter.tsx`

---

## Navegación

### HU-26 · Navegación inferior del director
> Como director, quiero una barra de navegación siempre visible en la parte inferior para cambiar rápidamente entre las secciones principales de la app.

**Secciones:**
- Inicio (`/dashboard`)
- Eventos (`/eventos`)
- Miembros (`/miembros`)
- Reportes (`/reportes`)

La sección activa se resalta en violeta.

**Archivo:** `components/director/DirectorNav.tsx`

---

### HU-27 · Navegación inferior del miembro
> Como miembro, quiero una barra de navegación siempre visible en la parte inferior para acceder a mis secciones rápidamente.

**Secciones:**
- Inicio (`/home`)
- Mis eventos (`/mis-eventos`)
- Mis multas (`/mis-multas`)
- Perfil (`/perfil`)

**Archivo:** `components/member/MemberNav.tsx`

---

## Lógica del sistema

### HU-28 · Cálculo automático de multas al cerrar un evento
> Como sistema, cuando el director cierra un evento, quiero que se calculen automáticamente las multas de cada miembro según su estado de asistencia para que el director no tenga que hacer ese cálculo manualmente.

**Reglas:**
- Presente: sin multa (`fine_amount = 0`)
- Tardanza: multa configurada en el tipo de evento (`fine_late`)
- Falta (marcada o registrada automáticamente al cerrar): multa configurada (`fine_absent`)
- El cálculo lo hace el trigger `calculate_fine` en PostgreSQL al insertar o actualizar una asistencia
- El trigger **no recalcula** si el UPDATE no cambia el campo `status` (esto permite saldar multas sin que el trigger las restaure)

**Archivos:** `supabase/migrations/003_triggers.sql`, `supabase/migrations/012_fix_settle_fine_trigger.sql`

---

### HU-29 · Tolerancia de 1 minuto para marcar como "presente"
> Como miembro, si llego justo a la hora del evento (con hasta 1 minuto de diferencia), quiero ser marcado como "presente" y no como "tardanza".

**Flujo:** La función `resolve_attendance_status()` en PostgreSQL compara la hora de check-in con `starts_at`. Si la diferencia es menor a 1 minuto, el estado es `present`. Si es entre 1 y 15 minutos: `late`. Si supera los 15 minutos: `absent`.

**Archivo:** `supabase/migrations/009_fix_attendance_status_tolerance.sql`

---

### HU-30 · Eventos seccionales: solo aplica a algunas secciones
> Como miembro de "Vientos", si hay un ensayo seccional solo para percusión, quiero ver el evento pero saber claramente que no aplica para mí para no confundirme.

**Flujo:** Cada evento tiene un campo `target_sections` (array). Si está vacío o es `null` → aplica a todos. Si el miembro no pertenece a ninguna de las secciones listadas, ve el evento con un chip "No aplica para tu sección" y no puede hacer check-in. Los eventos seccionales no generan falta para quienes no aplican.

**Archivos:** `app/(member)/home/page.tsx`, `components/member/CheckInButton.tsx`

---

### ~~HU-31 · Check-in desde kiosco público~~ *(eliminado)*
> Esta funcionalidad fue removida. La ruta raíz `/` ahora solo redirige: sin sesión → `/login`, director → `/dashboard`, miembro → `/home`. El check-in se hace únicamente desde `/home` con sesión iniciada.

---

### HU-32 · Push notifications: suscripción y recepción
> Como miembro, quiero recibir una notificación push en mi dispositivo cuando el check-in de un evento se abre para no perder el momento de marcar asistencia.

**Flujo:** Al entrar a `/home`, el componente `PushSubscriber` solicita permiso de notificaciones al navegador. Si el miembro acepta, la suscripción Web Push se guarda en la base de datos.

Cuando el director presiona "🔔 Notificar miembros" en el detalle del evento, el sistema envía una push notification a todos los miembros activos de las secciones objetivo con el mensaje: `"[Título del evento] comienza a las HH:MM. ¡Marca tu asistencia!"` y un link a `/home`.

Las notificaciones también se envían automáticamente vía cron (ver HU-33) cuando se detecta que la ventana de check-in acaba de abrirse. El flag `events.notified = true` evita reenvíos.

**Archivos:** `components/PushSubscriber.tsx`, `app/api/push/subscribe/route.ts`, `app/api/push/notify/route.ts`, `lib/webpush.ts`

---

### HU-33 · Auto-apertura y auto-cierre de eventos por cron
> Como sistema, quiero que los eventos se abran y cierren automáticamente según los horarios configurados para que el director no tenga que hacerlo manualmente.

**Flujo:** Un cron job (`/api/cron/close-events`, protegido por `CRON_SECRET`) se ejecuta periódicamente y realiza dos acciones:

1. **Auto-apertura:** Eventos en estado `scheduled` cuyo `checkin_opens_at` ya pasó y cuyo `starts_at` fue hace menos de 1 hora → cambian a estado `open` y se envía push notification a los miembros (solo una vez, controlado por el flag `notified`).

2. **Auto-cierre:** Eventos no cerrados cuyo `starts_at` fue hace más de 1 hora → se llama a `close_event()` que registra ausentes y calcula multas.

La función `autoCloseExpiredEvents()` también se llama en cada carga de `/home` y `/dashboard` para garantizar consistencia aunque el cron no haya corrido recientemente.

**Archivos:** `app/api/cron/close-events/route.ts`, `lib/actions/events.ts`
