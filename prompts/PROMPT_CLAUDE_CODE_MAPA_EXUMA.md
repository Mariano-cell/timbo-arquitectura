# Prompt para Claude Code — Mapa animado para Exuma Lodge

> **Instrucción inicial**: Antes de ejecutar, entrá en **plan mode** para que diseñemos juntos la estrategia más robusta. Después de aprobar el plan, ejecutá.

## Contexto del proyecto

Sitio web vanilla HTML/CSS/JS para un estudio de arquitectura ecológica. Ya existe un sistema completo de "map story" que anima un mapa en 3 etapas (continente → región → punto). **El JS y el CSS ya están implementados y funcionando.** Lo único que falta es:

1. Agregar el bloque HTML del componente en `proyecto-exuma-lodge.html`
2. Crear las imágenes SVG del mapa (base continental + overlay regional)

## Sistema existente (NO modificar)

### JS — `Timbo.mapStory` en `assets/js/main.js`
Ya implementado con:
- `hydrateLayers(storyEl)`: carga imágenes de `data-map-base-src` y `data-map-region-src`
- `applyConfig(storyEl)`: lee data attributes para escalas y posiciones de cada stage
- `play(storyEl)`: ejecuta secuencia `stage-1` → `stage-2` → `stage-3` con delays configurables
- `init()`: observa `[data-map-story]` con IntersectionObserver (threshold 0.25) y auto-reproduce al entrar en viewport
- Replay via `[data-map-story-replay]` button
- Soporta `prefers-reduced-motion`

### CSS — `.project-map-story` en `assets/css/styles.css`
Ya implementado con:
- Variables CSS por defecto: `--stage2-scale: 1.9`, `--stage2-x`, `--stage2-y`, `--stage3-scale: 3.2`, `--stage3-x`, `--stage3-y`, `--marker-x`, `--marker-y`
- Viewport con `aspect-ratio: 16/9`, overflow hidden
- Scene: transform con `translate3d` + `scale`, transición de 1800ms cubic-bezier
- Layer base (opacity 1), layer region (opacity 0 → 1 en stage-2)
- Marker con cross-hairs (pseudo-elements `::before`/`::after`), aparece en stage-3
- Asset note para placeholder/error states
- Replay button con estilos
- Responsive y reduced-motion

### Textos bilingües — `SITE_DATA.projectPages` en `assets/js/data.js`
Ya incluye:
- `mapEyebrow`: "Secuencia cartográfica" / "Cartographic Sequence"
- `mapTitle`: "Del continente al sitio" / "From Continent To Site"
- `mapCaption`: texto descriptivo en ambos idiomas
- `mapReplay`: "Reproducir secuencia" / "Replay sequence"

Estos textos se aplican via `setText()` en `projectPage.render()` usando IDs (`project-map-eyebrow`, `project-map-title`, `project-map-caption`, `project-map-replay`).

## Lo que hay que hacer

### Tarea 1 — Crear las imágenes SVG del mapa

Crear **2 archivos SVG** en `assets/images/maps/`:

#### `assets/images/maps/exuma-base.svg`
Mapa minimalista del **Caribe y costa sureste de Norteamérica** (Florida, Cuba, Bahamas, Jamaica, Hispaniola, Puerto Rico). Estilo:
- Fondo transparente
- Masas de tierra en `rgba(255, 255, 255, 0.12)` con stroke `rgba(255, 255, 255, 0.2)` de 0.5px
- Agua implícita (transparente)
- Sin labels ni nombres
- Debe ser lo suficientemente amplio para que Bahamas esté visible pero no sea el centro absoluto — el efecto es que primero ves "el continente" y después el zoom te lleva a Bahamas
- Dimensiones del viewBox: usar 800x450 (ratio 16:9)
- Simplificar las formas geográficas: no necesitan ser geográficamente perfectas, pero sí reconocibles. Usar paths simplificados que sean estéticamente limpios

#### `assets/images/maps/exuma-region.svg`
Overlay que resalta la **cadena de islas Exumas** dentro de Bahamas. Estilo:
- Mismo viewBox que el base (800x450)
- Solo las islas Exumas dibujadas, con fill `rgba(168, 213, 162, 0.25)` (verde suave) y stroke `rgba(168, 213, 162, 0.6)` de 1px
- El resto transparente
- Este layer aparece en stage-2 con un fade-in, así que no necesita fondo

**Ubicación del proyecto**: Staniel Cay, Exumas, Bahamas (aprox. 24.17°N, 76.44°W). El marker del stage-3 apuntará a esta zona.

### Tarea 2 — Agregar el HTML en `proyecto-exuma-lodge.html`

