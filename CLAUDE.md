# Timbó Arquitectura — Proyecto Web

## Qué es
Sitio web estático para Timbó, estudio de arquitectura bioclimática argentino (Gerónimo Vigil y Mía Morrone). Vanilla HTML/CSS/JS, sin frameworks ni bundlers. Hosteado en Netlify.

## ⚠️ REGLA CRÍTICA: Mobile vs Desktop

**El sitio es desktop-first.** El CSS base (fuera de cualquier `@media`) define la versión desktop. Los estilos mobile viven dentro de `@media (max-width: ...)`.

Cuando se trabaja en **mobile**:
- TODA modificación debe ir dentro de un bloque `@media (max-width: ...)` apropiado (ver "Breakpoints estándar" abajo).
- NUNCA modificar las reglas CSS de afuera de los `@media` queries — esas son las de desktop y deben quedar intactas.
- Si hace falta cambiar un valor que está en `:root` o en una custom property, verificar antes si ese valor también afecta desktop. Si afecta a ambos, NO cambiarlo: en su lugar, sobreescribir la propiedad sólo dentro del `@media` mobile.
- Antes de tocar cualquier selector, chequear si ya existe una regla para ese selector en desktop. Si existe, la versión mobile debe estar en `@media`, no reemplazar la de desktop.
- Si una modificación de HTML o JS podría afectar desktop (ej. agregar/sacar un elemento, cambiar estructura), avisar antes y proponer cómo aislarla (clases condicionales, `matchMedia`, etc.).

Cuando se trabaja en **desktop**: aplica la regla inversa — no tocar lo que está dentro de los `@media (max-width: ...)`.

Si una modificación impacta ambos, hay que decirlo explícitamente antes de aplicarla.

## Breakpoints estándar

El sitio usa **dos modos** (mobile y desktop) con un solo breakpoint principal en **1024px**.

| Modo | Ancho | Breakpoint CSS | Cubre |
|---|---|---|---|
| Celular chico (opcional) | ≤480px | `@media (max-width: 480px)` | iPhone SE y similares cuando hace falta ajuste fino |
| Mobile + tablet vertical | ≤1023.98px | `@media (max-width: 1023.98px)` | Celulares y tablets en orientación vertical |
| Desktop + tablet horizontal | ≥1024px | (default, sin `@media`) | Tablets horizontales, laptops, monitores |

**Reglas:**
- El breakpoint principal para mobile nuevo es **1024px** (`max-width: 1023.98px`).
- Sólo se usa `480px` cuando un ajuste específico no se ve bien en celulares chicos.
- NO se agregan breakpoints nuevos (`640`, `700`, `768`, `900`, `980`, `1100`, etc.) sin discutirlo primero.
- **Importante:** el archivo `styles.css` actual tiene muchos `@media` viejos con breakpoints variados (`480`, `640`, `700`, `768`, `900`, `980`, `1080`, `1100`, `1366`, `1535`). Esto es legacy.

### Pantalla de referencia de diseño (mobile)

La diseñadora trabaja los mockups mobile sobre un viewport de **375 × 667 px** (referencia tipo iPhone SE / 6 / 7 / 8). Esta es la **pantalla base** sobre la que se implementa la versión mobile.

**Flujo de trabajo mobile:**
1. Implementar primero los estilos para que coincidan **exactamente** con el diseño a 375 × 667 px.
2. Una vez que esa pantalla está fiel al mockup, **adaptar** los estilos para que escalen bien en otros tamaños de mobile (anchos mayores hasta 1023.98px, y eventualmente ajustes finos en ≤480px).
3. Las medidas, proporciones y tamaños tipográficos del mockup están pensadas para 375px de ancho — al adaptar a otros tamaños, mantener la proporción visual, no copiar valores absolutos sin criterio.

Esto NO cambia los breakpoints CSS (siguen siendo 1023.98px y 480px); 375 × 667 es la **resolución de referencia para diseño**, no un breakpoint nuevo.

### Migración oportunista

