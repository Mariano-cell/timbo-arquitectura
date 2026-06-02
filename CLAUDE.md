# Timbó Arquitectura — Proyecto Web

## Qué es
Sitio web estático para Timbó, estudio de arquitectura bioclimática argentino (Gerónimo Vigil y Mía Morrone). Vanilla HTML/CSS/JS, sin frameworks ni bundlers. Hosteado en Netlify.

## ⚠️ REGLA CRÍTICA: Mobile vs Desktop

**El sitio es desktop-first.** El CSS base (fuera de cualquier `@media`) define la versión desktop. Los estilos mobile viven dentro de `@media (max-width: ...)`.

Cuando se trabaja en **mobile**:
- TODA modificación debe ir dentro de un bloque `@media (max-width: ...)` apropiado (ver "Breakpoints estándar" abajo).
- NUNCA modificar las reglas CSS de afuera de los `@media` queries — esas son las de desktop y deben quedar intactas.
- Si hace falta cambiar un valor que está en `:root` o en una custom property, verificar antes si ese valor también afecta desktop. Si afecta a ambos, NO cambiarlo: en su lugar, sobreescribir la propiedad sólo dentro del `@media` mobile.
- Antes de tocar cualquier selector, chequear si ya existe una regla para ese selector en desktop. Si existe, la versión mobile debe estar en `@media`, no reemplazar la de desktop.
- Si una modificación de HTML o JS podría afectar desktop (ej. agregar/sacar un elemento, cambiar estructura), avisar antes y proponer cómo aislarla (clases condicionales, `matchMedia`, etc.).

Cuando se trabaja en **desktop**: aplica la regla inversa — no tocar lo que está dentro de los `@media (max-width: ...)`.

Si una modificación impacta ambos, hay que decirlo explícitamente antes de aplicarla.

## Breakpoints estándar

El sitio usa **dos modos** (mobile y desktop) con un solo breakpoint principal en **1024px**.

| Modo | Ancho | Breakpoint CSS | Cubre |
|---|---|---|---|
| Celular chico (opcional) | ≤480px | `@media (max-width: 480px)` | iPhone SE y similares cuando hace falta ajuste fino |
| Mobile + tablet vertical | ≤1023.98px | `@media (max-width: 1023.98px)` | Celulares y tablets en orientación vertical |
| Desktop + tablet horizontal | ≥1024px | (default, sin `@media`) | Tablets horizontales, laptops, monitores |

**Reglas:**
- El breakpoint principal para mobile nuevo es **1024px** (`max-width: 1023.98px`).
- Sólo se usa `480px` cuando un ajuste específico no se ve bien en celulares chicos.
- NO se agregan breakpoints nuevos (`640`, `700`, `768`, `900`, `980`, `1100`, etc.) sin discutirlo primero.
- **Importante:** el archivo `styles.css` actual tiene muchos `@media` viejos con breakpoints variados (`480`, `640`, `700`, `768`, `900`, `980`, `1080`, `1100`, `1366`, `1535`). Esto es legacy.

### Pantalla de referencia de diseño (mobile)

La diseñadora trabaja los mockups mobile sobre un viewport de **375 × 667 px** (referencia tipo iPhone SE / 6 / 7 / 8). Esta es la **pantalla base** sobre la que se implementa la versión mobile.

**Flujo de trabajo mobile:**
1. Implementar primero los estilos para que coincidan **exactamente** con el diseño a 375 × 667 px.
2. Una vez que esa pantalla está fiel al mockup, **adaptar** los estilos para que escalen bien en otros tamaños de mobile (anchos mayores hasta 1023.98px, y eventualmente ajustes finos en ≤480px).
3. Las medidas, proporciones y tamaños tipográficos del mockup están pensadas para 375px de ancho — al adaptar a otros tamaños, mantener la proporción visual, no copiar valores absolutos sin criterio.

Esto NO cambia los breakpoints CSS (siguen siendo 1023.98px y 480px); 375 × 667 es la **resolución de referencia para diseño**, no un breakpoint nuevo.

### Migración oportunista

NO se migra el `styles.css` viejo de golpe (riesgo alto, poca recompensa). En su lugar:
- Cuando volvamos a tocar una sección por otra razón (ajuste, bugfix, feature nuevo), **aprovechamos y migramos sus `@media` viejos al estándar de 1024px**.
- Si un `@media` viejo está en `768px` y no estamos por entrar a esa sección, se queda como está.
- Si se modifica una regla dentro de un `@media` viejo, considerar primero si la sección entera está lista para migrarse, o si conviene dejarla en el breakpoint viejo hasta más adelante.

### Formato para `@media` mobile nuevos

Cada `@media` mobile nuevo va **al final de su sección** (antes del próximo header `/* ===== ... ===== */`), con este formato:

```css
/* --- MOBILE --- */
@media (max-width: 1023.98px) {
  /* reglas mobile de esta sección */
}

/* --- MOBILE CHICO (opcional) --- */
@media (max-width: 480px) {
  /* sólo si hace falta ajuste extra para celulares chicos */
}
```

Así cada sección queda autocontenida: desktop arriba, mobile pegado abajo.

## ⭐ Estándar oficial para títulos y párrafos — versión mobile (`estandar-a-mobile`)

Este es el **estándar de comportamiento tipográfico mobile** del sitio. Se aplica dentro de `@media (max-width: 1023.98px)` a títulos, etiquetas (kickers/labels) y párrafos de las secciones que usen este patrón.

**Nombre corto:** `estandar-a-mobile`. El usuario puede pedir aplicarlo refiriéndose a él por este nombre, y aclarará si se refiere al **estándar para título** (`.selector__claim`), al **estándar para párrafo** (`.selector__text`) o al **estándar para label/kicker** (`.selector__label`). Si dice "estandar-a-mobile" sin aclarar, se aplica el bloque entero (label + claim + text + body gap).

**No se aplica automáticamente a todas las secciones** — sólo a las que indique el usuario. Pero cuando se aplica, se usan estos valores tal cual (o se adaptan proporcionalmente si el diseño lo pide).

### Reglas de oro

1. **Sólo afecta mobile.** Todas estas reglas van DENTRO de `@media (max-width: 1023.98px)`. El CSS desktop (fuera del `@media`) NO se toca jamás al aplicar este estándar.
2. **Antes de aplicar, leer el desktop.** Si la sección destino tiene tamaños desktop muy distintos a los de `.intro`, los `clamp()` mobile pueden necesitar ajuste proporcional (no copiar y pegar a ciegas).
3. **Escalado fluido entre 375px y 1023px.** Los `clamp()` están calculados para que arranquen en el valor de 375px (mockup base) y crezcan suavemente hasta 1023px. No se pisan con desktop porque a 1024px sale del `@media`.
4. **El valor del medio del `clamp()` SIEMPRE lleva `vw`.** Si los tres valores son fijos (sin `vw`), `clamp()` no escala — siempre devuelve el del medio. Eso es un bug, no es el estándar.
5. **El bloque contenedor (flex/grid column) usa `gap: var(--space-md)` (16px)** entre label, título y párrafo en mobile, en vez de los gaps más grandes de desktop.

