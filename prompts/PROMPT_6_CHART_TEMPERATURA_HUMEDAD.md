# Prompt para Claude Code / Codex — Gráfico interactivo: Temperatura + Humedad

## Contexto del proyecto

Sitio web Timbó Arquitectura. Stack: vanilla HTML/CSS/JS, sin frameworks, sin bundler.
Ver `prompts/CONTEXTO_PROYECTO.md` para arquitectura completa.

La página usa fondo `var(--color-crema): #f0ebe3`, tipografía Autaut Grotesk, y tiene una sección `.project-climate` en `proyectos/proyecto-exuma-lodge.html` donde van los gráficos.

**No usar ninguna librería externa** (no D3, no Chart.js, no Recharts). El gráfico se construye con SVG nativo + JS vanilla. Esto es intencional: control total sobre estética, animación y hover.

---

## Objetivo

Crear un componente de gráfico interactivo de temperatura y humedad relativa a lo largo del año (enero–diciembre), insertarlo en la sección `.project-climate` de `proyecto-exuma-lodge.html`, y estilizarlo en `styles.css`.

---

## Datos del gráfico

Estos datos provienen del análisis climático del sitio (Kemps Bay, Andros Island, Bahamas — ERA5-TMYx):

```js
const CLIMATE_DATA = {
  months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  tempAvg:   [22, 22, 23, 24, 26, 28, 29, 29, 28, 27, 25, 23],   // °C temperatura promedio
  tempMax:   [24, 24, 25, 27, 29, 30, 31, 31, 30, 29, 27, 25],   // °C máxima media
  tempMin:   [19, 19, 20, 21, 23, 25, 26, 26, 25, 24, 22, 20],   // °C mínima media
  humidity:  [70, 70, 69, 70, 73, 79, 79, 79, 79, 77, 74, 71],   // % humedad relativa
};
```

---

## Especificación visual del componente

### Estructura HTML a insertar

Insertar **después** del bloque `.project-climate__stats` (las 4 stat cards), **dentro** de la sección `.project-climate`, y **antes** del cierre `</section>`:

```html
<div class="climate-chart" id="climate-chart-temp-humidity" aria-label="Temperatura y humedad mensual — Bahamas">
  <div class="climate-chart__header">
    <div class="climate-chart__legend">
      <span class="climate-chart__legend-item climate-chart__legend-item--temp">
        <span class="climate-chart__legend-dot"></span>
        Temperatura media (°C)
      </span>
      <span class="climate-chart__legend-item climate-chart__legend-item--humidity">
        <span class="climate-chart__legend-dot"></span>
        Humedad relativa (%)
      </span>
    </div>
  </div>
  <div class="climate-chart__canvas-wrapper">
    <svg class="climate-chart__svg" id="temp-humidity-svg" aria-hidden="true"></svg>
  </div>
  <div class="climate-chart__tooltip" id="climate-tooltip" role="tooltip" aria-live="polite"></div>
</div>
```

### Diseño del SVG (instrucciones para el JS)

El SVG debe dibujarse completamente desde JavaScript cuando el DOM esté listo. Usar `viewBox` relativo, no píxeles fijos.

**Dimensiones y márgenes:**
- `viewBox="0 0 800 320"`
- Márgenes internos: top 20, right 50, bottom 40, left 50
- Área de plot: width = 800 - 50 - 50 = 700, height = 320 - 20 - 40 = 260

**Ejes:**
- Eje X: 12 puntos equidistantes para los meses. Etiquetas debajo en `--text-xs` (12px equiv).
- Eje Y izquierdo: temperatura, rango 15–35°C. Líneas horizontales de guía (gridlines) en 20, 25, 30°C.
- Eje Y derecho: humedad, rango 55–95%. Escalar al mismo espacio vertical.
- Las gridlines deben ser `stroke: rgba(0,0,0,0.06)`, sin relleno.

**Serie temperatura (área sombreada + línea):**
- Área (`<path>` con fill): usar `tempMin` como borde inferior y `tempMax` como borde superior del área sombreada.
- Color área: `rgba(180, 120, 60, 0.12)` (cálido, desaturado, compatible con crema)
- Línea `tempAvg`: `stroke: #8B5E3C`, `stroke-width: 2`, `fill: none`, curva suave (`stroke-linecap: round`, usar curva cúbica o `smooth` con puntos de control)

**Serie humedad (línea sola):**
- Línea: `stroke: #4A7FA5`, `stroke-width: 1.5`, `fill: none`, `stroke-dasharray: none`
- Escalar usando el eje Y derecho (55–95%)

