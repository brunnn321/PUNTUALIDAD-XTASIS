# Design

## Theme

Light mode con fondo gris claro (`gray-50`). El modo oscuro está declarado en `globals.css` via `prefers-color-scheme` pero no se usa activamente en la UI todavía. La app vive en mobile-first: single-column, max-width 512px (`max-w-lg`), padding lateral de 16px.

Registro visual: **product**. Herramienta interna de gestión, no marketing.

## Color

Paleta OKLCH derivada del logo de Xtasis (magenta-rosa dominante, hue 335):

| Token CSS | OKLCH | Rol |
|---|---|---|
| `--brand-500` | `oklch(0.55 0.28 335)` | Primary — CTA, nav activo, acciones (`#c0278a` aprox) |
| `--brand-600` | `oklch(0.47 0.26 335)` | Hover / dark state |
| `--brand-50` | `oklch(0.97 0.02 335)` | Surface tint — stat cards, badges |
| `--brand-100` | `oklch(0.93 0.06 335)` | Backgrounds suaves |
| `--brand-200` | `oklch(0.86 0.12 335)` | Borders, separadores |
| `--background` | `oklch(0.98 0.005 335)` | Body — near-white tintado al brand |
| `--foreground` | `oklch(0.14 0.006 335)` | Ink principal |

Utilidades Tailwind: `bg-brand-500`, `text-brand-500`, `border-brand-200`, `ring-brand-500`, etc.

Semántica invariante:
- Danger: `red-500` / `red-50` — multas, errores
- Success: `green-600` / `green-50` — asistencia presente
- Warning: `amber-500` / `amber-50` — tardanzas

**themeColor PWA**: `#c0278a` (brand-500)

## Typography

| Elemento | Stack actual |
|---|---|
| Font principal | Geist Sans (Google Fonts via `next/font`) |
| Font mono | Geist Mono |
| Variable CSS | `--font-geist` |
| Body fallback | `Arial, Helvetica, sans-serif` (en `globals.css`, a reemplazar) |

Escala de tamaños en uso:
- `text-sm` (14px) — labels, meta, nav labels
- `text-base` (16px) — body
- `text-xl` / `text-2xl` — headings de página
- `text-3xl font-bold tracking-tight` — hero/nombre en login

No hay escala de tipo declarada como tokens. Se usa Tailwind utilities directamente.

## Spacing & Layout

- Container: `max-w-lg mx-auto` (512px) + `p-4` (16px padding)
- Secciones: `space-y-6` entre bloques principales
- Cards: `space-y-4` o `space-y-3`
- Grids de stats: `grid grid-cols-2 gap-3`
- Padding de cards: `p-4` o `p-8` (login)

No hay escala de spacing como tokens — todo Tailwind utilities.

## Components

### Bottom Nav
Fixed, `bg-white border-t border-gray-200 z-50`. Flex de 4 items iguales.
- Activo: `text-violet-600`
- Inactivo: `text-gray-500 hover:text-gray-900`
- Icon size: 22px, label: `text-xs`

### CTA / Button primario
```
bg-violet-600 text-white font-medium px-4 py-2 rounded-xl
```
Con icon inline: `flex items-center gap-1.5`

### Button secundario / borde
```
border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700
```

### Stat Card
`bg-{color}-50 rounded-xl p-4` con icon de 20px + label `text-xs text-gray-500` + valor `text-2xl font-bold`

### Alert / Error inline
`flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3`

### Login surface
`bg-white rounded-2xl shadow-xl p-8` sobre fondo `bg-gradient-to-br from-violet-700 to-purple-900`

### Border radius
- Cartas y panels: `rounded-xl` (12px) — estándar en toda la app
- Login card: `rounded-2xl` (16px)
- Badges/chips: `rounded-full`

## Icons

Lucide React — tamaños usados: 16px (inline en texto), 20px (stat cards), 22px (nav), 40px (hero logo)

## Motion

Sin animaciones definidas actualmente. `transition-colors` en hover states de nav y botones. Oportunidad clara.

## Patterns & Notes

- Heading de página: `<p className="text-sm text-gray-500">Subtítulo</p>` + `<h1 className="text-2xl font-bold text-gray-900">Título</h1>` — patrón consistente
- Spacing top en primera sección: `pt-6`
- `cn()` de `@/lib/utils` para clases condicionales (clsx + tailwind-merge)
- PWA completo: manifest, push notifications, Apple web app capable
