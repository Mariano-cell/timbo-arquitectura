# Prompt para Codex — Animación de entrada del floating logo

## Problema

El `.floating-logo` aparece visible desde el primer momento de carga de la página. Como vive detrás del hero (z-index más bajo), se hace visible durante el fade-in del video cuando este todavía tiene poca opacidad, generando un efecto no deseado.

## Solución

Agregar una animación de fade-in al floating logo con 2 segundos de delay inicial, usando solo CSS. No hay que tocar el JS.

## Cambio en `assets/css/styles.css`

Localizar la regla `.floating-logo` (alrededor de la línea 1106) y hacer estos dos cambios:

**1. Cambiar `opacity: 1` por `opacity: 0` en la clase base**, para que empiece invisible:

```css
.floating-logo {
  /* ... resto de propiedades sin cambios ... */
  opacity: 0;  /* antes era opacity: 1 */
  visibility: visible;
  pointer-events: auto;
  transition: opacity 300ms ease;  /* mantener igual */
}
```

**2. Agregar la animación de entrada** usando `animation` con `animation-delay: 2s`:

```css
.floating-logo {
  /* ... resto de propiedades sin cambios ... */
  opacity: 0;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 300ms ease;
  animation: floating-logo-appear 600ms ease 2s forwards;
}

@keyframes floating-logo-appear {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

El `forwards` en `animation-fill-mode` es esencial: hace que el logo quede en `opacity: 1` después de que la animación termina, sin volver a 0.

**3. Verificar que `prefers-reduced-motion` también lo cubre.** Si ya hay un bloque `@media (prefers-reduced-motion: reduce)` en el archivo, agregar dentro:

```css
@media (prefers-reduced-motion: reduce) {
  .floating-logo {
    animation: none;
    opacity: 1;
  }
}
```

## Archivos a modificar

- `assets/css/styles.css` — modificar `.floating-logo` y agregar `@keyframes floating-logo-appear`

## Archivos que NO hay que modificar

- `assets/js/main.js`
- `index.html`
- `assets/js/data.js`
- `assets/css/variables.css`

## Verificación

1. Abrir `index.html` en el browser
2. El floating logo no debe ser visible durante los primeros 2 segundos
3. A los 2 segundos debe aparecer con un fade-in de 600ms
4. Para entonces el video ya debería estar visible, así que el logo nunca se ve "flotando en el aire" sobre un fondo blanco
5. El resto del comportamiento del logo (cambio de color según sección, layer bajo el hero) debe seguir funcionando igual
