# Prompt para Claude Code / Codex — Rediseño Exuma Lodge (Paso 1: Arquitectura General)

## Contexto del proyecto

Sitio web Timbó Arquitectura. Stack: vanilla HTML/CSS/JS, sin frameworks, sin bundler.
Ver `prompts/CONTEXTO_PROYECTO.md` para arquitectura completa.

**RESTRICCIÓN CRÍTICA — EL MAPA NO SE TOCA.**
El componente `<div class="project-map" data-map-sequence>` y todo su JS asociado (`Timbo.projectMap` en `main.js`) deben quedar exactamente como están. No mover, no re-estilizar, no tocar nada de ese bloque. La única tarea con el mapa es integrarlo en su posición natural dentro del nuevo layout.

---

## Objetivo de este paso

Rediseñar la estructura HTML de `proyectos/proyecto-exuma-lodge.html` para comunicar la siguiente información del proyecto, distribuida en secciones bien pensadas. El diseño debe ser **visualmente liviano**: mucho espacio, ritmo, tipografía que respira. Los textos descriptivos están provistos abajo. Los slots de imágenes se marcan como placeholders; al final Claude Code debe listar exactamente cuántas imágenes se necesitan, con qué nombre guardarlas y en qué carpeta.

---

## Información a presentar

### Datos del proyecto (ya en `data.js`, mantenerlos)
- Nombre: **Exuma Lodge**
- Ubicación: **Bahamas** — 23°58'02"N, 77°31'30"W
- Tipología: **Hospitality Lodge**
- Estado: **En desarrollo**

### Datos climáticos (nuevos, extraídos del PDF de análisis)
Clasificación Köppen: **Tropical Savanna (Aw – Dry Season)**

**Temperatura:**
- Rango anual: 21°C (mín. invierno) — 30°C (máx. verano)
- Humedad relativa: 70% en temporada seca / 79% en temporada húmeda
- Temperatura de bulbo seco mayoritaria: 22–28°C

**Radiación solar:**
- Pico de energía global horizontal: **862 Wh/m²** (mayo–jun)
- Mínimo invierno: ~300 Wh/m²

**Lluvias:**
- Temporada húmeda (RA+): abril–septiembre, pico ~109 cm
- Temporada seca (RA–): octubre–marzo, mínimo ~3 cm (noviembre)

**Viento:**
- Velocidad media: 4–6 m/s todo el año
- Dirección dominante: Norte / Noroeste (invierno), Este / Sureste (verano)
- Velocidad meteorológica promedio: **5.29 m/s** (terreno suburbano, Andros)

**Trayectoria solar:**
- El sol pasa cerca del cénit en verano (lat. ~24°N, próximo al Trópico de Cáncer)
- Junio: sale NE, se pone NO (días largos)
- Diciembre: sale SE, se pone SO (días cortos)
- La fachada norte recibe sol en verano — la fachada sur recibe sol en invierno

**Cobertura de cielo:**
- Alta nubosidad durante la temporada húmeda
- Cielos más despejados en temporada seca (especialmente noviembre–febrero)

---

## Estructura de secciones propuesta

Reorganizar el HTML en las siguientes secciones, en este orden:

### 1. Hero
- Imagen grande a ancho completo (placeholder)
- Fade-in al cargar (ya existe, mantener)

### 2. Header del proyecto
- Nombre del proyecto, ubicación, tipología, estado
- (ya existe como `.project-detail__header` + `.project-detail__meta`, mantener estructura y clases BEM, refinar si hace falta)

### 3. Descripción narrativa
- Dos párrafos de texto (ya existen en `data.js` como `description1` y `description2`)
- Layout limpio, sin columnas forzadas, texto que respira

### 4. Galería de imágenes
- Grid de 3 imágenes (landscape, portrait, landscape) o variante que se vea bien
- Placeholders con clase `.project-gallery__img` y `data-placeholder="gallery-1"` etc.
- Sin lightbox por ahora, simples `<img>` con `object-fit: cover`

### 5. Clima del sitio — sección introductoria
- Título de sección: "Clima · Bahamas" (o variante limpia)
- Texto introductorio corto (generarlo): 2–3 oraciones que contextualizan el clima tropical de Bahamas y su relación con las decisiones de diseño del lodge
- A continuación, una fila de **4 datos climáticos clave** como "stat cards" minimalistas:
  - Clasificación: Tropical Savanna (Aw)
  - Temperatura media: 21–30 °C
  - Humedad media: 70–79%
  - Viento promedio: 5.29 m/s
