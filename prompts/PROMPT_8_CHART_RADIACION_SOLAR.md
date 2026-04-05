# PROMPT 8 — Gráfico 2: Radiación Solar (barras mensuales)

## Contexto del proyecto
Stack: HTML + CSS + JS vanilla. Sin frameworks, sin bundler.
El objeto `TimboCharts` ya existe en `assets/js/charts.js` con el módulo `tempHumidity`.
Convenciones: BEM, CSS custom properties, SVG nativo con `document.createElementNS`.
Este gráfico va en la página `proyectos/proyecto-exuma-lodge.html`.

---

## Objetivo

Agregar un **segundo gráfico de barras mensuales** que muestra la radiación solar en Bahamas:
- Barras apiladas: **Global horizontal** (naranja oscuro) + **Difusa horizontal** (amarillo/dorado)
- Eje Y izquierdo: energía en Wh/m²
- Eje X: 12 meses
- Animación de entrada: las barras crecen desde la base hacia arriba al entrar al viewport (IntersectionObserver)
- Hover: tooltip con valores exactos de global y difusa para ese mes

---

## Datos

```js
months:  ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
global:  [300, 420, 530, 620, 700, 750, 740, 700, 580, 440, 330, 270],
diffuse: [130, 165, 190, 210, 245, 290, 285, 275, 230, 185, 145, 115],
```

`diffuse` está incluido dentro de `global` (es la fracción difusa del total) — se representa apilando la porción difusa encima de la porción directa: barra directa = `global - diffuse`, barra difusa = `diffuse`, total visible = `global`.

---

## Cambios en `assets/js/charts.js`

### 1. Agregar nuevo módulo `solarRadiation` dentro del objeto `TimboCharts`, después de `tempHumidity`

