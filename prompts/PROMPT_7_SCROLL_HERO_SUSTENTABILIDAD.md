# PROMPT 7 — Scroll-reveal hero en Sustentabilidad

## Contexto del proyecto
Stack: HTML + CSS + JS vanilla. Sin frameworks, sin bundler.
Convenciones del proyecto: BEM, CSS custom properties (`--color-crema`, `--color-azul`, etc.), módulos en el objeto global `Timbo`.
Archivo a modificar: `sustentabilidad.html`
Estilos: `assets/css/styles.css`
Imagen disponible: `assets/images/sustentabilidad/hero-sustentabilidad.jpg`

---

## Efecto a implementar

Un **scroll-driven clip-path hero**: una imagen que comienza recortada en el centro de la pantalla (rectángulo pequeño) y se expande hasta ocupar el ancho completo a medida que el usuario hace scroll. Simultáneamente, la imagen hace zoom-out (de 170% → 100% de background-size).

Inspirado en este componente React (traducir a vanilla JS):
- `clipPath` inicial: `polygon(25% 25%, 75% 25%, 75% 75%, 25% 75%)`
- `clipPath` final: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`
- `backgroundSize` inicial: `170%`, final: `100%`
- La interpolación ocurre mientras `scrollY` va de `0` a `1500px`
- El elemento usa `position: sticky; top: 0` para permanecer fijo durante el scroll

---

## Cambios en `sustentabilidad.html`

### 1. Agregar el bloque scroll-hero ANTES de `<main class="page-content">`

```html
<!-- SCROLL HERO -->
<div class="sust-scroll-hero">
  <div class="sust-scroll-hero__sticky">
    <div class="sust-scroll-hero__image" id="sustHeroImage"></div>
  </div>
</div>
```

### 2. NO modificar nada del `<main>` existente

El contenido actual (sust-hero, sust-section 01/02/03, sust-principles, sust-closing) queda intacto.

---

## Cambios en `assets/css/styles.css`

Agregar al final del archivo:

```css
/* ============================================================
   SUSTENTABILIDAD — Scroll Hero
   ============================================================ */

.sust-scroll-hero {
  height: calc(1500px + 100vh);
  position: relative;
  width: 100%;
}

.sust-scroll-hero__sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.sust-scroll-hero__image {
  position: absolute;
  inset: 0;
  background-image: url('../images/sustentabilidad/hero-sustentabilidad.jpg');
  background-size: 170%;
  background-position: center;
  background-repeat: no-repeat;
  clip-path: polygon(25% 25%, 75% 25%, 75% 75%, 25% 75%);
  will-change: clip-path, background-size;
}
```

---

## Cambios en `assets/js/main.js`

Agregar un nuevo módulo dentro del objeto `Timbo`, después del último módulo existente y antes del cierre del objeto:

```js
sustScrollHero: {
  init() {
    const imageEl = document.getElementById('sustHeroImage');
    if (!imageEl) return;

    const SCROLL_HEIGHT = 1500;

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function clamp(v, min, max) {
      return Math.min(Math.max(v, min), max);
    }

    function onScroll() {
      const progress = clamp(window.scrollY / SCROLL_HEIGHT, 0, 1);

      // clip-path: de polygon(25% 25%, 75% 25%, 75% 75%, 25% 75%) → polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)
      const start = lerp(25, 0, progress);
      const end   = lerp(75, 100, progress);
      imageEl.style.clipPath =
        `polygon(${start}% ${start}%, ${end}% ${start}%, ${end}% ${end}%, ${start}% ${end}%)`;

      // background-size: 170% → 100%
      const size = lerp(170, 100, progress);
      imageEl.style.backgroundSize = size + '%';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // estado inicial
  },
},
```

### También: llamar `Timbo.sustScrollHero.init()` al final del bloque de inicialización de `Timbo`

Dentro del `DOMContentLoaded` (o donde se llaman los demás `init()`), agregar:
```js
Timbo.sustScrollHero.init();
```

---

## Verificación esperada

1. Al cargar `sustentabilidad.html`, la imagen aparece como un rectángulo central (~50% del viewport).
2. Al hacer scroll, la imagen se expande progresivamente hasta cubrir toda la pantalla.
3. Mientras se expande, la imagen hace zoom-out (se aleja).
4. Al terminar el scroll del hero (~1500px), la imagen ocupa el 100% del viewport.
5. Luego el contenido normal de la página (secciones de texto) sigue debajo.
6. No hay errores en consola.
7. El efecto es fluido (no hay jank ni parpadeos).

---

## Notas

- No instalar ninguna librería. Todo en vanilla JS.
- No usar `requestAnimationFrame` — el listener `passive: true` en `scroll` es suficiente para este efecto.
- El módulo `sustScrollHero` solo se activa si existe `#sustHeroImage` en el DOM, por lo que no afecta otras páginas.
