# Prompt para Codex — Eliminar imagen de fondo previa al video en el hero

## Problema

Al cargar la home, aparece `hero_004.jpg` como fondo antes del video. Esto pasa por dos razones simultáneas:

1. El `<video>` tiene `poster="assets/images/hero/hero_004.jpg"` — el browser muestra ese poster automáticamente mientras carga el video, sin que JS intervenga.
2. Hay un `<img src="assets/images/hero/hero_004.jpg">` dentro de `.hero__bg` con una animación `hero-fade-in` que la hace aparecer independientemente del video.

El resultado es que se ve `hero_004.jpg` en fade-out al mismo tiempo que el video aparece en fade-in. Lo correcto es que el fondo sea blanco hasta que el video arranque.

## Lo que está bien y no debe cambiar

- Todos los elementos del `.hero__content` (logo + tagline) esperan a que el video esté visible antes de aparecer. Eso funciona bien, no tocar.

## Cambios a hacer

### 1. `index.html` — quitar el `poster` del video

```html
<!-- Antes -->
<video autoplay muted loop playsinline preload="metadata" poster="assets/images/hero/hero_004.jpg">

<!-- Después -->
<video autoplay muted loop playsinline preload="auto">
```

Cambiar también `preload="metadata"` a `preload="auto"` para que el browser empiece a descargar el video lo antes posible.

### 2. `index.html` — quitar el `<img>` de fallback dentro de `.hero__bg`

```html
<!-- Antes -->
<div class="hero__bg">
  <video ...>...</video>
  <img src="assets/images/hero/hero_004.jpg" alt="Vista aérea de costa y naturaleza" loading="eager">
</div>

<!-- Después -->
<div class="hero__bg">
  <video ...>...</video>
</div>
```

Esa imagen de fallback ya no hace falta. El fondo blanco del body cumple esa función hasta que el video cargue.

### 3. `assets/css/styles.css` — eliminar los estilos de la img de fallback del hero

Eliminar o limpiar estas reglas que ya no tienen elemento al que aplicarse:

```css
/* Eliminar esto: */
.hero__bg img {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: hero-fade-in 2500ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

@keyframes hero-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 4. `assets/js/main.js` — actualizar `Timbo.heroSwitcher`

El módulo `heroSwitcher` cuando seleccionás una imagen genera este HTML:

```js
heroBg.innerHTML = `<img src="${item.src}" alt="${item.label}" loading="eager">`;
```

Y cuando seleccionás el video:
```js
heroBg.innerHTML = `
  <video autoplay muted loop playsinline poster="${item.poster}">
    <source src="${item.src}" type="video/mp4">
  </video>
  <img src="${item.poster}" alt="..." loading="eager">
`;
```

Actualizar el case del video para que no incluya `poster` ni la `<img>` de fallback, coherente con los cambios anteriores:

```js
heroBg.innerHTML = `
  <video autoplay muted loop playsinline preload="auto">
    <source src="${item.src}" type="video/mp4">
  </video>
`;
```

El case de imagen se puede dejar igual ya que ahí sí es correcto mostrar una imagen directamente.

## Archivos a modificar

- `index.html` — quitar `poster` del video y eliminar el `<img>` de fallback
- `assets/css/styles.css` — eliminar reglas de `.hero__bg img` y `@keyframes hero-fade-in`
- `assets/js/main.js` — actualizar el template del video en `Timbo.heroSwitcher.select()`

## Archivos que NO hay que modificar

- `assets/js/data.js`
- `assets/css/variables.css`

## Verificación

1. Abrir `index.html` con throttling de red en DevTools (Slow 3G) para simular carga lenta
2. El fondo debe ser blanco hasta que el video empiece a reproducirse
3. NO debe aparecer `hero_004.jpg` en ningún momento antes del video
4. El video hace fade-in desde blanco correctamente
5. El logo y tagline aparecen después del fade-in del video, como antes
6. Con el heroSwitcher, cambiar al video y verificar que tampoco aparece el poster
