# Estándar de páginas de proyecto

Documento de referencia para la migración de todas las páginas de proyecto al
modelo de "Praderas Cabin". Este archivo es la **fuente de verdad** durante la
migración: cualquier cambio de estructura, naming o atributos se discute y se
actualiza acá antes de tocar código.

> **Versión:** 1 — escrito el día del arranque de la migración.
> **Página de referencia:** `proyectos/proyecto-praderas-cabin.html`.

---

## 1. Estructura canónica (orden de secciones)

Toda página de proyecto sigue este orden, sin saltos ni reordenamientos:

```
1. project-hero
2. project-overview
3. project-refuge
4. project-frame              (con modificador --split)
5. project-phrase             ← NUEVA respecto al estado actual de la mayoría
6. project-highlight          ← NUEVA respecto al estado actual de la mayoría
7. project-palette            (con modo drag por defecto)
8. project-final
```

Las 8 secciones son **obligatorias** en todos los proyectos. Si en un proyecto
puntual el cliente decide no mostrar `project-phrase` o `project-highlight`,
se podrán ocultar después caso por caso — pero el HTML siempre las incluye.

---

## 2. Regla de naming (importante)

**No se usan modificadores BEM con nombre de proyecto en el estándar.**

Eso significa que las siguientes clases del Praderas actual **NO van** al
estándar:

- ❌ `project-hero--praderas`
- ❌ `project-palette--praderas`
- ❌ `project-phrase--praderas`

En su lugar:

- Lo que es **comportamiento estándar de todos** se promueve a la clase base
  (sin modificador). Ej: el offset de `margin-top` que tenía
  `.project-palette--praderas .project-palette__text` pasa a
  `.project-palette__text`.
- Lo que es **variante reutilizable** (no específica de un proyecto) usa un
  modificador genérico, no de proyecto. Ej: `--split`, `--drag`.
- Lo que es **específico de UN proyecto** (ej: `object-position` de una foto
  particular) se resuelve con CSS custom properties por proyecto o con una
  regla puntual en un `<style>` inline de esa página — pero nunca con un
  modificador BEM con nombre de proyecto.

> **Excepción legacy que NO se toca:** la clase `page--haras-light` que está
> en el `<body>` de todos los proyectos. Es deuda técnica conocida pero
> cambiarla afecta a muchos selectores. Se queda como está.

---

## 3. Definición de cada sección

### 3.1. `project-hero`

```html
<section class="project-hero" id="hero" data-nav-theme="{light|dark}">
  <div class="project-hero__media" aria-hidden="true">
    <img id="project-cover" src="..." alt="{Nombre}" loading="eager" decoding="async">
  </div>
  <div class="container project-hero__content">
    <div class="project-hero__title-mask">
      <h1 class="project-hero__title">{Nombre del proyecto}</h1>
    </div>
  </div>
</section>
```

- `data-nav-theme` se elige según el contraste de la foto del hero.
- Si la foto necesita un `object-position` particular, se resuelve con una
  regla CSS en un `<style>` inline de esa página (no con un modificador BEM
  con nombre de proyecto).

### 3.2. `project-overview`

Sin cambios estructurales respecto a lo que ya tienen los proyectos: título
en dos líneas, sidebar con 5 facts (clima, bioma, terreno, área cubierta,
ubicación) + mapa, y media con slider de 2 fotos.

```html
<section class="project-overview" data-nav-theme="light">
  <div class="container project-overview__container">
    <h2 class="project-overview__title">
      <span class="project-overview__title-line"><span class="project-overview__title-line-inner">{Línea 1}</span></span>
      <span class="project-overview__title-line"><span class="project-overview__title-line-inner">{Línea 2}</span></span>
    </h2>
    <div class="project-overview__content">
      <div class="project-overview__sidebar">
        <div class="project-overview__facts">
          <!-- 5 facts: clima, bioma, terreno, área cubierta, ubicación -->
          <!-- mapa al final -->
          <div class="project-overview__map anim-fade-in" data-anim-delay="420">
            <div class="project-map" data-map-sequence data-map-theme="grayscale">
              <div class="project-map__canvas" id="project-map-canvas"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="project-overview__media anim-fade-in" data-anim-delay="160">
        <div class="project-overview__dots">
          <button class="project-overview__dot is-active" data-project-overview-slide="0" aria-label="Foto 1"></button>
          <button class="project-overview__dot" data-project-overview-slide="1" aria-label="Foto 2"></button>
        </div>
        <figure class="project-overview__photo">
          <img class="project-overview__img is-active" src="..." alt="..." loading="lazy" decoding="async">
          <img class="project-overview__img" src="..." alt="..." loading="lazy" decoding="async">
        </figure>
      </div>
    </div>
  </div>
</section>
```

