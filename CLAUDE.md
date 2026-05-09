# Timbó Arquitectura — Proyecto Web

## Qué es
Sitio web estático para Timbó, estudio de arquitectura bioclimática argentino (Gerónimo Vigil y Mía Morrone). Vanilla HTML/CSS/JS, sin frameworks ni bundlers. Hosteado en Netlify.

## Repo
`https://github.com/Mariano-cell/timbo-arquitectura`

## Estructura del proyecto

```
timbo-arquitectura/
├── index.html                    (Home)
├── proyectos.html                (Listado de proyectos)
├── sustentabilidad.html          (Sustentabilidad)
├── sobre-nosotros.html           (Sobre nosotros)
├── contacto.html                 (Contacto + formulario)
├── proyectos/                    (Páginas individuales de proyecto)
│   ├── proyecto-exuma-lodge.html
│   ├── proyecto-haras-san-pablo.html
│   ├── proyecto-tobar-lodge.html
│   ├── proyecto-cabana-suinda.html
│   └── proyecto-cherokee-ave.html
├── assets/
│   ├── css/
│   │   ├── variables.css         (Reset, @font-face, custom properties)
│   │   └── styles.css            (Todos los estilos)
│   ├── js/
│   │   ├── main.js               (Objeto global Timbo + todos los módulos)
│   │   ├── data.js               (Contenido bilingüe ES/EN centralizado)
│   │   └── charts.js             (Gráficos climáticos SVG)
│   ├── fonts/
│   │   ├── autaut-grotesk/       (Tipografía anterior — conservar por si se reutiliza)
│   │   └── neue-haas-grotesk-display-pro-cufonfonts/  (Tipografía nueva)
│   ├── images/
│   └── interactives/             (Modelos 3D embebidos)
├── netlify/
│   └── functions/
│       └── contact.js            (Serverless function para formulario de contacto)
├── netlify.toml
└── prompts/                      (Prompts usados con Claude Code / Codex)
```

## Convenciones de código

### HTML
- Secciones con comentarios descriptivos `<!-- ====== NOMBRE ====== -->`
- Atributo `data-nav-theme="dark|light"` en cada section para controlar el color del nav
- Atributo `data-i18n="clave.subclave"` para textos bilingües
- Atributo `data-i18n-html="true"` cuando el valor contiene HTML (ej: `<strong>`, `<br>`)
- Clases de animación: `anim-fade-up`, `anim-fade-in`, `anim-wind-in` con `data-anim-delay="ms"`

### CSS
- BEM: `.bloque__elemento--modificador`
- Custom properties en `:root` de `variables.css`
- Todas las secciones de cada página agrupadas con comentarios `/* ========================= NOMBRE ========================= */`
- Mobile-first no: es desktop-first con `@media (max-width: ...)` para responsive

### JS
- Objeto global `Timbo` con módulos que tienen método `init()`
- `Timbo.init()` se llama en `DOMContentLoaded` y ejecuta todos los módulos
- `data.js` exporta `SITE_DATA` con estructura `{ seccion: { es: {...}, en: {...} } }`
- `charts.js` tiene `TimboCharts` con módulos para gráficos climáticos
- SVG nativo para diagramas (no D3, no Chart.js)
- IntersectionObserver para scroll-triggered animations y visibilidad
- `document.createElementNS('http://www.w3.org/2000/svg', ...)` para crear SVG dinámico

## Paleta de colores (variables.css)

### Escala de grises
| Variable | Valor | Uso |
|---|---|---|
| `--color-gray-100` | `#F6F6F6` | Fondo claro principal (`--color-bg-light`) |
| `--color-gray-200` | `#DADADA` | Bordes, separadores |
| `--color-gray-300` | `#9D9D9C` | Texto muted |
| `--color-gray-400` | `#575756` | Texto secundario (`--color-text-muted`) |
| `--color-gray-500` | `#3C3C3B` | Fondo oscuro (`--color-bg-dark`) |
| `--color-black` | `#1D1D1B` | Texto principal (`--color-text-primary`) |

### Acentos
| Variable | Valor |
|---|---|
| `--color-olive` | `#9EA052` |
| `--color-forest` | `#74793E` |
| `--color-earth` | `#6D4D0B` |
| `--color-sky` | `#BCD8ED` |

## Tipografía

### Tipografía activa: Neue Haas Grotesk Display Pro
Migración completada. `--font-primary` apunta a `'Neue Haas Grotesk Display Pro'`. Archivos en `assets/fonts/neue-haas-grotesk-display-pro-cufonfonts/`. La carpeta `autaut-grotesk/` se conserva por si se reutiliza.

Mapeo de pesos:

| Peso CSS | Archivo Neue Haas | Nota |
|---|---|---|
| 400 (Regular) | `NeueHaasDisplayRoman.ttf` | |
| 500 (Medium) | `NeueHaasDisplayMediu.ttf` | Typo en el nombre del archivo (falta "m") |
| 700 (Bold / Semibold) | `NeueHaasDisplayBold.ttf` | Neue Haas no tiene Semibold; `--fw-semibold: 700` |
| 900 (Black) | `NeueHaasDisplayBlack.ttf` | |