### Valores estándar

```css
@media (max-width: 1023.98px) {
  /* Etiqueta / kicker (ej. "Sección 02") */
  .selector__label {
    /* Fluid: 10px @ 375px → 14px @ 1023px */
    font-size: clamp(0.625rem, 0.62vw + 0.39rem, 0.875rem);
  }

  /* Título principal de la sección */
  .selector__claim {
    /* Fluid: 28px @ 375px → 40px @ 1023px */
    font-size: clamp(1.75rem, 1.85vw + 1.06rem, 2.5rem);
  }

  /* Párrafo / texto del cuerpo */
  .selector__text {
    /* Fluid: 16px @ 375px → 23px @ 1023px */
    font-size: clamp(1rem, 1.08vw + 0.747rem, 1.4375rem);
    max-width: clamp(16rem, 80vw, 30rem);
  }

  /* Contenedor flex en columna que agrupa label + claim + text */
  .selector__body {
    gap: var(--space-md); /* 16px — mitad del gap desktop típico */
  }
}
```

### Referencia: cómo se ven los tamaños en distintos anchos

| Ancho | label | claim | text |
|---|---|---|---|
| 375px | 10px | 28px | 16px |
| 500px | ~10.8px | ~30.3px | ~17.3px |
| 700px | 12px | 34px | ~19.5px |
| 900px | ~13.3px | ~37.7px | ~21.7px |
| 1023px | 14px | 40px | 23px |

### Origen del estándar

Calibrado sobre la sección `.intro` de `index.html` (home). Si se modifican los valores del estándar, actualizarlos primero en esta sección de `CLAUDE.md` y luego propagar a las secciones donde ya esté aplicado.

### Cómo aplicar a una sección nueva

1. Identificar los selectores equivalentes: el label (kicker), el título y el párrafo.
2. Identificar el contenedor flex/grid que los agrupa (equivalente a `.intro__body`).
3. Dentro del `@media (max-width: 1023.98px)` de esa sección, agregar los cuatro bloques de arriba con los nombres reales de los selectores.
4. Verificar que NO existan reglas desktop que se vayan a pisar, y que NO se modifiquen reglas fuera del `@media`.
5. Probar resize entre 375px y 1023px — los tres tamaños deben crecer gradualmente.

## ⭐ Estándar oficial para títulos y párrafos — versión desktop (`estandar-desktop`)

Este es el **estándar de comportamiento tipográfico desktop** del sitio. Se aplica FUERA de cualquier `@media (max-width: ...)`, es decir, en el CSS base que toma efecto a partir de **1024px** de ancho.

**Nombres oficiales** (el usuario los invoca por estos nombres en cualquier chat):

- `estandar-desktop para parrafo` → aplica el bloque de **párrafo**.
- `estandar-desktop para titulo` → aplica el bloque de **título**.
- `estandar-desktop para frase-destacada` → aplica el bloque de **frase destacada**.

Si el usuario dice `estandar-desktop` sin aclarar, preguntar a cuál de los tres se refiere.

### Reglas de oro

1. **Sólo afecta desktop.** Estos bloques van FUERA de los `@media (max-width: ...)`. Las reglas mobile (dentro de `@media`) NO se tocan jamás al aplicar este estándar. Si la sección destino ya tiene `estandar-a-mobile` aplicado, ambos conviven sin pisarse porque viven en bloques distintos.
2. **El valor del medio del `clamp()` SIEMPRE lleva `vw`.** Si los tres valores son fijos, `clamp()` no escala. Eso es un bug, no el estándar.
3. **Escalado fluido desde 1024px hacia arriba.** Los `clamp()` están calculados para arrancar en el valor mínimo cerca del breakpoint mobile/desktop y crecer hasta el máximo en pantallas grandes.
4. **Antes de aplicar, leer el desktop existente.** Si la sección destino ya tiene tamaños desktop muy distintos, conviene revisar si el reemplazo total tiene sentido o si hay que adaptar proporcionalmente.

### Valores estándar

```css
/* === estandar-desktop para parrafo === */
.selector__text {
  font-size: clamp(1.125rem, 0.4vw + 1rem, 1.375rem);
  letter-spacing: 0.03em;
  line-height: 1.35;
  font-weight: var(--fw-regular);
}

/* === estandar-desktop para titulo === */
.selector__claim {
  font-size: clamp(1.875rem, 1.7vw + 0.85rem, 2.75rem);
  letter-spacing: 0.04em;
  line-height: 1.05;
  font-weight: var(--fw-medium);
}

/* === estandar-desktop para frase-destacada === */
.selector__highlight {
  font-size: clamp(1.125rem, 0.4vw + 1rem, 1.375rem);
  letter-spacing: 0.03em;
  line-height: 1.5;
  font-weight: var(--fw-bold);
}
```

### Resumen rápido

| Estándar | font-size (clamp) | letter-spacing | line-height | font-weight |
|---|---|---|---|---|
| `parrafo` | `clamp(1.125rem, 0.4vw + 1rem, 1.375rem)` | `0.03em` | `1.35` | `--fw-regular` (400) |
| `titulo` | `clamp(1.875rem, 1.7vw + 0.85rem, 2.75rem)` | `0.04em` | `1.05` | `--fw-medium` (500) |
| `frase-destacada` | `clamp(1.125rem, 0.4vw + 1rem, 1.375rem)` | `0.03em` | `1.5` | `--fw-bold` (700) |

Notar que **`parrafo` y `frase-destacada` comparten font-size y letter-spacing**; las diferencian el `line-height` (1.35 vs 1.5) y el `font-weight` (regular vs bold).

### Cómo aplicar a una sección nueva

1. Identificar los selectores reales de esa sección (el título, los párrafos, las frases destacadas si las hay).
2. Reemplazar `.selector__claim`, `.selector__text`, `.selector__highlight` por los nombres reales.
3. Pegar el/los bloques **fuera** de cualquier `@media (max-width: ...)`.
4. Verificar que no haya reglas desktop previas para los mismos selectores que vayan a quedar duplicadas o en conflicto — si existen, decidir si se reemplazan o se mergean.
5. NO tocar reglas dentro de `@media (max-width: 1023.98px)` ni similares.

## Saltos de línea responsive: `<br>` mobile vs desktop

Muchos textos del sitio tienen `<br>` pensados para el ritmo de **desktop** (donde el ancho es grande y los saltos quedan elegantes), pero en mobile esos mismos `<br>` cortan el texto en lugares incómodos. Y al revés: a veces en mobile querés un salto en un lugar específico que en desktop no tiene sentido.

No hay una regla automática para decidir esto — es **manual y caso por caso**. El usuario va a ir indicando, párrafo por párrafo, qué `<br>` desaparece en mobile o qué `<br>` se agrega sólo para mobile.

### Clases utilitarias

En `styles.css` (zona de utilities globales, fuera de cualquier `@media` específico de sección):

```css
/* === BR responsive === */
.br-desktop { display: inline; }
.br-mobile  { display: none; }

@media (max-width: 1023.98px) {
  .br-desktop { display: none; }
  .br-mobile  { display: inline; }
}
```