- `data-map-theme="grayscale"` por defecto. `grayscale-light` se usa en
  proyectos sobre fondo claro y queda como opción válida (NO se elimina).

### 3.3. `project-refuge`

```html
<section class="project-refuge" data-nav-theme="light">
  <div class="container project-refuge__container">
    <div class="project-refuge__copy">
      <p class="project-refuge__text anim-fade-up" data-anim-delay="0">{Párrafo 1}</p>
      <p class="project-refuge__text anim-fade-up" data-anim-delay="120">{Párrafo 2}</p>
      <!-- opcional: <p class="project-refuge__text anim-fade-up" data-anim-delay="240">{Párrafo 3}</p> -->
    </div>
    <div class="project-refuge__gallery">
      <figure class="project-refuge__image anim-fade-in" data-anim-delay="0">
        <img src="..." alt="..." loading="lazy" decoding="async">
      </figure>
      <figure class="project-refuge__image anim-fade-in" data-anim-delay="400">
        <img src="..." alt="..." loading="lazy" decoding="async">
      </figure>
    </div>
  </div>
</section>
```

- **Cambio respecto a Tobar/Haras:** las imágenes ya NO usan
  `project-refuge__image--slide-a` / `--slide-x`. Usan `anim-fade-in` con
  `data-anim-delay`, como Praderas. Eso significa que en la migración
  esas clases se eliminan del HTML. Las reglas CSS de `--slide-a/x` se
  pueden conservar en `styles.css` por ahora (no estorban), pero quedan
  como deuda de limpieza.

### 3.4. `project-frame` (con `--split`)

```html
<section class="project-frame project-frame--split" data-project-slug="{slug}" data-nav-theme="light">
  <div class="container project-frame__container">
    <figure class="project-frame__media anim-fade-in">
      <img src="..." alt="..." loading="lazy" decoding="async">
    </figure>
    <div class="project-frame__copy">
      <p class="project-frame__text anim-fade-up" data-anim-delay="0">{Texto}</p>
    </div>
  </div>
</section>
```

- `data-project-slug` cambia por proyecto. Útil para JS si hace falta
  diferenciar.
- En Praderas el `<div class="project-frame__copy">` tiene una `<p>` con
  clase `project-phrase__text` (no `project-frame__text`). Lo unificamos:
  **el estándar usa `project-frame__text`**.

### 3.5. `project-phrase` (NUEVA en la mayoría)

```html
<section class="project-phrase" data-nav-theme="light">
  <div class="project-phrase__container">
    <div class="project-phrase__copy">
      <p class="project-frame__text anim-fade-up" data-anim-delay="0">{Párrafo largo}</p>
    </div>
    <div class="project-phrase__images">
      <figure class="project-phrase__image project-phrase__image--zoom anim-fade-in" data-anim-delay="120">
        <img src="..." alt="..." loading="lazy" decoding="async">
      </figure>
      <figure class="project-phrase__image project-phrase__image--pan anim-fade-in anim-reveal-right" data-anim-delay="220">
        <img src="..." alt="..." loading="lazy" decoding="async">
      </figure>
    </div>
  </div>
</section>
```

- Texto largo + dos imágenes: la primera con efecto **zoom**, la segunda
  con efecto **pan + reveal-right**.
- El CSS de `.project-phrase` ya existe en `styles.css`. La regla
  específica `.project-phrase--praderas .project-phrase__text` (offset de
  margin-top) se promueve a `.project-phrase__text` o se queda como está
  si en el piloto vemos que el offset no aplica universalmente — se
  decide en la tarea 3 (auditoría CSS).
- Imágenes requeridas por proyecto:
  - `assets/images/projects/{slug}/phrase-01.jpg` (efecto zoom)
  - `assets/images/projects/{slug}/phrase-02.jpg` (efecto pan)

### 3.6. `project-highlight` (NUEVA en la mayoría)

```html
<section class="project-highlight project-highlight--split" data-project-slug="{slug}" data-nav-theme="light">
  <div class="container project-highlight__container">
    <figure class="project-highlight__media anim-zoom-in">
      <img src="..." alt="..." loading="lazy" decoding="async">
      <h2 class="project-highlight__title">
        <span class="project-highlight__title-line"><span class="project-highlight__title-line-inner">{Línea 1}<br><br></span></span>
        <span class="project-highlight__title-line"><span class="project-highlight__title-line-inner">{Línea 2}</span></span>
      </h2>
    </figure>
  </div>
</section>
```

