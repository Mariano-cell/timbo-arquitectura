# Estandarización tipográfica del sitio — handoff

> **Para qué sirve este documento**: aplicar el sistema responsivo definido en `.intro__claim` y `.intro__text` (sección home) al resto del sitio, manteniendo proporciones coherentes entre 769px y 1920px.
> **Estado**: la sección `.intro` ya está calibrada y validada en 1280×720, 1440×900, 1512×770 y 1920×1080. Es la **referencia visual** para todo lo demás.
> **Archivos involucrados**: `assets/css/variables.css`, `assets/css/styles.css`.

---

## 1. Filosofía del sistema

El proyecto es **desktop-first**. La consigna del diseño es:

- **De 769px a ~1920px**: el contenido escala fluidamente sin cambios bruscos. Las proporciones entre texto, columnas, padding y márgenes se mantienen coherentes.
- **Por encima de 1538px**: el container topea en 1200px y deja respirar margen exterior. Pantallas grandes (1920+) por ahora se aceptan "abandonadas" — no hay que romper las vistas medianas para mejorarlas.
- **Por debajo de 769px**: layout colapsa a una columna. No es foco de este documento.

Las dos referencias canónicas son:

- **`.intro__claim`** → patrón para títulos de sección
- **`.intro__text`** → patrón para párrafos / cuerpos de texto

---

## 2. Variables globales (definidas en `variables.css`)

```css
/* Container fluido */
--max-width: clamp(60rem, 78vw, 75rem);
/*  ≤1230px → 960px (mín)
    1280px  → 998px
    1440px  → 1123px
    1512px  → 1180px
    ≥1538px → 1200px (tope) */

/* Padding lateral global de página
   Aplicado en .container, .main-nav y .floating-logo */
--page-side-padding: clamp(1rem, 1.3vw + 0.3rem, 2.8rem);
/*  ≤1024px → 16px (mín)
    1280px  → ~22px
    1440px  → ~28px
    1512px  → ~32px
    1920px  → ~40px
    ≥2000px → 45px (tope) */
```

**Importante**: estas tres clases (`.container`, `.main-nav`, `.floating-logo`) deben respetar `--page-side-padding`. Garantiza que el nav, el logo flotante y el contenido siempre estén alineados verticalmente con el mismo margen al borde izquierdo.

---

## 3. Patrones tipográficos (los moldes a copiar)

### 3.1 Patrón "título" — basado en `.intro__claim`

```css
.NUEVA-CLASE {
  font-size: clamp(1.875rem, 1.7vw + 0.85rem, 2.75rem);
  font-weight: var(--fw-medium, 500);  /* o --fw-bold si requiere más peso */
  line-height: 1.1;
  max-width: 22ch;
  color: var(--color-black);
  letter-spacing: 0.04em;
}
```

**Curva resultante**:
| Viewport | Tamaño |
|---|---|
| 1024px | 32px |
| 1280px | 36px |
| 1440px | ~39.5px |
| 1512px | ~40.5px |
| 1920px | 44px (tope) |

**Cuándo usarlo**: títulos de sección de tamaño "principal" (h2 grande). Equivalente al "Entre lo salvaje y las personas" de la home.

**Variaciones permitidas**:
- `font-weight: var(--fw-bold)` si el título necesita más impacto.
- `max-width` ajustado a la cantidad de texto: 22ch funciona para títulos de 4-7 palabras. Para títulos más largos, subir a 28-32ch.
- **No tocar** la fórmula del `clamp()` ni el `letter-spacing`. Esa es la "voz tipográfica" del sistema.

---

### 3.2 Patrón "párrafo" — basado en `.intro__text`

```css
.NUEVA-CLASE {
  font-size: clamp(1.125rem, 0.4vw + 1rem, 1.375rem);
  font-weight: var(--fw-regular);
  line-height: 1.7;
  color: var(--color-black);
  max-width: 50ch;
  letter-spacing: 0.03em;
}
```

**Curva resultante**:
| Viewport | Tamaño |
|---|---|
| 1024px | 18px |
| 1280px | ~21.1px |
| 1440px | ~21.8px |
| 1512px | 22px (tope) |
| 1920px | 22px (tope) |

**Cuándo usarlo**: cualquier párrafo de cuerpo, descripción, bio, texto explicativo.