NO se migra el `styles.css` viejo de golpe (riesgo alto, poca recompensa). En su lugar:
- Cuando volvamos a tocar una sección por otra razón (ajuste, bugfix, feature nuevo), **aprovechamos y migramos sus `@media` viejos al estándar de 1024px**.
- Si un `@media` viejo está en `768px` y no estamos por entrar a esa sección, se queda como está.
- Si se modifica una regla dentro de un `@media` viejo, considerar primero si la sección entera está lista para migrarse, o si conviene dejarla en el breakpoint viejo hasta más adelante.

### Formato para `@media` mobile nuevos

Cada `@media` mobile nuevo va **al final de su sección** (antes del próximo header `/* ===== ... ===== */`), con este formato:

```css
/* --- MOBILE --- */
@media (max-width: 1023.98px) {
  /* reglas mobile de esta sección */
}

/* --- MOBILE CHICO (opcional) --- */
@media (max-width: 480px) {
  /* sólo si hace falta ajuste extra para celulares chicos */
}
```

Así cada sección queda autocontenida: desktop arriba, mobile pegado abajo.

## ⭐ Estándar oficial para títulos y párrafos — versión mobile (`estandar-a-mobile`)

Este es el **estándar de comportamiento tipográfico mobile** del sitio. Se aplica dentro de `@media (max-width: 1023.98px)` a títulos, etiquetas (kickers/labels) y párrafos de las secciones que usen este patrón.

**Nombre corto:** `estandar-a-mobile`. El usuario puede pedir aplicarlo refiriéndose a él por este nombre, y aclarará si se refiere al **estándar para título** (`.selector__claim`), al **estándar para párrafo** (`.selector__text`) o al **estándar para label/kicker** (`.selector__label`). Si dice "estandar-a-mobile" sin aclarar, se aplica el bloque entero (label + claim + text + body gap).

**No se aplica automáticamente a todas las secciones** — sólo a las que indique el usuario. Pero cuando se aplica, se usan estos valores tal cual (o se adaptan proporcionalmente si el diseño lo pide).

### Reglas de oro

1. **Sólo afecta mobile.** Todas estas reglas van DENTRO de `@media (max-width: 1023.98px)`. El CSS desktop (fuera del `@media`) NO se toca jamás al aplicar este estándar.
2. **Antes de aplicar, leer el desktop.** Si la sección destino tiene tamaños desktop muy distintos a los de `.intro`, los `clamp()` mobile pueden necesitar ajuste proporcional (no copiar y pegar a ciegas).
3. **Escalado fluido entre 375px y 1023px.** Los `clamp()` están calculados para que arranquen en el valor de 375px (mockup base) y crezcan suavemente hasta 1023px. No se pisan con desktop porque a 1024px sale del `@media`.
4. **El valor del medio del `clamp()` SIEMPRE lleva `vw`.** Si los tres valores son fijos (sin `vw`), `clamp()` no escala — siempre devuelve el del medio. Eso es un bug, no es el estándar.
5. **El bloque contenedor (flex/grid column) usa `gap: var(--space-md)` (16px)** entre label, título y párrafo en mobile, en vez de los gaps más grandes de desktop.

### Valores estándar

```css
@media (max-width: 1023.98px) {
  /* Etiqueta / kicker (ej. "Sección 02") */
  .selector__label {
    /* Fluid: 10px @ 375px → 14px @ 1023px */
    font-size: clamp(0.625rem, 0.62vw + 0.39rem, 0.875rem);
  }

  /* Título principal de la sección */
  .selector__claim {
    /* Fluid: 28px @ 375px → 40px @ 1023px */
    font-size: clamp(1.75rem, 1.85vw + 1.06rem, 2.5rem);
  }

  /* Párrafo / texto del cuerpo */
  .selector__text {
    /* Fluid: 16px @ 375px → 23px @ 1023px */
    font-size: clamp(1rem, 1.08vw + 0.747rem, 1.4375rem);
    max-width: clamp(16rem, 80vw, 30rem);
  }

  /* Contenedor flex en columna que agrupa label + claim + text */
  .selector__body {
    gap: var(--space-md); /* 16px — mitad del gap desktop típico */
  }
}
```