- Imagen grande con título superpuesto en dos líneas.
- El modificador `--split` ya existe en CSS y es el layout estándar para
  esta sección.
- Imagen requerida por proyecto:
  - `assets/images/projects/{slug}/highlight-01.jpg`

### 3.7. `project-palette` (con drag por defecto)

```html
<section class="project-palette" data-nav-theme="light" data-palette-mode="drag">
  <div class="project-palette__container">
    <div class="project-palette__copy">
      <p class="project-palette__text">{Frase clave del proyecto}</p>
    </div>
    <div class="project-palette__images project-palette__images--drag">
      <figure class="project-palette__image project-palette__image--a anim-fade-in" data-anim-delay="120">
        <img src="..." alt="..." loading="lazy" decoding="async">
      </figure>
      <button type="button" class="project-palette__divider" aria-label="Arrastrar para redimensionar">
        <span class="project-palette__divider-icon" aria-hidden="true">
          <!-- SVG chevron-círculo-chevron, copiado tal cual de Praderas -->
        </span>
      </button>
      <figure class="project-palette__image project-palette__image--b anim-fade-in" data-anim-delay="220">
        <img src="..." alt="..." loading="lazy" decoding="async">
      </figure>
    </div>
  </div>
</section>
```

- **Drag por defecto en todos los proyectos.**
- Los atributos `data-scroll-width-points`, `data-photo-a-width-points` y
  `data-photo-b-width-points` que tienen Tobar/Haras (y posiblemente otros)
  **se eliminan** al migrar.
- El SVG del divisor (chevron-círculo-chevron) se copia tal cual de
  Praderas — es genérico.
- Imágenes requeridas por proyecto:
  - Las dos imágenes pueden ser reutilizadas del overview (como hace
    Praderas con `praderas-overview-01.jpg` y `praderas-overview-02.jpg`)
    o ser específicas. Decisión por proyecto.

### 3.8. `project-final`

```html
<section class="project-final" data-nav-theme="dark">
  <div class="project-final__media anim-fade-in" data-anim-delay="0" aria-hidden="true">
    <img src="..." alt="" loading="lazy" decoding="async">
  </div>
  <div class="project-final__content">
    <div class="project-final__logo-mask">
      <img class="project-final__logo" src="../assets/images/logo/logo-nuevo-blanco-15.svg" alt="Timbó">
    </div>
  </div>
</section>
```

- Sin cambios estructurales.

---

## 4. `<head>` estándar

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Timbó — {Nombre del proyecto}">
  <title>Timbó — {Nombre del proyecto}</title>
  <link rel="icon" type="image/png" href="../assets/images/logo/solo-arbol/Timbo_Isologo1_Gris1.png">
  <link rel="stylesheet" href="../assets/css/variables.css">
  <link rel="stylesheet" href="../assets/css/styles.css">
  <style>
    /* Labels A/B/C de revisión — temporal, eliminar cuando termine el feedback con la diseñadora. */
    .page-content > section[data-review-section] { position: relative; }
    .page-content > section[data-review-section] > .project-review-section-label {
      position: absolute;
      top: 50%;
      right: clamp(0.35rem, 0.8vw, 0.75rem);
      transform: translateY(-50%);
      display: grid;
      place-items: center;
      min-width: clamp(2rem, 3vw, 2.75rem);
      height: clamp(2rem, 3vw, 2.75rem);
      padding: 0 0.35rem;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.82);
      box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: rgba(0, 0, 0, 0.82);
      font-size: clamp(0.85rem, 1.1vw, 1rem);
      font-weight: var(--fw-medium);
      line-height: 1;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      white-space: nowrap;
      pointer-events: none;
      z-index: 120;
    }
    @media (max-width: 900px) {
      .page-content > section[data-review-section] > .project-review-section-label {
        right: 0.35rem;
        min-width: 1.75rem;
        height: 1.75rem;
        font-size: 0.78rem;
      }
    }
  </style>