**Variaciones permitidas**:
- `max-width: 60ch` o `65ch` si la columna lo justifica (más cómodo de leer en bloques largos).
- `max-width: 40ch` si querés un bloque compacto/poético.
- **No tocar** la fórmula del `clamp()`, el `line-height`, ni el `letter-spacing`. Esa es la "voz" del cuerpo de texto.

---

### 3.3 Patrón "etiqueta" / "label" (ya existente en `.intro__label`)

```css
.NUEVA-CLASE {
  font-size: var(--text-sm, 0.975rem);   /* 15.6px */
  font-weight: var(--fw-regular);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-black);  /* o rgba(0,0,0,0.924) si se quiere atenuar levemente */
}
```

**Cuándo usarlo**: kicker, eyebrow, micro-titulares antes del título principal ("Lo que hacemos", "Nuestros proyectos", etc.).

**Por ahora `.intro__label` es fijo (no fluido)** porque es un texto chico que no se beneficia de escalado. Si se quiere migrar a fluido más adelante, usar `clamp(0.9rem, 0.2vw + 0.85rem, 1.05rem)`.

---

## 4. Reglas para layouts de sección

Cualquier sección de "texto + media" (texto + foto, texto + video, etc.) que se parezca a `.intro` debería seguir estos lineamientos:

### 4.1 Container

```html
<section class="seccion" data-nav-theme="light|dark">
  <div class="container seccion__container">
    <!-- contenido -->
  </div>
</section>
```

El `.container` ya tiene `max-width: var(--max-width)` y `padding: 0 var(--page-side-padding)`. **No hay que volver a definir esos valores en cada sección.**

### 4.2 Grid de 2 columnas (texto + media)

Si la sección tiene texto a un lado y media al otro:

```css
.seccion__container {
  display: grid;
  grid-template-columns: 2fr 3fr;  /* 40% texto / 60% media */
  gap: clamp(1rem, 1.6vw, 2rem);
  align-items: start;
}
```

Ajustes según el caso:
- `2fr 3fr` (40/60) → texto cómodo, media dominante. Es el ratio actual de `.intro`.
- `1fr 1fr` (50/50) → texto y media equilibrados.
- `3fr 2fr` (60/40) → texto dominante, media acompañando.

### 4.3 Breakpoint de colapso

```css
@media (max-width: 768px) {
  .seccion__container {
    grid-template-columns: 1fr;
  }
}
```

768px es el corte estándar acordado para "abandonar" desktop y pasar a mobile/tablet vertical.

### 4.4 Overflow para animaciones

Si la sección tiene animaciones que desplazan elementos con `transform: translateX/Y`, agregar:

```css
.seccion {
  overflow-x: clip;
}
```

Esto evita que las animaciones generen scroll horizontal en el viewport. **Solo aplicar si la sección tiene transforms que pueden salirse del bloque.**

### 4.5 Padding vertical

`.intro` usa `padding: var(--space-5xl) 0` (128px arriba/abajo). Esto es **fijo**, no fluido. Si querés que respire en pantallas grandes y se compacte en chicas:

```css
.seccion {
  padding: clamp(4rem, 8vw, 8rem) 0;
}
```

Esto es **opcional** y a evaluar caso por caso. No es prioritario migrar el padding vertical de todas las secciones.

---

## 5. Plan de aplicación sugerido

Las páginas y secciones a estandarizar (según `CLAUDE.md`):

1. **`index.html` (home)** — `.intro` ya está hecho. Falta:
   - `.featured-project` (sección del proyecto destacado)
   - `.philosophy` (sección filosofía)
   - Hero tagline

2. **`proyectos.html`** — título principal, items de la lista, CTA.
3. **`sustentabilidad.html`** — overview, process, climate signals, breathe, metrics, strategies. Es la página con más texto, mucho que estandarizar.
4. **`sobre-nosotros.html`** — hero, founders bios, approach.
5. **`contacto.html`** — hero, form labels, info lateral.
6. **`proyectos/proyecto-*.html`** — páginas individuales de proyecto (5 archivos).

**Orden recomendado**: arrancar por la home (las secciones que faltan), después `sobre-nosotros` (es texto-pesado), después `sustentabilidad`, y al final las páginas de proyecto.

### Para cada sección a estandarizar