### Referencia: cómo se ven los tamaños en distintos anchos

| Ancho | label | claim | text |
|---|---|---|---|
| 375px | 10px | 28px | 16px |
| 500px | ~10.8px | ~30.3px | ~17.3px |
| 700px | 12px | 34px | ~19.5px |
| 900px | ~13.3px | ~37.7px | ~21.7px |
| 1023px | 14px | 40px | 23px |

### Origen del estándar

Calibrado sobre la sección `.intro` de `index.html` (home). Si se modifican los valores del estándar, actualizarlos primero en esta sección de `CLAUDE.md` y luego propagar a las secciones donde ya esté aplicado.

### Cómo aplicar a una sección nueva

1. Identificar los selectores equivalentes: el label (kicker), el título y el párrafo.
2. Identificar el contenedor flex/grid que los agrupa (equivalente a `.intro__body`).
3. Dentro del `@media (max-width: 1023.98px)` de esa sección, agregar los cuatro bloques de arriba con los nombres reales de los selectores.
4. Verificar que NO existan reglas desktop que se vayan a pisar, y que NO se modifiquen reglas fuera del `@media`.
5. Probar resize entre 375px y 1023px — los tres tamaños deben crecer gradualmente.

## ⭐ Estándar oficial para títulos y párrafos — versión desktop (`estandar-desktop`)

Este es el **estándar de comportamiento tipográfico desktop** del sitio. Se aplica FUERA de cualquier `@media (max-width: ...)`, es decir, en el CSS base que toma efecto a partir de **1024px** de ancho.

**Nombres oficiales** (el usuario los invoca por estos nombres en cualquier chat):

- `estandar-desktop para parrafo` → aplica el bloque de **párrafo**.
- `estandar-desktop para titulo` → aplica el bloque de **título**.
- `estandar-desktop para frase-destacada` → aplica el bloque de **frase destacada**.

Si el usuario dice `estandar-desktop` sin aclarar, preguntar a cuál de los tres se refiere.

### Reglas de oro

1. **Sólo afecta desktop.** Estos bloques van FUERA de los `@media (max-width: ...)`. Las reglas mobile (dentro de `@media`) NO se tocan jamás al aplicar este estándar. Si la sección destino ya tiene `estandar-a-mobile` aplicado, ambos conviven sin pisarse porque viven en bloques distintos.
2. **El valor del medio del `clamp()` SIEMPRE lleva `vw`.** Si los tres valores son fijos, `clamp()` no escala. Eso es un bug, no el estándar.
3. **Escalado fluido desde 1024px hacia arriba.** Los `clamp()` están calculados para arrancar en el valor mínimo cerca del breakpoint mobile/desktop y crecer hasta el máximo en pantallas grandes.
4. **Antes de aplicar, leer el desktop existente.** Si la sección destino ya tiene tamaños desktop muy distintos, conviene revisar si el reemplazo total tiene sentido o si hay que adaptar proporcionalmente.

### Valores estándar

```css
/* === estandar-desktop para parrafo === */
.selector__text {
  font-size: clamp(1.125rem, 0.4vw + 1rem, 1.375rem);
  letter-spacing: 0.03em;
  line-height: 1.35;
  font-weight: var(--fw-regular);
}

/* === estandar-desktop para titulo === */
.selector__claim {
  font-size: clamp(1.875rem, 1.7vw + 0.85rem, 2.75rem);
  letter-spacing: 0.04em;
  line-height: 1.05;
  font-weight: var(--fw-medium);
}

/* === estandar-desktop para frase-destacada === */
.selector__highlight {
  font-size: clamp(1.125rem, 0.4vw + 1rem, 1.375rem);
  letter-spacing: 0.03em;
  line-height: 1.5;
  font-weight: var(--fw-bold);
}
```

### Resumen rápido

| Estándar | font-size (clamp) | letter-spacing | line-height | font-weight |
|---|---|---|---|---|
| `parrafo` | `clamp(1.125rem, 0.4vw + 1rem, 1.375rem)` | `0.03em` | `1.35` | `--fw-regular` (400) |
| `titulo` | `clamp(1.875rem, 1.7vw + 0.85rem, 2.75rem)` | `0.04em` | `1.05` | `--fw-medium` (500) |
| `frase-destacada` | `clamp(1.125rem, 0.4vw + 1rem, 1.375rem)` | `0.03em` | `1.5` | `--fw-bold` (700) |

