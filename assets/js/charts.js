/* ============================================================
   TIMBÓ — charts.js
   Gráficos climáticos SVG — vanilla JS, sin dependencias.
   ============================================================ */

const TimboCharts = {

  tempHumidity: {

    DATA: {
      months:   ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
      tempAvg:  [22, 22, 23, 24, 26, 28, 29, 29, 28, 27, 25, 23],
      tempMax:  [24, 24, 25, 27, 29, 30, 31, 31, 30, 29, 27, 25],
      tempMin:  [19, 19, 20, 21, 23, 25, 26, 26, 25, 24, 22, 20],
      humidity: [70, 70, 69, 70, 73, 79, 79, 79, 79, 77, 74, 71],
    },

    // Layout
    VB_W: 800,
    VB_H: 320,
    PAD: { top: 20, right: 50, bottom: 40, left: 50 },

    // Scales
    TEMP_MIN: 15,
    TEMP_MAX: 35,
    HUM_MIN:  55,
    HUM_MAX:  95,

    svgEl: null,
    tooltipEl: null,
    drawn: false,

    /* ---- helpers ---- */

    ns: 'http://www.w3.org/2000/svg',

    el(tag, attrs) {
      const e = document.createElementNS(this.ns, tag);
      if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      return e;
    },

    plotW() { return this.VB_W - this.PAD.left - this.PAD.right; },
    plotH() { return this.VB_H - this.PAD.top  - this.PAD.bottom; },

    xFor(i) {
      return this.PAD.left + (i / (this.DATA.months.length - 1)) * this.plotW();
    },

    yTemp(v) {
      return this.PAD.top + (1 - (v - this.TEMP_MIN) / (this.TEMP_MAX - this.TEMP_MIN)) * this.plotH();
    },

    yHum(v) {
      return this.PAD.top + (1 - (v - this.HUM_MIN) / (this.HUM_MAX - this.HUM_MIN)) * this.plotH();
    },

    /* Catmull-Rom → cubic bezier smooth path */
    smoothPath(points) {
      if (points.length < 2) return '';
      const d = ['M', points[0][0], points[0][1]];
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const tension = 6;
        const cp1x = p1[0] + (p2[0] - p0[0]) / tension;
        const cp1y = p1[1] + (p2[1] - p0[1]) / tension;
        const cp2x = p2[0] - (p3[0] - p1[0]) / tension;
        const cp2y = p2[1] - (p3[1] - p1[1]) / tension;
        d.push('C', cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
      }
      return d.join(' ');
    },

    /* ---- draw ---- */

    draw() {
      if (this.drawn) return;
      this.drawn = true;

      const svg = this.svgEl;
      svg.setAttribute('viewBox', `0 0 ${this.VB_W} ${this.VB_H}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      const { months, tempAvg, tempMax, tempMin, humidity } = this.DATA;

      /* gridlines */
      [20, 25, 30].forEach(t => {
        const y = this.yTemp(t);
        svg.appendChild(this.el('line', {
          x1: this.PAD.left, y1: y,
          x2: this.VB_W - this.PAD.right, y2: y,
          stroke: 'rgba(0,0,0,0.06)', 'stroke-width': 1,
        }));
      });

      /* axis labels — temp left */
      [20, 25, 30].forEach(t => {
        const y = this.yTemp(t);
        const label = this.el('text', {
          x: this.PAD.left - 10, y: y + 4,
          'text-anchor': 'end',
          'font-size': '11', fill: 'rgba(0,0,0,0.32)',
          'font-family': 'inherit',
        });
        label.textContent = t + '°';
        svg.appendChild(label);
      });

      /* axis labels — humidity right */
      [60, 70, 80, 90].forEach(h => {
        const y = this.yHum(h);
        const label = this.el('text', {
          x: this.VB_W - this.PAD.right + 10, y: y + 4,
          'text-anchor': 'start',
          'font-size': '11', fill: 'rgba(0,0,0,0.32)',
          'font-family': 'inherit',
        });
        label.textContent = h + '%';
        svg.appendChild(label);
      });

      /* month labels */
      months.forEach((m, i) => {
        const label = this.el('text', {
          x: this.xFor(i), y: this.VB_H - 8,
          'text-anchor': 'middle',
          'font-size': '11', fill: 'rgba(0,0,0,0.4)',
          'font-family': 'inherit',
        });
        label.textContent = m;
        svg.appendChild(label);
      });

      /* temperature area (min → max) */
      const areaPoints = [];
      for (let i = 0; i < 12; i++) areaPoints.push([this.xFor(i), this.yTemp(tempMax[i])]);
      for (let i = 11; i >= 0; i--) areaPoints.push([this.xFor(i), this.yTemp(tempMin[i])]);

      // Build area path using smooth top + smooth bottom
      const topPts  = months.map((_, i) => [this.xFor(i), this.yTemp(tempMax[i])]);
      const botPts  = months.map((_, i) => [this.xFor(i), this.yTemp(tempMin[i])]);
      const topD = this.smoothPath(topPts);
      const botReversed = [...botPts].reverse();
      const botD = this.smoothPath(botReversed);
      // Connect: top path forward, line to last bottom, bottom path reversed, close
      const areaD = topD + ' L ' + botReversed[0][0] + ' ' + botReversed[0][1] + ' ' +
                    botD.replace(/^M\s*[\d.]+\s+[\d.]+/, '') + ' Z';

      const area = this.el('path', {
        d: areaD,
        fill: 'rgba(180,120,60,0.12)',
        opacity: '0',
        class: 'climate-chart__area',
      });
      svg.appendChild(area);

      /* temperature avg line */
      const tempPts  = months.map((_, i) => [this.xFor(i), this.yTemp(tempAvg[i])]);
      const tempLine = this.el('path', {
        d: this.smoothPath(tempPts),
        stroke: '#8B5E3C', 'stroke-width': '2',
        fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        class: 'climate-chart__line climate-chart__line--temp',
      });
      svg.appendChild(tempLine);

      /* humidity line */
      const humPts  = months.map((_, i) => [this.xFor(i), this.yHum(humidity[i])]);
      const humLine = this.el('path', {
        d: this.smoothPath(humPts),
        stroke: '#4A7FA5', 'stroke-width': '1.5',
        fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        class: 'climate-chart__line climate-chart__line--humidity',
      });
      svg.appendChild(humLine);

      /* prepare stroke animation */
      [tempLine, humLine].forEach(line => {
        const len = line.getTotalLength();
        line.style.strokeDasharray  = len;
        line.style.strokeDashoffset = len;
      });

      /* hover hitboxes + interactive dots */
      const hoverGroup = this.el('g', { class: 'climate-chart__hover-group' });

      // Vertical guide line (shared, moved on hover)
      const guideLine = this.el('line', {
        x1: 0, y1: this.PAD.top, x2: 0, y2: this.VB_H - this.PAD.bottom,
        stroke: 'rgba(0,0,0,0.15)', 'stroke-width': '1',
        'stroke-dasharray': '4 4',
        opacity: '0',
        class: 'climate-chart__guide',
      });
      hoverGroup.appendChild(guideLine);

      // Dots
      const dotTemp = this.el('circle', {
        r: '4', fill: '#8B5E3C', opacity: '0',
        class: 'climate-chart__dot',
      });
      const dotHum = this.el('circle', {
        r: '4', fill: '#4A7FA5', opacity: '0',
        class: 'climate-chart__dot',
      });
      hoverGroup.appendChild(dotTemp);
      hoverGroup.appendChild(dotHum);

      // Hitboxes per month
      const colW = this.plotW() / 12;
      months.forEach((_, i) => {
        const x = this.xFor(i);
        const hitbox = this.el('rect', {
          x: x - colW / 2, y: this.PAD.top,
          width: colW, height: this.plotH(),
          fill: 'transparent', cursor: 'pointer',
          'data-index': i,
        });

        const showTooltip = () => {
          const idx = i;
          guideLine.setAttribute('x1', x);
          guideLine.setAttribute('x2', x);
          guideLine.setAttribute('opacity', '1');

          dotTemp.setAttribute('cx', x);
          dotTemp.setAttribute('cy', this.yTemp(tempAvg[idx]));
          dotTemp.setAttribute('opacity', '1');

          dotHum.setAttribute('cx', x);
          dotHum.setAttribute('cy', this.yHum(humidity[idx]));
          dotHum.setAttribute('opacity', '1');

          // Tooltip
          const tip = this.tooltipEl;
          tip.innerHTML =
            '<div class="climate-chart__tooltip-month">' + months[idx] + '</div>' +
            '<div class="climate-chart__tooltip-row"><strong>Temp: ' + tempAvg[idx] + '°C</strong>  (mín ' + tempMin[idx] + '° – máx ' + tempMax[idx] + '°)</div>' +
            '<div class="climate-chart__tooltip-row"><strong>Humedad: ' + humidity[idx] + '%</strong></div>';
          tip.classList.add('is-visible');

          // Position tooltip
          const wrapper = svg.closest('.climate-chart__canvas-wrapper');
          const svgRect = wrapper.getBoundingClientRect();
          const xRatio = x / this.VB_W;
          const yRatio = this.yTemp(tempAvg[idx]) / this.VB_H;
          const pxX = xRatio * svgRect.width;
          const pxY = yRatio * svgRect.height;

          tip.style.left = pxX + 'px';
          tip.style.top  = (pxY - 12) + 'px';
          tip.style.transform = 'translate(-50%, -100%)';
        };

        const hideTooltip = () => {
          guideLine.setAttribute('opacity', '0');
          dotTemp.setAttribute('opacity', '0');
          dotHum.setAttribute('opacity', '0');
          this.tooltipEl.classList.remove('is-visible');
        };

        hitbox.addEventListener('mouseenter', showTooltip);
        hitbox.addEventListener('mouseleave', hideTooltip);
        hitbox.addEventListener('touchstart', (e) => {
          e.preventDefault();
          showTooltip();
        }, { passive: false });

        hoverGroup.appendChild(hitbox);
      });

      svg.appendChild(hoverGroup);

      /* hide tooltip on touch outside */
      document.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.climate-chart')) {
          this.tooltipEl.classList.remove('is-visible');
        }
      });
    },

    /* ---- animate in ---- */

    animateIn() {
      const area  = this.svgEl.querySelector('.climate-chart__area');
      const lines = this.svgEl.querySelectorAll('.climate-chart__line');

      // Animate lines
      lines.forEach(line => {
        line.style.transition = 'stroke-dashoffset 1200ms cubic-bezier(0.22, 0.61, 0.36, 1)';
        line.style.strokeDashoffset = '0';
      });

      // Fade in area
      if (area) {
        area.style.transition = 'opacity 1200ms cubic-bezier(0.22, 0.61, 0.36, 1)';
        area.style.opacity = '1';
      }
    },

    /* ---- init ---- */

    init() {
      this.svgEl     = document.getElementById('temp-humidity-svg');
      this.tooltipEl = document.getElementById('climate-tooltip');
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

  /* ============================================================
     GRÁFICO 2 — Radiación Solar (barras apiladas)
     ============================================================ */

  solarRadiation: {

    DATA: {
      months:  ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
      global:  [300, 420, 530, 620, 700, 750, 740, 700, 580, 440, 330, 270],
      diffuse: [130, 165, 190, 210, 245, 290, 285, 275, 230, 185, 145, 115],
    },

    VB_W: 800,
    VB_H: 300,
    PAD: { top: 20, right: 30, bottom: 40, left: 55 },
    Y_MAX: 800,

    COLOR_DIRECT:  '#C05A1F',
    COLOR_DIFFUSE: '#E8A84A',

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

      const { months, global, diffuse } = this.DATA;
      const n = months.length;
      const barGroupW = this.plotW() / n;
      const barW = barGroupW * 0.55;
      const barOffset = (barGroupW - barW) / 2;
      const baseY = this.PAD.top + this.plotH();

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

      /* Y axis unit */
      const unitLabel = this.el('text', {
        x: 10, y: this.PAD.top + this.plotH() / 2,
        'text-anchor': 'middle',
        'font-size': '10', fill: 'rgba(0,0,0,0.35)',
        'font-family': 'inherit',
        transform: `rotate(-90, 10, ${this.PAD.top + this.plotH() / 2})`,
      });
      unitLabel.textContent = 'Wh/m\u00B2';
      svg.appendChild(unitLabel);

      /* baseline */
      svg.appendChild(this.el('line', {
        x1: this.PAD.left, y1: baseY,
        x2: this.VB_W - this.PAD.right, y2: baseY,
        stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 1,
      }));

      /* bars + labels + hitboxes */
      this._bars = [];

      months.forEach((m, i) => {
        const xGroup = this.PAD.left + i * barGroupW;
        const xBar   = xGroup + barOffset;
        const direct  = global[i] - diffuse[i];
        const diff    = diffuse[i];
        const hDirect  = this.hFor(direct);
        const hDiffuse = this.hFor(diff);
        const yDirect  = baseY - hDirect;
        const yDiffuse = yDirect - hDiffuse;

        const rectDirect = this.el('rect', {
          x: xBar, y: baseY,
          width: barW, height: 0,
          fill: this.COLOR_DIRECT, rx: '2',
          'data-final-y': yDirect, 'data-final-h': hDirect,
        });

        const rectDiffuse = this.el('rect', {
          x: xBar, y: baseY,
          width: barW, height: 0,
          fill: this.COLOR_DIFFUSE, rx: '2',
          'data-final-y': yDiffuse, 'data-final-h': hDiffuse,
        });

        svg.appendChild(rectDirect);
        svg.appendChild(rectDiffuse);
        this._bars.push({ direct: rectDirect, diffuse: rectDiffuse });

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
            '<div class="climate-chart__tooltip-row"><strong>Global: ' + global[i] + ' Wh/m\u00B2</strong></div>' +
            '<div class="climate-chart__tooltip-row">Direct: ' + (global[i] - diffuse[i]) + ' Wh/m\u00B2</div>' +
            '<div class="climate-chart__tooltip-row">Diffuse: ' + diffuse[i] + ' Wh/m\u00B2</div>';
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

      this._bars.forEach(({ direct, diffuse }, i) => {
        const delay = i * 40;
        setTimeout(() => {
          const easing = 'cubic-bezier(0.22,0.61,0.36,1)';
          direct.style.transition  = `y 600ms ${easing}, height 600ms ${easing}`;
          diffuse.style.transition = `y 600ms ${easing}, height 600ms ${easing}`;

          direct.setAttribute('y',      direct.getAttribute('data-final-y'));
          direct.setAttribute('height', direct.getAttribute('data-final-h'));
          diffuse.setAttribute('y',      diffuse.getAttribute('data-final-y'));
          diffuse.setAttribute('height', diffuse.getAttribute('data-final-h'));
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

  /* ============================================================
     GRÁFICO 3 — Rosa de Vientos (polar SVG con toggle)
     ============================================================ */

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

    SIZE: 400,
    CX: 200,
    CY: 200,
    R_MAX: 160,

    svgEl: null,
    currentSeason: 'wet',
    drawn: false,
    petalEls: [],

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

    freqToR(freq, maxFreq) {
      return (freq / maxFreq) * this.R_MAX;
    },

    petalPoints(angleDeg, r) {
      const angleRad = (angleDeg - 90) * Math.PI / 180;
      const halfWidth = Math.PI / 16;

      const tipX = this.CX + r * Math.cos(angleRad);
      const tipY = this.CY + r * Math.sin(angleRad);

      const leftAngle  = angleRad - halfWidth;
      const rightAngle = angleRad + halfWidth;
      const baseR = r * 0.15;

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

      // Reference rings
      [0.25, 0.5, 0.75, 1].forEach(pct => {
        svg.appendChild(this.el('circle', {
          cx: this.CX, cy: this.CY,
          r: this.R_MAX * pct,
          fill: 'none',
          stroke: 'rgba(0,0,0,0.07)',
          'stroke-width': 1,
        }));
      });

      // Cardinal axes + labels
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

      // Petal group
      const petalGroup = this.el('g', { id: 'windRosePetals' });
      svg.appendChild(petalGroup);

      this.renderPetals(petalGroup, this.currentSeason);
    },

    renderPetals(group, season) {
      while (group.firstChild) group.removeChild(group.firstChild);
      this.petalEls = [];

      const data = this.DATA[season];
      const maxFreq = Math.max(...data.freq);
      const n = this.DATA.directions.length;

      data.freq.forEach((freq, i) => {
        const angleDeg = (i / n) * 360;
        const r = this.freqToR(freq, maxFreq);
        const color = this.speedColor(data.speed[i]);

        const petal = this.el('polygon', {
          points: this.petalPoints(angleDeg, r),
          fill: color,
          opacity: '0.85',
          'data-dir': this.DATA.directions[i],
          'data-freq': freq,
          'data-speed': data.speed[i],
        });

        group.appendChild(petal);
        this.petalEls.push(petal);
      });
    },

    switchSeason(season) {
      if (season === this.currentSeason) return;
      this.currentSeason = season;
      const petalGroup = this.svgEl.querySelector('#windRosePetals');
      if (!petalGroup) return;

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

      // Toggle
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

      // Fade in on viewport
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

  /* ============================================================
     GRÁFICO 4 — Precipitación Mensual (barras simples + bandas RA)
     ============================================================ */

  rainfall: {

    DATA: {
      months:   ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
      rain:     [44, 47, 44, 69, 109, 163, 155, 163, 170, 163, 84, 50],
    },

    VB_W: 800,
    VB_H: 300,
    PAD: { top: 40, right: 30, bottom: 40, left: 55 },
    Y_MAX: 200,

    COLOR_BAR: '#4A7FA5',
    COLOR_RA_BAND: 'rgba(74,127,165,0.07)',

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

      const { months, rain } = this.DATA;
      const n = months.length;
      const barGroupW = this.plotW() / n;
      const barW = barGroupW * 0.55;
      const barOffset = (barGroupW - barW) / 2;
      const baseY = this.PAD.top + this.plotH();

      /* RA+ background band (Apr–Sep = indices 3–8) */
      const raStartX = this.PAD.left + 3 * barGroupW;
      const raEndX   = this.PAD.left + 9 * barGroupW;
      svg.appendChild(this.el('rect', {
        x: raStartX, y: this.PAD.top,
        width: raEndX - raStartX, height: this.plotH(),
        fill: this.COLOR_RA_BAND,
      }));

      /* RA bracket line + labels */
      const bracketY = this.PAD.top - 8;
      const raMidX   = (raStartX + raEndX) / 2;

      // RA+ bracket
      svg.appendChild(this.el('line', {
        x1: raStartX, y1: bracketY, x2: raEndX, y2: bracketY,
        stroke: 'rgba(0,0,0,0.2)', 'stroke-width': 1,
      }));
      svg.appendChild(this.el('line', {
        x1: raStartX, y1: bracketY - 4, x2: raStartX, y2: bracketY + 4,
        stroke: 'rgba(0,0,0,0.2)', 'stroke-width': 1,
      }));
      svg.appendChild(this.el('line', {
        x1: raEndX, y1: bracketY - 4, x2: raEndX, y2: bracketY + 4,
        stroke: 'rgba(0,0,0,0.2)', 'stroke-width': 1,
      }));
      const raLabel = this.el('text', {
        x: raMidX, y: bracketY - 6,
        'text-anchor': 'middle',
        'font-size': '10', fill: 'rgba(0,0,0,0.45)',
        'font-family': 'inherit', 'font-weight': '600',
      });
      raLabel.textContent = 'RA+';
      svg.appendChild(raLabel);

      // RA- labels (left + right)
      const raMinusLeftX = (this.PAD.left + raStartX) / 2;
      const raMinusRightX = (raEndX + this.VB_W - this.PAD.right) / 2;
      [raMinusLeftX, raMinusRightX].forEach(xPos => {
        const lbl = this.el('text', {
          x: xPos, y: bracketY - 6,
          'text-anchor': 'middle',
          'font-size': '10', fill: 'rgba(0,0,0,0.3)',
          'font-family': 'inherit',
        });
        lbl.textContent = 'RA\u2212';
        svg.appendChild(lbl);
      });

      /* gridlines + Y labels */
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

      /* baseline */
      svg.appendChild(this.el('line', {
        x1: this.PAD.left, y1: baseY,
        x2: this.VB_W - this.PAD.right, y2: baseY,
        stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 1,
      }));

      /* bars + labels + hitboxes */
      this._bars = [];

      months.forEach((m, i) => {
        const xGroup = this.PAD.left + i * barGroupW;
        const xBar   = xGroup + barOffset;
        const h = this.hFor(rain[i]);
        const y = baseY - h;

        const rect = this.el('rect', {
          x: xBar, y: baseY,
          width: barW, height: 0,
          fill: this.COLOR_BAR, rx: '2',
          opacity: '0.85',
          'data-final-y': y, 'data-final-h': h,
        });

        svg.appendChild(rect);
        this._bars.push(rect);

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
            '<div class="climate-chart__tooltip-row"><strong>' + rain[i] + ' mm</strong></div>';
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

      this._bars.forEach((bar, i) => {
        setTimeout(() => {
          const easing = 'cubic-bezier(0.22,0.61,0.36,1)';
          bar.style.transition = `y 600ms ${easing}, height 600ms ${easing}`;
          bar.setAttribute('y',      bar.getAttribute('data-final-y'));
          bar.setAttribute('height', bar.getAttribute('data-final-h'));
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

  init() {
    this.tempHumidity.init();
    this.solarRadiation.init();
    this.windRose.init();
    this.rainfall.init();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  TimboCharts.init();
});
