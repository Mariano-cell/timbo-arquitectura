# Prompt para Claude Code — Nueva estrategia de floating logo con z-index por capas

## Contexto del proyecto

Sitio web vanilla HTML/CSS/JS (sin frameworks). Los archivos relevantes son:
- `index.html` — página principal
- `assets/css/styles.css` — estilos
- `assets/js/main.js` — lógica JS organizada en un objeto `Timbo` con módulos (cada funcionalidad es un sub-objeto con `init()`)

## Qué hay que hacer

Reemplazar completamente la estrategia actual del floating logo (el logo fijo en la esquina inferior izquierda). El sistema actual usa un solo contenedor `<a class="floating-logo">` con dos imágenes apiladas (negra y blanca) dentro de un `<span class="floating-logo__stack">`, y cambia la opacidad de cada imagen según la sección. Hay que eliminarlo y reemplazarlo con un sistema de capas basado en z-index.

## Nueva estrategia

### Estructura HTML

En vez de un solo contenedor con dos imágenes, crear **dos elementos separados e independientes**, posicionados en el mismo lugar (misma posición fixed, mismo tamaño):

```html
<!-- Logo negro — z-index más alto por defecto -->
<a href="index.html" class="floating-logo floating-logo--black" aria-label="Go to home">
  <img src="assets/images/logo/timbo-negro.svg" alt="Timbó">
</a>

<!-- Logo blanco — z-index más bajo por defecto -->
<a href="index.html" class="floating-logo floating-logo--white" aria-label="Go to home">
  <img src="assets/images/logo/timbo-blanco.svg" alt="Timbó">
</a>
```

Ambos deben ser insertados por JS en `Timbo.floatingLogo.render()`.

### Sistema de capas (z-index)

La idea central es que los z-index de los logos y de las imágenes de la página cambian según qué sección está a la altura del logo. Esto crea un efecto donde las imágenes de la página "pasan entre" los dos logos, revelando uno u otro.

**Fase 1: Hero section (estado por defecto)**

Mientras el hero está visible a la altura del logo:
- `.hero__bg` — z-index: **30** (por encima de ambos logos → tapa a los dos)
- `.floating-logo--black` — z-index: **20**
- `.floating-logo--white` — z-index: **10**

Resultado visual: no se ve ningún logo (la imagen del hero tapa todo).

**Fase 2: Secciones intermedias (intro, entre hero y featured)**

Cuando la hero image ya pasó pero todavía no llegamos al featured-project:
- `.floating-logo--black` — z-index: **20** (visible, por encima de todo)
- `.floating-logo--white` — z-index: **10** (detrás del negro, no se ve)

Resultado visual: se ve el logo negro.

**Fase 3: Featured project**

Cuando `.featured-project__image` está a la altura del logo:
- `.floating-logo--white` — z-index: **30** (por encima de la imagen → se ve el blanco)
- `.featured-project__image` — z-index: **20** (por encima del negro → tapa al negro)
- `.floating-logo--black` — z-index: **10** (detrás de la imagen → no se ve)

Resultado visual: se ve el logo blanco sobre la foto oscura.

**Fase 4: Después del featured project (philosophy, footer, etc.)**

Vuelve al estado de fase 2:
- `.floating-logo--black` — z-index: **20** (visible)
- `.floating-logo--white` — z-index: **10** (detrás)

Resultado visual: se ve el logo negro.

### Implementación JS

Reescribir `Timbo.floatingLogo` completamente. El módulo debe:

1. **render()**: crear los dos elementos `<a>` separados y appendearlos al body.

2. **init()**: usar un Intersection Observer (o scroll listener) que detecte cuándo `.hero` y `.featured-project__image` están a la altura del logo (zona inferior del viewport, donde vive el logo). Según qué sección esté a esa altura, aplicar clases CSS al body o a los propios elementos que disparen los cambios de z-index.

   Sugerencia de implementación: usar clases en el `<body>` que representen la "fase" activa:
   - `body.logo-phase--hero` → fase 1
   - `body.logo-phase--default` → fases 2 y 4
   - `body.logo-phase--featured` → fase 3

   El observer debe mirar la zona inferior del viewport (donde está el logo) con un rootMargin que recorte la parte superior. Algo como `rootMargin: '-85% 0px 0px 0px'` para solo detectar intersecciones en el 15% inferior del viewport.

