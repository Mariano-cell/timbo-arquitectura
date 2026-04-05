# PROMPT 13 — Rediseño sección intro (index.html)

## Contexto del proyecto
Proyecto: Timbó Arquitectura — sitio web estático.
Stack: HTML + CSS + JS vanilla. Sin frameworks, sin bundler.
Convenciones: BEM, CSS custom properties en `variables.css`.
Archivos a modificar: `index.html`, `assets/css/styles.css`.

---

## Objetivo

Rediseñar la sección `.intro` para que tenga un layout de **dos columnas**:

- **Columna izquierda (~40% del ancho):** contenido textual
- **Columna derecha (~60% del ancho):** dos fotos lado a lado con bordes redondeados

El contenido textual de la columna izquierda incluye (de arriba hacia abajo):
1. Label pequeño en mayúsculas: "LO QUE HACEMOS"
2. Título grande en negrita: el `intro__claim` existente ("Entre lo salvaje y las personas.")
3. Párrafo descriptivo: el `intro__text` existente (con el logo SVG inline + texto)

El logo "timbó" (`intro__name`) queda donde está, inline dentro del párrafo.

En la columna derecha, **dos fotos lado a lado**:
- Foto izquierda (más ancha): `assets/images/intro-section/DSC01984.jpg`
- Foto derecha (más angosta): `assets/images/intro-section/DSC02312.jpg`
- Ambas con `border-radius: 12px`
- Misma altura, ocupando toda la altura de la sección
- `object-fit: cover`

El link "See More" / `intro__link` se elimina del HTML — ya no va en esta sección.

---

## Cambios en `index.html`

Reemplazar el contenido actual de `<section class="intro">` por:

```html
<section class="intro" id="intro" data-nav-theme="light">
  <div class="container intro__container">

    <!-- Columna izquierda: texto -->
    <div class="intro__body">
      <p class="intro__label">Lo que hacemos</p>
      <h2 class="intro__claim anim-fade-up" data-i18n="home.claim" data-anim-delay="0">
        Entre lo salvaje y las personas.
      </h2>
      <p class="intro__text anim-fade-up" data-anim-delay="250">
        <img class="intro__name" src="assets/images/logo/timbo-negro.svg" alt="TIMBÓ">
        <span data-i18n="home.introText">es un estudio de arquitectura, diseño, consultoría e investigación con origen
          en Buenos Aires. Comprometido con contribuir a un futuro bajo en carbono, permite a las personas
          experimentar la naturaleza en su máxima expresión. Mediante el análisis de datos climáticos, los proyectos
          se adaptan a las condiciones específicas de cada lugar, asegurando una baja demanda energética y una alta
          calidad ambiental tanto en espacios interiores como exteriores.</span>
      </p>
    </div>

    <!-- Columna derecha: fotos -->
    <div class="intro__photos">
      <figure class="intro__photo intro__photo--wide">
        <img src="assets/images/intro-section/DSC01984.jpg" alt="Timbó — naturaleza" loading="lazy">
      </figure>
      <figure class="intro__photo intro__photo--narrow">
        <img src="assets/images/intro-section/DSC02312.jpg" alt="Timbó — arquitectura" loading="lazy">
      </figure>
    </div>

  </div>
</section>
```

---

## Cambios en `assets/css/styles.css`

### 1. Reemplazar las reglas existentes del bloque `.intro` (desde `.intro {` hasta `.intro__name {}` inclusive) por las siguientes:

```css
/* =========================
   INTRO
   ========================= */

.intro {
  padding: var(--space-5xl) 0;
  background-color: var(--color-bg-light);
}

.intro__container {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: var(--space-3xl);
  align-items: start;
}

.intro__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding-top: var(--space-2xl);
}

.intro__label {
  font-size: var(--text-xs, 0.75rem);
  font-weight: var(--fw-regular);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(0, 0, 0, 0.4);
}

.intro__claim {
  font-size: var(--text-5xl);
  font-weight: var(--fw-bold, 700);
  line-height: 1.1;
  max-width: 480px;
}

.intro__text {
  font-size: var(--text-base, 1rem);
  font-weight: var(--fw-regular);
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.7);
  max-width: 480px;
}

.intro__name {
  display: inline;
  height: 0.72em;
  width: auto;
  vertical-align: baseline;
  margin-right: 0.15em;
}

/* Fotos */
.intro__photos {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 8px;
  align-items: stretch;
}

.intro__photo {
  margin: 0;
  overflow: hidden;
  border-radius: 12px;
}

.intro__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.intro__photo--wide {
  aspect-ratio: 3 / 4;
}

.intro__photo--narrow {
  aspect-ratio: 3 / 4;
}

/* Responsive */
@media (max-width: 900px) {
  .intro__container {
    grid-template-columns: 1fr;
  }

  .intro__photos {
    grid-template-columns: 3fr 2fr;
    max-height: 400px;
  }
}
```

### 2. Eliminar las reglas que ya no se usan:
- `.intro__link`
- `.intro__link:hover`
- `.intro-link__oval`
- `.intro__link--oval-draw .intro-link__oval`

(Si preferís dejarlas por si acaso, no es un problema — simplemente no se usarán.)

---

## Verificación esperada

1. La sección intro muestra dos columnas: texto a la izquierda, fotos a la derecha.
2. El texto tiene el label "LO QUE HACEMOS" arriba, luego el título en negrita, luego el párrafo.
3. Las dos fotos están lado a lado con bordes redondeados, misma altura.
4. En mobile (< 900px), las columnas se apilan: texto arriba, fotos abajo.
5. El link "See More" ya no aparece.
6. El logo SVG inline dentro del párrafo sigue funcionando.
7. No hay errores en consola.
8. El resto de la página no se ve afectado.