El breakpoint es **el mismo que usa el resto del sitio para mobile**: `1023.98px`. No se agrega un breakpoint propio para esto.

### Cómo se usan

| Caso | Clase | Resultado |
|---|---|---|
| `<br>` que sirve en desktop pero estorba en mobile | `<br class="br-desktop">` | Visible ≥1024px, oculto ≤1023.98px |
| `<br>` que sirve sólo en mobile | `<br class="br-mobile">` | Oculto ≥1024px, visible ≤1023.98px |
| `<br>` que sirve en ambos | `<br>` sin clase | Visible siempre (comportamiento default) |
| `<br>` que no sirve en ninguno | (borrarlo) | — |

### Estrategia de migración: manual y guiada por el usuario

- Los `<br>` existentes **se quedan como están** (visibles en ambos viewports) hasta que el usuario indique explícitamente qué hacer con cada uno.
- El usuario va a ir revisando los textos uno por uno y diciendo cosas como:
  - "este `<br>` desaparece en mobile" → agregar `class="br-desktop"`.
  - "acá agregamos un `<br>` sólo para mobile" → insertar `<br class="br-mobile">` donde corresponda.
- **No** hacer migración masiva ni asumir comportamiento. Sólo se toca el `<br>` que el usuario menciona en ese momento.
- Cuando se agrega un `<br class="br-mobile">` nuevo, NO altera el HTML que ve desktop (porque la clase lo oculta), así que es seguro hacerlo sin romper desktop.

### Reglas

1. **Nunca borrar un `<br>` existente sin que el usuario lo pida.** Pueden estar afectando el ritmo de desktop.
2. **Nunca agregar un `<br>` "pelado" (sin clase) nuevo** si la intención es que sólo aparezca en un viewport — usar `br-desktop` o `br-mobile`.
3. Si el usuario pide ocultar un `<br>` en mobile, agregar `class="br-desktop"` al `<br>` existente (no borrarlo, no envolverlo en nada raro).
4. Las clases viven en `styles.css` como utilities globales, **no** dentro del CSS de una sección específica.

## ⭐ Estándar de transformación de fotos — `cambio-dos-a-uno`

Estándar para convertir una sección con **texto + dos fotos verticales** en **texto + una sola foto horizontal**. Aplica a páginas de proyecto (`proyectos/proyecto-*.html`) cuando el cliente pide simplificar la galería.

**Nombre oficial:** `cambio-dos-a-uno`. El usuario lo invoca con frases como *"aplicá `cambio-dos-a-uno` a la sección `project-refuge` de exuma-lodge"*.

**Caso de referencia donde se calibró:** `.project-refuge` de `proyectos/proyecto-exuma-lodge.html`.

### Regla de oro

**NUNCA se modifica la regla CSS base de una clase compartida entre páginas.** Si la transformación no aplica a todas las páginas, se implementa **siempre** con:

1. una **clase modificadora BEM** agregada sólo al `<section>` objetivo;
2. un **bloque CSS bajo el selector compuesto del modificador**;
3. el HTML de la página objetivo ajustado puntualmente;
4. **cero cambios** en las otras páginas.

Ejemplo correcto:

```html
<section class="project-refuge project-refuge--single-horizontal" data-nav-theme="light">
```

```css
.project-refuge--single-horizontal .project-refuge__gallery {
  grid-template-columns: 1fr;
}

.project-refuge--single-horizontal .project-refuge__image {
  aspect-ratio: 16 / 9;
}
```

La regla base compartida (`.project-refuge__gallery`, `.project-refuge__image`, etc.) queda intacta.

### Qué hace la transformación

- **Texto:** queda exactamente igual.
- **Galería:** las dos imágenes verticales se reemplazan por **una sola imagen horizontal** que ocupa el ancho total que antes ocupaban ambas juntas.
- **Imagen sobreviviente:** se conserva la **primera** (`*-01.jpg` por convención). El path NO se cambia.
- **Aspect-ratio horizontal por defecto:** `16 / 9`. Se puede cambiar a `3 / 2` u otro si el usuario lo pide.

### Pasos para aplicar (desktop-first)

1. **Releer HTML, CSS y JS actuales** de la sección destino. Nunca asumir estado.
2. **Definir el nombre del modificador** antes de editar. Usar la convención `project-XXX--single-horizontal`.
3. **HTML:** agregar la clase modificadora **sólo** al `<section>` objetivo.
4. **HTML de la galería:** borrar el segundo `<figure>` completo (incluyendo `<img>` y comentarios internos). Conservar el primero sin tocar `src`, `alt`, `loading`, `decoding` ni `data-anim-*`.
5. **CSS base:** no tocarla.
6. **CSS modificador:** agregar, inmediatamente después del bloque base de la sección en `assets/css/styles.css`, un bloque bajo el selector compuesto del modificador. Ahí viven todas las diferencias de display:
   - galería a `grid-template-columns: 1fr`;
   - imagen a `aspect-ratio: 16 / 9` (o el ratio acordado).
7. **CSS mobile:** no agregar reglas nuevas. Sólo si ya existían reglas mobile específicas de esa transformación y quedaron obsoletas, limpiarlas dentro del scope correcto.
8. **JS:** revisar `assets/js/main.js`. Si hay módulos que apuntan a una segunda imagen, confirmar que esas clases **no estén aplicadas** en la sección que se transforma. Si sí están, avisar antes de seguir.

### Reglas de oro operativas

1. **Desktop-first.** Mobile se resuelve en otra pasada.
2. **No tocar el path de la imagen sobreviviente.**
3. **No tocar otras páginas.** La transformación es atómica y local.
4. **Sin código residual.** Revisar que no queden selectores, comentarios o hooks que asuman dos imágenes.
5. **Si otra sección necesita el mismo patrón**, se crea su propio modificador (`project-phrase--single-horizontal`, `project-palette--single-horizontal`, etc.) sólo cuando el usuario lo pida explícitamente.

### Toggle temporal para iterar el ratio (opcional)

Mientras se decide el `aspect-ratio` final, se puede agregar un **toggle in-page** con tres bloques autocontenidos dentro de esa página puntual:

- `<style>` temporal para el toggle.
- `<div class="...-ratio-toggle">` dentro de la galería, con botones `data-ratio="..."`.
- `<script>` temporal que cambia un `data-*` en la galería y togglea la clase `is-active`.

Todos los bloques se marcan con comentarios `TEMPORAL`. Cuando se define el ratio final, se borran juntos y el valor final queda fijo en `styles.css`.

**Cierre obligatorio del proceso:** una vez que el cliente responde el formulario y define si el ratio final queda en `16 / 9`, `3 / 2` u otro, hay que **emprolijar la implementación**: borrar los bloques `TEMPORAL` (`<style>`, `<script>`, toggles y labels de revisión que ya no hagan falta), dejar sólo el modificador BEM + el CSS final en `assets/css/styles.css`, y **no dejar CSS embebido dentro del HTML**.

### Estado de aplicaciones