**Animación de entrada:**
- Ambas líneas deben animarse con `stroke-dasharray` / `stroke-dashoffset` cuando entran al viewport (IntersectionObserver, threshold 0.3)
- Duración: 1200ms, easing: `cubic-bezier(0.22, 0.61, 0.36, 1)`
- El área de temperatura hace fade-in de opacity 0 → final valor, misma duración

**Interactividad (hover / touch):**
- Una línea vertical invisible (`<line>` o `<rect>` transparent) por cada mes actúa como hitbox
- Al hover: mostrar línea vertical sutil (`stroke: rgba(0,0,0,0.15)`, `stroke-width: 1`, `stroke-dasharray: 4 4`)
- Mostrar dots activos en ambas líneas (círculo relleno de 5px de radio)
- Mostrar el `.climate-chart__tooltip` posicionado relativo al chart con los valores del mes

**Contenido del tooltip:**
```
[Nombre del mes]
Temp: XX°C  (min XX° – max XX°)
Humedad: XX%
```

---

## CSS a agregar en `assets/css/styles.css`

```css
/* =========================
   PROYECTO: GRÁFICOS CLIMÁTICOS
   ========================= */

.climate-chart {
  margin-top: var(--space-3xl);
  position: relative;
}

.climate-chart__header {
  margin-bottom: var(--space-lg);
}

.climate-chart__legend {
  display: flex;
  gap: var(--space-xl);
  align-items: center;
}

.climate-chart__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  font-weight: var(--fw-medium);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-gray-400);
}

.climate-chart__legend-dot {
  width: 24px;
  height: 2px;
  border-radius: 1px;
  flex-shrink: 0;
}

.climate-chart__legend-item--temp .climate-chart__legend-dot {
  background-color: #8B5E3C;
}

.climate-chart__legend-item--humidity .climate-chart__legend-dot {
  background-color: #4A7FA5;
}

.climate-chart__canvas-wrapper {
  width: 100%;
  overflow: visible;
}

.climate-chart__svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.climate-chart__tooltip {
  position: absolute;
  background: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-xs);
  line-height: 1.6;
  padding: var(--space-sm) var(--space-md);
  border-radius: 6px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease;
  white-space: nowrap;
  z-index: 10;
  transform: translateX(-50%);
}

.climate-chart__tooltip.is-visible {
  opacity: 1;
}

.climate-chart__tooltip-month {
  font-weight: var(--fw-semibold);
  margin-bottom: 2px;
}

.climate-chart__tooltip-row {
  color: rgba(255,255,255,0.75);
}

.climate-chart__tooltip-row strong {
  color: var(--color-white);
}
```

---

## Arquitectura JS

Crear el módulo como objeto dentro del scope de la página, **no** dentro de `main.js` (para mantenerlo aislado). Crear un nuevo archivo: `assets/js/charts.js`.

El archivo debe seguir el patrón del proyecto:
```js
const TimboCharts = {
  tempHumidity: {
    DATA: { /* los datos arriba */ },
    svgEl: null,
    tooltipEl: null,
    drawn: false,

    init() { /* observar con IntersectionObserver, llamar draw() al entrar */ },
    draw() { /* construir todo el SVG */ },
    bindHover() { /* hitboxes + tooltip */ },
  },

  init() {
    this.tempHumidity.init();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  TimboCharts.init();
});
```

**Importante:** El SVG se construye con `document.createElementNS('http://www.w3.org/2000/svg', ...)`. No usar innerHTML para los elementos SVG (causa problemas con namespaces en algunos browsers).

---

## Archivos a crear / modificar

**Crear:**
- `assets/js/charts.js`

**Modificar:**
- `proyectos/proyecto-exuma-lodge.html` — agregar el HTML del componente dentro de `.project-climate`, y agregar `<script src="../assets/js/charts.js"></script>` antes del cierre `</body>`
- `assets/css/styles.css` — agregar los estilos del componente

**NO modificar:**
- `assets/js/main.js`
- `assets/js/data.js`
- `assets/css/variables.css`

---

## Verificación

1. Abrir `proyectos/proyecto-exuma-lodge.html` en el browser
2. Al hacer scroll hasta la sección de clima, las dos líneas deben animarse dibujándose de izquierda a derecha
3. Al hacer hover sobre cualquier mes, aparece la línea vertical + tooltip con los 3 valores
4. En mobile (< 600px), el gráfico debe ser legible — el SVG es responsive por `width: 100%`
5. Sin errores en consola
6. Sin dependencias externas nuevas — todo es vanilla JS + SVG
