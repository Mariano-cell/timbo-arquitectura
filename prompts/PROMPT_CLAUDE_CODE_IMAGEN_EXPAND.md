# Prompt para Claude Code — Efecto de imagen que se expande al scrollear

## Contexto del proyecto

Sitio web vanilla HTML/CSS/JS (sin frameworks ni librerías externas). El archivo principal es `index.html`. Los estilos están en `assets/css/styles.css` y las variables en `assets/css/variables.css`. La lógica JS está en `assets/js/main.js`, organizada dentro de un objeto `Timbo` con módulos (cada funcionalidad es un sub-objeto con un método `init()`).

## Qué hay que hacer

En `index.html` existe una sección `.featured-project` (id="featured-project") que contiene un div `.featured-project__image` con una imagen `<img>` adentro. Actualmente la imagen ocupa el 100% del ancho del viewport.

Necesito que cuando la imagen recién aparece en pantalla (al scrollear hacia abajo), tenga márgenes a los costados (no ocupe todo el ancho). A medida que el usuario sigue scrolleando, la imagen se va expandiendo progresivamente hasta ocupar el 100% del ancho del viewport.

Referencia visual: el efecto de la home de https://www.anthropic.com donde una imagen arranca con márgenes y border-radius, y al scrollear se expande a full width.

## Especificación técnica

### Estado inicial (cuando la imagen aparece en pantalla):
- La imagen debe tener un margen horizontal de `clamp(24px, 5vw, 80px)` a cada lado
- Border-radius: `12px`
- La imagen ya tiene `width: 100%` y `height: 120vh` con `object-fit: cover`

### Estado final (cuando terminás de scrollear):
- Margen horizontal: `0`
- Border-radius: `0`
- La imagen ocupa el 100% del ancho del viewport

### Comportamiento del scroll:
- La animación debe estar **vinculada al scroll** (scrub), no ser un trigger de una sola vez. Es decir: si scrolleás para abajo, se expande; si scrolleás para arriba, se contrae.
- La transición debe ser suave y progresiva (interpolada con el scroll, no un salto).
- Debe empezar cuando el borde superior de `.featured-project__image` entre al viewport.
- Debe completarse cuando la imagen haya sido scrolleada aproximadamente un 40% de su altura visible.

### Implementación:
- NO usar GSAP ni ninguna librería externa. Hacerlo con JS vanilla.
- Usar un `scroll` event listener (con `passive: true`) que calcule el progreso de la animación basándose en la posición del elemento relativa al viewport.
- Aplicar los cambios mediante CSS custom properties en el elemento (ej: `--expand-progress`) y usar esas variables en CSS para interpolar los valores.
- Crear un nuevo módulo `Timbo.imageExpand` con un método `init()` siguiendo el patrón del resto de módulos en main.js.
- Llamar a `this.imageExpand.init()` dentro de `Timbo.init()`.

### CSS:
- `.featured-project__image` debe tener las propiedades iniciales (margin, border-radius) usando `calc()` con la custom property `--expand-progress` (que va de 0 a 1).
- Ejemplo de lógica: `margin: 0 calc(clamp(24px, 5vw, 80px) * (1 - var(--expand-progress, 0)))`
- `border-radius: calc(12px * (1 - var(--expand-progress, 0)))`
- Asegurate de que `overflow: hidden` esté en `.featured-project__image` (ya debería estar) para que el border-radius se aplique a la imagen.

### Accesibilidad:
- Respetar `prefers-reduced-motion`: si el usuario prefiere movimiento reducido, setear `--expand-progress: 1` directamente (imagen siempre expandida, sin animación).

## Archivos a modificar
- `assets/css/styles.css` — agregar/modificar estilos de `.featured-project__image`
- `assets/js/main.js` — agregar módulo `Timbo.imageExpand` y llamarlo en `init()`

## Archivos que NO hay que modificar
- `index.html` — no cambiar la estructura HTML
- `assets/css/variables.css`

## Notas importantes
- `.featured-project__image` ya tiene `position: relative`, `width: 100%`, y `overflow: hidden`. No borrar estos estilos, solo agregar los nuevos.
- La imagen interna ya tiene `width: 100%`, `height: 120vh`, `object-fit: cover`, `display: block`. No tocar estos estilos.
- Hay elementos posicionados absolutamente dentro de `.featured-project__image` (un texto overlay y un botón). Estos deben seguir funcionando normalmente — el margen se aplica al contenedor, no a la imagen directamente.
- El botón `.btn--overlay` tiene un sistema de visibilidad propio en `Timbo.featuredProjectCta` que no hay que romper.
