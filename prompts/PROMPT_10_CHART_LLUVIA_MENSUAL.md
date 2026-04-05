# PROMPT 10 — Gráfico 4: Lluvia Mensual (barras con marcador RA+ / RA-)

## Contexto del proyecto
Stack: HTML + CSS + JS vanilla. Sin frameworks, sin bundler.
El objeto `TimboCharts` ya existe en `assets/js/charts.js` con los módulos `tempHumidity`, `solarRadiation` y `windRose`.
Convenciones: BEM, CSS custom properties, SVG nativo con `document.createElementNS`.
Este gráfico va en la página `proyectos/proyecto-exuma-lodge.html`.

---

## Objetivo

Un **gráfico de barras simples mensuales** que muestra la precipitación media (mm) con dos elementos adicionales:
- **Banda de fondo RA+** (temporada de alta actividad pluvial, Apr–Sep) en azul muy tenue
- **Banda de fondo RA-** (temporada seca, Oct–Mar) sin color / fondo crema neutro
- Labels "RA+" y "RA-" dentro del área del gráfico, encima de las bandas
- Animación de entrada: barras crecen desde la base al hacer scroll
- Hover: tooltip con valor en mm

---

## Datos

```js
months:   ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
rainfall: [38, 40, 37, 65, 98, 107, 109, 105, 142, 100, 55, 3],
// Fuente: PDF "The Bahamas, Outdoor Climate" — Mia Morrone Rueda, AA SED 2024-25
// RA+ (High Rainfall Activity): Apr–Sep (índices 3–8)
// RA-: Oct–Mar (índices 9–11, 0–2)
```

---

## Cambios en `assets/js/charts.js`

### 1. Agregar módulo `rainfall` dentro de `TimboCharts`, después de `windRose`

