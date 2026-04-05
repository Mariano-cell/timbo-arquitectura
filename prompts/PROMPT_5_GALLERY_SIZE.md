# Prompt para Claude Code / Codex — Reducir tamaño de la galería de imágenes

## Contexto

Sitio web Timbó Arquitectura. Stack: vanilla HTML/CSS/JS, sin frameworks.
Ver `prompts/CONTEXTO_PROYECTO.md` para arquitectura completa.

## El problema

La sección `.project-gallery` en `proyectos/proyecto-exuma-lodge.html` quedó demasiado grande. El grid ocupa hasta `max-width: 1400px` y las imágenes reales (a diferencia de los placeholders) no tienen `aspect-ratio` definido, así que se estiran al alto natural de cada foto.

## Lo que hay que hacer

Solo modificar CSS en `assets/css/styles.css`. No tocar el HTML.

### Cambios en `.project-gallery`

```css
/* ANTES */
.project-gallery {
  padding: 0 var(--space-xl);
  margin-bottom: var(--space-5xl);
}

/* DESPUÉS */
.project-gallery {
  padding: 0 var(--space-xl);
  margin-bottom: var(--space-4xl);
}
```

### Cambios en `.project-gallery__grid`

```css
/* ANTES */
.project-gallery__grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  grid-template-rows: auto auto;
  gap: var(--space-md);
  max-width: 1400px;
  margin: 0 auto;
}

/* DESPUÉS */
.project-gallery__grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  grid-template-rows: auto auto;
  gap: var(--space-sm);
  max-width: 900px;
  margin: 0 auto;
}
```

### Agregar `aspect-ratio` a las imágenes reales (no solo a los placeholders)

Las reglas actuales solo aplican `aspect-ratio` cuando la imagen tiene `[data-placeholder]`. Hay que aplicarlo a todos los `.project-gallery__img`, independientemente de si tienen src o no:

```css
/* REEMPLAZAR estas dos reglas: */
.project-gallery__item--landscape .project-gallery__img[data-placeholder] {
  aspect-ratio: 16 / 10;
}

.project-gallery__item--portrait .project-gallery__img[data-placeholder] {
  aspect-ratio: 3 / 4;
}

/* POR estas (sin [data-placeholder]): */
.project-gallery__item--landscape .project-gallery__img {
  aspect-ratio: 16 / 10;
}

.project-gallery__item--portrait .project-gallery__img {
  aspect-ratio: 3 / 4;
}
```

## Archivo a modificar

- `assets/css/styles.css`

## Archivos que NO hay que modificar

- `proyectos/proyecto-exuma-lodge.html`
- `assets/js/main.js`

## Verificación

1. Abrir `proyectos/proyecto-exuma-lodge.html` en el browser
2. La galería debe ocupar un ancho máximo de 900px centrado en la página
3. Las imágenes landscape deben tener proporción 16:10, la portrait 3:4
4. El conjunto de la galería debe leerse como un bloque compacto, no dominante
5. Sin cambios en el resto de la página