Notar que **`parrafo` y `frase-destacada` comparten font-size y letter-spacing**; las diferencian el `line-height` (1.35 vs 1.5) y el `font-weight` (regular vs bold).

### Cómo aplicar a una sección nueva

1. Identificar los selectores reales de esa sección (el título, los párrafos, las frases destacadas si las hay).
2. Reemplazar `.selector__claim`, `.selector__text`, `.selector__highlight` por los nombres reales.
3. Pegar el/los bloques **fuera** de cualquier `@media (max-width: ...)`.
4. Verificar que no haya reglas desktop previas para los mismos selectores que vayan a quedar duplicadas o en conflicto — si existen, decidir si se reemplazan o se mergean.
5. NO tocar reglas dentro de `@media (max-width: 1023.98px)` ni similares.

## Saltos de línea responsive: `<br>` mobile vs desktop

Muchos textos del sitio tienen `<br>` pensados para el ritmo de **desktop** (donde el ancho es grande y los saltos quedan elegantes), pero en mobile esos mismos `<br>` cortan el texto en lugares incómodos. Y al revés: a veces en mobile querés un salto en un lugar específico que en desktop no tiene sentido.

No hay una regla automática para decidir esto — es **manual y caso por caso**. El usuario va a ir indicando, párrafo por párrafo, qué `<br>` desaparece en mobile o qué `<br>` se agrega sólo para mobile.

### Clases utilitarias

En `styles.css` (zona de utilities globales, fuera de cualquier `@media` específico de sección):

```css
/* === BR responsive === */
.br-desktop { display: inline; }
.br-mobile  { display: none; }

@media (max-width: 1023.98px) {
  .br-desktop { display: none; }
  .br-mobile  { display: inline; }
}
```

El breakpoint es **el mismo que usa el resto del sitio para mobile**: `1023.98px`. No se agrega un breakpoint propio para esto.

### Cómo se usan

| Caso | Clase | Resultado |
|---|---|---|
| `<br>` que sirve en desktop pero estorba en mobile | `<br class="br-desktop">` | Visible ≥1024px, oculto ≤1023.98px |
| `<br>` que sirve sólo en mobile | `<br class="br-mobile">` | Oculto ≥1024px, visible ≤1023.98px |
| `<br>` que sirve en ambos | `<br>` sin clase | Visible siempre (comportamiento default) |
| `<br>` que no sirve en ninguno | (borrarlo) | — |

### Estrategia de migración: manual y guiada por el usuario

- Los `<br>` existentes **se quedan como están** (visibles en ambos viewports) hasta que el usuario indique explícitamente qué hacer con cada uno.
- El usuario va a ir revisando los textos uno por uno y diciendo cosas como:
  - "este `<br>` desaparece en mobile" → agregar `class="br-desktop"`.
  - "acá agregamos un `<br>` sólo para mobile" → insertar `<br class="br-mobile">` donde corresponda.
- **No** hacer migración masiva ni asumir comportamiento. Sólo se toca el `<br>` que el usuario menciona en ese momento.
- Cuando se agrega un `<br class="br-mobile">` nuevo, NO altera el HTML que ve desktop (porque la clase lo oculta), así que es seguro hacerlo sin romper desktop.

### Reglas

1. **Nunca borrar un `<br>` existente sin que el usuario lo pida.** Pueden estar afectando el ritmo de desktop.
2. **Nunca agregar un `<br>` "pelado" (sin clase) nuevo** si la intención es que sólo aparezca en un viewport — usar `br-desktop` o `br-mobile`.
3. Si el usuario pide ocultar un `<br>` en mobile, agregar `class="br-desktop"` al `<br>` existente (no borrarlo, no envolverlo en nada raro).
4. Las clases viven en `styles.css` como utilities globales, **no** dentro del CSS de una sección específica.

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
