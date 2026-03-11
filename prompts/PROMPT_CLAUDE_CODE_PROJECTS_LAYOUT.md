# Prompt para Claude Code — Nuevo layout de la Projects page

## Contexto del proyecto

Sitio web vanilla HTML/CSS/JS para Timbó, un estudio de arquitectura ecológica. Sin frameworks ni build tools. Los archivos relevantes son:

- `proyectos.html` — página de proyectos
- `assets/css/styles.css` — todos los estilos
- `assets/css/variables.css` — custom properties (paleta, tipografía, espaciado)
- `assets/js/main.js` — objeto `Timbo` con módulos; el relevante acá es `Timbo.projectsList`
- `assets/js/data.js` — contenido bilingüe; la sección de proyectos es `SITE_DATA.projects`

## Estado actual de la Projects page

### HTML actual (`proyectos.html`):
```html
<section class="projects-section" id="projects-section">
  <div class="container">
    <h1 class="projects__title" data-i18n="projects.title">Selected Projects</h1>
    <ul class="projects__list" id="projects-list">
      <!-- Renderizado por main.js -->
    </ul>
  </div>
</section>
```

### Datos actuales en `data.js` (sección projects.en.items):
```js
items: [
  { name: 'Exuma Lodge',     location: 'Bahamas' },
  { name: 'Haras San Pablo', location: 'Argentina' },
  { name: 'Tobar Lodge',     location: 'Argentina' },
  { name: 'Cherokee Ave',    location: 'United States' },
]
```

### Módulo JS actual que renderiza la lista (`Timbo.projectsList.render()` en `main.js`):
```js
list.innerHTML = data.items.map(project => `
  <li class="projects__item">
    <div class="projects__item-info">
      <span class="projects__item-name">${project.name}</span>
      <span class="projects__item-location">${project.location}</span>
    </div>
    <span class="projects__item-cta">
      ${data.viewProject}
      <span class="projects__item-cta-arrow"></span>
    </span>
  </li>
`).join('');
```

### CSS actual relevante (en `styles.css`):
- `.projects-section`: padding-top con nav height + space-5xl, min-height 100vh
- `.projects__title`: font-size --text-6xl, bold, color blanco
- `.projects__list`: ul sin estilos de lista
- `.projects__item`: flex, space-between, border-top, padding --space-2xl
- `.projects__item-name`: font-size --text-5xl, color --color-gray-300, transición a blanco en hover
- `.projects__item-location`: font-size --text-3xl, color --color-gray-300
- `.projects__item-cta`: flex, opacity 0 por defecto, translateX(-10px), aparece en hover con flecha →
- Hover behavior: cuando se hace hover en la lista, los demás ítems bajan a opacity 0.4, el hovered va a opacity 1 y texto blanco

### Custom properties disponibles (de `variables.css`):
- Grises: --color-gray-100 (#F5F5F5), --color-gray-200 (#D9D9D9), --color-gray-300 (#A0A0A0), --color-gray-400 (#707070), --color-gray-500 (#4A4A4A), --color-black (#1A1A1A), --color-white (#FFFFFF)
- Espaciado: --space-xs (4px) a --space-5xl (128px)
- Tipografía: --text-sm a --text-hero
- --max-width: 1200px, --nav-height: 60px
- --transition-base: 300ms ease, --transition-fast: 150ms ease

## Lo que NO hay que modificar

- **El nav** (`.main-nav`) — no tocar nada
- **El floating logo** (`.floating-logo`) — no tocar nada
- **El h1 `.projects__title`** — no tocar sus estilos ni su HTML
- **El hover behavior de la lista** — debe seguir funcionando igual

## Cambios requeridos

### 1. Nuevo layout debajo del título

Reemplazar la `<ul id="projects-list">` que está directamente dentro del `.container` por un nuevo contenedor de dos columnas:

```
[ Columna A — 25% ] [ Columna B — 75% ]
   imagen + datos      lista de proyectos
```

**Estructura HTML objetivo** (dentro de `.container`, debajo del `<h1>`):

```html
<div class="projects__body">

  <!-- COLUMNA A: preview del proyecto en hover -->
  <div class="projects__preview" id="projects-preview">
    <div class="projects__preview-image-wrapper">
      <img class="projects__preview-img" id="projects-preview-img" src="" alt="">
    </div>
    <div class="projects__preview-meta" id="projects-preview-meta">
      <!-- nombre y location se insertan por JS en hover -->
    </div>
  </div>

  <!-- COLUMNA B: lista de proyectos -->
  <ul class="projects__list" id="projects-list">
    <!-- Renderizado por main.js -->
  </ul>

</div>
```

### 2. CSS para el nuevo layout

Agregar en `styles.css`, dentro de la sección `/* PÁGINA: PROYECTOS */`:

- `.projects__body`: display flex, gap razonable (ej: --space-3xl), align-items flex-start
- `.projects__preview`: width ~25%, flex-shrink 0, position sticky, top calculado para quedar centrado verticalmente en pantalla (algo como `top: calc(var(--nav-height) + var(--space-2xl))`)
- `.projects__preview-image-wrapper`: aspect-ratio 3/4 (portrait), overflow hidden, background --color-gray-400 como placeholder
- `.projects__preview-img`: width 100%, height 100%, object-fit cover, opacity 0 por defecto con transition 300ms
- `.projects__preview-img.is-visible`: opacity 1
- `.projects__preview-meta`: margin-top --space-lg, color --color-gray-300
- `.projects__list`: flex 1 (ocupa el 75% restante)

### 3. Cambios en `data.js`

Agregar un campo `image` a cada proyecto (usar placeholder vacío por ahora, ya que no tenemos imágenes reales de proyectos):

```js
items: [
  { name: 'Exuma Lodge',     location: 'Bahamas',       image: '' },
  { name: 'Haras San Pablo', location: 'Argentina',     image: '' },
  { name: 'Tobar Lodge',     location: 'Argentina',     image: '' },
  { name: 'Cherokee Ave',    location: 'United States', image: '' },
]
```

### 4. Cambios en `main.js`

**En `Timbo.projectsList.render()`**: agregar lógica de hover que actualice la columna A.

Cuando el mouse entra a un `.projects__item`:
- Mostrar la imagen del proyecto en `#projects-preview-img` (si existe, sino dejar placeholder)
- Mostrar nombre y location en `#projects-preview-meta`
- Agregar clase `is-visible` a la imagen para el fade-in

Cuando el mouse sale de la lista:
- Remover `is-visible` de la imagen (fade out)
- Limpiar el meta

Implementarlo con `mouseenter`/`mouseleave` en cada `<li>` dentro de `render()`. Usar delegación de eventos en la `<ul>` para eficiencia.

## Archivos a modificar
- `proyectos.html` — agregar `.projects__body` y `.projects__preview` al HTML
- `assets/css/styles.css` — agregar estilos del nuevo layout
- `assets/js/main.js` — actualizar `Timbo.projectsList.render()` con hover interactivo
- `assets/js/data.js` — agregar campo `image` a cada proyecto

## Archivos que NO hay que modificar
- `assets/css/variables.css`
- Nada relacionado al nav o al floating logo

## Adjuntar con el prompt
Adjuntar la imagen del estado actual de la página para que Claude Code entienda el punto de partida visual.
