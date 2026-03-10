# Prompt para Claude Code — Fix de clicks en clones del values carousel

## Contexto

Sitio web vanilla HTML/CSS/JS. El `.values-track` en `index.html` tiene 16 `.value-item`:
- Los primeros 8 (originales) tienen `data-value-index="0"` a `data-value-index="7"`
- Los últimos 8 (clones para loop infinito) tienen `data-value-clone="true"` pero NO tienen `data-value-index`

El módulo `Timbo.valuesBreakdown` en `main.js` hace esto para registrar clicks:
```js
const originalItems = carousel.querySelectorAll('[data-value-index]');
originalItems.forEach(item => {
  item.addEventListener('click', () => {
    const index = Number(item.dataset.valueIndex);
    this.pauseAuto();
    this.setActive(index);
  });
});
```

El problema: los clones no tienen `data-value-index`, así que `querySelectorAll('[data-value-index]')` no los encuentra. Cuando el carousel está rodando y un clon queda visible en pantalla, el click no hace nada.

## Lo que hay que hacer

### 1. Agregar `data-value-index` a los 8 clones en `index.html`

Los 8 `<div class="value-item" data-value-clone="true">` deben pasar a tener también `data-value-index`. El orden de aparición en el HTML es el mismo que los originales (0 a 7), así que:

```html
<!-- antes -->
<div class="value-item" data-value-clone="true">

<!-- después -->
<div class="value-item" data-value-clone="true" data-value-index="0">
<div class="value-item" data-value-clone="true" data-value-index="1">
<!-- ...etc hasta 7 -->
```

### 2. Actualizar el listener de clicks en `main.js`

Reemplazar el selector que solo busca originales por uno que busque todos los `.value-item` con `data-value-index`, incluyendo clones:

```js
// antes
const originalItems = carousel.querySelectorAll('[data-value-index]');
originalItems.forEach(item => {
  item.addEventListener('click', () => {
    const index = Number(item.dataset.valueIndex);
    this.pauseAuto();
    this.setActive(index);
  });
});

// después — usar delegación de eventos en el carousel
carousel.addEventListener('click', (e) => {
  const item = e.target.closest('[data-value-index]');
  if (!item) return;
  const index = Number(item.dataset.valueIndex);
  this.pauseAuto();
  this.setActive(index);
});
```

La delegación de eventos es más eficiente: un solo listener en el contenedor en vez de 16 listeners individuales. Funciona igual para originales y clones.

### 3. Actualizar `setActive` para manejar múltiples ítems con el mismo index

`setActive(index)` actualmente hace:
```js
const allItems = document.querySelectorAll('.value-item[data-value-index]');
allItems.forEach(item => {
  item.classList.toggle('value-item--active', Number(item.dataset.valueIndex) === index);
});
```

Con los clones teniendo `data-value-index`, este código ya funciona correctamente — activará tanto el original como su clon cuando corresponda. No necesita cambios, pero verificar que el selector sea `'.value-item[data-value-index]'` (no `'[data-value-index]'` a secas, para no seleccionar otros elementos si los hubiera).

## Archivos a modificar

- `index.html` — agregar `data-value-index="N"` a los 8 divs con `data-value-clone="true"` (N = 0 a 7 en orden)
- `assets/js/main.js` — reemplazar los listeners individuales por delegación de eventos en el carousel

## Archivos que NO hay que modificar

- `assets/css/styles.css`
- `assets/css/variables.css`
- `assets/js/data.js`
- Los 8 value-items originales (los que ya tienen `data-value-index` sin `data-value-clone`)
- La animación CSS del carousel ni su estructura visual

## Verificación

Después del fix:
1. Click en cualquier ítem del carousel (original o clon) debe mostrar el breakdown correspondiente y pausar la rotación automática
2. La rotación automática debe seguir funcionando normalmente cuando no hay interacción
3. El estado `.value-item--active` debe verse en el ítem clickeado (y en su copia si está visible simultáneamente)
