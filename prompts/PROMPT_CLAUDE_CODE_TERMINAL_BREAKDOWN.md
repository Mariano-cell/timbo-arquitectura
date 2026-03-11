# Prompt para Claude Code — Restyling del values-breakdown con estética científica / terminal

## Contexto

Sitio web vanilla HTML/CSS/JS. La sección `values-breakdown` en `index.html` muestra paneles de detalle para cada uno de los 8 pilares climáticos del carousel. El contenido viene de `SITE_DATA.valuesBreakdown.en` en `data.js` y se renderiza dinámicamente en `main.js` dentro de `Timbo.valuesBreakdown.renderBreakdown()`.

La estructura actual de cada panel renderizado es:
```html
<div class="breakdown-panel" data-breakdown-index="0">
  <div class="breakdown-panel__text">
    <h3 class="breakdown-panel__title">Climatic Zone</h3>
    <p class="breakdown-panel__body">...</p>
  </div>
  <div class="breakdown-panel__metrics">
    <div class="breakdown-metric">
      <span class="breakdown-metric__value">30+</span>
      <span class="breakdown-metric__label">climate variables analyzed per site</span>
    </div>
    <!-- x3 métricas -->
  </div>
</div>
```

Los paneles se activan con la clase `is-active` cuando el usuario hace click en un ítem del carousel. Solo el panel activo es visible.

El sitio usa la fuente **Autaut Grotesk** (5 weights: 400, 500, 600, 700, 900) definida como `@font-face` en `variables.css`. Las variables de diseño relevantes son:

```css
--color-azul: #1d4363;
--color-crema: #f0ebe3;
--fw-regular: 400;
--fw-medium: 500;
--fw-semibold: 600;
--fw-bold: 700;
--fw-black: 900;
--fs-xl: clamp(1.5rem, 2.5vw, 2rem);
--fs-lg: clamp(1.1rem, 1.8vw, 1.4rem);
--fs-md: clamp(0.95rem, 1.4vw, 1.1rem);
--fs-sm: clamp(0.8rem, 1.2vw, 0.9rem);
--space-xl: clamp(48px, 8vw, 96px);
```

## Lo que hay que hacer

### 1. Importar una tipografía monoespaciada

Al inicio de `styles.css` (o en un `<link>` en `index.html`), agregar la importación de **JetBrains Mono** desde Google Fonts. Esta fuente es gratuita, está en Google Fonts, y es perfecta para el efecto terminal.

En `index.html`, dentro del `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### 2. Rediseñar los estilos del breakdown en `styles.css`

Reemplazar los estilos actuales de `.breakdown-panel`, `.breakdown-panel__title`, `.breakdown-panel__body`, `.breakdown-metric`, `.breakdown-metric__value` y `.breakdown-metric__label` con una estética científica / terminal.

Criterios de diseño:
- **Fondo oscuro**: el contenedor `.values-breakdown` debe tener fondo `var(--color-azul)` o similar (oscuro, frío).
- **Tipografía mixta**: el título y las métricas usan `'JetBrains Mono', monospace`. El cuerpo de texto (`.breakdown-panel__body`) puede mantener Autaut Grotesk para legibilidad, pero en color claro y tamaño contenido.
- **Métricas destacadas**: los valores (`.breakdown-metric__value`) grandes, en `JetBrains Mono`, color blanco o verde suave tipo `#a8d5a2` o `#7ec8a0`. Sus labels en monoespaciado, más pequeños, color `rgba(255,255,255,0.5)`.
- **Detalles de terminal**: líneas horizontales finas (`border-top: 1px solid rgba(255,255,255,0.12)`), padding generoso, estructura clara en dos columnas (texto + métricas en desktop, apilado en mobile).
- **Prefijo de terminal en el título**: el `.breakdown-panel__title` debe mostrarse con un prefijo fijo `>_` antes del texto, en color tenue (`rgba(255,255,255,0.35)`), usando `::before` en CSS.

Ejemplo de apariencia meta:
```
>_ CLIMATIC ZONE                   [ ANALYSIS ACTIVE ]
──────────────────────────────────────────────────────
Every project begins with a rigorous classification...

  30+          5              100%
  climate      Köppen zones   of projects climate-
  variables    studied        classified before
  analyzed                    design begins
```

### 3. Agregar la animación de terminal en `main.js`

