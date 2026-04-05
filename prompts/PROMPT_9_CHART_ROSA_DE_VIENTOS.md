# PROMPT 9 — Gráfico 3: Rosa de Vientos (polar SVG con toggle)

## Contexto del proyecto
Stack: HTML + CSS + JS vanilla. Sin frameworks, sin bundler.
El objeto `TimboCharts` ya existe en `assets/js/charts.js` con los módulos `tempHumidity` y `solarRadiation`.
Convenciones: BEM, CSS custom properties, SVG nativo con `document.createElementNS`.
Este gráfico va en la página `proyectos/proyecto-exuma-lodge.html`.

---

## Objetivo

Una **rosa de vientos SVG** en coordenadas polares que muestra la frecuencia e intensidad del viento por dirección (16 puntos cardinales), con un **toggle de dos estados**: Temporada Húmeda (May–Oct) / Temporada Seca (Nov–Abr).

---

## Estructura visual

- Círculo con 4 anillos concéntricos de referencia (25%, 50%, 75%, 100% del radio máximo)
- Ejes N / S / E / W con labels
- 16 pétalos radiales, uno por dirección (N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW)
- Cada pétalo = un `<polygon>` SVG cuyo radio es proporcional a la frecuencia (%) de viento en esa dirección
- Color de relleno según velocidad media dominante de esa dirección: escala azul → naranja → rojo (igual al PDF)
- Toggle HTML encima del gráfico para cambiar entre temporadas; al cambiar, los pétalos se redibujan con transición de opacidad

---

## Datos

```js
// Frecuencia (%) e intensidad media (m/s) por dirección — 16 puntos cardinales
// Orden: N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW

DATA: {
  directions: ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'],

  // Temporada HÚMEDA (May–Oct): viento dominante E/ESE, velocidades más altas
  wet: {
    freq:  [3, 4, 6, 8, 14, 13, 9, 7, 5, 3, 2, 2, 3, 3, 4, 4],   // % frecuencia
    speed: [4, 4, 5, 6,  8,  8, 6, 5, 4, 3, 3, 3, 4, 4, 4, 4],   // m/s velocidad media
  },

  // Temporada SECA (Nov–Abr): viento gira más hacia NE, velocidades algo menores
  dry: {
    freq:  [4, 6, 9, 7, 10, 9, 7, 6, 4, 3, 2, 2, 3, 4, 6, 5],    // % frecuencia
    speed: [4, 5, 6, 5,  7,  6, 5, 5, 4, 3, 3, 3, 4, 4, 5, 4],   // m/s velocidad media
  },
},
```

---

## Escala de color por velocidad (igual al PDF)

```js
// Mapeo velocidad m/s → color hex
function speedColor(ms) {
  if (ms <= 1.75) return '#6BAED6'; // azul claro
  if (ms <= 3.25) return '#9ECAE1'; // azul
  if (ms <= 5.50) return '#FDB863'; // naranja claro
  if (ms <= 7.75) return '#E6550D'; // naranja oscuro
  return '#A63603';                  // rojo
}
```

---

## Cambios en `assets/js/charts.js`

### 1. Agregar módulo `windRose` dentro de `TimboCharts`, después de `solarRadiation`