- [x] `proyecto-exuma-lodge.html` — sección `.project-refuge` con modificador `.project-refuge--single-horizontal`.
- [x] `proyecto-cardano-clubhouse.html` — sección `.project-refuge` con modificador `.project-refuge--single-horizontal` y ratio `16 / 9`.
- [x] `proyecto-haras-san-pablo.html` — sección `.project-refuge` con modificador `.project-refuge--single-horizontal` y toggle temporal `16 / 9` ↔ `3 / 2`.

(A medida que se aplique a otras secciones, registrar acá página, sección, modificador y ratio final.)

## ⭐ Estándar de transformación de fotos — `conversion-a-galeria`

Estándar para convertir una sección con **una sola foto** en una **galería de varias fotos con dots navegables**, replicando la mecánica de `.project-overview__media`.

**Nombre oficial:** `conversion-a-galeria`. El usuario lo invoca con frases como *"aplicá `conversion-a-galeria` a la sección `project-frame` de exuma-lodge"*.

**Caso de referencia donde se calibró:** `.project-frame` de `proyectos/proyecto-exuma-lodge.html`.

### Regla de oro

**Nunca se modifica la regla base de una clase compartida para convertirla en galería.** La conversión vive siempre detrás de un modificador BEM en la sección objetivo.

Ejemplo correcto:

```html
<section class="project-frame project-frame--split project-frame--gallery" data-project-slug="exuma-lodge" data-nav-theme="light">
```

```css
.project-frame--gallery .project-frame__media { ... }
.project-frame--gallery .project-frame__photo { ... }
.project-frame--gallery .project-frame__img { ... }
.project-frame--gallery .project-frame__dots { ... }
.project-frame--gallery .project-frame__dot { ... }
```

La regla base (`.project-frame__media`, `.project-frame__media img`) se restaura o se mantiene como estaba para el resto de las páginas.

### Qué hace la transformación

- Conserva la posición del bloque en el layout.
- Reemplaza la foto única por una galería con **dots arriba a la derecha**.
- Las imágenes se apilan y cambian con **fade**.
- La imagen activa hace **slow-zoom** (`scale(1.12)`).
- Click en un dot: cambia slide y actualiza `is-active`.

### Cantidad de fotos

Por default son **2 fotos**. Si el usuario pide 3, el patrón escala igual. Antes de aplicar, confirmar cantidad de fotos y naming de assets (`-01`, `-02`, `-03`).

### Pasos para aplicar (desktop-first)

1. **Releer HTML, CSS y JS actuales** de la sección destino.
2. **Definir el modificador** a usar. Convención: `project-XXX--gallery`.
3. **HTML:** agregar la clase modificadora sólo al `<section>` objetivo.
4. **HTML del media:** convertir la estructura original a wrapper + dots + `<figure>` interno de fotos. Las clases de animación existentes (`anim-fade-in`, `data-anim-delay`, etc.) se conservan en el wrapper.
5. **CSS base:** no tocarla.
6. **CSS modificador:** agregar, inmediatamente después del bloque base de la sección en `styles.css`, todas las reglas de la galería bajo el selector compuesto del modificador:
   - `__media`;
   - `__photo`;
   - `__img` / `__img.is-active`;
   - `__dots`;
   - `__dot` / `__dot.is-active`.
7. **Si el viejo bloque base tiene propiedades que chocan con el nuevo rol del wrapper**, neutralizarlas dentro del modificador, nunca en la regla base.
8. **JS:** agregar o reutilizar un módulo tipo `projectXXXSlider` con guard `if (!dots.length || !imgs.length) return;`, y registrarlo en `Timbo.init()`.
9. **Aviso al usuario:** si faltan assets (`-02`, `-03`), avisar al cerrar la tarea.

### Reglas de oro operativas

1. **Desktop-first.** No agregar reglas mobile nuevas en esta pasada.
2. **No tocar el path de la primera imagen.**
3. **Mantener el HTML y CSS de las otras páginas intactos.**
4. **Sin código residual.** No dejar selectores viejos del tipo `.project-XXX__media img` actuando fuera del modificador.
5. **El módulo JS debe ser seguro de invocar globalmente.** Si la galería no existe en una página, no hace nada.

### Cierre del proceso

Si durante la revisión se agregan helpers temporales inline dentro de una página puntual (por ejemplo labels, toggles, overrides o CSS de prueba), cuando el cliente define la versión final hay que borrarlos y consolidar el resultado permanente en `styles.css` y, si corresponde, en `main.js`. **No se deja CSS embebido en los HTML al cerrar la implementación.**

### Estado de aplicaciones

- [x] `proyecto-exuma-lodge.html` — sección `.project-frame` con modificador `.project-frame--gallery`.
- [x] `proyecto-tobar-lodge.html` — sección `.project-frame` con modificador `.project-frame--gallery` y galería de `3` fotos.
- [x] `proyecto-haras-san-pablo.html` — sección `.project-frame` con modificador `.project-frame--gallery` y galería de `2` fotos.
- [x] `proyecto-tobar-lodge.html` — sección `.project-phrase` con modificador `.project-phrase--gallery` y galería de `3` fotos.
- [x] `proyecto-haras-san-pablo.html` — sección `.project-phrase` con modificador `.project-phrase--gallery`, galería de `2` fotos y toggle temporal `16 / 9` ↔ `3 / 2`.
- [x] `proyecto-tobar-lodge.html` — sección `.project-highlight` con modificador `.project-highlight--gallery` y galería de `2` fotos.
- [x] `proyecto-tobar-lodge.html` — sección `.project-palette` con modificador `.project-palette--gallery` y galería de `2` fotos.
- [x] `proyecto-cardano-clubhouse.html` — sección `.project-palette` con modificador `.project-palette--gallery` y galería de `2` fotos.

(A medida que se aplique a otras secciones, registrar acá página, sección, modificador y cantidad de fotos.)

## Repo
`https://github.com/Mariano-cell/timbo-arquitectura`

## Estructura del proyecto

```
timbo-arquitectura/
├── index.html                    (Home)
├── proyectos.html                (Listado de proyectos)
├── sustentabilidad.html          (Sustentabilidad)
├── sobre-nosotros.html           (Sobre nosotros)
├── contacto.html                 (Contacto + formulario)
├── proyectos/                    (Páginas individuales de proyecto)
│   ├── proyecto-exuma-lodge.html
│   ├── proyecto-haras-san-pablo.html
│   ├── proyecto-tobar-lodge.html
│   ├── proyecto-cabana-suinda.html
│   └── proyecto-cherokee-ave.html
├── assets/
│   ├── css/
│   │   ├── variables.css         (Reset, @font-face, custom properties)
│   │   └── styles.css            (Todos los estilos)
│   ├── js/
│   │   ├── main.js               (Objeto global Timbo + todos los módulos)
│   │   ├── data.js               (Contenido bilingüe ES/EN centralizado)
│   │   └── charts.js             (Gráficos climáticos SVG)
│   ├── fonts/
│   │   ├── autaut-grotesk/       (Tipografía anterior — conservar por si se reutiliza)
│   │   └── neue-haas-grotesk-display-pro-cufonfonts/  (Tipografía nueva)
│   ├── images/
│   └── interactives/             (Modelos 3D embebidos)
├── netlify/
│   └── functions/
│       └── contact.js            (Serverless function para formulario de contacto)
├── netlify.toml
└── prompts/                      (Prompts usados con Claude Code / Codex)
```