1. Identificar qué clases corresponden a "título" y cuáles a "párrafo".
2. Reemplazar sus `font-size`, `line-height`, `max-width`, `letter-spacing`, `color` por los patrones de la sección 3.
3. Si el layout es de 2 columnas (texto + media), aplicar las reglas de la sección 4.
4. **No tocar** el `--max-width` global, el `--page-side-padding` global, ni inventar nuevos `clamp()` sin justificación. Reusar los patrones ya definidos.
5. Validar visualmente en 1280×720, 1440×900, 1512×770 y 1920×1080.

---

## 6. Cosas que NO hay que hacer

- **No crear nuevos `clamp()` arbitrarios** para cada elemento. La idea es reusar 2-3 patrones bien definidos, no inventar 20 escalas distintas.
- **No reintroducir `font-size: var(--text-Xxl)` fijos** para títulos o párrafos. Esos tokens están bien para casos puntuales (labels, micro-textos), pero no para los textos principales.
- **No tocar `--page-side-padding` ni `--max-width`** sin discutir el impacto. Cualquier cambio afecta toda la página.
- **No agregar `@media queries` discretos** para tipografía. Toda la tipografía se maneja con `clamp()`. Los `@media` son solo para reorganizar layout (ej: 2 columnas → 1 columna a 768px).
- **No tocar `.intro` ni sus variables**. Esa sección es la referencia validada. Solo modificarla si surge un problema confirmado.

---

## 7. Pendientes anotados (para resolver más adelante)

- **Animación de `.intro__photo--wide` y `.intro__photo--narrow`**: el `translateX` de la foto wide (`clamp(6.5rem, 14vw, 11rem)`) hace que la foto se corte por el `overflow-x: clip` a 1280px en su posición final. No es crítico (la página no desborda), pero la imagen no se ve completa. Recalibrar el `clamp` del shift end y start a valores más conservadores.
- **Pantallas ≥1920px**: hoy el container topea en 1200px y queda mucho aire vacío a los lados. La sensación es que el contenido "flota" en pantallas grandes. **Decisión actual**: dejarlo así. Reevaluar cuando todo el sistema esté armado para ver el conjunto.
- **Variables tipográficas inconsistentes** en `variables.css`:
  - `--text-base` (1.25rem = 20px) y `--text-xl` (1.25rem = 20px) son idénticos.
  - `--text-lg` (1.125rem = 18px) es **menor** que `--text-base` (20px).
  - El comentario de `--text-base` dice "16px" pero el valor es 20px.
  - **No urgente** porque los tokens fijos se están reemplazando por `clamp()`. Pero si se mantienen los tokens, conviene corregirlos.

---

## 8. Cómo arrancar el próximo chat

Sugerencia de prompt inicial:

> "Quiero estandarizar la tipografía y layout del resto del sitio Timbó Arquitectura usando el sistema definido en `.intro__claim` y `.intro__text`. Leé `prompts/PROMPT_ESTANDARIZACION_TIPOGRAFICA.md` para el contexto completo. Empecemos por [SECCIÓN ELEGIDA]. Antes de tocar nada, mostrame qué clases corresponden a 'título' y cuáles a 'párrafo' en esa sección, y proponeme cómo aplicar los patrones."

---

## 9. Snapshot del estado actual de `.intro` (referencia)

```css
/* En variables.css */
--max-width: clamp(60rem, 78vw, 75rem);
--page-side-padding: clamp(1rem, 1.3vw + 0.3rem, 2.8rem);

/* En styles.css */
.intro {
  padding: var(--space-5xl) 0;
  background-color: var(--color-bg-light);
  overflow-x: clip;
}

.intro__container {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: clamp(1rem, 1.6vw, 2rem);
  align-items: start;
  margin-top: 6rem;
}

.intro__claim {
  font-size: clamp(1.875rem, 1.7vw + 0.85rem, 2.75rem);
  font-weight: var(--fw-medium, 500);
  line-height: 1.1;
  max-width: 22ch;
  color: var(--color-black);
  letter-spacing: 0.04em;
}

.intro__text {
  font-size: clamp(1.125rem, 0.4vw + 1rem, 1.375rem);
  font-weight: var(--fw-regular);
  line-height: 1.7;
  color: var(--color-black);
  max-width: 50ch;
  letter-spacing: 0.03em;
}

@media (max-width: 768px) {
  .intro__container { grid-template-columns: 1fr; }
}
```

Estos son los valores exactos que hay que replicar (con las variaciones permitidas en la sección 3) en el resto del sitio.