```js
windRose: {

  DATA: {
    directions: ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'],

    wet: {
      freq:  [3, 4, 6, 8, 14, 13, 9, 7, 5, 3, 2, 2, 3, 3, 4, 4],
      speed: [4, 4, 5, 6,  8,  8, 6, 5, 4, 3, 3, 3, 4, 4, 4, 4],
    },
    dry: {
      freq:  [4, 6, 9, 7, 10, 9, 7, 6, 4, 3, 2, 2, 3, 4, 6, 5],
      speed: [4, 5, 6, 5,  7,  6, 5, 5, 4, 3, 3, 3, 4, 4, 5, 4],
    },
  },

  // SVG viewBox (cuadrado)
  SIZE: 400,
  CX: 200,  // centro X
  CY: 200,  // centro Y
  R_MAX: 160, // radio máximo de pétalo (al 100%)

  svgEl: null,
  currentSeason: 'wet', // estado inicial
  drawn: false,
  petalEls: [], // referencias a los <polygon> para update

  ns: 'http://www.w3.org/2000/svg',

  el(tag, attrs) {
    const e = document.createElementNS(this.ns, tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  },

  speedColor(ms) {
    if (ms <= 1.75) return '#6BAED6';
    if (ms <= 3.25) return '#9ECAE1';
    if (ms <= 5.50) return '#FDB863';
    if (ms <= 7.75) return '#E6550D';
    return '#A63603';
  },

  // Convierte frecuencia % → radio en px (max freq del dataset = 100% del R_MAX)
  freqToR(freq, maxFreq) {
    return (freq / maxFreq) * this.R_MAX;
  },

  // Devuelve los 4 puntos del pétalo (rombo estrecho centrado en el eje)
  petalPoints(angleDeg, r) {
    const angleRad = (angleDeg - 90) * Math.PI / 180; // -90 para que N quede arriba
    const halfWidth = Math.PI / 16; // mitad del ancho angular del pétalo (360/16/2)

    const tipX = this.CX + r * Math.cos(angleRad);
    const tipY = this.CY + r * Math.sin(angleRad);

    const leftAngle  = angleRad - halfWidth;
    const rightAngle = angleRad + halfWidth;
    const baseR = r * 0.15; // base del pétalo cerca del centro

    const lx = this.CX + baseR * Math.cos(leftAngle);
    const ly = this.CY + baseR * Math.sin(leftAngle);
    const rx = this.CX + baseR * Math.cos(rightAngle);
    const ry = this.CY + baseR * Math.sin(rightAngle);

    return `${this.CX},${this.CY} ${lx},${ly} ${tipX},${tipY} ${rx},${ry}`;
  },

  draw() {
    if (this.drawn) return;
    this.drawn = true;

    const svg = this.svgEl;
    svg.setAttribute('viewBox', `0 0 ${this.SIZE} ${this.SIZE}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Anillos de referencia
    [0.25, 0.5, 0.75, 1].forEach(pct => {
      svg.appendChild(this.el('circle', {
        cx: this.CX, cy: this.CY,
        r: this.R_MAX * pct,
        fill: 'none',
        stroke: 'rgba(0,0,0,0.07)',
        'stroke-width': 1,
      }));
    });

    // Ejes cardinales
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([label, deg]) => {
      const rad = (deg - 90) * Math.PI / 180;
      const x1 = this.CX + 12 * Math.cos(rad);
      const y1 = this.CY + 12 * Math.sin(rad);
      const x2 = this.CX + (this.R_MAX + 10) * Math.cos(rad);
      const y2 = this.CY + (this.R_MAX + 10) * Math.sin(rad);

      svg.appendChild(this.el('line', {
        x1, y1, x2, y2,
        stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 1,
      }));

      const lx = this.CX + (this.R_MAX + 22) * Math.cos(rad);
      const ly = this.CY + (this.R_MAX + 22) * Math.sin(rad);
      const labelEl = this.el('text', {
        x: lx, y: ly + 4,
        'text-anchor': 'middle',
        'font-size': '13', 'font-weight': '600',
        fill: 'rgba(0,0,0,0.5)',
        'font-family': 'inherit',
      });
      labelEl.textContent = label;
      svg.appendChild(labelEl);
    });

    // Grupo de pétalos (se reemplaza en cada toggle)
    const petalGroup = this.el('g', { class: 'wind-rose__petals', id: 'windRosePetals' });
    svg.appendChild(petalGroup);

    // Dibujar pétalos iniciales
    this.renderPetals(petalGroup, this.currentSeason);
  },

  renderPetals(group, season) {
    // Limpiar pétalos anteriores
    while (group.firstChild) group.removeChild(group.firstChild);
    this.petalEls = [];

    const data = this.DATA[season];
    const maxFreq = Math.max(...data.freq);
    const n = this.DATA.directions.length;

    data.freq.forEach((freq, i) => {
      const angleDeg = (i / n) * 360;
      const r = this.freqToR(freq, maxFreq);
      const color = this.speedColor(data.speed[i]);
      const dir = this.DATA.directions[i];

      const petal = this.el('polygon', {
        points: this.petalPoints(angleDeg, r),
        fill: color,
        opacity: '0.85',
        'data-dir': dir,
        'data-freq': freq,
        'data-speed': data.speed[i],
        class: 'wind-rose__petal',
        style: 'cursor: default;',
      });

      group.appendChild(petal);
      this.petalEls.push(petal);
    });
  },

  switchSeason(season) {
    if (season === this.currentSeason) return;
    this.currentSeason = season;
    const group = this.svgEl.getElementById
      ? null
      : this.svgEl.querySelector('#windRosePetals');
    const petalGroup = this.svgEl.querySelector('#windRosePetals');
    if (!petalGroup) return;

    // Fade out → renderPetals → fade in
    petalGroup.style.transition = 'opacity 250ms ease';
    petalGroup.style.opacity = '0';

    setTimeout(() => {
      this.renderPetals(petalGroup, season);
      petalGroup.style.opacity = '1';
    }, 260);
  },

  init() {
    this.svgEl = document.getElementById('wind-rose-svg');
    if (!this.svgEl) return;

    this.draw();

    // Toggle buttons
    const btnWet = document.getElementById('windRoseBtnWet');
    const btnDry = document.getElementById('windRoseBtnDry');

    if (btnWet && btnDry) {
      btnWet.addEventListener('click', () => {
        this.switchSeason('wet');
        btnWet.classList.add('is-active');
        btnDry.classList.remove('is-active');
      });
      btnDry.addEventListener('click', () => {
        this.switchSeason('dry');
        btnDry.classList.add('is-active');
        btnWet.classList.remove('is-active');
      });
    }

    // Animación de entrada
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.svgEl.style.transition = 'opacity 800ms ease';
          this.svgEl.style.opacity = '1';
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });

    this.svgEl.style.opacity = '0';
    observer.observe(this.svgEl);
  },
},
```

### 2. Actualizar `TimboCharts.init()`

Reemplazar:
```js
init() {
  this.tempHumidity.init();
  this.solarRadiation.init();
},
```
Por:
```js
init() {
  this.tempHumidity.init();
  this.solarRadiation.init();
  this.windRose.init();
},
```

---

## Cambios en `proyectos/proyecto-exuma-lodge.html`

Agregar después del bloque del gráfico de radiación solar (`.climate-chart` del gráfico 2):

```html
<!-- GRÁFICO 3: Rosa de Vientos -->
<div class="climate-chart climate-chart--polar">
  <div class="climate-chart__header">
    <h3 class="climate-chart__title">Rosa de Vientos</h3>
    <p class="climate-chart__desc">Frecuencia e intensidad del viento por dirección. Los pétalos más largos indican mayor frecuencia; el color indica la velocidad media (azul = lento, rojo = rápido).</p>
  </div>
  <div class="climate-chart__toggle">
    <button class="climate-chart__toggle-btn is-active" id="windRoseBtnWet">Temporada húmeda</button>
    <button class="climate-chart__toggle-btn" id="windRoseBtnDry">Temporada seca</button>
  </div>
  <div class="climate-chart__canvas-wrapper climate-chart__canvas-wrapper--square">
    <svg id="wind-rose-svg" class="climate-chart__svg climate-chart__svg--square" aria-label="Rosa de vientos de Bahamas"></svg>
  </div>
  <div class="climate-chart__legend">
    <span class="climate-chart__legend-item"><span class="climate-chart__legend-swatch" style="background:#9ECAE1;"></span>1–3.25 m/s</span>
    <span class="climate-chart__legend-item"><span class="climate-chart__legend-swatch" style="background:#FDB863;"></span>3.25–5.5 m/s</span>
    <span class="climate-chart__legend-item"><span class="climate-chart__legend-swatch" style="background:#E6550D;"></span>5.5–7.75 m/s</span>
    <span class="climate-chart__legend-item"><span class="climate-chart__legend-swatch" style="background:#A63603;"></span>> 7.75 m/s</span>
  </div>
