# Guía de Configuración Inicial

Esta guía detalla paso a paso cómo pasar del código en el repositorio a una app funcionando.

---

## Requisitos previos

- Node.js 18+ instalado (en este equipo está en `C:\Program Files\nodejs\`)
- Cuenta de Google (para el login OAuth)
- Cuenta en [supabase.com](https://supabase.com) (tier gratuito es suficiente)
- Cuenta en [vercel.com](https://vercel.com) (para deploy, tier gratuito es suficiente)

---

## Paso 1 — Crear el proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Elegir nombre: `xtasis-asistencia`
3. Elegir una contraseña para la base de datos (guárdala)
4. Región: South America (São Paulo) — la más cercana

---

## Paso 2 — Ejecutar las migraciones SQL

En el dashboard de Supabase → **SQL Editor** → ejecutar cada archivo en orden:

1. Pegar y ejecutar `supabase/migrations/001_schema.sql`
2. Pegar y ejecutar `supabase/migrations/002_rls.sql`
3. Pegar y ejecutar `supabase/migrations/003_triggers.sql`

---

## Paso 3 — Configurar Google OAuth

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto → Habilitar Google+ API
3. Credenciales → Crear ID de cliente OAuth → Aplicación web
4. Agregar en "Orígenes autorizados": `http://localhost:3000` y tu dominio de Vercel
5. Agregar en "URIs de redirección": `https://[tu-proyecto].supabase.co/auth/v1/callback`
6. Copiar el **Client ID** y el **Client Secret**

En Supabase → Authentication → Providers → Google:
- Pegar el Client ID y Client Secret
- Habilitar

---

## Paso 4 — Completar las variables de entorno

Copiar `.env.local.example` como `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key de Settings > API]
SUPABASE_SERVICE_ROLE_KEY=[service role key de Settings > API]
```

Las variables de VAPID y Resend se completan en la Fase 3.

---

## Paso 5 — Asignar el rol de director

Después del primer login con Google, ir a Supabase → Table Editor → `profiles`:

1. Buscar tu registro (por nombre o email en `auth.users`)
2. Cambiar el campo `role` de `member` a `director`

---

## Paso 6 — Correr en desarrollo

```powershell
# Agregar Node.js al PATH si es necesario
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

# En la carpeta del proyecto
npm run dev
```

Abrir `http://localhost:3000` en el navegador.

---

## Paso 7 — Deploy en Vercel

1. Subir el código a GitHub
2. Ir a [vercel.com](https://vercel.com) → New Project → importar el repo
3. Agregar las variables de entorno en Vercel → Settings → Environment Variables
4. Deploy automático en cada `git push`

---

## Configuración de Git (si no está hecha)

```bash
git config --global user.email "tu@email.com"
git config --global user.name "Tu Nombre"
git add .
git commit -m "feat: app de asistencia Xtasis — scaffold inicial"
```

---

## Solución de problemas comunes

| Problema | Causa | Solución |
|---|---|---|
| Error "URL and API key required" | No hay `.env.local` | Crear el archivo con las keys de Supabase |
| Redirige al login en bucle | El perfil no existe en `profiles` | Verificar que el trigger `on_auth_user_created` se ejecutó |
| No puede acceder al dashboard | El rol es `member` | Cambiar a `director` en la tabla `profiles` |
| Botón de check-in no aparece | El evento no aplica a la sección del miembro | Verificar `target_sections` del evento |
| Check-in fuera de ventana | La hora del evento ya pasó o aún no abre | Verificar `checkin_opens_at` del evento |