## Convenciones de código

### HTML
- Secciones con comentarios descriptivos `<!-- ====== NOMBRE ====== -->`
- Atributo `data-nav-theme="dark|light"` en cada section para controlar el color del nav
- Atributo `data-i18n="clave.subclave"` para textos bilingües
- Atributo `data-i18n-html="true"` cuando el valor contiene HTML (ej: `<strong>`, `<br>`)
- Clases de animación: `anim-fade-up`, `anim-fade-in`, `anim-wind-in` con `data-anim-delay="ms"`

### CSS
- BEM: `.bloque__elemento--modificador`
- Custom properties en `:root` de `variables.css`
- Todas las secciones de cada página agrupadas con comentarios `/* ========================= NOMBRE ========================= */`
- Mobile-first no: es desktop-first con `@media (max-width: ...)` para responsive

### JS
- Objeto global `Timbo` con módulos que tienen método `init()`
- `Timbo.init()` se llama en `DOMContentLoaded` y ejecuta todos los módulos
- `data.js` exporta `SITE_DATA` con estructura `{ seccion: { es: {...}, en: {...} } }`
- `charts.js` tiene `TimboCharts` con módulos para gráficos climáticos
- SVG nativo para diagramas (no D3, no Chart.js)
- IntersectionObserver para scroll-triggered animations y visibilidad
- `document.createElementNS('http://www.w3.org/2000/svg', ...)` para crear SVG dinámico

## Paleta de colores (variables.css)

### Escala de grises
| Variable | Valor | Uso |
|---|---|---|
| `--color-gray-100` | `#F6F6F6` | Fondo claro principal (`--color-bg-light`) |
| `--color-gray-200` | `#DADADA` | Bordes, separadores |
| `--color-gray-300` | `#9D9D9C` | Texto muted |
| `--color-gray-400` | `#575756` | Texto secundario (`--color-text-muted`) |
| `--color-gray-500` | `#3C3C3B` | Fondo oscuro (`--color-bg-dark`) |
| `--color-black` | `#1D1D1B` | Texto principal (`--color-text-primary`) |

### Acentos
| Variable | Valor |
|---|---|
| `--color-olive` | `#9EA052` |
| `--color-forest` | `#74793E` |
| `--color-earth` | `#6D4D0B` |
| `--color-sky` | `#BCD8ED` |

## Tipografía

### Tipografía activa: Neue Haas Grotesk Display Pro
Migración completada. `--font-primary` apunta a `'Neue Haas Grotesk Display Pro'`. Archivos en `assets/fonts/neue-haas-grotesk-display-pro-cufonfonts/`. La carpeta `autaut-grotesk/` se conserva por si se reutiliza.

Mapeo de pesos:

| Peso CSS | Archivo Neue Haas | Nota |
|---|---|---|
| 400 (Regular) | `NeueHaasDisplayRoman.ttf` | |
| 500 (Medium) | `NeueHaasDisplayMediu.ttf` | Typo en el nombre del archivo (falta "m") |
| 700 (Bold / Semibold) | `NeueHaasDisplayBold.ttf` | Neue Haas no tiene Semibold; `--fw-semibold: 700` |
| 900 (Black) | `NeueHaasDisplayBlack.ttf` | |

### Escala tipográfica actual
```
--text-xs:   0.75rem   (12px)
--text-sm:   0.875rem  (14px)
--text-base: 1.25rem   (20px)
--text-lg:   1.125rem  (18px)
--text-xl:   1.25rem   (20px)
--text-2xl:  1.5rem    (24px)
--text-3xl:  2rem      (32px)
--text-4xl:  2.5rem    (40px)
--text-5xl:  3.5rem    (56px)
--text-6xl:  4.5rem    (72px)
--text-hero: 5rem      (96px)
```

### Pesos usados
```
--fw-regular:  400
--fw-medium:   500
--fw-semibold: 700  (no existe semibold en Neue Haas; usa Bold)
--fw-bold:     700
--fw-black:    900
```

## Espaciado
```
--space-xs:  0.25rem  (4px)
--space-sm:  0.5rem   (8px)
--space-md:  1rem     (16px)
--space-lg:  1.5rem   (24px)
--space-xl:  2rem     (32px)
--space-2xl: 3rem     (48px)
--space-3xl: 4rem     (64px)
--space-4xl: 6rem     (96px)
--space-5xl: 8rem     (128px)
```

## Layout
```
--max-width:     1200px
--nav-height:    60px
--border-radius: 12px
```

## Navegación (header)
- `position: fixed`, `z-index: 100`
- Sin scroll: fondo transparente, color según `data-nav-theme` de la sección activa
- Con scroll (clase `main-nav--scrolled` después de 900px): fondo `#f6f6f6` con fade-in de opacidad, color negro para los navlinks. Sin blur, sin border.
- El threshold de scroll es configurable en `Timbo.navScroll.SCROLL_THRESHOLD` (main.js)

## Páginas — estado actual

### Home (index.html)
- Hero: video de fondo
- Hero tagline con palabras **Arquitectura**, **clima**, **naturaleza** en `<strong>` (fw-bold)
- Intro: dos columnas (texto + fotos), segundo bloque con foto + ícono SVG + texto
- Featured project: imagen full-width (sin animación de expansión)
- Philosophy section
- Footer dinámico renderizado por JS

### Proyectos (proyectos.html)
- Título "Proyectos Seleccionados" en `font-weight: regular`
- Lista de items con hover que ilumina el activo y apaga los demás
- Items con font-size 3rem, padding 0.85rem, CTA a 18px

### Sustentabilidad (sustentabilidad.html)
- Hero con imagen de fondo
- Overview: grid 2 columnas con SVG circular de estrategias (8 puntos)
- Process: modelo 3D interactivo con controles (toggle sol, velocidad)
- Climate: señales climáticas con iconos + gráficos (temp/humedad implementado, otros pendientes)
- Breathe: imagen full-bleed con texto
- Metrics: barras animadas con contadores
- Strategies: SVG circular full-width con 8 estrategias bioclimáticas detalladas
- **Todos los textos en negro** (se cambió recientemente de blanco a negro)
- Color de fondo de las secciones: `#b8b37a` (oliva)

### Sobre Nosotros (sobre-nosotros.html)
- Hero, founders (retratos + bio), approach, final section

### Contacto (contacto.html)
- Hero con imagen de fondo
- Formulario (nombre, email, asunto, mensaje) que envía a Netlify serverless function
- Info lateral (email, Instagram, ubicación)
- La serverless function (`netlify/functions/contact.js`) valida y loguea; tiene instrucciones para conectar Resend/SendGrid