</head>
```

- El `<style>` inline con labels A/B/C va en **todos los proyectos** (decisión
  tomada con el cliente). Es temporal mientras dure el feedback con la
  diseñadora — al finalizar el review, se elimina con un buscar/reemplazar
  global.
- Nota: el `<style>` legacy de Praderas usa el breakpoint `900px`, que no
  cumple el estándar del CLAUDE.md (`1023.98px`). **No se toca por ahora**:
  cambiarlo requiere verificar que los labels se sigan viendo bien en
  tablets. Se anota como deuda menor.

---

## 5. `<body>` estándar

```html
<body class="page--haras-light">
  <nav class="main-nav main-nav--{light|dark} is-visible" aria-label="Main navigation">
    <ul class="nav__links">
      <li><a href="../index.html" class="nav__link">Home</a></li>
      <li><a href="../proyectos.html" class="nav__link nav__link--active">Projects</a></li>
      <li><a href="../sustentabilidad.html" class="nav__link">Sustainability</a></li>
      <li><a href="../servicios.html" class="nav__link">Services</a></li>
      <li><a href="../sobre-nosotros.html" class="nav__link">About Us</a></li>
      <li><a href="../contacto.html" class="nav__link">Contact</a></li>
    </ul>
  </nav>
  <main class="page-content">
    <!-- 8 secciones en orden -->
  </main>
  <script src="../assets/js/data.js"></script>
  <script src="../assets/js/main.js"></script>
  <script>
    /* Genera labels A/B/C en cada section — temporal, eliminar con el <style> de arriba. */
    (() => {
      const sections = document.querySelectorAll('.page-content > section');
      const getSectionLabel = (index) => {
        let label = '';
        let current = index;
        do {
          label = String.fromCharCode(65 + (current % 26)) + label;
          current = Math.floor(current / 26) - 1;
        } while (current >= 0);
        return label;
      };
      sections.forEach((section, index) => {
        const label = getSectionLabel(index);
        let marker = section.querySelector('.project-review-section-label');
        section.dataset.reviewSection = label;
        if (!marker) {
          marker = document.createElement('span');
          marker.className = 'project-review-section-label';
          marker.setAttribute('aria-hidden', 'true');
          section.appendChild(marker);
        }
        marker.textContent = label;
      });
    })();
  </script>