</div>
```

---

## Cambios en `assets/css/styles.css`

Agregar al final:

```css
/* Rosa de vientos — toggle */
.climate-chart__toggle {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.climate-chart__toggle-btn {
  padding: 6px 16px;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 999px;
  background: transparent;
  font-size: 0.8rem;
  cursor: pointer;
  color: rgba(0,0,0,0.5);
  transition: all 200ms ease;
  font-family: inherit;
}

.climate-chart__toggle-btn.is-active {
  background: var(--color-azul, #2a3f5f);
  border-color: var(--color-azul, #2a3f5f);
  color: #fff;
}

/* Rosa de vientos — SVG cuadrado */
.climate-chart__canvas-wrapper--square {
  max-width: 400px;
  margin: 0 auto;
}

.climate-chart__svg--square {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
}
```

---

## Verificación esperada

1. Se ve un gráfico polar circular con 4 anillos y ejes N/S/E/W.
2. Los pétalos apuntan hacia sus direcciones respectivas, más largos al E/ESE en temporada húmeda.
3. Al clickear "Temporada seca", los pétalos hacen fade y se redibujan con la dirección dominante NE.
4. Los colores de los pétalos corresponden a la escala de velocidad (azul lento → rojo rápido).
5. El SVG hace fade-in al entrar al viewport.
6. No hay errores en consola.

---

## Notas

- SVG nativo, sin librerías.
- `switchSeason` usa fade-out/fade-in en lugar de animación por punto para mayor simplicidad y robustez.
- El SVG tiene `viewBox="0 0 400 400"` cuadrado, renderizado responsive via CSS `aspect-ratio: 1/1`.
- Los pétalos son `<polygon>` con 4 puntos (rombo radial) — más legibles que arcos bezier para este tipo de datos.