## Módulos JS principales (main.js)
| Módulo | Función |
|---|---|
| `Timbo.i18n` | Detección y cambio de idioma ES/EN |
| `Timbo.navScroll` | Clase `main-nav--scrolled` al pasar threshold |
| `Timbo.navTheme` | Cambio dark/light según sección visible |
| `Timbo.navIntro` | Animación de entrada del nav |
| `Timbo.scrollReveal` | IntersectionObserver para `anim-fade-up`, `anim-fade-in` |
| `Timbo.footer` | Renderiza footer dinámicamente |
| `Timbo.floatingLogo` | Logo flotante con cambio de z-index por fase |
| `Timbo.heroIntro` | Animación de entrada del hero home |
| `Timbo.sustHeroIntro` | Animación de entrada del hero sustentabilidad |
| `Timbo.imageExpand` | Scroll-driven expansion de imagen (actualmente desactivado vía CSS) |
| `Timbo.contactForm` | Envío del formulario vía fetch a Netlify function |
| `Timbo.projectsList` | Renderiza lista de proyectos desde SITE_DATA |

## Gráficos climáticos (charts.js)
| Módulo | Estado |
|---|---|
| `TimboCharts.tempHumidity` | Implementado y funcionando |
| `TimboCharts.solarRadiation` | Prompt generado (PROMPT_8), pendiente de aplicar |
| `TimboCharts.windRose` | Prompt generado (PROMPT_9), pendiente de aplicar |
| `TimboCharts.rainfall` | Prompt generado (PROMPT_10), pendiente de aplicar |

## Notas importantes
- No usar frameworks, bundlers ni librerías externas (excepto JetBrains Mono para código)
- SVG nativo para todos los diagramas y gráficos
- Prompts para Claude Code / Codex se guardan en `prompts/`
- El archivo `data.js` centraliza todo el contenido bilingüe — cualquier texto nuevo debe ir ahí
- Las animaciones usan `is-visible` class toggleada por IntersectionObserver

## ⭐ Migración a sistema bilingüe (ES/EN) — proceso en curso

### Contexto

El sitio tiene un sistema bilingüe (`data-i18n` en el HTML + `SITE_DATA` en `assets/js/data.js` + módulo `Timbo.i18n` en `main.js`), pero **sólo está aplicado parcialmente**: `index.html` y partes de `sustentabilidad.html` usan el sistema; el resto de las páginas (proyectos individuales, `proyectos.html`, `sobre-nosotros.html`, `contacto.html`) tienen el texto **hardcodeado en español** dentro del HTML, sin contrapartida bilingüe.

**Decisión de proceso (mayo 2026):** primero se termina el diseño de todas las páginas en español hardcodeado (más rápido y menos fricción para iterar diseño). Después se migra cada página al sistema `data-i18n` agregando las claves en `data.js` con ES y EN. La traducción al inglés la provee el usuario (Mariano), no se autogenera.

### Orden acordado de migración

1. **Home** (`index.html`) + componentes generales (header/nav, footer).
2. **Proyectos**: `proyectos.html` (listado) y las páginas individuales de cada proyecto (`proyectos/proyecto-*.html`).
3. **Sustentabilidad** (`sustentabilidad.html`).
4. **Sobre Nosotros, Contacto, y limpieza final** — fase posterior.

### Fase 0 — Pre-requisito técnico (una sola vez)

Antes de migrar la primera página, hay que **parchar el `resolve()` de `Timbo.i18n`** en `main.js` para que soporte claves anidadas profundas (más de dos niveles, ej: `projectPages.projects.exuma-lodge.refugeParagraph1`).

Implementación recomendada del patch:

```js
// En main.js, dentro de Timbo.i18n.resolve():
resolve(key, lang) {
  const parts = key.split('.');
  const section = parts.shift();
  let node = SITE_DATA[section]?.[lang];
  for (const part of parts) {
    if (node == null) return key;
    node = node[part];
  }
  return node ?? key;
}
```

Después del patch, verificar que una clave existente (ej: `home.heroTagline`) sigue funcionando antes de seguir.

### Flujo de trabajo por página (ciclo repetible)

Para cada página, el ciclo es:

1. **Inventario.** Claude lee el HTML y devuelve una lista numerada de todos los textos a migrar, en español, en orden de aparición, marcando cuáles **ya existen** en `data.js` y cuáles **no existen** todavía.
2. **Pedidos de traducción al usuario.** Claude pregunta uno por uno (o en tandas chicas de 2-3) los textos que necesita en inglés.
   - Si el texto **no existe** en `data.js`: Claude muestra el español y pide el inglés.
   - Si el texto **ya existe** en `data.js` con su versión en inglés: Claude muestra la versión actual y pregunta si la dejamos o la actualizamos.
3. **Aplicación atómica.** Una vez que Claude tiene el bloque (ES + EN) de la sección:
   - Agrega la clave a `data.js` en `es` y `en` (ambas con la **misma estructura y mismas claves** exactas).
   - Agrega `data-i18n="ruta.completa"` al elemento del HTML.
   - Agrega `data-i18n-html="true"` si el texto contiene HTML inline (`<strong>`, `<br>`, `<br class="br-desktop">`, etc.).
   - **Deja el texto en español como fallback** dentro del elemento (no lo vacía).
4. **Confirmación visual.** Claude avisa qué cambió y le pide al usuario que mire la página con `?lang=es` (debería verse igual que antes) y `?lang=en` (debería cambiar al inglés).
5. **Cierre de página.** Cuando todos los textos de la página están migrados y verificados, se anota la página como completada y se pasa a la siguiente. **Una página a la vez, completa, antes de pasar a la siguiente.**

### Convenciones técnicas para la migración

- **Nombres de claves:** en inglés, `camelCase`. Ej: `refugeParagraph1`, `factClimate`, `overviewTitle`. NO usar `parrafo_refugio_1` ni `refuge-paragraph-1`.
- **Agrupación de claves:**
  - Textos **únicos de una página** van en su propio bloque (ej: `projectPages.projects.exuma-lodge.refugeParagraph1`).
  - Textos **compartidos entre páginas similares** se agrupan arriba para evitar duplicación. Ej: las labels "CLIMA /", "BIOMA /", "TERRENO /" se repiten en todas las páginas de proyecto → van en `projectPages.factLabels.climate`, no en cada proyecto.
- **HTML inline dentro de los valores de `data.js`:**
  - Los `<br>`, `<strong>`, `<span>`, `<br class="br-desktop">`, `<br class="br-mobile">`, etc. **van dentro del valor del string en `data.js`**, no en el HTML.
  - El elemento HTML lleva `data-i18n="..."` + `data-i18n-html="true"`.
  - Ejemplo:
    ```js
    refugeParagraph1: 'Ubicado en el extremo de la península<br class="br-desktop">de Exuma.'
    ```
    ```html
    <p data-i18n="projectPages.projects.exuma-lodge.refugeParagraph1"
       data-i18n-html="true">
      Ubicado en el extremo de la península de Exuma.
    </p>
    ```
- **Fallback:** el texto en español queda dentro del elemento como respaldo por si JS falla o tarda en cargar. No se vacía.
- **Consistencia `es` / `en`:** las claves deben ser **idénticas** en ambos bloques. Si en `es` se llama `refugeParagraph1`, en `en` también. Estrategia segura: copiar y pegar el bloque entero y editar sólo los valores.
- **Limpieza al final:** cuando una página se migra y se reemplazan claves viejas (ej: `description1` y `description2` genéricas de `projectPages.projects.exuma-lodge`), las claves viejas no usadas se borran de `data.js` para evitar deuda. Esto se hace en la fase de limpieza final, no a medida.