</body>
```

- `main-nav--light` o `main-nav--dark` según el `data-nav-theme` del hero.
- El script de labels va al final, **después** de cargar `main.js`.

---

## 6. Reglas CSS a promover / limpiar durante la migración

Decisiones tomadas tras la auditoría CSS (tarea 3). **Confirmadas con el
cliente.** Aplican durante la migración.

| Regla actual | Acción | Razón |
|---|---|---|
| `.project-hero--praderas .project-hero__media img { object-position: 58% 58%; }` (línea 1478 de styles.css) | **Mover a `<style>` inline en `proyecto-praderas-cabin.html`** y eliminar del styles.css global. Si otro proyecto necesita un encuadre similar, hace lo mismo en su propia página. | Ajuste de foto específica, no de sistema. Mantiene el styles.css global limpio de nombres de proyecto. |
| `.project-palette--praderas .project-palette__text { margin-top: calc(... + 100px); }` (línea 2118) | **Promover al base**: cambiar el selector a `.project-palette__text` (o sumar los 100px al clamp existente en la regla base de la línea 2111-2116). | Decisión del cliente: "todo debe permanecer tal cual está en Praderas". Tobar/Haras quedarán más espaciados, es la consecuencia esperada. |
| `.project-palette--praderas .project-palette__container` + reasignación de columnas (líneas 2127-2140, dentro de `@media min-width: 901px`) | **Promover al base**: quitar el `--praderas` de los 3 selectores, dejando las reglas dentro del mismo `@media`. Mantener el breakpoint 901px (legacy, NO migrar en esta tarea). | Grid invertido para TODOS los proyectos: imágenes a la izquierda, texto a la derecha en desktop. |
| `.project-phrase--praderas .project-phrase__text { margin-top: calc(... + 100px); }` (línea 2511) | **Promover al base**: igual que palette. Cambiar el selector a `.project-phrase__text` o sumar los 100px al clamp de la regla base (línea 2504-2509). | Idem decisión del palette. Misma estructura, misma regla. |
| Comentario `/* PROJECT PALETTE — DRAG MODE (praderas) */` (línea 2226) | Cambiar a `/* PROJECT PALETTE — DRAG MODE */`. | El selector ya es genérico; sólo el comentario engaña. |
| Reglas de `.project-refuge__image--slide-a` y `--slide-x` (líneas 1878-1888) | **Conservar por ahora**. Las clases se eliminan del HTML al migrar (Praderas usa `anim-fade-in`), pero las reglas CSS se quedan en el archivo. Limpieza opcional al final de la migración si nadie las usa. | Deuda menor. Sacarlas ahora suma riesgo sin valor. |
| Reglas de `.project-palette__images--scroll-width-active` (líneas 2172-2189) y equivalentes en phrase (líneas 2545-2562) | **Conservar por ahora**. Esas clases se aplican cuando hay `data-scroll-width-points`, que **se elimina** al migrar. CSS queda como deuda. | Mismo criterio que las anteriores. |

### Hallazgos colaterales (NO se tocan, registrados como deuda)

1. **`project-frame--split` y `project-highlight--split` no tienen reglas
   CSS asociadas.** Las clases se usan en el HTML pero ningún selector las
   apunta. Es deuda silenciosa — probablemente tenían estilos antes que se
   borraron. Las **mantenemos en el HTML** porque no rompen nada y por
   coherencia con el HTML actual; pero queda registrado que en una limpieza
   futura habría que decidir si se borran del HTML o se les restauran reglas.

2. **El bloque mobile de proyectos arranca en `@media (max-width: 900px)`**
   (línea 3033), no en el `1023.98px` del estándar nuevo del CLAUDE.md. Es
   legacy. **No se migra en esta tarea** (regla de migración oportunista).

3. **El grid invertido se aplica con `@media (min-width: 901px)`** (línea
   2127). Cuando promovamos al base, **mantenemos el 901px** para no
   introducir un cambio sutil en tablets. Registrado como deuda.

4. **`__intro` no existe en Praderas**, sólo `__text`. Tobar/Haras usan
   ambos. El template canónico **deja `__intro` como opcional** dentro de
   `__copy`, presente o ausente según el contenido del proyecto.

---

## 7. JavaScript

Auditoría JS completada en la tarea 4. Todos los módulos relevantes tienen
guards defensivos: cuando faltan clases o data-attrs, el módulo no se aplica
pero **no rompe la página**.

| Módulo en `main.js` | Qué busca | Comportamiento tras la migración |
|---|---|---|
| `refugePhotoSlide` (línea 431) y `refugePhotoA` (línea 489) | `.project-refuge__image--slide-x` y `--slide-a` | **Deja de aplicarse** porque el HTML migrado usa `anim-fade-in` en su lugar. Consecuencia confirmada: se pierde la animación scroll-driven del refuge en Tobar/Haras. Decisión del cliente: aceptar la pérdida. |
| `projectPaletteScrollWidth` (línea 6028) | `.project-palette[data-scroll-width-points]` | Deja de aplicarse en proyectos migrados (el data-attr se elimina). El código sigue en `main.js` por seguridad. |
| `projectPaletteDrag` (línea 6406) | `.project-palette[data-palette-mode="drag"]` + `--a`/`--b` + `__divider` | **Funciona en todos los proyectos migrados sin cambios**, siempre que el HTML lleve el data-attr, las dos clases y el botón divisor (copiados de Praderas). |
| `projectPhraseScrollWidth` (línea 6700) | `.project-phrase[data-scroll-width-points]` | Está dormido (ninguna página lo activa hoy) y sigue dormido. |
| `projectOverviewSlider` (línea 4908) | `.project-overview__dot[data-project-overview-slide]` | Totalmente genérico. Sin cambios. |
| Mapas (diccionario línea 3737+, keyed por slug) | `{ slug: { stages, polygon, ... } }` | **Es contenido configurable, no código atado a un proyecto.** Cada proyecto ya tiene su entry. Sin cambios en la migración. |

**Decisión cerrada (animación del refuge):** se acepta perder la animación
scroll-driven en Tobar/Haras. Todos los proyectos quedan con el refuge en
fade simple (`anim-fade-in` con delays), coherente con Praderas. Los
módulos `refugePhotoSlide` y `refugePhotoA` quedan en el código como
deuda — se podrían borrar al final de la migración, pero no estorban.

---

## 8. Lista de archivos a tocar en la migración

Por cada proyecto a migrar (los 8 que no son Praderas):

- `proyectos/proyecto-{slug}.html` → reescribir según template canónico.
- Imágenes nuevas requeridas en `assets/images/projects/{slug}/`:
  - `phrase-01.jpg`, `phrase-02.jpg` (para `project-phrase`)
  - `highlight-01.jpg` (para `project-highlight`)
  - Verificar que existen las del overview, refuge, frame, palette y final.

Archivos compartidos que pueden necesitar cambios chicos:

- `assets/css/styles.css` → eventuales promociones de reglas (`--praderas` →
  base) y limpieza de comentarios.
- `assets/js/main.js` → eventual guard si los `data-*` antiguos están
  ausentes.

---

## 9. Lo que NO se toca en esta migración

Para mantener el alcance acotado:

- La clase `page--haras-light` del `<body>` (legacy).
- Los breakpoints viejos de `styles.css` (regla de "migración oportunista"
  del CLAUDE.md).
- El bloque `<style>` legacy de Praderas que usa `max-width: 900px` (se
  conserva tal cual al copiarlo al estándar).
- Cualquier sección o componente que no sea una página de proyecto.
- El sistema de i18n (los proyectos actuales no usan `data-i18n` y no se
  agrega en esta migración).