### Escala tipográfica actual
```
--text-xs:   0.75rem   (12px)
--text-sm:   0.875rem  (14px)
--text-base: 1.25rem   (20px)
--text-lg:   1.125rem  (18px)
--text-xl:   1.25rem   (20px)
--text-2xl:  1.5rem    (24px)
--text-3xl:  2rem      (32px)
--text-4xl:  2.5rem    (40px)
--text-5xl:  3.5rem    (56px)
--text-6xl:  4.5rem    (72px)
--text-hero: 5rem      (96px)
```

### Pesos usados
```
--fw-regular:  400
--fw-medium:   500
--fw-semibold: 700  (no existe semibold en Neue Haas; usa Bold)
--fw-bold:     700
--fw-black:    900
```

## Espaciado
```
--space-xs:  0.25rem  (4px)
--space-sm:  0.5rem   (8px)
--space-md:  1rem     (16px)
--space-lg:  1.5rem   (24px)
--space-xl:  2rem     (32px)
--space-2xl: 3rem     (48px)
--space-3xl: 4rem     (64px)
--space-4xl: 6rem     (96px)
--space-5xl: 8rem     (128px)
```

## Layout
```
--max-width:     1200px
--nav-height:    60px
--border-radius: 12px
```

## Navegación (header)
- `position: fixed`, `z-index: 100`
- Sin scroll: fondo transparente, color según `data-nav-theme` de la sección activa
- Con scroll (clase `main-nav--scrolled` después de 900px): fondo `#f6f6f6` con fade-in de opacidad, color negro para los navlinks. Sin blur, sin border.
- El threshold de scroll es configurable en `Timbo.navScroll.SCROLL_THRESHOLD` (main.js)

## Páginas — estado actual

### Home (index.html)
- Hero: video de fondo
- Hero tagline con palabras **Arquitectura**, **clima**, **naturaleza** en `<strong>` (fw-bold)
- Intro: dos columnas (texto + fotos), segundo bloque con foto + ícono SVG + texto
- Featured project: imagen full-width (sin animación de expansión)
- Philosophy section
- Footer dinámico renderizado por JS

### Proyectos (proyectos.html)
- Título "Proyectos Seleccionados" en `font-weight: regular`
- Lista de items con hover que ilumina el activo y apaga los demás
- Items con font-size 3rem, padding 0.85rem, CTA a 18px

### Sustentabilidad (sustentabilidad.html)
- Hero con imagen de fondo
- Overview: grid 2 columnas con SVG circular de estrategias (8 puntos)
- Process: modelo 3D interactivo con controles (toggle sol, velocidad)
- Climate: señales climáticas con iconos + gráficos (temp/humedad implementado, otros pendientes)
- Breathe: imagen full-bleed con texto
- Metrics: barras animadas con contadores
- Strategies: SVG circular full-width con 8 estrategias bioclimáticas detalladas
- **Todos los textos en negro** (se cambió recientemente de blanco a negro)
- Color de fondo de las secciones: `#b8b37a` (oliva)

### Sobre Nosotros (sobre-nosotros.html)
- Hero, founders (retratos + bio), approach, final section

### Contacto (contacto.html)
- Hero con imagen de fondo
- Formulario (nombre, email, asunto, mensaje) que envía a Netlify serverless function
- Info lateral (email, Instagram, ubicación)
- La serverless function (`netlify/functions/contact.js`) valida y loguea; tiene instrucciones para conectar Resend/SendGrid

## Módulos JS principales (main.js)
| Módulo | Función |
|---|---|
| `Timbo.i18n` | Detección y cambio de idioma ES/EN |
| `Timbo.navScroll` | Clase `main-nav--scrolled` al pasar threshold |
| `Timbo.navTheme` | Cambio dark/light según sección visible |
| `Timbo.navIntro` | Animación de entrada del nav |
| `Timbo.scrollReveal` | IntersectionObserver para `anim-fade-up`, `anim-fade-in` |
| `Timbo.footer` | Renderiza footer dinámicamente |
| `Timbo.floatingLogo` | Logo flotante con cambio de z-index por fase |
| `Timbo.heroIntro` | Animación de entrada del hero home |
| `Timbo.sustHeroIntro` | Animación de entrada del hero sustentabilidad |
| `Timbo.imageExpand` | Scroll-driven expansion de imagen (actualmente desactivado vía CSS) |
| `Timbo.contactForm` | Envío del formulario vía fetch a Netlify function |
| `Timbo.projectsList` | Renderiza lista de proyectos desde SITE_DATA |

## Gráficos climáticos (charts.js)
| Módulo | Estado |
|---|---|
| `TimboCharts.tempHumidity` | Implementado y funcionando |
| `TimboCharts.solarRadiation` | Prompt generado (PROMPT_8), pendiente de aplicar |
| `TimboCharts.windRose` | Prompt generado (PROMPT_9), pendiente de aplicar |
| `TimboCharts.rainfall` | Prompt generado (PROMPT_10), pendiente de aplicar |

## Notas importantes
- No usar frameworks, bundlers ni librerías externas (excepto JetBrains Mono para código)
- SVG nativo para todos los diagramas y gráficos
- Prompts para Claude Code / Codex se guardan en `prompts/`
- El archivo `data.js` centraliza todo el contenido bilingüe — cualquier texto nuevo debe ir ahí
- Las animaciones usan `is-visible` class toggleada por IntersectionObserver
