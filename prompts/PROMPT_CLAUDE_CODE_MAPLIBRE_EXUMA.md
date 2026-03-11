# Prompt para Claude Code — Mapa animado con MapLibre GL JS para Exuma Lodge

> **Instrucción inicial**: Antes de escribir código, entrá en **plan mode** (`/plan`). Necesito que diseñemos juntos la estrategia completa antes de ejecutar. Pensá en edge cases, performance, y cómo integrar esto limpiamente con la arquitectura existente del sitio.

## Contexto del proyecto

Sitio web vanilla HTML/CSS/JS (sin frameworks, sin bundler) para **Timbó**, un estudio de arquitectura bioclimática. El sitio usa:

- CSS custom properties definidas en `assets/css/variables.css`
- Un objeto global `Timbo` en `assets/js/main.js` con módulos que tienen `init()`
- Páginas oscuras con `<body class="page--dark">` y paleta fría (`--color-azul: #1d4363`, `--color-crema: #f0ebe3`)
- Intersection Observer para activar animaciones al entrar en viewport
- Actualmente NO hay ningún sistema de mapas implementado

La página destino es `proyecto-exuma-lodge.html` — una project detail page para un lodge en **Staniel Cay, Exumas, Bahamas** (aprox. 24.17°N, 76.44°W).

## Objetivo

Crear un componente de mapa que, cuando el usuario scrollea hasta él, ejecuta una secuencia animada de zoom en 3 etapas:

1. **Vista continental** — Se ve el Caribe (Florida, Cuba, Bahamas, Jamaica, Hispaniola). Dura ~1.5 segundos.
2. **Vista regional** — Zoom animado (`flyTo`) hacia las Bahamas / archipiélago Exumas. Dura ~1.5 segundos.
3. **Vista de sitio** — Zoom animado final hacia Staniel Cay con un marcador que aparece en la ubicación del proyecto.

La animación total debe sentirse cinematográfica y suave, como un "drill-down" geográfico.

## Stack técnico elegido

**MapLibre GL JS** (fork open source de Mapbox GL):
- CDN: `https://unpkg.com/maplibre-gl/dist/maplibre-gl.js` + `maplibre-gl.css`
- Tiles gratuitos: usar **CartoDB Dark Matter** (estilo oscuro que combina con el sitio) u otro tile server oscuro gratuito que no requiera API key
- API: `map.flyTo({ center, zoom, speed, curve })` para las transiciones

**¿Por qué MapLibre?** Motor WebGL real, animaciones `flyTo` nativas con curva configurable, estilos dark disponibles gratis, sin API key obligatorio.

## Arquitectura de la solución (propuesta para discutir en plan mode)

### HTML (`proyecto-exuma-lodge.html`)

Insertar un contenedor después de `.project-detail__copy` y antes del cierre de `.container`:

```html
<!-- Mapa de ubicación -->
<div class="project-map" id="project-map" data-map-sequence>
  <div class="project-map__viewport" id="project-map-viewport"></div>
  <div class="project-map__marker" id="project-map-marker" aria-hidden="true"></div>
</div>
```

El marker es un elemento HTML posicionado sobre el mapa (no un marker de MapLibre), para tener control total del estilo y la animación de aparición. O bien usar un `maplibregl.Marker` — evaluá en plan mode qué es más limpio.

### JS (`assets/js/main.js`)

Nuevo módulo `Timbo.projectMap`:

```
Timbo.projectMap = {
  init() {
    const container = document.querySelector('[data-map-sequence]');
    if (!container) return;

    // Verificar que MapLibre está cargado
    if (typeof maplibregl === 'undefined') return;

    // Crear el mapa con vista inicial (Caribe)
    const map = new maplibregl.Map({
      container: 'project-map-viewport',
      style: { /* CartoDB Dark Matter o similar */ },
      center: [-74.5, 22.5],   // Centro del Caribe aprox
      zoom: 4,                  // Vista continental
      interactive: false,       // NO queremos que el usuario haga zoom/pan
      attributionControl: false,
    });

    // IntersectionObserver: disparar secuencia al entrar en viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.playSequence(map);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(container);
  },

  playSequence(map) {
    // Stage 1 → 2: flyTo Bahamas (después de 1500ms)
    setTimeout(() => {
      map.flyTo({
        center: [-76.5, 24.2],  // Bahamas / Exumas
        zoom: 7.5,
        speed: 0.8,
        curve: 1.4,
      });
    }, 1500);

    // Stage 2 → 3: flyTo Staniel Cay (después de ~4000ms)
    setTimeout(() => {
      map.flyTo({
        center: [-76.44, 24.17],  // Staniel Cay
        zoom: 12,
        speed: 0.6,
        curve: 1.2,
      });
      // Mostrar marker después de que el flyTo termine
      setTimeout(() => {
        this.showMarker(map);
      }, 2000);
    }, 4500);
  },

  showMarker(map) {
    // Agregar marker con animación de fade-in + scale
  },
};
```

