# Prompt para Codex — Secuencia de entrada del hero sincronizada con la carga del video

## Problema actual

En `Timbo.heroIntro.init()` (en `main.js`), el `.hero__content` recibe la clase `is-visible` después de un simple `setTimeout` de 100ms, sin esperar a que el video de fondo haya cargado. Esto causa que el logo y el tagline aparezcan sobre un fondo blanco o en transición, y luego el video aparece encima con su propio fade-in, generando un efecto visual desordenado.

## Comportamiento deseado

La secuencia debe ser estrictamente:

1. Página cargando — fondo blanco/vacío, **ningún elemento del hero visible**
2. El video termina de cargar lo suficiente para reproducirse → el video hace fade-in como fondo
3. Una vez que el video está visible → recién ahí aparece el `.hero__content` (logo + tagline) con su animación de entrada

## Implementación

### En `main.js` — reemplazar `Timbo.heroIntro.init()`

La lógica actual:
```js
heroIntro: {
  init() {
    const heroContent = document.querySelector('#hero .hero__content');
    if (!heroContent) return;
    setTimeout(() => {
      heroContent.classList.add('is-visible');
    }, 100);
  },
},
```

Reemplazarla con esta lógica:

```js
heroIntro: {
  FALLBACK_MS: 4000, // máximo tiempo de espera antes de mostrar igual (por si el video no carga)

  init() {
    const heroContent = document.querySelector('#hero .hero__content');
    const video = document.querySelector('#hero .hero__bg video');
    if (!heroContent) return;

    // Si no hay video (por ejemplo, en el heroSwitcher se eligió una imagen),
    // mostrar el contenido directamente con un delay mínimo
    if (!video) {
      setTimeout(() => heroContent.classList.add('is-visible'), 200);
      return;
    }

    // Asegurarse de que el hero__content sea invisible hasta que el video cargue
    // (el CSS ya debería manejarlo, pero lo forzamos por si acaso)
    heroContent.classList.remove('is-visible');

    // Fallback: si el video tarda demasiado, mostrar igual
    const fallbackTimer = setTimeout(() => {
      heroContent.classList.add('is-visible');
    }, this.FALLBACK_MS);

    // Esperar a que el video pueda reproducirse
    const onReady = () => {
      clearTimeout(fallbackTimer);
      // Primero el video hace su fade-in (manejado por CSS sobre .hero__bg video)
      // Luego, después de que el fade-in del video termine, mostrar el contenido
      // El fade-in del video dura lo que diga la transición CSS — usar un delay coherente
      setTimeout(() => {
        heroContent.classList.add('is-visible');
      }, 600); // ajustar si la duración del fade-in del video es distinta
    };

    // canplaythrough: el video tiene suficiente data para reproducirse sin interrupciones
    if (video.readyState >= 3) {
      // Ya está listo (cacheado o carga muy rápida)
      onReady();
    } else {
      video.addEventListener('canplaythrough', onReady, { once: true });
    }
  },
},
```

### En `assets/css/styles.css`

Verificar que el `<video>` dentro de `.hero__bg` tenga una transición de opacidad para su fade-in de entrada. Si no la tiene, agregarla:

```css
.hero__bg video {
  opacity: 0;
  transition: opacity 600ms ease;
}

.hero__bg video.is-loaded {
  opacity: 1;
}
```

Y en `main.js`, dentro del mismo `heroIntro.init()`, agregar la clase `is-loaded` al video en el momento `onReady` (antes del `setTimeout` del contenido):

```js
const onReady = () => {
  clearTimeout(fallbackTimer);
  video.classList.add('is-loaded'); // dispara el fade-in del video
  setTimeout(() => {
    heroContent.classList.add('is-visible');
  }, 600);
};
```

### Consideración: heroSwitcher

El módulo `Timbo.heroSwitcher` puede reemplazar el video por una imagen en runtime. En ese caso, el nuevo fondo es una `<img>`, no un `<video>`. La lógica del fallback (`if (!video)`) ya lo cubre: si no hay video, el contenido aparece de inmediato. No hay que modificar `heroSwitcher`.

### Consideración: prefers-reduced-motion

Si `prefers-reduced-motion` está activo, mostrar el contenido directamente sin esperar al video:

```js
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  heroContent.classList.add('is-visible');
  return;
}
```

Agregar esta verificación al inicio de `heroIntro.init()`, antes de cualquier otra lógica.

## Archivos a modificar

- `assets/js/main.js` — reemplazar `Timbo.heroIntro.init()` con la nueva lógica
- `assets/css/styles.css` — agregar transición de opacidad al `video` dentro de `.hero__bg` si no existe

## Archivos que NO hay que modificar

- `index.html`
- `assets/js/data.js`
- `assets/css/variables.css`

## Verificación

1. Abrir `index.html` con throttling de red en DevTools (Fast 3G o Slow 3G) para simular carga lenta
2. Verificar que el logo y el tagline NO aparecen hasta que el video esté visible
3. La secuencia debe ser: fondo blanco → video hace fade-in → contenido del hero aparece
4. Con red rápida o cacheado, el comportamiento debe verse fluido sin saltos
5. Si se deshabilita el video en DevTools (bloqueando el .mp4), el fallback de 4000ms debe activarse y mostrar el contenido igual
6. Verificar que `prefers-reduced-motion` muestra el contenido directamente sin esperar