```js
solarRadiation: {

  DATA: {
    months:  ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    global:  [300, 420, 530, 620, 700, 750, 740, 700, 580, 440, 330, 270],
    diffuse: [130, 165, 190, 210, 245, 290, 285, 275, 230, 185, 145, 115],
  },

  VB_W: 800,
  VB_H: 300,
  PAD: { top: 20, right: 30, bottom: 40, left: 55 },

  Y_MAX: 800, // techo del eje Y en Wh/m²

  COLOR_DIRECT:  '#C05A1F', // naranja oscuro — radiación directa
  COLOR_DIFFUSE: '#E8A84A', // amarillo/dorado — radiación difusa

  svgEl: null,
  tooltipEl: null,
  drawn: false,
  animated: false,

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

    const { months, global, diffuse } = this.DATA;
    const n = months.length;
    const barGroupW = this.plotW() / n;
    const barW = barGroupW * 0.55;
    const barOffset = (barGroupW - barW) / 2;

    /* gridlines + Y labels */
    [200, 400, 600, 800].forEach(v => {
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

    /* Y axis unit label */
    const unitLabel = this.el('text', {
      x: 10, y: this.PAD.top + this.plotH() / 2,
      'text-anchor': 'middle',
      'font-size': '10', fill: 'rgba(0,0,0,0.35)',
      'font-family': 'inherit',
      transform: `rotate(-90, 10, ${this.PAD.top + this.plotH() / 2})`,
    });
    unitLabel.textContent = 'Wh/m²';
    svg.appendChild(unitLabel);

    /* baseline */
    const baseY = this.PAD.top + this.plotH();
    svg.appendChild(this.el('line', {
      x1: this.PAD.left, y1: baseY,
      x2: this.VB_W - this.PAD.right, y2: baseY,
      stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 1,
    }));

    /* bars + month labels + hitboxes */
    this._bars = []; // store for animation

    months.forEach((m, i) => {
      const xGroup = this.PAD.left + i * barGroupW;
      const xBar   = xGroup + barOffset;
      const direct  = global[i] - diffuse[i];
      const diff    = diffuse[i];

      // Direct bar (bottom)
      const hDirect  = this.hFor(direct);
      const hDiffuse = this.hFor(diff);
      const yDirect  = baseY - hDirect;
      const yDiffuse = yDirect - hDiffuse;

      const rectDirect = this.el('rect', {
        x: xBar, y: baseY, // starts at baseline, grows up via animation
        width: barW, height: 0, // animated to hDirect
        fill: this.COLOR_DIRECT,
        rx: '2',
        'data-final-y': yDirect,
        'data-final-h': hDirect,
        class: 'solar-chart__bar solar-chart__bar--direct',
      });

      const rectDiffuse = this.el('rect', {
        x: xBar, y: baseY,
        width: barW, height: 0,
        fill: this.COLOR_DIFFUSE,
        rx: '2',
        'data-final-y': yDiffuse,
        'data-final-h': hDiffuse,
        class: 'solar-chart__bar solar-chart__bar--diffuse',
      });

      svg.appendChild(rectDirect);
      svg.appendChild(rectDiffuse);
      this._bars.push({ direct: rectDirect, diffuse: rectDiffuse, baseY });

      /* month label */
      const label = this.el('text', {
        x: xGroup + barGroupW / 2, y: this.VB_H - 8,
        'text-anchor': 'middle',
        'font-size': '11', fill: 'rgba(0,0,0,0.4)',
        'font-family': 'inherit',
      });
      label.textContent = m;
      svg.appendChild(label);

      /* hitbox */
      const hitbox = this.el('rect', {
        x: xGroup, y: this.PAD.top,
        width: barGroupW, height: this.plotH(),
        fill: 'transparent', cursor: 'pointer',
      });

      const showTooltip = () => {
        const tip = this.tooltipEl;
        tip.innerHTML =
          '<div class="climate-chart__tooltip-month">' + m + '</div>' +
          '<div class="climate-chart__tooltip-row"><strong>Global: ' + global[i] + ' Wh/m²</strong></div>' +
          '<div class="climate-chart__tooltip-row">Directa: ' + (global[i] - diffuse[i]) + ' Wh/m²</div>' +
          '<div class="climate-chart__tooltip-row">Difusa: ' + diffuse[i] + ' Wh/m²</div>';
        tip.classList.add('is-visible');

        const wrapper = svg.closest('.climate-chart__canvas-wrapper');
        const svgRect = wrapper.getBoundingClientRect();
        const xRatio  = (xGroup + barGroupW / 2) / this.VB_W;
        const pxX = xRatio * svgRect.width;
        tip.style.left = pxX + 'px';
        tip.style.top  = '16px';
        tip.style.transform = 'translate(-50%, 0)';
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

    this._bars.forEach(({ direct, diffuse, baseY }, i) => {
      const delay = i * 40; // escalonado suave

      setTimeout(() => {
        const hD = parseFloat(direct.getAttribute('data-final-h'));
        const yD = parseFloat(direct.getAttribute('data-final-y'));
        const hDiff = parseFloat(diffuse.getAttribute('data-final-h'));
        const yDiff = parseFloat(diffuse.getAttribute('data-final-y'));

        direct.style.transition  = 'y 600ms cubic-bezier(0.22,0.61,0.36,1), height 600ms cubic-bezier(0.22,0.61,0.36,1)';
        diffuse.style.transition = 'y 600ms cubic-bezier(0.22,0.61,0.36,1), height 600ms cubic-bezier(0.22,0.61,0.36,1)';

        direct.setAttribute('y', yD);
        direct.setAttribute('height', hD);
        diffuse.setAttribute('y', yDiff);
        diffuse.setAttribute('height', hDiff);
      }, delay);
    });
  },

  init() {
    this.svgEl     = document.getElementById('solar-radiation-svg');
    this.tooltipEl = document.getElementById('solar-tooltip');
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

### 2. Actualizar `TimboCharts.init()` para llamar al nuevo módulo

Reemplazar:
```js
init() {
  this.tempHumidity.init();
},
```
Por:
```js
init() {
  this.tempHumidity.init();
  this.solarRadiation.init();
},
```

---

## Cambios en `proyectos/proyecto-exuma-lodge.html`

### Localizar la sección `.project-climate` y agregar el nuevo bloque DESPUÉS del bloque del gráfico de temperatura/humedad existente.

El bloque del gráfico 1 termina con algo similar a:
```html
</div><!-- /.climate-chart -->
```

Inmediatamente después, agregar:

```html
<!-- GRÁFICO 2: Radiación Solar -->
<div class="climate-chart">
  <div class="climate-chart__header">
    <h3 class="climate-chart__title">Radiación Solar</h3>
    <p class="climate-chart__desc">Intensidad de energía solar mensual (Wh/m²). La porción dorada representa la radiación difusa; la naranja, la directa.</p>
  </div>
  <div class="climate-chart__legend">
    <span class="climate-chart__legend-item">
      <span class="climate-chart__legend-swatch" style="background:#C05A1F;"></span>
      Radiación directa
    </span>
    <span class="climate-chart__legend-item">
      <span class="climate-chart__legend-swatch" style="background:#E8A84A;"></span>
      Radiación difusa
    </span>
  </div>
  <div class="climate-chart__canvas-wrapper">
    <svg id="solar-radiation-svg" class="climate-chart__svg" aria-label="Gráfico de radiación solar mensual"></svg>
    <div class="climate-chart__tooltip" id="solar-tooltip"></div>
  </div>
</div>
```

---

## Verificación esperada

1. Al cargar la página, las barras del gráfico están en altura 0 (invisibles).
2. Al hacer scroll hasta la sección de clima, las barras crecen desde la base hacia arriba, escalonadas de izquierda a derecha.
3. Cada barra muestra dos colores: naranja oscuro (directa) abajo, dorado (difusa) encima.
4. Al hacer hover en un mes, aparece el tooltip con los valores de global, directa y difusa.
5. El gráfico de temperatura/humedad existente no se ve afectado.
6. No hay errores en consola.

---

## Notas

- SVG nativo, sin librerías.
- La animación CSS de `y` y `height` en `<rect>` SVG funciona en todos los navegadores modernos.
- Los colores naranja/dorado son coherentes con los del PDF original.
- El tooltip reutiliza las clases `.climate-chart__tooltip` y `.climate-chart__tooltip-month` ya definidas en `styles.css`.
