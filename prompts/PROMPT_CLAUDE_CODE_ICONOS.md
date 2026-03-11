# Prompt para Claude Code — Reemplazo de íconos del carrusel de valores

## Estrategia

Este es un prompt único y autocontenido. Incluye todo el contexto necesario: la estructura HTML actual, los estilos CSS del carrusel, la referencia visual, y la especificación exacta de los 8 valores con sus íconos.

**Importante:** Adjuntar la imagen de referencia de los íconos junto con este prompt. Claude Code necesita verla para entender la estética.

---

## Prompt

```
[ADJUNTAR LA IMAGEN DE REFERENCIA DE LOS ÍCONOS]

Necesito que reemplaces el contenido del carrusel de valores en el archivo index.html.

## Qué hay que hacer

Dentro de index.html, existe un div con clase `.values-track` que contiene 10 elementos `.value-item`. Cada uno tiene un SVG inline de 60x60px y un <span> con el nombre del valor. Hay que reemplazar esos 10 elementos por los 8 valores correctos que te especifico abajo.

IMPORTANTE: el carrusel funciona con scroll infinito (animación CSS que desplaza el track horizontalmente). Para que el loop sea continuo y sin cortes, el bloque de 8 ítems debe estar DUPLICADO dentro de `.values-track` (es decir, 16 elementos en total: los 8 originales + los 8 repetidos idénticos). Esto es lo que permite que cuando la primera tanda sale por la izquierda, la segunda tanda entre por la derecha sin que se note el salto.

## Los 8 valores (en inglés)

1. **Climatic Zone** — Ícono: un mapa del mundo simplificado (contorno de continentes) con un pin/marcador de ubicación
2. **Sun Path** — Ícono: un domo/semiesfera vista desde arriba con líneas de trayectoria solar (arcos con puntos cardinales N, S, E, O)
3. **Outdoor Temperature** — Ícono: una casa con un termómetro al lado, sol y nieve/estrellas arriba representando variación estacional
4. **Solar Radiation** — Ícono: un sol con rayos y flechas diagonales apuntando hacia abajo sobre unas nubes, indicando energía incidente
5. **Humidity** — Ícono: una gota de agua grande con gotas más pequeñas alrededor y un símbolo de porcentaje adentro
6. **Precipitation** — Ícono: una nube con gotas de lluvia, rayos y copos de nieve cayendo
7. **Wind Patterns** — Ícono: una manga de viento (windsock) sobre un poste, con líneas de viento
8. **Sky Coverage** — Ícono: un cielo con sol parcialmente cubierto por nubes, representando cobertura de cielo nublado/despejado

## Estética de los íconos (CRÍTICO)

Los SVGs deben imitar la estética de la imagen de referencia adjunta. Las características clave son:

- **Estilo hand-drawn / sketch**: los trazos NO deben ser perfectamente rectos ni geométricos. Usá paths con curvas sutilmente irregulares para simular trazo a mano. En vez de <line> o <rect> perfectos, usá <path> con coordenadas ligeramente imprecisas.
- **Un solo color de trazo**: `#1d6396` (azul petróleo). Este color se usa tanto para stroke como para fill cuando corresponda.
- **Stroke-width**: entre 1.5 y 2.5, variando dentro del mismo ícono para dar sensación de presión de pluma variable.
- **Rellenos parciales**: algunos elementos tienen fill sólido con el mismo color (como el pin del mapa, o áreas sombreadas) mientras que otros son solo contorno.
- **Sin fondos**: los SVGs no tienen fondo, son transparentes.
- **Tamaño**: width="60" height="60" viewBox="0 0 60 60"
- **Detalle medio-alto**: son ilustraciones expresivas, no íconos minimalistas. Tienen bastante detalle (como las gotas individuales en la lluvia, o las líneas de viento).
- **No usar text elements**: todo debe ser paths y shapes, nada de <text>.

## Estructura HTML de cada ítem

```html
<div class="value-item">
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- paths del ícono -->
  </svg>
  <span>Nombre del Valor</span>
</div>
```

## CSS existente (no modificar)

La clase `.value-item span` ya define la tipografía del nombre:
- font-family: 'DM Sans'
- font-size: 11px
- text-transform: uppercase
- letter-spacing: 0.15em
- color: var(--color-azul)

Nota: verificá que `--color-azul` exista en variables.css. Si no existe, agregalo con valor `#1d6396`.

## Archivo a modificar

- `index.html`: reemplazar todo el contenido de `.values-track` (borrar los 10 value-items existentes, poner los 8 nuevos duplicados = 16 total)
- `assets/css/variables.css`: agregar `--color-azul` si no existe

No modificar styles.css ni main.js.
```

---

## Notas para vos (Mariano)

- Este prompt es autocontenido — no necesitás darle contexto extra a Claude Code sobre el proyecto.
- Acordate de adjuntar la imagen de referencia de los íconos cuando le des el prompt.
- Si los SVGs hand-drawn no te convencen en la primera pasada, podés pedirle "hacé los trazos más irregulares" o "agregá más detalle al ícono de [nombre]" como follow-up.
- Si querés que ajuste el color, el número está en un solo lugar: `#1d6396`.