- Estas stat cards son solo texto + valor grande + etiqueta pequeña. Sin gráficos todavía (los gráficos interactivos van en el siguiente paso). No agregar librerías ni SVG complejos aquí.

### 6. Mapa interactivo
- Aquí va el componente del mapa existente (`<div class="project-map" data-map-sequence>`)
- No modificar nada adentro, solo ubicarlo correctamente en el flujo de la página

### 7. Estrategias de diseño (nueva sección)
- Título: "Estrategias de diseño" / "Design Strategies"
- 3 estrategias clave derivadas del análisis climático, presentadas como ítem con título corto + una oración:
  1. **Ventilación cruzada** — La orientación de los volúmenes capitaliza los vientos del E/SE para favorecer ventilación natural permanente.
  2. **Protección solar** — Voladizos y galerías profundas bloquean la radiación de alta intensidad del verano, permitiendo entrada de luz difusa.
  3. **Gestión hídrica** — La alta pluviometría de la temporada húmeda (hasta 109 cm) se integra al diseño como recurso, con captación en cubierta y drenaje controlado.
- Layout: fila de 3 tarjetas, o lista vertical si resulta más limpia

### 8. Slot para imágenes adicionales / planos
- 2 slots para planos o renders (placeholder)
- Clase `.project-plans__img`, `data-placeholder="plan-1"` y `data-placeholder="plan-2"`

### 9. Footer
- Mantener el `<footer id="main-footer">` existente

---

## Instrucciones de implementación

### HTML — `proyectos/proyecto-exuma-lodge.html`
- Reescribir la estructura completa dentro de `<main class="page-content">` siguiendo las secciones descritas arriba
- Mantener el sistema `data-i18n` para todos los textos que ya existen en `data.js`
- Los textos **nuevos** (intro climática, estrategias) pueden ir hardcodeados en esta iteración — los pasaremos a `data.js` en una iteración posterior
- Mantener `data-project-slug="exuma-lodge"` en la sección raíz
- No agregar librerías nuevas

### CSS — `assets/css/styles.css`
- Agregar los estilos necesarios para las secciones nuevas (`.project-climate`, `.project-climate__stats`, `.project-strategies`, `.project-gallery`, `.project-plans`)
- Las stat cards deben ser minimalistas: valor grande en tipografía del sistema, etiqueta pequeña en uppercase con letter-spacing
- El fondo de la página es `var(--color-crema)` (`#f0ebe3`) — todo lo que se agregue debe funcionar sobre ese fondo
- Espaciado generoso entre secciones: mínimo `8rem` de padding vertical por sección
- No usar `background-color` distinto de crema en ninguna sección, a menos que sea un contraste muy sutil (ej. blanco roto o un tono más claro de crema)

### Al finalizar — Claude Code debe imprimir en consola:
Un listado con exactamente cuántas imágenes se necesitan, con:
- Nombre de archivo sugerido (ej. `exuma_gallery_01.jpg`)
- Carpeta donde guardarlas (ej. `assets/images/projects/exuma-lodge/`)
- Dimensiones recomendadas y orientación (landscape / portrait / square)
- A qué placeholder corresponde

---

## Archivos a modificar

- `proyectos/proyecto-exuma-lodge.html`
- `assets/css/styles.css`

## Archivos que NO hay que modificar

- `assets/js/main.js`
- `assets/js/data.js`
- `assets/css/variables.css`
- Cualquier otro archivo HTML de proyecto

---

## Verificación

1. Abrir `proyectos/proyecto-exuma-lodge.html` en el browser
2. La página carga con fondo crema, sin fondo negro ni errores de contraste
3. El mapa carga y reproduce la animación normalmente (sin cambios)
4. Las secciones se leen con claridad, hay respiro entre ellas
5. Los placeholders de imagen se ven como cajas con dimensiones definidas (usar `background: #e0dbd3; aspect-ratio: 16/9` o similar)
6. Sin errores en consola JS
7. Claude Code imprime el listado de imágenes necesarias
