# Prompt para Claude Code — Values Breakdown interactivo debajo del carousel

## Contexto del proyecto

Sitio web vanilla HTML/CSS/JS para Timbó, estudio de arquitectura ecológica. Sin frameworks. Archivos relevantes:

- `index.html` — página principal
- `assets/css/styles.css` — estilos (paleta fría, grises + verde musgo)
- `assets/css/variables.css` — custom properties
- `assets/js/main.js` — objeto `Timbo` con módulos; el relevante es `Timbo.valuesCarousel`
- `assets/js/data.js` — contenido centralizado en `SITE_DATA`

**Custom properties disponibles:**
- Grises: `--color-gray-100` (#F5F5F5) → `--color-black` (#1A1A1A)
- Acentos: `--color-sky` (#A8CBE0), `--color-olive` (#8BA63A), `--color-forest` (#3D6B5E)
- Espaciado: `--space-xs` (4px) → `--space-5xl` (128px)
- Tipografía: `--text-sm` → `--text-hero`; pesos `--fw-regular` (400) → `--fw-black` (900)
- `--transition-base`: 300ms ease, `--transition-slow`: 500ms ease

---

## Estado actual del carousel (`.values-carousel`)

El carousel es un `<div class="values-carousel">` con un `<div class="values-track">` adentro que contiene 16 `.value-item` (8 originales + 8 duplicados para loop infinito). Cada `.value-item` tiene un SVG de 60×60 y un `<span>` con el nombre.

El módulo JS actual `Timbo.valuesCarousel` solo maneja scroll horizontal con rueda del mouse. No tiene estado activo ni clicks.

**CSS actual relevante del carousel:**
```css
.values-carousel {
  overflow: hidden;
  width: 100%;
  padding: 2.5rem 0;
  border-top: 1px solid rgba(29, 67, 99, 0.15);
  border-bottom: 1px solid rgba(29, 67, 99, 0.15);
}
.values-track {
  display: flex;
  gap: 0;
  animation: values-scroll 40s linear infinite;
  width: max-content;
}
.value-item {
  flex-shrink: 0;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0 2rem;
  border-right: 1px solid rgba(29, 67, 99, 0.16);
}
.value-item svg { width: 60px; height: 60px; }
.value-item span {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-azul);  /* #1d4363 */
  white-space: nowrap;
}
@keyframes values-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

**IMPORTANTE:** Los SVGs dentro de `.value-item` usan `stroke="currentColor"` y `fill="currentColor"`. El color del ícono se controla con la propiedad CSS `color` del `.value-item`. El active state debe cambiar el `color` del ítem, NO tocar los atributos SVG.

---

## Qué hay que construir

### 1. Refactorizar el carousel para soportar estado activo

Cada `.value-item` necesita:
- Un atributo `data-value-index` con su índice (0–7), solo en los 8 originales (no en los duplicados)
- Los duplicados NO necesitan ser clickeables

Al hacer click en un `.value-item` (de los originales):
- Ese ítem recibe la clase `.value-item--active`
- Los demás la pierden
- Se muestra el breakdown correspondiente (ver punto 2)
- Se pausa la rotación automática (ver punto 3)

**CSS del estado activo** — mantener la estética actual, solo resaltar sutilmente:
```css
.value-item--active {
  color: var(--color-forest); /* verde bosque: #3D6B5E */
}
.value-item--active span {
  color: var(--color-forest);
  font-weight: 700;
}
```

### 2. Nuevo bloque: Values Breakdown

Debajo del `.values-carousel`, agregar un nuevo div:

```html
<div class="values-breakdown" id="values-breakdown">
  <!-- Renderizado por JS -->
</div>
```

El breakdown muestra el contenido del valor activo. Tiene dos partes:
- **Texto**: título + párrafo explicativo
- **Métricas**: 3 datos numéricos/clave en formato horizontal

**Estructura HTML de cada panel** (generado por JS):
```html
<div class="breakdown-panel is-active">
  <div class="breakdown-panel__text">
    <h3 class="breakdown-panel__title">Climatic Zone</h3>
    <p class="breakdown-panel__body">...párrafo...</p>
  </div>
  <div class="breakdown-panel__metrics">
    <div class="breakdown-metric">
      <span class="breakdown-metric__value">5</span>
      <span class="breakdown-metric__label">Köppen climate zones analyzed per project</span>
    </div>
    <!-- más métricas -->
  </div>
</div>
```

**Transición entre paneles:** fade out del panel saliente, fade in del entrante. Duración 400ms. Usar `opacity` + `position: absolute` para que no haya salto de altura (el contenedor tiene altura fija o mínima).

**CSS del breakdown:**
```css
.values-breakdown {
  position: relative;
  min-height: 240px;  /* evita saltos de layout durante transición */
  padding: var(--space-3xl) 0;
  margin: 0 clamp(48px, 12vw, 168px);  /* alineado con philosophy__statement */
}
.breakdown-panel {
  position: absolute;
  top: var(--space-3xl);
  left: 0;
  right: 0;
  display: flex;
  gap: var(--space-5xl);
  align-items: flex-start;
  opacity: 0;
  transition: opacity 400ms ease;
  pointer-events: none;
}
.breakdown-panel.is-active {
  opacity: 1;
  pointer-events: auto;
}
.breakdown-panel__text {
  flex: 1;
  max-width: 480px;
}
.breakdown-panel__title {
  font-size: var(--text-xl);
  font-weight: var(--fw-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-black);
  margin-bottom: var(--space-md);
}
.breakdown-panel__body {
  font-size: var(--text-base);
  font-weight: var(--fw-regular);
  line-height: 1.7;
  color: var(--color-gray-500);
}
.breakdown-panel__metrics {
  display: flex;
  gap: var(--space-3xl);
  flex-shrink: 0;
}
.breakdown-metric {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.breakdown-metric__value {
  font-size: var(--text-4xl);
  font-weight: var(--fw-bold);
  color: var(--color-forest);
  line-height: 1;
}
.breakdown-metric__label {
  font-size: var(--text-sm);
  font-weight: var(--fw-regular);
  color: var(--color-gray-400);
  max-width: 120px;
  line-height: 1.4;
}
```

### 3. Lógica de automatización

**Rotación automática:** cada 8 segundos, avanza al siguiente valor (índice 0→1→2→...→7→0). Al cambiar, actualiza el ítem activo en el carousel y el panel del breakdown.

**Pausa por interacción:** si el usuario hace click en un `.value-item`, la rotación automática se pausa (`clearInterval`).

**Reanudación:** la rotación se reanuda cuando `.values-carousel` sale completamente del viewport. Usar un `IntersectionObserver` con `threshold: 0` — cuando `isIntersecting` pasa de `true` a `false`, reanudar el intervalo.

**Estado inicial:** al cargar la página, el valor activo es el índice 0 (Climatic Zone). La rotación empieza automáticamente.

### 4. Datos de los 8 valores (ya generados — incluir en `data.js`)

Agregar la siguiente clave a `SITE_DATA` (solo en inglés por ahora):

```js
valuesBreakdown: {
  en: [
    {
      id: 'climatic-zone',
      title: 'Climatic Zone',
      body: 'Every project begins with a rigorous classification of its geographic location according to altitude, latitude, and regional climate patterns. Understanding the climatic zone establishes the non-negotiable baseline: it defines the range of temperatures the building must handle, the seasonal extremes to anticipate, and the passive strategies available. A high-altitude Andean site and a subtropical coastal site demand entirely different architectural responses — and that difference starts here.',
      metrics: [
        { value: '30+', label: 'climate variables analyzed per site' },
        { value: '5', label: 'Köppen zones studied across current projects' },
        { value: '100%', label: 'of projects climate-classified before design begins' },
      ],
    },
    {
      id: 'sun-path',
      title: 'Sun Path',
      body: 'The trajectory of the sun — its daily arc and seasonal shift — is the primary organizer of architectural form. By mapping the sun path for each specific latitude and longitude, we determine the optimal orientation of every façade, overhang depth, and glazing ratio. A window that admits warming winter sun while blocking the high summer sun is not an accident: it is the result of precise solar geometry applied at the earliest stage of design.',
      metrics: [
        { value: '23.5°', label: 'axial tilt driving seasonal sun angle variation' },
        { value: '4', label: 'seasonal sun path simulations per project' },
        { value: '↓40%', label: 'average solar heat gain reduction through passive shading' },
      ],
    },
    {
      id: 'outdoor-temperature',
      title: 'Outdoor Temperature',
      body: 'Thermal comfort is not a single number — it is a range that shifts with the seasons and fluctuates hour by hour. We analyze annual temperature curves, diurnal swings, and heating and cooling degree days to understand how much the building envelope must work. This data directly informs insulation strategy, thermal mass placement, and the decision between passive heating, natural ventilation, or minimal mechanical conditioning.',
      metrics: [
        { value: '8,760', label: 'hourly temperature data points analyzed per year' },
        { value: '18–26°C', label: 'target indoor comfort range without mechanical systems' },
        { value: '↓60%', label: 'energy demand reduction vs. conventional construction' },
      ],
    },
    {
      id: 'solar-radiation',
      title: 'Solar Radiation',
      body: 'Solar radiation quantifies the actual energy arriving at exterior surfaces — not just whether the sun is up, but how intensely it strikes walls, roofs, and glazing throughout the year. We calculate global horizontal irradiance and direct normal irradiance to evaluate overheating risk, passive solar gain potential, and photovoltaic viability. Every surface of a Timbó building is modeled for its annual radiation load before a single material is specified.',
      metrics: [
        { value: '5.2', label: 'avg kWh/m²/day peak solar resource across project sites' },
        { value: '3', label: 'surface orientations radiation-modeled per design iteration' },
        { value: '↓35%', label: 'cooling load reduction through radiation-informed shading' },
      ],
    },
    {
      id: 'humidity',
      title: 'Humidity',
      body: 'Moisture in the air affects not only how people feel, but how buildings perform over time. High humidity accelerates material degradation, promotes mold growth, and can undermine insulation effectiveness; low humidity dries out materials and raises perceived cold. We map relative humidity patterns across seasons to select hygroscopic materials that regulate moisture naturally, detail ventilation paths that prevent condensation, and design spaces where the air itself contributes to comfort.',
      metrics: [
        { value: '40–65%', label: 'relative humidity target range for optimal comfort' },
        { value: '12', label: 'monthly humidity profiles analyzed per project' },
        { value: '↑30%', label: 'occupant comfort improvement through humidity-responsive design' },
      ],
    },
    {
      id: 'precipitation',
      title: 'Precipitation',
      body: 'Rain and snow are not just weatherproofing concerns — they are design inputs. Annual precipitation volumes, seasonal distribution, and peak intensity events inform roof geometry, drainage strategy, water harvesting potential, and landscape design. In water-scarce climates, precipitation becomes a resource to capture and store; in flood-prone zones, it becomes a force to redirect and dissipate. Either way, the building must be conceived as part of its hydrological context.',
      metrics: [
        { value: '365', label: 'daily precipitation records analyzed per site per year' },
        { value: '↑80%', label: 'stormwater managed on-site through passive design' },
        { value: '100%', label: 'of roofs designed for rainwater harvesting where feasible' },
      ],
    },
    {
      id: 'wind-patterns',
      title: 'Wind Patterns',
      body: 'Prevailing wind direction and intensity shape everything from cross-ventilation strategy to structural loads and outdoor comfort. A wind rose analysis reveals the dominant directions across all seasons, allowing us to position openings for maximum natural airflow in summer while shielding occupants from cold winter winds. Wind is a free energy source when harnessed — and a thermal penalty when ignored.',
      metrics: [
        { value: '16', label: 'wind directions tracked in rose analysis' },
        { value: '↑70%', label: 'naturally ventilated floor area in wind-optimized projects' },
        { value: '↓50%', label: 'mechanical ventilation need through passive airflow design' },
      ],
    },
    {
      id: 'sky-coverage',
      title: 'Sky Coverage',
      body: 'The fraction of sky covered by clouds determines the quality and quantity of natural light reaching interior spaces. An overcast climate calls for maximizing diffuse daylight through generous glazing and light-colored surfaces; a predominantly clear sky demands precise solar control to prevent glare and overheating. Sky coverage data guides our daylight simulations, helping us design spaces that feel luminous and comfortable without depending on artificial lighting during daytime hours.',
      metrics: [
        { value: '300+', label: 'annual clear sky hours analyzed per project site' },
        { value: '↓45%', label: 'artificial lighting energy use through daylight design' },
        { value: '2–3%', label: 'minimum daylight factor target for all occupied spaces' },
      ],
    },
  ],
},
```

---

## Implementación JS — nuevo módulo `Timbo.valuesBreakdown`

Reemplazar `Timbo.valuesCarousel` con un módulo expandido que maneje todo:

```js
valuesBreakdown: {
  INTERVAL_MS: 8000,
  activeIndex: 0,
  intervalId: null,
  isPaused: false,

  // Métodos: init(), renderBreakdown(), setActive(index), startAuto(), pauseAuto(), resumeAuto()
  // Ver lógica detallada abajo
}
```

**Flujo de `init()`:**
1. Agregar `data-value-index` a los 8 value-items originales (no a los duplicados del loop)
2. Renderizar el `#values-breakdown` con los 8 paneles (todos `opacity: 0` excepto el índice 0)
3. Marcar el value-item 0 como activo
4. Iniciar la rotación automática (`setInterval` cada 8s)
5. Agregar listeners de click en los value-items originales → `pauseAuto()` + `setActive(index)`
6. Iniciar `IntersectionObserver` en `.values-carousel` → cuando sale del viewport, llamar `resumeAuto()`

**`setActive(index)`:**
- Remover `.value-item--active` de todos
- Agregar `.value-item--active` al ítem con `data-value-index === index`
- Cambiar panel activo: quitar `.is-active` del panel actual, agregarlo al nuevo
- Actualizar `this.activeIndex`

**`startAuto()`:**
```js
this.intervalId = setInterval(() => {
  const next = (this.activeIndex + 1) % 8;
  this.setActive(next);
}, this.INTERVAL_MS);
```

**`pauseAuto()`:** `clearInterval(this.intervalId)`, `this.isPaused = true`

**`resumeAuto()`:** solo si `this.isPaused`, reiniciar el intervalo desde el índice actual

---

## Archivos a modificar

- `assets/js/data.js` — agregar `SITE_DATA.valuesBreakdown` con los datos de arriba
- `index.html` — agregar `<div class="values-breakdown" id="values-breakdown"></div>` inmediatamente después del cierre de `.values-carousel`; agregar `data-value-index` a los 8 value-items originales (índices 0–7); NO tocar los duplicados
- `assets/css/styles.css` — agregar estilos de `.values-breakdown`, `.breakdown-panel`, `.breakdown-metric`, `.value-item--active`
- `assets/js/main.js` — reemplazar `Timbo.valuesCarousel` con `Timbo.valuesBreakdown`; actualizar la llamada en `init()` de `this.valuesCarousel.init()` a `this.valuesBreakdown.init()`

## Archivos que NO hay que modificar

- `assets/css/variables.css`
- Todo lo relacionado al nav, floating logo, hero, featured project
- Los SVGs dentro de los `.value-item` — no tocarlos

## Notas críticas

- Los `.value-item` usan `color: currentColor` en sus SVGs. El estado activo se aplica cambiando la propiedad CSS `color` del contenedor, NO modificando atributos del SVG.
- El carousel sigue teniendo 16 ítems (8 + 8 duplicados) para el loop infinito. Los clicks solo funcionan en los 8 originales.
- La animación CSS `values-scroll` del `.values-track` no debe pausarse cuando el usuario hace click — solo el `setInterval` del breakdown se pausa. El carousel visual sigue rotando siempre.
- El `IntersectionObserver` para reanudar observa `.values-carousel`, con `threshold: 0`. Cuando `entry.isIntersecting === false`, reanudar.