En `Timbo.valuesBreakdown.setActive(index)`, después de activar el panel correcto, disparar una animación que emule que una terminal está "cargando" datos.

**La animación tiene 2 etapas rápidas:**

**Etapa 1 — Scan** (100ms): el panel activo recibe la clase `breakdown-panel--scanning`. En CSS, esto hace que el texto tenga `opacity: 0` excepto el título (para que el usuario vea qué panel es).

**Etapa 2 — Reveal** (luego de 100ms): quitar `breakdown-panel--scanning` y agregar `breakdown-panel--revealing`. En CSS, esto dispara una animación donde cada línea del panel aparece con un efecto de "typewriter" o fade escalonado.

**Implementación CSS para la animación:**

```css
/* Estado de scanning: todo oculto menos el título */
.breakdown-panel--scanning .breakdown-panel__body,
.breakdown-panel--scanning .breakdown-metric {
  opacity: 0;
}

/* Estado de reveal: fade-in escalonado */
.breakdown-panel--revealing .breakdown-panel__body {
  animation: terminal-fade-in 0.15s ease forwards;
  animation-delay: 0.05s;
}

.breakdown-panel--revealing .breakdown-metric:nth-child(1) {
  animation: terminal-fade-in 0.15s ease forwards;
  animation-delay: 0.10s;
}
.breakdown-panel--revealing .breakdown-metric:nth-child(2) {
  animation: terminal-fade-in 0.15s ease forwards;
  animation-delay: 0.15s;
}
.breakdown-panel--revealing .breakdown-metric:nth-child(3) {
  animation: terminal-fade-in 0.15s ease forwards;
  animation-delay: 0.20s;
}

@keyframes terminal-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Implementación JS en `setActive(index)`:**

```js
setActive(index) {
  // Actualizar ítems del carousel (sin cambios)
  const allItems = document.querySelectorAll('.value-item[data-value-index]');
  allItems.forEach(item => {
    item.classList.toggle('value-item--active', Number(item.dataset.valueIndex) === index);
  });

  // Desactivar todos los paneles
  const panels = document.querySelectorAll('.breakdown-panel');
  panels.forEach(panel => {
    panel.classList.remove('is-active', 'breakdown-panel--scanning', 'breakdown-panel--revealing');
  });

  // Activar el panel target con animación de terminal
  const targetPanel = document.querySelector(`.breakdown-panel[data-breakdown-index="${index}"]`);
  if (targetPanel) {
    targetPanel.classList.add('is-active', 'breakdown-panel--scanning');

    // Fase 2: reveal escalonado
    setTimeout(() => {
      targetPanel.classList.remove('breakdown-panel--scanning');
      targetPanel.classList.add('breakdown-panel--revealing');
    }, 100);
  }

  this.activeIndex = index;
},
```

### 4. Opcional — Indicador de "loading" en el título durante el scan

Durante los 100ms de `breakdown-panel--scanning`, el título puede mostrar un cursor parpadeante después del texto usando CSS:

```css
.breakdown-panel--scanning .breakdown-panel__title::after {
  content: '█';
  animation: blink 0.5s step-end infinite;
  opacity: 0.7;
}

@keyframes blink {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 0; }
}
```

## Archivos a modificar

- `index.html` — agregar el `<link>` de Google Fonts (JetBrains Mono) en el `<head>`
- `assets/css/styles.css` — rediseñar los estilos del breakdown section
- `assets/js/main.js` — modificar `setActive()` para incluir la animación terminal

## Archivos que NO hay que modificar

- `assets/js/data.js`
- `assets/css/variables.css`
- El carousel (`.values-carousel`, `.values-track`, `.value-item`)
- La lógica de `init()`, `startAuto()`, `pauseAuto()`, `resumeAuto()` en `Timbo.valuesBreakdown`

## Verificación

Después del cambio:
1. La sección `.values-breakdown` debe verse visualmente distinta al resto del sitio: fondo oscuro, tipografía monoespaciada en títulos y métricas
2. Al hacer click en cualquier ítem del carousel (o al cambiar automáticamente), el panel nuevo debe aparecer con una secuencia rápida: primero el título solo, luego el cuerpo y las métricas aparecen escalonadas
3. La animación completa no debe durar más de 350ms en total (ágil, no lenta)
4. En mobile el layout debe seguir siendo legible (una columna)
5. El prefijo `>_` debe verse antes de cada título de panel
