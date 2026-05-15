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

  /* ============================================================
     GRÁFICO 5 — Emisiones globales de CO2 (pie chart)
     ============================================================ */

  emissionsPie: {

    // Datos: orden = orden de dibujado, en sentido horario desde arriba (12hs).
    // Los slices se dibujan en este orden, así que el primero arranca en el "top".
    DATA: [
      { id: 'industry',  value: 30, color: '#BCD8ED' }, // celeste
      { id: 'materials', value: 11, color: '#74793E' }, // oliva/verde
      { id: 'transport', value: 22, color: '#D6D6D6' }, // gris claro
      { id: 'ops',       value: 28, color: '#A8A8A8' }, // gris medio
      { id: 'other',     value:  9, color: '#7A7A7A' }, // gris oscuro
    ],

    // Geometría
    CX: 100,
    CY: 100,
    R:  90,

    rootEl: null,
    svgEl: null,
    slicesGroup: null,
    legendItems: null,
    drawn: false,
    animated: false,
    _slices: [], // {id, pathEl, startAngle, endAngle}

    ns: 'http://www.w3.org/2000/svg',

    el(tag, attrs) {
      const e = document.createElementNS(this.ns, tag);
      if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      return e;
    },

    // Convierte ángulo (0 = arriba, en sentido horario) y radio en (x, y).
    polar(angleDeg, r) {
      const rad = (angleDeg - 90) * Math.PI / 180;
      return {
        x: this.CX + r * Math.cos(rad),
        y: this.CY + r * Math.sin(rad),
      };
    },

    // Dibuja un slice como path (wedge) entre dos ángulos.
    arcPath(startAngle, endAngle) {
      const start = this.polar(endAngle, this.R);
      const end   = this.polar(startAngle, this.R);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return [
        `M ${this.CX} ${this.CY}`,
        `L ${start.x} ${start.y}`,
        `A ${this.R} ${this.R} 0 ${largeArc} 0 ${end.x} ${end.y}`,
        'Z',
      ].join(' ');
    },

    /* ---- draw ---- */

    draw() {
      if (this.drawn) return;
      this.drawn = true;

      const total = this.DATA.reduce((sum, d) => sum + d.value, 0);
      let angle = 0;

      this.DATA.forEach(d => {
        const sweep = (d.value / total) * 360;
        const startAngle = angle;
        const endAngle   = angle + sweep;
        angle = endAngle;

        const path = this.el('path', {
          d: this.arcPath(startAngle, endAngle),
          fill: d.color,
          stroke: '#F6F6F6',
          'stroke-width': '1.2',
          'stroke-linejoin': 'round',
          'data-slice': d.id,
        });
        this.slicesGroup.appendChild(path);

        this._slices.push({ id: d.id, pathEl: path, startAngle, endAngle });
      });
    },

    /* ---- animateIn: sweep horario desde 0 ---- */

    animateIn() {
      if (this.animated) return;
      this.animated = true;

      // Estrategia: usamos un clipPath circular animado. Más simple: animamos
      // el path de cada slice "creciendo" desde 0° hasta su sweep final.
      // Para no complicar, optamos por un fade-in escalonado por slice
      // siguiendo el orden horario.
      this._slices.forEach((s, i) => {
        s.pathEl.style.opacity = '0';
        s.pathEl.style.transition = 'opacity 1100ms cubic-bezier(0.22, 0.61, 0.36, 1)';
      });

      // Forzamos reflow para que el opacity 0 se aplique antes del transition
      // eslint-disable-next-line no-unused-expressions
      this.svgEl.getBoundingClientRect();

      this._slices.forEach((s, i) => {
        const delay = 220 * i;
        setTimeout(() => {
          s.pathEl.style.opacity = '1';
        }, delay);
      });
    },

    /* ---- hover: highlight slice + matching legend item ---- */

    bindHover() {
      const setActive = (sliceId) => {
        this._slices.forEach(s => {
          if (sliceId && s.id !== sliceId) {
            s.pathEl.style.opacity = '0.35';
          } else {
            s.pathEl.style.opacity = '1';
          }
        });
        this.legendItems.forEach(item => {
          const id = item.getAttribute('data-slice');
          item.classList.toggle('is-active', sliceId !== null && id === sliceId);
          item.classList.toggle('is-dim', sliceId !== null && id !== sliceId);
        });
      };

      // Hover sobre los slices
      this._slices.forEach(s => {
        s.pathEl.addEventListener('mouseenter', () => setActive(s.id));
        s.pathEl.addEventListener('mouseleave', () => setActive(null));
      });

      // Hover sobre la leyenda
      this.legendItems.forEach(item => {
        const id = item.getAttribute('data-slice');
        item.addEventListener('mouseenter', () => setActive(id));
        item.addEventListener('mouseleave', () => setActive(null));
      });
    },

    /* ---- init ---- */

    init() {
      this.rootEl = document.getElementById('emissions-chart');
      if (!this.rootEl) return;

      this.svgEl       = this.rootEl.querySelector('.emissions-chart__pie');
      this.slicesGroup = this.rootEl.querySelector('.emissions-chart__slices');
      this.legendItems = this.rootEl.querySelectorAll('.emissions-chart__legend-item');
      if (!this.svgEl || !this.slicesGroup) return;

      // Pintamos los swatches de la leyenda con el mismo color del slice
      this.legendItems.forEach(item => {
        const id = item.getAttribute('data-slice');
        const datum = this.DATA.find(d => d.id === id);
        if (!datum) return;
        const swatch = item.querySelector('.emissions-chart__swatch');
        if (swatch) swatch.style.backgroundColor = datum.color;
      });

      this.draw();
      this.bindHover();

      // Animación de entrada cuando entra al viewport (una sola vez)
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateIn();
            observer.disconnect();
          }
        });
      }, { threshold: 0.3 });

      // Estado inicial: invisible — animateIn lo prende
      this._slices.forEach(s => { s.pathEl.style.opacity = '0'; });
      observer.observe(this.svgEl);
    },
  },

  /* ============================================================
     GRÁFICO 6 — Outdoor Climate Card (Buenos Aires)
     Reemplaza la imagen estática en la sección "sust-process".
     4 paneles minimalistas: temp+humedad, radiación, lluvia, viento.
     ============================================================ */

  outdoorClimate: {

    DATA: {
      months:   ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
      // °C — Buenos Aires (aprox., basado en gráfico de referencia)
      tempAvg:  [25, 24, 23, 19, 16, 13, 12, 14, 16, 19, 22, 24],
      tempMin:  [21, 20, 19, 15, 12, 9,  8,  9, 11, 14, 17, 19],
      tempMax:  [28, 29, 27, 23, 20, 17, 16, 18, 20, 23, 26, 28],
      // % — Humedad relativa: 64 en Ene (mínimo), tres jorobas (Abr ~75,
      // Jun ~76, Ago ~78 máximo anual), luego descenso sostenido a 64 en Dic.
      humidity: [64, 73, 71, 73, 76, 75, 74, 70, 71, 70, 71, 65],
      // Wh/m² — radiación global horizontal media diaria
      radiation:[885, 800, 680, 540, 410, 340, 380, 480, 600, 740, 850, 890],
      // mm — precipitación mensual
      rain:     [110,  95, 105, 90, 80, 60, 70, 75, 80, 110, 100, 115],
      // m/s — viento medio
      wind:     [5.0, 4.6, 4.2, 3.8, 3.7, 3.9, 4.0, 4.3, 4.7, 5.2, 5.6, 5.3],
    },

    // Rangos de escala
    TEMP_MIN: 5,  TEMP_MAX: 32,
    HUM_MIN:  55, HUM_MAX:  85,
    RAD_MAX:  1000,
    RAIN_MAX: 116,
    WIND_MIN: 3,
    WIND_MAX: 6,

    // Padding interno común (en unidades del viewBox horizontal de 800)
    PAD_X: 42,

    // Colores (alineados a variables.css)
    COLOR_TEMP:     '#6D4D0B',           // --color-earth
    COLOR_RANGE:    'rgba(109,77,11,0.12)',
    COLOR_HUMIDITY: '#7a93a8',           // azul apagado (mismo que pilares)
    COLOR_RADIATION:'#9EA052',           // --color-olive
    COLOR_RAIN:     '#BCD8ED',           // --color-sky
    COLOR_WIND:     '#575756',           // --color-gray-400
    COLOR_GRID:     'rgba(29,29,27,0.08)',
    COLOR_AXIS:     'rgba(29,29,27,0.35)',
    LETTER_CHARSET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',

    rootEl: null,
    coordsEl: null,
    coordsText: '',
    drawn: false,
    animated: false,
    coordsAnimated: false,
    coordsScrambleRaf: 0,
    _animTargets: [],
    // Marcadores interactivos por panel (se rellenan en draw*)
    _markers: {
      temp:      { dotAvg: null, dotMin: null, dotMax: null, dotHum: null },
      radiation: { bars: [] },
      rain:      { bars: [] },
      wind:      { dot: null },
    },

    ns: 'http://www.w3.org/2000/svg',

    el(tag, attrs) {
      const e = document.createElementNS(this.ns, tag);
      if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      return e;
    },

    randomizeCoordsChar(char) {
      if (/\d/.test(char)) {
        return String(Math.floor(Math.random() * 10));
      }

      if (/[A-Za-z]/.test(char)) {
        return this.LETTER_CHARSET[Math.floor(Math.random() * this.LETTER_CHARSET.length)];
      }

      return char;
    },

    animateCoordsScramble() {
      if (!this.coordsEl || this.coordsAnimated) return;
      this.coordsAnimated = true;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.coordsEl.textContent = this.coordsText;
        return;
      }

      const finalText = this.coordsText;
      const chars = Array.from(finalText);
      const duration = 1800;
      const startTime = performance.now();
      const revealPoints = chars.map((char, index) => {
        if (!/[A-Za-z0-9]/.test(char)) return 0;
        const base = index / Math.max(chars.length - 1, 1);
        return Math.min(1, base * 0.65 + Math.random() * 0.35);
      });

      const frame = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const nextText = chars.map((char, index) => {
          if (!/[A-Za-z0-9]/.test(char)) return char;
          if (progress >= revealPoints[index]) return char;
          return this.randomizeCoordsChar(char);
        }).join('');

        this.coordsEl.textContent = nextText;

        if (progress < 1) {
          this.coordsScrambleRaf = window.requestAnimationFrame(frame);
        } else {
          this.coordsEl.textContent = finalText;
          this.coordsScrambleRaf = 0;
        }
      };

      this.coordsEl.textContent = chars.map((char) => (
        /[A-Za-z0-9]/.test(char) ? this.randomizeCoordsChar(char) : char
      )).join('');

      this.coordsScrambleRaf = window.requestAnimationFrame(frame);
    },

    /* helpers */
    xFor(i, vbW) {
      const n = this.DATA.months.length;
      const plotW = vbW - this.PAD_X * 2;
      // centro de cada mes (12 columnas)
      return this.PAD_X + (i + 0.5) * (plotW / n);
    },

    yMap(v, min, max, top, height) {
      const t = (v - min) / (max - min);
      return top + (1 - t) * height;
    },

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

    /* Catmull-Rom cíclico: interpola una serie mensual a una serie
       de N*sub puntos (sub sub-puntos por mes). El primero coincide
       con el dato original; el resto va entre meses. */
    interpolateCyclic(values, sub) {
      const n = values.length;
      const out = [];
      for (let i = 0; i < n; i++) {
        const p0 = values[(i - 1 + n) % n];
        const p1 = values[i];
        const p2 = values[(i + 1) % n];
        const p3 = values[(i + 2) % n];
        for (let k = 0; k < sub; k++) {
          const t = k / sub;
          const t2 = t * t;
          const t3 = t2 * t;
          // Catmull-Rom uniforme
          const v = 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
          );
          out.push(v);
        }
      }
      return out;
    },

    /* ---- Panel: Temperatura + Humedad ----
       Resolución elevada: SUB sub-puntos por mes (48 puntos en total). */
    drawTempPanel(svg) {
      const vbW = 800, vbH = 220;
      const padTop = 18, padBottom = 14;
      const plotH = vbH - padTop - padBottom;

      const { months, tempAvg, tempMin, tempMax, humidity } = this.DATA;

      // === Sub-resolución ===
      const SUB = 4;                   // sub-puntos por mes
      const N   = months.length * SUB; // total de puntos (48)
      const plotW = vbW - this.PAD_X * 2;

      // x para sub-punto j ∈ [0, N)
      const xAt = (j) => this.PAD_X + (j + 0.5) * (plotW / N);

      // Mes/semana a partir del índice j
      const weekLabel = (j) => {
        const monthIdx = Math.floor(j / SUB);
        const week     = (j % SUB) + 1;
        return months[monthIdx] + ' · sem ' + week;
      };

      // Series interpoladas (Catmull-Rom cíclico)
      const sAvg = this.interpolateCyclic(tempAvg, SUB);
      const sMin = this.interpolateCyclic(tempMin, SUB);
      const sMax = this.interpolateCyclic(tempMax, SUB);
      const sHum = this.interpolateCyclic(humidity, SUB);

      // gridlines temp (eje izquierdo)
      [10, 20, 30].forEach(t => {
        const y = this.yMap(t, this.TEMP_MIN, this.TEMP_MAX, padTop, plotH);
        svg.appendChild(this.el('line', {
          x1: this.PAD_X, y1: y, x2: vbW - this.PAD_X, y2: y,
          stroke: this.COLOR_GRID, 'stroke-width': 1,
        }));
        const lbl = this.el('text', {
          x: 8, y: y + 4, 'text-anchor': 'start',
          'font-size': '10', fill: this.COLOR_AXIS, 'font-family': 'inherit',
        });
        lbl.textContent = t + '°';
        svg.appendChild(lbl);
      });

      // eje derecho (humedad)
      [60, 75].forEach(h => {
        const y = this.yMap(h, this.HUM_MIN, this.HUM_MAX, padTop, plotH);
        const lbl = this.el('text', {
          x: vbW - 8, y: y + 4, 'text-anchor': 'end',
          'font-size': '10', fill: this.COLOR_AXIS, 'font-family': 'inherit',
        });
        lbl.textContent = h + '%';
        svg.appendChild(lbl);
      });

      // tick verticales tenues por sub-punto (cada sem)
      for (let j = 0; j < N; j++) {
        const isMonthStart = (j % SUB) === 0;
        svg.appendChild(this.el('line', {
          x1: xAt(j), y1: padTop + plotH - 4,
          x2: xAt(j), y2: padTop + plotH,
          stroke: isMonthStart ? this.COLOR_AXIS : this.COLOR_GRID,
          'stroke-width': isMonthStart ? 0.8 : 0.5,
        }));
      }

      // Área (rango min-max temperatura, con curva interpolada)
      const topPts = [];
      const botPts = [];
      for (let j = 0; j < N; j++) {
        topPts.push([xAt(j), this.yMap(sMax[j], this.TEMP_MIN, this.TEMP_MAX, padTop, plotH)]);
        botPts.push([xAt(j), this.yMap(sMin[j], this.TEMP_MIN, this.TEMP_MAX, padTop, plotH)]);
      }
      const botRev = [...botPts].reverse();
      const topD = this.smoothPath(topPts);
      const botD = this.smoothPath(botRev);
      const areaD = topD + ' L ' + botRev[0][0] + ' ' + botRev[0][1] + ' ' +
                    botD.replace(/^M\s*[\d.]+\s+[\d.]+/, '') + ' Z';

      const area = this.el('path', {
        d: areaD, fill: this.COLOR_RANGE, opacity: '0',
        class: 'outdoor-climate__area',
      });
      svg.appendChild(area);

      // Línea temperatura media
      const tempPts = [];
      for (let j = 0; j < N; j++) tempPts.push([xAt(j), this.yMap(sAvg[j], this.TEMP_MIN, this.TEMP_MAX, padTop, plotH)]);
      const tempLine = this.el('path', {
        d: this.smoothPath(tempPts),
        stroke: this.COLOR_TEMP, 'stroke-width': 1.6, fill: 'none',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        class: 'outdoor-climate__line',
      });
      svg.appendChild(tempLine);

      // Línea humedad (dashed)
      const humPts = [];
      for (let j = 0; j < N; j++) humPts.push([xAt(j), this.yMap(sHum[j], this.HUM_MIN, this.HUM_MAX, padTop, plotH)]);
      const humLine = this.el('path', {
        d: this.smoothPath(humPts),
        stroke: this.COLOR_HUMIDITY, 'stroke-width': 1.2, fill: 'none',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'stroke-dasharray': '4 4',
        class: 'outdoor-climate__line',
      });
      svg.appendChild(humLine);

      // prepara animación de trazo
      [tempLine, humLine].forEach(line => {
        const len = line.getTotalLength();
        line.style.strokeDasharray = (line.getAttribute('stroke-dasharray') === '4 4')
          ? len + ' ' + len
          : len;
        line.style.strokeDashoffset = len;
        this._animTargets.push({ type: 'line', el: line, len });
      });
      this._animTargets.push({ type: 'fade', el: area });

      // marcadores interactivos (ocultos hasta hover)
      const dotAvg = this.el('circle', { r: 3.5, fill: this.COLOR_TEMP, opacity: '0', class: 'outdoor-climate__marker' });
      const dotMin = this.el('circle', { r: 2.5, fill: 'none', stroke: this.COLOR_TEMP, 'stroke-width': 1, opacity: '0', class: 'outdoor-climate__marker' });
      const dotMax = this.el('circle', { r: 2.5, fill: 'none', stroke: this.COLOR_TEMP, 'stroke-width': 1, opacity: '0', class: 'outdoor-climate__marker' });
      const dotHum = this.el('circle', { r: 3, fill: this.COLOR_HUMIDITY, opacity: '0', class: 'outdoor-climate__marker' });
      [dotAvg, dotMin, dotMax, dotHum].forEach(d => svg.appendChild(d));
      this._markers.temp = { dotAvg, dotMin, dotMax, dotHum };

      // hover layer — N sub-puntos en lugar de 12 meses
      this.attachInteractivity({
        svg, panelKey: 'temp', vbW, vbH, padTop, plotH,
        readoutId: 'outdoor-climate-temp-readout',
        steps: N,
        xResolver: xAt,
        onIndex: (j) => {
          const x    = xAt(j);
          const yAvg = this.yMap(sAvg[j], this.TEMP_MIN, this.TEMP_MAX, padTop, plotH);
          const yMin = this.yMap(sMin[j], this.TEMP_MIN, this.TEMP_MAX, padTop, plotH);
          const yMax = this.yMap(sMax[j], this.TEMP_MIN, this.TEMP_MAX, padTop, plotH);
          const yHum = this.yMap(sHum[j], this.HUM_MIN, this.HUM_MAX, padTop, plotH);
          dotAvg.setAttribute('cx', x); dotAvg.setAttribute('cy', yAvg);
          dotMin.setAttribute('cx', x); dotMin.setAttribute('cy', yMin);
          dotMax.setAttribute('cx', x); dotMax.setAttribute('cy', yMax);
          dotHum.setAttribute('cx', x); dotHum.setAttribute('cy', yHum);
          [dotAvg, dotMin, dotMax, dotHum].forEach(d => d.setAttribute('opacity', '1'));

          return [
            '<span class="outdoor-climate__readout-month">' + weekLabel(j) + '</span>',
            '<span class="outdoor-climate__readout-metric"><em>Media</em> ' + sAvg[j].toFixed(1) + '°</span>',
            '<span class="outdoor-climate__readout-metric"><em>Mín</em> ' + sMin[j].toFixed(1) + '°</span>',
            '<span class="outdoor-climate__readout-metric"><em>Máx</em> ' + sMax[j].toFixed(1) + '°</span>',
            '<span class="outdoor-climate__readout-metric"><em>Humedad</em> ' + sHum[j].toFixed(0) + '%</span>',
          ].join('');
        },
        onLeave: () => {
          [dotAvg, dotMin, dotMax, dotHum].forEach(d => d.setAttribute('opacity', '0'));
        },
      });
    },

    /* ---- Panel: Radiación solar + Lluvia (doble eje)
       Replica el segundo panel de la imagen original:
       - Lluvia: área celeste suave de fondo, curva interpolada cíclica (eje derecho mm).
       - Radiación: "montañas" mensuales tipo campana (eje izquierdo Wh/m²),
         con tono más claro en la base (difusa) y más oscuro en la cima (global). */
    drawRadiationPanel(svg) {
      const vbW = 800, vbH = 180;
      const padTop = 14, padBottom = 12;
      const plotH = vbH - padTop - padBottom;

      const { months, radiation, rain } = this.DATA;

      // === Gridlines (referencia visual) ===
      [250, 500, 750].forEach(v => {
        const y = this.yMap(v, 0, this.RAD_MAX, padTop, plotH);
        svg.appendChild(this.el('line', {
          x1: this.PAD_X, y1: y, x2: vbW - this.PAD_X, y2: y,
          stroke: this.COLOR_GRID, 'stroke-width': 1,
        }));
      });

      // === Eje izquierdo (radiación) ===
      [0, 500, 1000].forEach(v => {
        const y = this.yMap(v, 0, this.RAD_MAX, padTop, plotH);
        const lbl = this.el('text', {
          x: 8, y: y + 4, 'text-anchor': 'start',
          'font-size': '10', fill: this.COLOR_AXIS, 'font-family': 'inherit',
        });
        lbl.textContent = v;
        svg.appendChild(lbl);
      });

      // === Eje derecho (lluvia) ===
      [0, 29, 58, 87, 116].forEach(v => {
        const y = this.yMap(v, 0, this.RAIN_MAX, padTop, plotH);
        const lbl = this.el('text', {
          x: vbW - 8, y: y + 4, 'text-anchor': 'end',
          'font-size': '10', fill: this.COLOR_AXIS, 'font-family': 'inherit',
        });
        lbl.textContent = v;
        svg.appendChild(lbl);
      });

      // === Lluvia: área celeste suave de fondo (interpolada cíclica) ===
      const SUB = 6;                       // resolución de la curva de lluvia
      const Nrain = months.length * SUB;
      const plotW = vbW - this.PAD_X * 2;
      const xRain = (j) => this.PAD_X + (j + 0.5) * (plotW / Nrain);

      const sRain = this.interpolateCyclic(rain, SUB);
      // Suavizar un poco más para evitar overshoots negativos
      const baseY = padTop + plotH;

      const rainTopPts = [];
      for (let j = 0; j < Nrain; j++) {
        const v = Math.max(0, sRain[j]);
        rainTopPts.push([xRain(j), this.yMap(v, 0, this.RAIN_MAX, padTop, plotH)]);
      }
      // Path de área cerrada al baseline
      const rainTopD = this.smoothPath(rainTopPts);
      const xLeft  = this.PAD_X;
      const xRight = vbW - this.PAD_X;
      const rainAreaD =
        rainTopD +
        ` L ${rainTopPts[rainTopPts.length - 1][0]} ${baseY}` +
        ` L ${xLeft} ${baseY} Z`;

      const rainArea = this.el('path', {
        d: rainAreaD,
        fill: this.COLOR_RAIN, opacity: '0',
        class: 'outdoor-climate__rain-area',
      });
      svg.appendChild(rainArea);
      this._animTargets.push({ type: 'fade-soft', el: rainArea, target: 0.55 });

      // === Radiación: "montañas" mensuales tipo campana ===
      // Cada mes dibuja una curva campana que va desde 0 en (i-0.5) hasta 0 en (i+0.5),
      // con pico igual al valor de radiación.
      const colW = plotW / months.length;
      const radMountains = [];
      months.forEach((m, i) => {
        const cx = this.xFor(i, vbW);
        const xL = cx - colW / 2;
        const xR = cx + colW / 2;
        const yPeak  = this.yMap(radiation[i], 0, this.RAD_MAX, padTop, plotH);
        const yBase0 = baseY;

        // Curva tipo campana usando cubic Bezier: base izquierda → pico → base derecha.
        // Aprovechamos puntos de control en y=peak para "redondear" la cima.
        const cp1x = xL + colW * 0.18;
        const cp1y = yBase0;
        const cp2x = cx - colW * 0.22;
        const cp2y = yPeak;
        const cp3x = cx + colW * 0.22;
        const cp3y = yPeak;
        const cp4x = xR - colW * 0.18;
        const cp4y = yBase0;

        const d =
          `M ${xL} ${yBase0} ` +
          `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cx} ${yPeak} ` +
          `C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${xR} ${yBase0} Z`;

        const peak = this.el('path', {
          d, fill: this.COLOR_RADIATION, opacity: '0',
          class: 'outdoor-climate__rad-peak',
          'data-index': i,
        });
        svg.appendChild(peak);
        this._animTargets.push({ type: 'fade', el: peak });
        radMountains.push(peak);
      });
      this._markers.radiation.bars = radMountains;

      // === Baseline ===
      svg.appendChild(this.el('line', {
        x1: this.PAD_X, y1: baseY, x2: vbW - this.PAD_X, y2: baseY,
        stroke: this.COLOR_AXIS, 'stroke-width': 0.5,
      }));

      // === Hover ===
      this.attachInteractivity({
        svg, panelKey: 'radiation', vbW, vbH, padTop, plotH,
        readoutId: 'outdoor-climate-radiation-readout',
        onIndex: (i) => {
          radMountains.forEach((b, idx) => b.style.opacity = idx === i ? '1' : '0.3');
          return [
            '<span class="outdoor-climate__readout-month">' + months[i] + '</span>',
            '<span class="outdoor-climate__readout-metric"><em>Radiación</em> ' + radiation[i] + ' Wh/m²</span>',
            '<span class="outdoor-climate__readout-metric"><em>Lluvia</em> ' + rain[i] + ' mm</span>',
          ].join('');
        },
        onLeave: () => {
          radMountains.forEach(b => b.style.opacity = '1');
        },
      });
    },

    /* ---- Panel: Viento ---- */
    drawWindPanel(svg) {
      const vbW = 800, vbH = 100;
      const padTop = 14, padBottom = 12;
      const plotH = vbH - padTop - padBottom;

      const { months, wind } = this.DATA;

      [4, 5].forEach(v => {
        const y = this.yMap(v, this.WIND_MIN, this.WIND_MAX, padTop, plotH);
        svg.appendChild(this.el('line', {
          x1: this.PAD_X, y1: y, x2: vbW - this.PAD_X, y2: y,
          stroke: this.COLOR_GRID, 'stroke-width': 1,
        }));
      });

      [this.WIND_MIN, 4, 5, this.WIND_MAX].forEach(v => {
        const y = this.yMap(v, this.WIND_MIN, this.WIND_MAX, padTop, plotH);
        const lbl = this.el('text', {
          x: 8, y: y + 4, 'text-anchor': 'start',
          'font-size': '10', fill: this.COLOR_AXIS, 'font-family': 'inherit',
        });
        lbl.textContent = v;
        svg.appendChild(lbl);
      });

      const pts = months.map((_, i) => [this.xFor(i, vbW), this.yMap(wind[i], this.WIND_MIN, this.WIND_MAX, padTop, plotH)]);
      const line = this.el('path', {
        d: this.smoothPath(pts),
        stroke: this.COLOR_WIND, 'stroke-width': 1.4, fill: 'none',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        class: 'outdoor-climate__line',
      });
      svg.appendChild(line);

      // puntos discretos en cada mes
      months.forEach((m, i) => {
        const dot = this.el('circle', {
          cx: this.xFor(i, vbW),
          cy: this.yMap(wind[i], this.WIND_MIN, this.WIND_MAX, padTop, plotH),
          r: 2, fill: this.COLOR_WIND, opacity: 0,
          class: 'outdoor-climate__dot',
        });
        svg.appendChild(dot);
        this._animTargets.push({ type: 'fade', el: dot });
      });

      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      this._animTargets.push({ type: 'line', el: line, len });

      // marcador interactivo
      const dotHover = this.el('circle', {
        r: 4, fill: '#ffffff', stroke: this.COLOR_WIND, 'stroke-width': 1.5,
        opacity: '0', class: 'outdoor-climate__marker',
      });
      svg.appendChild(dotHover);
      this._markers.wind.dot = dotHover;

      this.attachInteractivity({
        svg, panelKey: 'wind', vbW, vbH, padTop, plotH,
        readoutId: 'outdoor-climate-wind-readout',
        onIndex: (i) => {
          const x = this.xFor(i, vbW);
          const y = this.yMap(wind[i], this.WIND_MIN, this.WIND_MAX, padTop, plotH);
          dotHover.setAttribute('cx', x);
          dotHover.setAttribute('cy', y);
          dotHover.setAttribute('opacity', '1');
          return [
            '<span class="outdoor-climate__readout-month">' + months[i] + '</span>',
            '<span class="outdoor-climate__readout-metric"><em>Velocidad</em> ' + wind[i].toFixed(1) + ' m/s</span>',
          ].join('');
        },
        onLeave: () => {
          dotHover.setAttribute('opacity', '0');
        },
      });
    },

    /* ---- Interactividad compartida (guía vertical + hitboxes + readout)
       `steps`     — cantidad de columnas/hitboxes (default = 12 meses).
       `xResolver` — función opcional que dado el índice devuelve la x
                     central; default usa xFor(i, vbW) (paneles mensuales). */
    attachInteractivity({ svg, panelKey, vbW, vbH, padTop, plotH, readoutId, onIndex, onLeave, steps, xResolver }) {
      const n = typeof steps === 'number' ? steps : this.DATA.months.length;
      const plotW = vbW - this.PAD_X * 2;
      const colW = plotW / n;
      const xAt = typeof xResolver === 'function' ? xResolver : (i) => this.xFor(i, vbW);

      // Guía vertical
      const guide = this.el('line', {
        x1: 0, y1: padTop, x2: 0, y2: padTop + plotH,
        stroke: this.COLOR_AXIS, 'stroke-width': 0.5,
        'stroke-dasharray': '2 3', opacity: '0',
        class: 'outdoor-climate__guide',
      });
      svg.appendChild(guide);

      // Grupo de hitboxes
      const hitGroup = this.el('g', { class: 'outdoor-climate__hits' });
      const readout = document.getElementById(readoutId);
      const defaultHTML = readout ? readout.innerHTML : '';

      const show = (i) => {
        const x = xAt(i);
        guide.setAttribute('x1', x);
        guide.setAttribute('x2', x);
        guide.setAttribute('opacity', '1');
        if (readout) {
          readout.classList.add('is-active');
          readout.innerHTML = onIndex(i);
        } else {
          onIndex(i);
        }
      };

      const hide = () => {
        guide.setAttribute('opacity', '0');
        if (onLeave) onLeave();
        if (readout) {
          readout.classList.remove('is-active');
          readout.innerHTML = defaultHTML;
        }
      };

      for (let i = 0; i < n; i++) {
        const x = this.PAD_X + i * colW;
        const hit = this.el('rect', {
          x, y: padTop, width: colW, height: plotH,
          fill: 'transparent', 'data-index': i,
          class: 'outdoor-climate__hit',
        });
        hit.style.cursor = 'crosshair';
        hit.addEventListener('mouseenter', () => show(i));
        hit.addEventListener('mousemove',  () => show(i));
        hit.addEventListener('touchstart', (e) => { e.preventDefault(); show(i); }, { passive: false });
        hitGroup.appendChild(hit);
      }

      // Captura mouseleave a nivel SVG para asegurar limpieza
      svg.addEventListener('mouseleave', hide);
      svg.addEventListener('touchend', hide);

      svg.appendChild(hitGroup);
    },

    /* ---- draw ---- */
    draw() {
      if (this.drawn) return;
      this.drawn = true;

      const tempSvg = document.getElementById('outdoor-climate-temp');
      const radSvg  = document.getElementById('outdoor-climate-radiation');
      const windSvg = document.getElementById('outdoor-climate-wind');

      if (tempSvg) this.drawTempPanel(tempSvg);
      if (radSvg)  this.drawRadiationPanel(radSvg);
      if (windSvg) this.drawWindPanel(windSvg);
    },

    animateIn() {
      if (this.animated) return;
      this.animated = true;
      this.animateCoordsScramble();

      this._animTargets.forEach((target, i) => {
        const delay = Math.min(i * 18, 800);
        setTimeout(() => {
          if (target.type === 'line') {
            target.el.style.transition = 'stroke-dashoffset 1300ms cubic-bezier(0.22, 0.61, 0.36, 1)';
            target.el.style.strokeDashoffset = '0';
          } else if (target.type === 'fade') {
            target.el.style.transition = 'opacity 900ms cubic-bezier(0.22, 0.61, 0.36, 1)';
            target.el.style.opacity = '1';
          } else if (target.type === 'fade-soft') {
            target.el.style.transition = 'opacity 1100ms cubic-bezier(0.22, 0.61, 0.36, 1)';
            target.el.style.opacity = String(target.target != null ? target.target : 0.5);
          } else if (target.type === 'bar') {
            const easing = 'cubic-bezier(0.22,0.61,0.36,1)';
            target.el.style.transition = `y 700ms ${easing}, height 700ms ${easing}`;
            target.el.setAttribute('y', target.el.getAttribute('data-final-y'));
            target.el.setAttribute('height', target.el.getAttribute('data-final-h'));
          }
        }, delay);
      });
    },

    init() {
      this.rootEl = document.getElementById('outdoor-climate');
      if (!this.rootEl) return;
      this.coordsEl = this.rootEl.querySelector('.outdoor-climate__coords');
      this.coordsText = this.coordsEl ? this.coordsEl.textContent : '';

      this.draw();

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateIn();
            observer.disconnect();
          }
        });
      }, { threshold: 0.2 });

      observer.observe(this.rootEl);
    },
  },

  init() {
    this.tempHumidity.init();
    this.solarRadiation.init();
    this.windRose.init();
    this.rainfall.init();
    this.emissionsPie.init();
    this.outdoorClimate.init();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  TimboCharts.init();
});