### Trampas comunes que pueden aparecer

- **Olvidarse `data-i18n-html="true"`** cuando el texto tiene HTML inline → se muestra el HTML como texto plano (ej: `<strong>palabra</strong>`).
- **Claves desalineadas entre `es` y `en`** → el inglés nunca se muestra para ese texto (cae al fallback en español).
- **Espacios o saltos de línea sobrantes** al copiar del HTML a `data.js` → se cuelan en la versión renderizada.
- **Tocar el HTML y olvidarse del fallback** → si el español en `data.js` cambia, el fallback queda viejo. Mantenerlos sincronizados.
- **`<br>` responsive en distintos lugares por idioma:** el largo del inglés vs español puede hacer que un `<br class="br-desktop">` caiga mal. Si pasa, se resuelve definiendo dos valores distintos en `data.js` (uno para cada idioma) — no se duplica HTML.

### Estado de migración (actualizar a medida que se avanza)

- [x] Fase 0 — Patch a `Timbo.i18n.resolve()` para claves anidadas profundas.
- [x] Home (`index.html`) — textos del contenido principal migrados.
- [x] Nav del header — migrado en las 16 páginas del sitio (incluida la plantilla `prompts/proyecto-_TEMPLATE.html`). Fallback uniformado a español. Clave nueva `nav.services` agregada.
- [ ] `proyectos.html` (listado).
- [ ] `proyectos/proyecto-exuma-lodge.html`.
- [ ] `proyectos/proyecto-haras-san-pablo.html`.
- [ ] `proyectos/proyecto-tobar-lodge.html`.
- [ ] `proyectos/proyecto-cabana-suinda.html`.
- [ ] `proyectos/proyecto-cherokee-ave.html`.
- [ ] `sustentabilidad.html` — hero migrado (título + texto + SVG bilingüe ES/EN); pendiente: resto de las secciones (process, climate, breathe, metrics, strategies).
- [x] `servicios.html` — listado de 6 servicios migrado (`services.items[]` en `data.js` con array de strings ES/EN).
- [ ] `sobre-nosotros.html`.
- [ ] `contacto.html`.
- [ ] Limpieza final de `data.js` (borrar claves no usadas, ordenar).

### Registro de avances detallado

Esta sección documenta **qué se hizo concretamente en cada hito**, para que cualquier sesión futura tenga la foto completa del estado del trabajo y pueda continuar sin pisar nada.

#### Fase 0 — Patch a `Timbo.i18n.resolve()` (completado)

**Archivo tocado:** `assets/js/main.js`, función `Timbo.i18n.resolve()`.

**Qué cambió:** la función pasó de soportar sólo claves de dos niveles (`section.field`) a soportar claves de cualquier profundidad (ej: `projectPages.projects.exuma-lodge.refugeParagraph1`). El primer segmento sigue siendo la sección, después se inserta `[lang]`, y desde ahí baja por el resto del path con un `for`. Devuelve `undefined` si en algún nivel no encuentra el valor (mismo comportamiento que antes ante claves rotas, lo que asegura que el resto de `apply()` siga funcionando igual).

**Verificación post-patch:** se confirmó que claves de dos niveles (ej: `home.heroTagline`) siguen resolviendo igual que antes.

#### Home (`index.html`) — textos del contenido principal migrados

**Archivos tocados:**
- `assets/js/data.js` — agregadas claves nuevas + actualizadas traducciones EN existentes.
- `index.html` — agregados `data-i18n` a elementos sin atributo previo; eliminado bloque obsoleto.
- `assets/css/styles.css` — eliminadas reglas CSS huérfanas tras la limpieza del HTML.

**Claves nuevas creadas en `home`:**
- `home.introLabel` — "Lo que hacemos" / "Our practice".
- `home.introText` — párrafo de la sección Intro (descripción del estudio).
- `home.natureDialogueText` — manifiesto sobre la imagen de la sección "Diálogo con la naturaleza".

**Claves EN modificadas (el ES quedó intacto en todas):**
- `home.heroTagline` — EN nuevo: `<strong>Architecture</strong> shaped by<br><strong>climate</strong> and <strong>place</strong>.`
- `home.claim` — EN nuevo (3 renglones via spans, no via `<br>`): "Between the wild" / "and the people" (sin punto final, decisión del usuario).
- `home.sustainabilityStatement` — EN nuevo (pasó de 4 renglones a 3 spans): "Resilient design," / "grounded in climate" / "and place."
- `home.philosophyText` — EN reescrito para reflejar mejor el tono de la marca (texto más descriptivo que el anterior).

**HTML — elementos a los que se les agregó `data-i18n` en esta sesión:**
- `<p class="intro__label">` → `data-i18n="home.introLabel"`.
- `<p class="intro__text">` → `data-i18n="home.introText"`.
- `<p class="nature-dialogue__text">` → `data-i18n="home.natureDialogueText"`.

**Limpieza estructural realizada:**
- Eliminado del HTML el bloque completo `<div class="nature-dialogue__info"><div class="container"><p class="nature-dialogue__description">…</p></div></div>` que estaba dentro de `<section class="nature-dialogue">`. Era un placeholder vacío con `display: none` que ya no tenía propósito.
- Eliminadas del CSS las reglas `.nature-dialogue__info` y `.nature-dialogue__description` (estaban en `styles.css` cerca de la línea 1036). No quedó código residual.

**Pendientes del Home (no resueltos en esta sesión):**
- **Footer:** ya tiene `data-i18n="footer.rights"` y debería cambiar bien con el idioma; verificar visualmente cuando se pase por ahí.

**Sin commits:** todos los cambios están en el working tree. Mariano los commitea manualmente cuando decide.

#### Nav del header — migrado en todas las páginas

**Archivos tocados (16):**
- `index.html`, `proyectos.html`, `sustentabilidad.html`, `servicios.html`, `sobre-nosotros.html`, `contacto.html`.
- `proyectos/proyecto-exuma-lodge.html`, `proyectos/proyecto-haras-san-pablo.html`, `proyectos/proyecto-tobar-lodge.html`, `proyectos/proyecto-cabana-suinda.html`, `proyectos/proyecto-cherokee-ave.html`, `proyectos/proyecto-cardano-clubhouse.html`, `proyectos/proyecto-chacras-de-murray.html`, `proyectos/proyecto-club-de-mar.html`, `proyectos/proyecto-praderas-cabin.html`.
- `prompts/proyecto-_TEMPLATE.html` (plantilla para futuros proyectos).
- `assets/js/data.js` (clave nueva).

