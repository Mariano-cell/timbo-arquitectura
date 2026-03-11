# Prompts para Codex — Animaciones de entrada

## Contexto general (incluir siempre al inicio de cada prompt)

```
Estoy trabajando en un sitio web para Timbó, un estudio de arquitectura ecológica y bioclimática. La identidad visual es sobria, de tonos fríos (grises, verdes apagados) y orientada a la naturaleza. Todas las animaciones deben sentirse orgánicas y naturales — como fenómenos de la naturaleza (vegetación que crece, niebla que se disipa, viento que fluye). Nada mecánico, sin rebotes, sin flashes. Usá animaciones CSS disparadas por Intersection Observer cuando los elementos entren al viewport. El easing debe sentirse orgánico: usá cubic-bezier(0.22, 0.61, 0.36, 1) para todas las transiciones. El sitio usa vanilla HTML/CSS/JS (sin frameworks).
```

---

## Prompt 1 — Sección Hero (logo + tagline)

```
[PEGAR CONTEXTO DE ARRIBA]

En el archivo index.html, la sección hero (#hero) contiene:
- .hero__logo (una imagen SVG del logo, 400px de ancho)
- .hero__tagline (un h1 con texto en mayúsculas)

Estos elementos son visibles al cargar la página (no requieren scroll), así que deben animarse en DOMContentLoaded, no con scroll.

Especificación de animación:
- .hero__logo: empieza en opacity 0, scale 0.92. Anima a opacity 1, scale 1 en 1000ms. Debe sentirse como si el logo estuviera "inhalando" — una expansión suave.
- .hero__tagline: empieza en opacity 0, translateY(20px). Hace fade up a opacity 1, translateY(0) en 800ms. Delay: 400ms (empieza después de que el logo comience su animación).

Agregá las clases CSS y un pequeño snippet de JS que agregue la clase "is-visible" a .hero__content en DOMContentLoaded después de un delay de 100ms. Las animaciones deben definirse en CSS usando la clase padre .is-visible para dispararlas.

Archivos a modificar: assets/css/styles.css, assets/js/main.js
No modificar la estructura del HTML.
```

---

## Prompt 2 — Sección Intro (claim + párrafo)

```
[PEGAR CONTEXTO DE ARRIBA]

En index.html, la sección intro (#intro) contiene:
- .intro__claim (h2 — el texto principal del claim)
- .intro__text (un párrafo con un <strong> y un <span>)

Especificación de animación:
- Usá Intersection Observer para detectar cuando #intro entra al viewport (threshold: 0.2).
- .intro__claim: empieza en opacity 0, translateY(30px). Anima a opacity 1, translateY(0) en 800ms. Debe sentirse como vegetación creciendo lentamente desde el suelo.
- .intro__text: misma animación pero con un delay de 250ms después del claim.

Creá un sistema de clases CSS reutilizable:
- .anim-fade-up: la clase base de animación (estado inicial: opacity 0, translateY(30px))
- .anim-fade-up.is-visible: el estado animado (opacity 1, translateY(0), transition 800ms)
- Soportar un atributo data-anim-delay para setear delays personalizados vía CSS transition-delay.

Después en JS, creá un Intersection Observer genérico que observe todos los elementos con .anim-fade-up y les agregue .is-visible cuando entren al viewport. Este observer se va a reutilizar en todas las secciones.

Archivos a modificar: assets/css/styles.css, assets/js/main.js
No modificar la estructura del HTML. Agregar la clase .anim-fade-up y los atributos data-anim-delay a los elementos HTML.
```

---

## Prompt 3 — Proyecto destacado (imagen + texto overlay + botón)

```
[PEGAR CONTEXTO DE ARRIBA]

En index.html, la sección de proyecto destacado (#featured-project) contiene:
- .featured-project__image con un <img> adentro
- .featured-project__overlay-text (texto posicionado de forma absoluta sobre la imagen)
- .btn--overlay (un botón CTA sobre la imagen)

Especificación de animación:
- La imagen NO debe animarse (es un elemento visual grande, animarla se sentiría pesado).
- .featured-project__overlay-text: empieza en opacity 0, translateX(-40px). Anima a opacity 1, translateX(0) en 900ms. Debe sentirse como el viento llevando el texto a su posición — un reveal horizontal. Se dispara cuando el elemento entra al viewport.
- El .btn--overlay ya tiene su propio sistema de visibilidad (controlado por JS), así que no le agregues animación.

Usá el mismo sistema de Intersection Observer creado en el Prompt 2 pero agregá una nueva clase CSS:
- .anim-wind-in: estado inicial opacity 0, translateX(-40px)
- .anim-wind-in.is-visible: opacity 1, translateX(0), transition 900ms

Archivos a modificar: assets/css/styles.css, assets/js/main.js (solo si el observer no maneja la nueva clase), index.html (agregar la clase al elemento)
```

---

## Prompt 4 — Sección Filosofía (statement + carrusel de valores)

```
[PEGAR CONTEXTO DE ARRIBA]

En index.html, la sección de filosofía (#philosophy) contiene:
- .philosophy__statement (texto h2)
- .values-carousel (un carrusel con scroll horizontal de ítems de valores, que ya tiene animación CSS de scroll infinito)

Especificación de animación:
- .philosophy__statement: usá la clase existente .anim-fade-up con el sistema de Intersection Observer. Fade-up estándar, 800ms.
- .values-carousel: empieza en opacity 0. Cuando entra al viewport, hace fade a opacity 1 en 1000ms con un delay de 300ms. La animación interna del scroll solo debe empezar a correr DESPUÉS de que se complete el fade-in. Usá animation-play-state: paused inicialmente, después cambiá a running cuando sea visible.

Creá una nueva clase CSS:
- .anim-fade-in: estado inicial opacity 0
- .anim-fade-in.is-visible: opacity 1, transition 1000ms

Para el carrusel, agregá .anim-fade-in a .values-carousel, y agregá una regla para que .values-track tenga animation-play-state: paused por defecto, y animation-play-state: running cuando .values-carousel.is-visible.

El Intersection Observer existente debe manejar también los elementos con .anim-fade-in.

Archivos a modificar: assets/css/styles.css, assets/js/main.js (si es necesario), index.html (agregar clases)
```

---

## Prompt 5 — Footer

```
[PEGAR CONTEXTO DE ARRIBA]

El footer (#main-footer) es renderizado por JavaScript. Contiene:
- .footer__logo (una imagen SVG)
- .footer__rights (un párrafo)

Especificación de animación:
- Todo el .footer__inner debe usar .anim-fade-up con una animación sutil: translateY(15px) en vez de 30px, y duración de 600ms. Es una entrada más tranquila y contenida — el footer es el final de la página y no debería llamar mucho la atención.

Agregá un modificador CSS:
- .anim-fade-up--subtle: sobreescribe translateY a 15px y duración a 600ms

Como el footer es renderizado por JS, asegurate de que las clases .anim-fade-up y .anim-fade-up--subtle se agreguen a .footer__inner en la función render, y que el Intersection Observer las detecte después del render.

Archivos a modificar: assets/css/styles.css, assets/js/main.js
```

---

## Notas para todos los prompts

- El easing para TODAS las animaciones es: `cubic-bezier(0.22, 0.61, 0.36, 1)`
- Las animaciones solo se ejecutan UNA vez (no se repiten al scrollear de vuelta)
- Los elementos deben empezar en su estado "oculto" por CSS, y la clase .is-visible los revela
- El Intersection Observer debe usar `{ once: true }` para desconectarse después de animar