```js
rainfall: {

  DATA: {
    months:   ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    rainfall: [38, 40, 37, 65, 98, 107, 109, 105, 142, 100, 55, 3],
    // RA+ = índices 3 a 8 (Abr–Sep)
    // RA- = índices 0–2 y 9–11
  },

  VB_W: 800,
  VB_H: 300,
  PAD: { top: 40, right: 30, bottom: 40, left: 55 },

  Y_MAX: 160, // techo eje Y en mm

  COLOR_BAR:    '#4A7FA5',  // azul — misma paleta que línea de humedad del gráfico 1
  COLOR_RA_PLUS: 'rgba(74, 127, 165, 0.07)', // fondo banda RA+

  svgEl: null,
  tooltipEl: null,
  drawn: false,
  animated: false,
  _bars: [],

  ns: 'http://www.w3.org/2000/svg',

  el(tag, attrs) {
    const e = document.createElementNS(this.ns, tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  },

  plotW() { return this.VB_W - this.PAD.left - this.PAD.right; },
  plotH() { return this.VB_H - this.PAD.top  - this.PAD.bottom; },

  yFor(v) {
    return this.PAD.top + (1 - v / this.Y_MAX) * this.plotH();
  },

  hFor(v) {
    return (v / this.Y_MAX) * this.plotH();
  },

  draw() {
    if (this.drawn) return;
    this.drawn = true;

    const svg = this.svgEl;
    svg.setAttribute('viewBox', `0 0 ${this.VB_W} ${this.VB_H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const { months, rainfall } = this.DATA;
    const n = months.length;
    const barGroupW = this.plotW() / n;
    const barW      = barGroupW * 0.55;
    const barOffset = (barGroupW - barW) / 2;
    const baseY     = this.PAD.top + this.plotH();

    /* ---- Bandas RA+ / RA- ---- */
    // RA+ cubre Abr (i=3) a Sep (i=8) — 6 meses
    const raStartX = this.PAD.left + 3 * barGroupW;
    const raEndX   = this.PAD.left + 9 * barGroupW;
    const raWidth  = raEndX - raStartX;

    // Banda RA+
    svg.appendChild(this.el('rect', {
      x: raStartX, y: this.PAD.top,
      width: raWidth, height: this.plotH(),
      fill: this.COLOR_RA_PLUS,
    }));

    // Label "RA+" centrado en la banda, arriba
    const raPlusLabel = this.el('text', {
      x: raStartX + raWidth / 2, y: this.PAD.top - 10,
      'text-anchor': 'middle',
      'font-size': '11', 'font-weight': '600',
      fill: '#4A7FA5',
      'font-family': 'inherit',
      'letter-spacing': '0.05em',
    });
    raPlusLabel.textContent = 'RA+';
    svg.appendChild(raPlusLabel);

    // Bracket superior RA+ — línea horizontal fina
    svg.appendChild(this.el('line', {
      x1: raStartX, y1: this.PAD.top - 6,
      x2: raEndX,   y2: this.PAD.top - 6,
      stroke: '#4A7FA5', 'stroke-width': '1', opacity: '0.4',
    }));

    // Labels "RA-" a la izquierda y derecha
    const raMinusLeftX  = this.PAD.left + 1.5 * barGroupW;  // centro Ene–Mar
    const raMinusRightX = this.PAD.left + 10.5 * barGroupW; // centro Oct–Dic

    [raMinusLeftX, raMinusRightX].forEach(x => {
      const label = this.el('text', {
        x, y: this.PAD.top - 10,
        'text-anchor': 'middle',
        'font-size': '11', 'font-weight': '600',
        fill: 'rgba(0,0,0,0.28)',
        'font-family': 'inherit',
        'letter-spacing': '0.05em',
      });
      label.textContent = 'RA-';
      svg.appendChild(label);
    });

    /* ---- Gridlines + Y labels ---- */
    [40, 80, 120, 160].forEach(v => {
      const y = this.yFor(v);
      svg.appendChild(this.el('line', {
        x1: this.PAD.left, y1: y,
        x2: this.VB_W - this.PAD.right, y2: y,
        stroke: 'rgba(0,0,0,0.06)', 'stroke-width': 1,
      }));
      const label = this.el('text', {
        x: this.PAD.left - 8, y: y + 4,
        'text-anchor': 'end',
        'font-size': '11', fill: 'rgba(0,0,0,0.32)',
        'font-family': 'inherit',
      });
      label.textContent = v;
      svg.appendChild(label);
    });

    /* Y axis unit */
    const unitLabel = this.el('text', {
      x: 10, y: this.PAD.top + this.plotH() / 2,
      'text-anchor': 'middle',
      'font-size': '10', fill: 'rgba(0,0,0,0.35)',
      'font-family': 'inherit',
      transform: `rotate(-90, 10, ${this.PAD.top + this.plotH() / 2})`,
    });
    unitLabel.textContent = 'mm';
    svg.appendChild(unitLabel);

    /* Baseline */
    svg.appendChild(this.el('line', {
      x1: this.PAD.left, y1: baseY,
      x2: this.VB_W - this.PAD.right, y2: baseY,
      stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 1,
    }));

    /* ---- Barras + labels + hitboxes ---- */
    this._bars = [];

    months.forEach((m, i) => {
      const xGroup = this.PAD.left + i * barGroupW;
      const xBar   = xGroup + barOffset;
      const h      = this.hFor(rainfall[i]);
      const yBar   = baseY - h;

      const rect = this.el('rect', {
        x: xBar, y: baseY,
        width: barW, height: 0,
        fill: this.COLOR_BAR,
        rx: '2',
        'data-final-y': yBar,
        'data-final-h': h,
      });

      svg.appendChild(rect);
      this._bars.push(rect);

      /* Month label */
      const label = this.el('text', {
        x: xGroup + barGroupW / 2, y: this.VB_H - 8,
        'text-anchor': 'middle',
        'font-size': '11', fill: 'rgba(0,0,0,0.4)',
        'font-family': 'inherit',
      });
      label.textContent = m;
      svg.appendChild(label);

      /* Hitbox */
      const hitbox = this.el('rect', {
        x: xGroup, y: this.PAD.top,
        width: barGroupW, height: this.plotH(),
        fill: 'transparent', cursor: 'pointer',
      });

      const showTooltip = () => {
        const tip = this.tooltipEl;
        tip.innerHTML =
          '<div class="climate-chart__tooltip-month">' + m + '</div>' +
          '<div class="climate-chart__tooltip-row"><strong>' + rainfall[i] + ' mm</strong></div>';
        tip.classList.add('is-visible');

        const wrapper = svg.closest('.climate-chart__canvas-wrapper');
        const svgRect = wrapper.getBoundingClientRect();
        const xRatio  = (xGroup + barGroupW / 2) / this.VB_W;
        const yRatio  = yBar / this.VB_H;
        tip.style.left      = (xRatio * svgRect.width) + 'px';
        tip.style.top       = (yRatio * svgRect.height - 8) + 'px';
        tip.style.transform = 'translate(-50%, -100%)';
      };

      const hideTooltip = () => {
        this.tooltipEl.classList.remove('is-visible');
      };

      hitbox.addEventListener('mouseenter', showTooltip);
      hitbox.addEventListener('mouseleave', hideTooltip);
      hitbox.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showTooltip();
      }, { passive: false });

      svg.appendChild(hitbox);
    });
  },

  animateIn() {
    if (this.animated) return;
    this.animated = true;

    this._bars.forEach((rect, i) => {
      setTimeout(() => {
        const easing = 'cubic-bezier(0.22,0.61,0.36,1)';
        rect.style.transition = `y 600ms ${easing}, height 600ms ${easing}`;
        rect.setAttribute('y',      rect.getAttribute('data-final-y'));
        rect.setAttribute('height', rect.getAttribute('data-final-h'));
      }, i * 40);
    });
  },

  init() {
    this.svgEl     = document.getElementById('rainfall-svg');
    this.tooltipEl = document.getElementById('rainfall-tooltip');
    if (!this.svgEl) return;

    this.draw();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateIn();
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });

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
  this.windRose.init();
},
```
Por:
```js
init() {
  this.tempHumidity.init();
  this.solarRadiation.init();
  this.windRose.init();
  this.rainfall.init();
},
```

---

## Cambios en `proyectos/proyecto-exuma-lodge.html`

Agregar después del bloque del gráfico de Rosa de Vientos:

```html
<!-- GRÁFICO 4: Lluvia Mensual -->
<div class="climate-chart">
  <div class="climate-chart__header">
    <h3 class="climate-chart__title">Precipitación Mensual</h3>
    <p class="climate-chart__desc">Lluvia media mensual (mm). La banda azul marca la temporada de alta actividad pluvial (RA+, Abr–Sep); el resto corresponde a la temporada seca (RA-).</p>
  </div>
  <div class="climate-chart__canvas-wrapper">
    <svg id="rainfall-svg" class="climate-chart__svg" aria-label="Gráfico de precipitación mensual en Bahamas"></svg>
    <div class="climate-chart__tooltip" id="rainfall-tooltip"></div>
  </div>
</div>
```

---

## Verificación esperada

1. Al cargar la página, las barras están en altura 0.
2. Al hacer scroll, las 12 barras crecen desde la base, escalonadas.
3. Se ve claramente la banda RA+ (fondo azul tenue) sobre Abr–Sep con el label "RA+" arriba.
4. Los meses Oct–Mar tienen el label "RA-" en gris tenue a ambos lados.
5. Septiembre es la barra más alta (~142 mm); Diciembre la más baja (~3 mm).
6. Hover muestra tooltip con el mes y los mm.
7. No hay errores en consola.
8. Los 3 gráficos anteriores (temperatura, radiación, rosa de vientos) siguen funcionando sin cambios.

---

## Notas

- SVG nativo, sin librerías.
- `PAD.top: 40` (más generoso que otros gráficos) para dar espacio a los labels RA+/RA- encima del área.
- El color azul `#4A7FA5` reutiliza el mismo tono de la línea de humedad del gráfico 1 — coherencia visual.
- La banda RA+ es un `<rect>` SVG de fondo con opacidad muy baja, dibujado antes que las barras para que quede detrás.