**Qué cambió en cada nav:**
- A cada `<a class="nav__link">` se le agregó `data-i18n="nav.xxx"` con la clave correspondiente.
- El texto fallback dentro del `<a>` se unificó a español (Inicio, Proyectos, Sustentabilidad, Servicios, Sobre Nosotros, Contacto). Antes algunas páginas tenían fallback en inglés (Home, Projects, etc.) y otras en español; ahora todas en español, para consistencia con el resto del sitio.
- La clase `nav__link--active` se mantuvo exactamente donde estaba en cada página (señala la página activa).

**Clave nueva en `data.js`:**
- `nav.services` — "Servicios" (ES) / "Services" (EN). El link `Services` aparecía en el nav pero no tenía clave correspondiente.

**Detalle de capitalización:**
- Los valores en `data.js` están en sentence-case (`Inicio`, `Home`, `Sobre Nosotros`, etc.).
- El CSS de `.nav__link` aplica `text-transform: uppercase`, así que en pantalla se ven en MAYÚSCULAS (INICIO, HOME, SOBRE NOSOTROS).
- Convención: el contenido vive en sentence-case, la estilización (uppercase) vive en CSS. No mezclar.

**Verificación visual recomendada:** abrir cualquier página con `?lang=es` (debería mostrar fallback en español) y `?lang=en` (debería cambiar a Home / Projects / Sustainability / Services / About Us / Contact). Repetir en al menos una página de proyecto para confirmar que las rutas con `../` siguen funcionando.

#### Sustentabilidad (`sustentabilidad.html`) — hero migrado

**Archivos tocados:**
- `assets/js/data.js` — claves nuevas `sustainability.heroTitle` y `sustainability.heroText` agregadas en ES + EN.
- `sustentabilidad.html` — `data-i18n` agregados al `<h1>` y al `<p>` del hero. SVG del hero duplicado con clases `--es` / `--en` (patrón bilingüe temporal, ver "Deuda técnica" abajo).
- `assets/css/styles.css` — regla `html[lang="xx"] .sust-hero__visual-img--yy { display: none }` agregada cerca de las utilidades de `.br-desktop` / `.br-mobile`.

**Claves nuevas creadas en `sustainability`:**
- `sustainability.heroTitle` — "Sustentabilidad no es un rótulo ni una etiqueta." (ES, 3 renglones via `<br>`) / "Sustainability is not a label." (EN, 2 renglones via `<br>`).
- `sustainability.heroText` — párrafo del hero con `<br><br>` interno para separar las dos oraciones. ES y EN tienen contenido equivalente.

**Patrón nuevo introducido — SVG bilingüe:** porque el SVG del hero (`hero-drawing.svg` / `hero-drawing-english.svg`) contiene texto incrustado en el archivo, no se puede traducir con `data-i18n` (que sólo toca `textContent`/`innerHTML`, no atributos). Solución temporal: dos `<div>` con clases `--es` / `--en` y CSS que oculta uno según `html[lang]`. Ver "Deuda técnica" para el plan de migración.

**Pendientes de `sustentabilidad.html`:**
- Sección 3 (Proceso / Investigación con gráfico climático).
- Sección 4 (Climate / señales climáticas con iconos + gráficos).
- Sección 5 (Breathe).
- Sección 6 (Metrics / barras animadas con contadores).
- Sección 7 (Strategies / SVG circular de 8 estrategias bioclimáticas).
- Verificar las claves que ya existen en `sustainability` (`title`, `variables[]`, `emissionsChartTitle`, etc.) — pueden estar consumidas por estas secciones; chequear caso por caso al migrarlas.

#### Servicios (`servicios.html`) — listado de servicios migrado

**Archivos tocados:**
- `assets/js/data.js` — nueva sección `services` con array `items[]` de 6 strings en ES + EN.
- `servicios.html` — 6 `<p class="services-directory__title">` con `data-i18n="services.items.N"` y `data-i18n-html="true"` donde corresponde.

**Estructura nueva en `data.js`:**
- `services.es.items[]` y `services.en.items[]` — arrays de 6 strings, mismos índices en ambos idiomas.
- Convención: los textos van en el mismo orden de aparición visual en la página. El índice de la clave (`services.items.0`, `services.items.1`, …) es el orden de aparición.

**Detalle sobre claves con índice de array:** funciona porque `Timbo.i18n.resolve()` (patched en Fase 0) baja por el path con `node[part]`, y en JS `arr["0"]` equivale a `arr[0]`. No hizo falta modificar el motor. Sirve como patrón para otros listados.

**Tabla de mapeo de ítems (orden de aparición = orden del array):**

| Índice | ES | EN | Tiene `<br>`? |
|---|---|---|---|
| 0 | Arquitectura (Anteproyecto y proyecto) | Architecture (Concept & Project Design) | Sí |
| 1 | Supervisión de obra | Construction Supervision | No |
| 2 | Dirección de Obra | Construction Management | No |
| 3 | Consultoría en sustentabilidad y performance | Building Performance & Environmental Consulting | Sí |
| 4 | Evaluación posterior a la ocupación | Post-Occupancy Evaluation | No |
| 5 | Interiorismo | Interior Design | No |

**Capitalización en EN:** todos los ítems en Title Case, coherentes entre sí.

## ⚠️ Deuda técnica pendiente — fase de optimización

Decisiones que se tomaron a propósito durante el desarrollo y que conviene revisar cuando lleguemos a la fase de optimización del sitio. **No son bugs**, son trade-offs explícitos.

### Assets bilingües duplicados (SVG ES/EN)

**Dónde vive:**
- Marcado en HTML como `<!-- BILINGÜE-TEMPORAL: ... -->` arriba del bloque afectado.
- Marcado en CSS como `/* --- BILINGÜE-TEMPORAL: assets duplicados ES/EN --- */` cerca de las utilidades `.br-desktop` / `.br-mobile`.
- Caso conocido hoy: SVG del hero de Sustentabilidad (`.sust-hero__visual-img--es` / `.sust-hero__visual-img--en`).

**Qué pasa hoy:** los dos SVGs (uno por idioma) se descargan siempre. CSS oculta uno con `display: none` según `html[lang]`. Funciona perfecto visualmente, pero hace una descarga extra inútil.

**Por qué se hizo así:** el sistema `data-i18n` actual no maneja atributos (sólo cambia texto interno). Cambiar la ruta de un SVG (`data-svg-src`) requeriría tocar el motor del i18n o el loader del SVG. Decisión: no tocar el motor mientras no hayan varios casos.

**Cuándo migrar:** cuando aparezca el segundo o tercer asset bilingüe, o en la fase de optimización general del sitio.

**Cómo migrar:** dos opciones, elegir según contexto:
1. Extender el loader de `data-svg-src` para que acepte un segundo atributo `data-svg-src-en` y cargue según `Timbo.state.lang`. Cambio acotado al loader, no toca el motor i18n.
2. Extender `Timbo.i18n.apply()` para que, además de `textContent` y `innerHTML`, sepa actualizar atributos arbitrarios (sintaxis tipo `data-i18n-attr="data-svg-src:sustainability.heroSvgPath"`). Más genérico pero más cambio.

**Después de migrar:** borrar todas las reglas `html[lang="xx"] .xxx--yy { display: none }` del CSS y los pares `<div>...--es` / `<div>...--en` del HTML. Reemplazar por un solo elemento por caso.
