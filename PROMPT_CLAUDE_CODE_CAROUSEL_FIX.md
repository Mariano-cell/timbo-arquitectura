# Prompt para Claude Code — Fix del scroll infinito del values carousel

## Contexto

Sitio web vanilla HTML/CSS/JS. El archivo `index.html` contiene un `.values-carousel` con un `.values-track` que tiene 16 `.value-item` (8 originales + 8 duplicados para loop infinito CSS). La animación es una CSS keyframe que hace `translateX(0)` → `translateX(-50%)` en 40s linear infinite.

## El problema

Hay **dos bugs relacionados**:

### Bug 1 — Conflicto de sistemas de scroll
El wheel handler en `Timbo.valuesBreakdown.init()` hace esto:
```js
carousel.addEventListener('wheel', (e) => {
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  e.preventDefault();
  carousel.scrollLeft += delta;
}, { passive: false });
```

El problema: la animación CSS mueve el `.values-track` con `transform: translateX()`. El wheel handler mueve el *contenedor* con `scrollLeft`. Son dos sistemas de coordenadas independientes. Cuando el usuario scrollea, el contenedor acumula `scrollLeft`, pero la animación CSS sigue corriendo desde `translateX(0)`. Cuando la animación hace su reset a `translateX(0)`, el track "salta" porque el `scrollLeft` del contenedor no se resetea junto con él. El resultado: el carousel visualmente "se queda sin ítems".

### Bug 2 — data-value-index duplicado
Los 8 ítems duplicados (los del loop) también tienen `data-value-index` (0–7), igual que los originales. Esto hace que `querySelectorAll('[data-value-index]')` devuelva 16 elementos. Cuando se aplica `.value-item--active`, se activan tanto el original como su copia — lo cual puede causar comportamientos inesperados en el estado activo.

## La solución

### Fix Bug 1 — Eliminar el wheel handler
La solución más limpia y sin riesgo de colateral es **eliminar completamente el wheel handler** del carousel. El scroll horizontal manual con rueda del mouse no es una feature crítica — el carousel ya funciona solo automáticamente, y el usuario puede hacer click en los ítems. Eliminar este handler resuelve el conflicto sin tocar ningún otro sistema.

En `assets/js/main.js`, dentro de `Timbo.valuesBreakdown.init()`, borrar este bloque completo:
```js
// Scroll horizontal manual con rueda del mouse
carousel.addEventListener('wheel', (e) => {
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  e.preventDefault();
  carousel.scrollLeft += delta;
}, { passive: false });
```

### Fix Bug 2 — Quitar data-value-index de los duplicados
En `index.html`, los 8 ítems duplicados (los que están debajo del comentario `<!-- Duplicated for infinite loop -->`) tienen `data-value-index="0"` a `data-value-index="7"`. Hay que **reemplazar ese atributo por `data-value-clone="true"`** en los 8 duplicados.

Esto asegura que:
- `querySelectorAll('[data-value-index]')` devuelve exactamente 8 elementos (los originales)
- Los clicks solo se registran en los originales
- `.value-item--active` solo se aplica a los originales

En `assets/js/main.js`, la línea que selecciona los ítems originales ya es correcta:
```js
const originalItems = carousel.querySelectorAll('[data-value-index]');
```
No necesita cambios — con el fix del HTML ya funciona bien.

## Archivos a modificar

- `assets/js/main.js` — eliminar el wheel handler (3 líneas dentro de `Timbo.valuesBreakdown.init()`)
- `index.html` — en los 8 value-items duplicados, cambiar `data-value-index="N"` por `data-value-clone="true"`

## Archivos que NO hay que modificar

- `assets/css/styles.css`
- `assets/css/variables.css`
- `assets/js/data.js`
- Los 8 value-items originales (los que van de `data-value-index="0"` a `data-value-index="7"` en la primera mitad del `.values-track`)

## Verificación

Después de aplicar los cambios:
1. El carousel debe scrollear infinitamente sin interrupciones
2. Al hacer click en un ítem original, debe activarse solo ese ítem (sin que su copia se active también)
3. La rueda del mouse sobre el carousel no debe tener ningún efecto (el evento debe propagarse normalmente a la página)