**Puntos a discutir en plan mode:**

1. **Tiles server**: CartoDB Dark Matter (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) funciona directo sin key. ¿Es la mejor opción? ¿Hay alternativas dark gratuitas más confiables?

2. **Interactividad**: el mapa debería ser `interactive: false` (sin zoom/pan del usuario) para que funcione como componente visual puro. ¿O permitimos interacción después de que la secuencia termine?

3. **Marker**: ¿usar `maplibregl.Marker` con un elemento HTML custom, o un elemento DOM posicionado absolute sobre el viewport? El marker de MapLibre se mueve con el mapa si el usuario hace pan después. El DOM absolute no.

4. **Carga del script**: MapLibre pesa ~200KB gzip. ¿Cargarlo con `<script defer>` en el `<head>`, o con carga lazy (crear el `<script>` dinámicamente cuando el IntersectionObserver detecta que el contenedor está cerca del viewport)?

5. **Estilo del mapa**: las tiles default de CartoDB Dark Matter tienen labels en inglés, calles, etc. Para un look más minimalista podríamos usar un estilo que oculte labels y simplifique features. ¿Conviene? ¿Es factible con el style JSON?

6. **Responsive**: el viewport del mapa necesita `aspect-ratio` o height fija. En mobile el zoom debería ajustarse (zoom inicial más bajo para que entre el Caribe en una pantalla chica).

7. **`prefers-reduced-motion`**: si está activo, ¿mostrar el mapa directamente en la vista final (Staniel Cay) sin animación?

8. **Replay**: ¿vale la pena agregar un botón de replay como tenía el sistema anterior? Si sí, el módulo necesita un método `reset()` + `playSequence()`.

9. **Fallback**: si MapLibre no carga (bloqueado, sin conexión), ¿qué muestra el contenedor? ¿Un fondo oscuro vacío? ¿Un mensaje sutil?

### CSS (`assets/css/styles.css`)

```css
.project-map {
  position: relative;
  margin-top: var(--space-4xl);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: var(--space-2xl);
}

.project-map__viewport {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

/* Ocultar controles de MapLibre */
.project-map__viewport .maplibregl-ctrl-bottom-left,
.project-map__viewport .maplibregl-ctrl-bottom-right {
  display: none;
}
```

## Datos de ubicación

- **Proyecto**: Exuma Lodge
- **Ubicación**: Staniel Cay, Exumas, Bahamas
- **Coordenadas**: 24.17°N, 76.44°W → `[-76.44, 24.17]` en formato `[lng, lat]`
- **Vista continental inicial**: centro aprox `[-74.5, 22.5]`, zoom ~4
- **Vista regional**: centro aprox `[-76.5, 24.2]`, zoom ~7–8
- **Vista de sitio**: centro `[-76.44, 24.17]`, zoom ~11–13

## Estética deseada

- El mapa debe verse como un componente editorial, no como Google Maps
- Palette oscura que se integre con `page--dark` (fondo `--color-azul`)
- Si es posible, quitar o minimizar labels de ciudades/calles en el estilo de tiles
- El marker final debe ser sutil: una cruz fina, un punto con ring animado, o similar — coherente con la estética del sitio (sin iconos coloridos de pin)
- Bordes finos del viewport, sin sombras pesadas

## Archivos a modificar

- `proyecto-exuma-lodge.html` — agregar `<link>` de maplibre-gl.css, `<script>` de maplibre-gl.js, y el contenedor HTML del mapa
- `assets/js/main.js` — agregar módulo `Timbo.projectMap` con init en `Timbo.init()`
- `assets/css/styles.css` — estilos del componente `.project-map`

## Archivos que NO hay que modificar

- `assets/js/data.js`
- `assets/css/variables.css`
- Otros archivos HTML

## Verificación

1. Abrir `proyecto-exuma-lodge.html` en el browser
2. Hacer scroll hasta el mapa
3. Verificar la secuencia: Caribe → Bahamas → Staniel Cay, con transiciones suaves
4. El marker debe aparecer al final de la secuencia con una animación sutil
5. No debe haber errores en consola
6. El mapa no debe ser interactivo (sin zoom/pan del usuario) — o sí, según lo que decidan en plan mode
7. En mobile el mapa debe verse bien proporcionado
8. Si MapLibre no carga, el contenedor no debe romper el layout
