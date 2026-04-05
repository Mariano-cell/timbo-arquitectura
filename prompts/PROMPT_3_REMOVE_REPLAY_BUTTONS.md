# Prompt para Claude Code / Codex — Eliminar botones "Reproducir de nuevo" del mapa

## Contexto

Sitio web Timbó Arquitectura. Stack: vanilla HTML/CSS/JS, sin frameworks. Ver `prompts/CONTEXTO_PROYECTO.md` para contexto completo.

Los proyectos con mapa interactivo (MapLibre GL JS) tienen un botón "Reproducir de nuevo ↻" que aparece al terminar la secuencia de animación del mapa. Se decidió eliminar ese botón: la única forma de reproducir la animación es recargar la página.

## Lo que hay que hacer

### Paso 1 — Eliminar los botones del HTML

En `proyectos/proyecto-exuma-lodge.html`, eliminar este bloque:

```html
<button class="project-map__replay" data-map-replay type="button">
  Reproducir de nuevo ↻
</button>
```

En `proyectos/proyecto-cabana-suinda.html`, hacer lo mismo (tiene el mismo botón con idéntica estructura).

Verificar si alguna otra página en `proyectos/` tiene `data-map-replay` y eliminar esos botones también.

### Paso 2 — Eliminar el código JS en `assets/js/main.js`

En el módulo `Timbo.projectMap`, eliminar todo lo relacionado con el replay:

- La propiedad `replayBtn: null` (o como esté declarada)
- La línea `this.replayBtn = this.container.querySelector('[data-map-replay]');`
- El método completo `showReplayButton() { ... }`
- El método completo `hideReplayButton() { ... }`
- El método completo `replay() { ... }`
- Cualquier llamada a `this.showReplayButton()`, `this.hideReplayButton()` o `this.replay()` en el resto del módulo

No eliminar nada más del módulo `Timbo.projectMap`. El mapa debe seguir funcionando normalmente — solo se quita la funcionalidad de replay.

### Paso 3 — Eliminar los estilos CSS en `assets/css/styles.css`

Eliminar las reglas:

```css
.project-map__replay { ... }
.project-map__replay.is-visible { ... }
```

(Pueden estar separadas o juntas — buscar por `.project-map__replay`.)

## Archivos a modificar

- `proyectos/proyecto-exuma-lodge.html`
- `proyectos/proyecto-cabana-suinda.html`
- `assets/js/main.js`
- `assets/css/styles.css`

## Archivos que NO hay que modificar

- `proyectos/proyecto-tobar-lodge.html`
- `proyectos/proyecto-cherokee-ave.html`
- `proyectos/proyecto-haras-san-pablo.html`

## Verificación

1. Abrir `proyectos/proyecto-exuma-lodge.html` en el browser
2. Esperar a que termine la secuencia de animación del mapa
3. El botón "Reproducir de nuevo" no debe aparecer
4. El mapa debe seguir cargando y animándose normalmente
5. Sin errores en consola relacionados con `replayBtn`, `showReplayButton`, `hideReplayButton` o `replay`
6. Verificar lo mismo en `proyecto-cabana-suinda.html`
