# Prompt para Claude Code — Eliminar el sistema Map Story completo

## Objetivo

Eliminar por completo todo lo relacionado con el componente "Map Story" (mapa animado con zoom en 3 etapas). Esto incluye JS, CSS, HTML y datos. Queremos dejar el código limpio como si esta feature nunca hubiera existido.

## Qué eliminar

### 1. `assets/js/main.js`

- Eliminar el módulo completo `Timbo.mapStory` (todo el bloque desde el comentario `MAP STORY` hasta el cierre de su llave).
- Eliminar la línea `this.mapStory.init();` dentro de `Timbo.init()`.
- Eliminar las líneas de `setText` que refieren al mapa dentro de `Timbo.projectPage.render()`:
  - `setText('project-map-eyebrow', ...)`
  - `setText('project-map-title', ...)`
  - `setText('project-map-caption', ...)`
  - `setText('project-map-replay', ...)`

### 2. `assets/js/data.js`

- Dentro de `SITE_DATA.projectPages.es`, eliminar las propiedades:
  - `mapEyebrow`
  - `mapTitle`
  - `mapCaption`
  - `mapReplay`
- Dentro de `SITE_DATA.projectPages.en`, eliminar las mismas 4 propiedades.

### 3. `assets/css/styles.css`

- Eliminar todos los bloques CSS que comiencen con `.project-map-story` (selector principal y todos sus hijos/modificadores/estados).
- Esto incluye también las media queries que contengan reglas de `.project-map-story` (tanto `prefers-reduced-motion` como el breakpoint de `max-width: 900px`). Si esas media queries contienen también reglas de otros componentes, eliminar solo las líneas de `.project-map-story` y dejar el resto intacto.

### 4. `proyecto-exuma-lodge.html`

- Eliminar el bloque completo del Map Story dentro de la sección `project-detail`, desde el comentario `<!-- Map Story: Caribbean → Exumas → Staniel Cay -->` hasta el cierre de su `</div>` (incluyendo el `<button>` de replay).

### 5. Archivos SVG

- Eliminar los archivos de mapas si existen:
  - `assets/images/maps/exuma-base.svg`
  - `assets/images/maps/exuma-region.svg`
- Si el directorio `assets/images/maps/` queda vacío después de esto, eliminar también el directorio.

## Qué NO modificar

- El resto de `main.js` (no tocar otros módulos como `valuesBreakdown`, `navTheme`, etc.)
- El resto de `data.js` (no tocar proyectos, nav, footer, etc.)
- El resto de `styles.css` (no tocar otros componentes)
- El resto de `proyecto-exuma-lodge.html` (dejar intacto el header, meta, copy, footer, etc.)
- Ningún otro archivo HTML

## Verificación

1. Abrir `proyecto-exuma-lodge.html` en el browser — no debe haber errores en consola
2. Buscar "mapStory" en `main.js` — 0 resultados
3. Buscar "map-story" en `styles.css` — 0 resultados
4. Buscar "mapEyebrow\|mapTitle\|mapCaption\|mapReplay" en `data.js` — 0 resultados
5. Buscar "map-story" en `proyecto-exuma-lodge.html` — 0 resultados
6. Verificar que `window.replayMapStory` no existe (no debe estar definido en consola)
7. El resto de la página de Exuma Lodge debe seguir funcionando normalmente (textos, navegación, footer)