3. Los z-index se definen en CSS y se activan con las clases del body.

### Implementación CSS

Eliminar todas las clases actuales del floating logo:
- `.floating-logo`
- `.floating-logo--visible`
- `.floating-logo--under-hero`
- `.floating-logo__img`
- `.floating-logo__stack`
- `.floating-logo__img--black`
- `.floating-logo__img--white`
- `.floating-logo--on-featured`

Reemplazar con:

```css
/* Posición compartida para ambos logos */
.floating-logo {
  position: fixed;
  left: var(--space-lg);
  bottom: var(--space-lg);
  display: block;
  width: clamp(58px, 7.3vw, 110px);
  line-height: 0;
  transition: z-index 0s; /* z-index no transiciona, pero ayuda a documentar */
}

.floating-logo img {
  display: block;
  width: 100%;
  height: auto;
}

/* Fase por defecto (y fases 2/4): logo negro visible, blanco detrás */
.floating-logo--black {
  z-index: 20;
}

.floating-logo--white {
  z-index: 10;
}

/* Fase 1: Hero — ambos logos debajo de hero__bg */
body.logo-phase--hero .floating-logo--black {
  z-index: 20;
}
body.logo-phase--hero .floating-logo--white {
  z-index: 10;
}

/* Fase 3: Featured — blanco arriba, negro abajo */
body.logo-phase--featured .floating-logo--white {
  z-index: 30;
}
body.logo-phase--featured .floating-logo--black {
  z-index: 10;
}
```

También hay que ajustar los z-index de los elementos de la página:

```css
/* Hero background siempre z-index 30 para tapar ambos logos */
.hero__bg {
  z-index: 30;
}

/* Hero content debe estar por encima del bg */
.hero__content {
  z-index: 40;
}

/* Featured project image: z-index 20 para pasar entre los logos en fase 3 */
body.logo-phase--featured .featured-project__image {
  z-index: 20;
}
```

### Notas importantes

- El `.hero__bg` actualmente tiene `z-index: 10`. Hay que subirlo a `30`. Ajustar `.hero__content` a `40` para que siga por encima.
- `.featured-project__image` actualmente tiene `position: relative`. Eso está bien, necesita position para que z-index funcione.
- No agregar `position: relative` al body (rompería los fixed).
- Los z-index de `.featured-project__image` solo necesitan cambiar en fase 3. En las demás fases puede quedar en `auto` o el valor que tenga.
- El logo ya no necesita lógica de "aparecer/desaparecer" con scroll threshold. Ahora siempre está presente, solo que los z-index hacen que se tape o se revele según la sección.
- La transición entre fases debe ser instantánea (sin fade de opacidad). El efecto de "revelado" lo produce naturalmente el scroll: a medida que la imagen de hero sale del viewport por arriba, va dejando de tapar al logo negro.

### Responsive

```css
@media (max-width: 768px) {
  .floating-logo {
    left: var(--space-md);
    bottom: var(--space-md);
  }
}
```

## Archivos a modificar
- `assets/css/styles.css` — reemplazar sección "LOGO FIJO" completa, ajustar z-index de `.hero__bg` y `.hero__content`
- `assets/js/main.js` — reescribir `Timbo.floatingLogo` completamente

## Archivos que NO hay que modificar
- `index.html`
- `assets/css/variables.css`
- `assets/js/data.js`

## Qué hay que eliminar
- En CSS: todas las clases `.floating-logo__stack`, `.floating-logo__img`, `.floating-logo__img--black`, `.floating-logo__img--white`, `.floating-logo--on-featured`, `.floating-logo--under-hero`
- En JS: toda la lógica actual de `floatingLogo` (render, observeFeaturedSection, updateHeroLayer, init) — reemplazar con la nueva