Insertar el siguiente bloque **después del cierre de `.project-detail__copy`** y **antes del cierre de `.container`** (es decir, antes de la línea `</div>` que cierra el container, alrededor de la línea 63):

```html
<!-- Map Story -->
<div class="project-map-story"
     data-map-story
     data-map-base-src="assets/images/maps/exuma-base.svg"
     data-map-region-src="assets/images/maps/exuma-region.svg"
     data-stage2-scale="2.2"
     data-stage2-x="-120"
     data-stage2-y="-60"
     data-stage3-scale="4.5"
     data-stage3-x="-280"
     data-stage3-y="-180"
     data-marker-x="52"
     data-marker-y="48"
     data-stage2-delay="800"
     data-stage3-delay="2600">

  <header class="project-map-story__header">
    <p class="project-map-story__eyebrow" id="project-map-eyebrow">Cartographic Sequence</p>
    <h2 class="project-map-story__title" id="project-map-title">From Continent To Site</h2>
    <p class="project-map-story__caption" id="project-map-caption">
      Editorial location sequence: continental view, regional focus, and final project point.
    </p>
  </header>

  <div class="project-map-story__viewport">
    <div class="project-map-story__scene">
      <img class="project-map-story__layer project-map-story__layer--base"
           data-map-layer="base"
           src="assets/images/maps/exuma-base.svg"
           alt="Caribbean map">
      <img class="project-map-story__layer project-map-story__layer--region"
           data-map-layer="region"
           src="assets/images/maps/exuma-region.svg"
           alt="Exumas region">
      <div class="project-map-story__marker" aria-hidden="true"></div>
    </div>
    <p class="project-map-story__asset-note">
      Placeholder — replace with final cartographic assets
    </p>
  </div>

  <button class="project-map-story__replay"
          data-map-story-replay
          id="project-map-replay">
    Replay sequence
  </button>
</div>
```

### Tarea 3 — Calibrar los data attributes

Los valores de `data-stage2-*`, `data-stage3-*` y `data-marker-*` en el HTML de arriba son estimaciones iniciales. **Después de crear los SVGs**, hay que ajustar estos valores para que:

1. **Stage 1** (estado inicial): se ve todo el mapa base — el Caribe completo
2. **Stage 2** (zoom regional): el zoom y translate centran Bahamas en el viewport, y el overlay regional (Exumas) aparece con fade-in
3. **Stage 3** (zoom al punto): zoom más cerrado sobre Staniel Cay, y el marker (crosshairs) aparece exactamente sobre esa ubicación

Los valores dependen de dónde queden Bahamas y Staniel Cay dentro del viewBox del SVG. Hay que iterar visualmente:
- Abrir la página en el browser
- Usar `window.replayMapStory()` en la consola para re-disparar la animación
- Ajustar los `data-*` attributes hasta que los encuadres queden bien

**Tips para la calibración:**
- `data-stage2-scale`: cuánto zoom hace en stage 2 (1.8–2.5 es un rango razonable)
- `data-stage2-x` / `data-stage2-y`: translate en px para centrar la región en el viewport
- `data-stage3-scale`: zoom final (3.5–5.0 para un encuadre cerrado)
- `data-stage3-x` / `data-stage3-y`: translate para centrar el punto exacto
- `data-marker-x` / `data-marker-y`: posición del marker como % del scene (no del viewport)

### Tarea 4 — Crear el directorio de mapas

```bash
mkdir -p assets/images/maps
```

## Archivos a crear
- `assets/images/maps/exuma-base.svg`
- `assets/images/maps/exuma-region.svg`

## Archivos a modificar
- `proyecto-exuma-lodge.html` (agregar el bloque HTML del map story)

## Archivos que NO hay que modificar
- `assets/js/main.js` (el sistema mapStory ya funciona)
- `assets/js/data.js` (los textos ya están)
- `assets/css/styles.css` (los estilos ya están)
- `assets/css/variables.css`

## Verificación

1. Abrir `proyecto-exuma-lodge.html` en el browser
2. Hacer scroll hasta la sección del mapa
3. Verificar que la secuencia se dispara automáticamente al entrar en el viewport:
   - Stage 1: se ve el Caribe completo
   - Stage 2 (~800ms después): zoom a Bahamas, aparece overlay regional verde
   - Stage 3 (~2600ms después): zoom cerrado a Staniel Cay, aparecen las crosshairs
4. Hacer click en "Replay sequence" y verificar que la animación se repite
5. Ejecutar `window.replayMapStory()` en la consola para verificar el dev helper
6. Los textos deben coincidir con los de `data.js` (se actualizan via `projectPage.render()`)
