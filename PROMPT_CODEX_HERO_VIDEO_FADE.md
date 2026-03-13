# Prompt para Codex — Corregir el "parpadeo" del video en el hero

## Problema

El video hace un parpadeo ("pestañeo") al cargar: aparece visible por un instante antes de que empiece el fade-in. Esto pasa porque `canplaythrough` se dispara cuando el video ya tiene frames decodificados y listos — o sea, el primer frame ya está pintado en pantalla antes de que JS pueda agregarle `is-loaded`.

## Causa técnica

En `heroIntro.init()` se escucha `canplaythrough` para agregar `is-loaded` al video. Pero en ese momento el browser ya renderizó el primer frame. El video "aparece" por un instante antes de que la transición de opacidad arranque.

## Solución

Dos cambios coordinados:

### 1. `assets/js/main.js` — cambiar el evento de `canplaythrough` a `playing`

El evento `playing` se dispara en el momento exacto en que el video **empieza a reproducirse**, sincronizado con el primer frame visible. Si agregamos `is-loaded` justo antes de que `playing` se dispare (usando `canplay` para preparar + `playing` para ejecutar), el fade-in arranca simultáneamente con el primer frame, eliminando el parpadeo.

Reemplazar esta parte de `heroIntro.init()`:

```js
// Antes
const onReady = () => {
  clearTimeout(fallbackTimer);
  video.classList.add('is-loaded');
  setTimeout(() => {
    revealContent();
  }, 600);
};

if (video.readyState >= 3) {
  onReady();
} else {
  video.addEventListener('canplaythrough', onReady, { once: true });
}
```

Por esto:

```js
// Después
const onPlaying = () => {
  clearTimeout(fallbackTimer);
  // Agregar is-loaded en el mismo tick en que el video empieza a reproducirse
  // para que el fade-in arranque exactamente con el primer frame
  video.classList.add('is-loaded');
  setTimeout(() => {
    revealContent();
  }, 700); // ligeramente más largo que la transición CSS (600ms) para que el video ya sea visible
};

// Si el video ya está reproduciéndose (cacheado), disparar directamente
if (!video.paused && video.readyState >= 3) {
  onPlaying();
} else {
  video.addEventListener('playing', onPlaying, { once: true });
}
```

### 2. `assets/css/styles.css` — asegurarse de que el video empieza completamente invisible

El video debe tener `opacity: 0` desde CSS puro, sin depender de JS. Verificar que la regla sea:

```css
.hero__bg video {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 600ms ease;
}

.hero__bg video.is-loaded {
  opacity: 1;
}
```

Si ya está así, no cambiar nada en el CSS.

## Por qué funciona

- `playing` se dispara en el mismo frame en que el video empieza a reproducirse visualmente
- Al agregar `is-loaded` en ese momento exacto, la transición de opacidad arranca sincronizada con el primer frame
- El resultado es un fade-in limpio desde blanco, sin ningún parpadeo intermedio

## Archivos a modificar

- `assets/js/main.js` — reemplazar el listener de `canplaythrough` por `playing` en `Timbo.heroIntro.init()`

## Archivos que NO hay que modificar

- `index.html`
- `assets/css/styles.css` (salvo que la regla de opacity no esté correcta)
- `assets/js/data.js`
- `assets/css/variables.css`

## Verificación

1. Abrir `index.html` con throttling Slow 3G en DevTools
2. El fondo debe ser blanco hasta que el video empiece a reproducirse
3. El fade-in debe arrancar exactamente cuando el video empieza — sin parpadeo ni frame visible previo
4. El logo y tagline deben aparecer después de que el fade-in del video termine
5. Probar también sin throttling (red rápida / cacheado) — no debe haber diferencia visual
