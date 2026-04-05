# PROMPT 15 — Rehacer diagrama de estrategias en sustentabilidad.html

## Contexto del proyecto
Proyecto: Timbó Arquitectura — sitio web estático.
Stack: HTML + CSS + JS vanilla. Sin frameworks, sin bundler.
Convenciones: BEM, CSS custom properties en `variables.css`.
Archivos a modificar: `sustentabilidad.html`, `assets/css/styles.css`.

---

## Objetivo

**Eliminar completamente** el diagrama actual (`.sust-overview__diagram` y todos sus hijos) y **reemplazarlo por un SVG nativo** que dibuja lo mismo: un círculo con 8 puntos cardinales y labels, un glow central difuso, y la palabra "ESTRATEGIAS" en el centro.

El resultado final debe verse exactamente como el diseño de referencia: fondo verde oliva (`#b8b37a`), anillo blanco fino, puntos blancos con borde, labels en blanco, glow central verde más oscuro difuso.

---

## Paso 1: Cambios en `sustentabilidad.html`

### Eliminar el div `.sust-overview__diagram` completo (líneas 42–86 aprox.)

Reemplazar todo ese bloque por un SVG inline:

```html
<svg class="sust-overview__diagram-svg" viewBox="0 0 600 600" aria-label="Estrategias bioclimáticas">
  <defs>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="35%">
      <stop offset="0%" stop-color="rgba(80,82,30,0.45)" />
      <stop offset="50%" stop-color="rgba(80,82,30,0.15)" />
      <stop offset="100%" stop-color="rgba(80,82,30,0)" />
    </radialGradient>
  </defs>

  <!-- Glow central -->
  <circle cx="300" cy="300" r="200" fill="url(#glowGrad)" />

  <!-- Anillo -->
  <circle cx="300" cy="300" r="210" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1" />

  <!-- Label central -->
  <text x="300" y="310" text-anchor="middle" font-size="38" font-weight="400" letter-spacing="-0.02em" fill="rgba(255,255,255,0.96)" font-family="'Autaut Grotesk', sans-serif">ESTRATEGIAS</text>

  <!-- 8 puntos con labels -->
  <!-- Distribución: 0°=top, cada 45° en sentido horario -->
  <!-- Punto = circle blanco con borde, label = text -->

  <!-- 1. ALBEDO — top (0°) -->
  <circle cx="300" cy="90" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.92)" stroke-width="2" />
  <text x="300" y="68" text-anchor="middle" font-size="13" font-weight="400" fill="rgba(255,255,255,0.98)" font-family="'Autaut Grotesk', sans-serif">ALBEDO</text>

  <!-- 2. ORIENTACIÓN CORRECTA — top-right (45°) -->
  <circle cx="449" cy="151" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.92)" stroke-width="2" />
  <text x="470" y="142" text-anchor="start" font-size="13" font-weight="400" fill="rgba(255,255,255,0.98)" font-family="'Autaut Grotesk', sans-serif">
    <tspan x="470" dy="0">ORIENTACIÓN</tspan>
    <tspan x="470" dy="16">CORRECTA</tspan>
  </text>

  <!-- 3. TRANSMITANCIA TÉRMICA — right (90°) -->
  <circle cx="510" cy="300" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.92)" stroke-width="2" />
  <text x="530" y="290" text-anchor="start" font-size="13" font-weight="400" fill="rgba(255,255,255,0.98)" font-family="'Autaut Grotesk', sans-serif">
    <tspan x="530" dy="0">TRANSMITANCIA</tspan>
    <tspan x="530" dy="16">TÉRMICA DE LA</tspan>
    <tspan x="530" dy="16">ENVOLVENTE</tspan>
  </text>

  <!-- 4. MASA TÉRMICA — bottom-right (135°) -->
  <circle cx="449" cy="449" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.92)" stroke-width="2" />
  <text x="470" y="445" text-anchor="start" font-size="13" font-weight="400" fill="rgba(255,255,255,0.98)" font-family="'Autaut Grotesk', sans-serif">
    <tspan x="470" dy="0">MASA</tspan>
    <tspan x="470" dy="16">TÉRMICA</tspan>
  </text>

  <!-- 5. PROPORCIÓN VIDRIADA — bottom (180°) -->
  <circle cx="300" cy="510" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.92)" stroke-width="2" />
  <text x="300" y="540" text-anchor="middle" font-size="13" font-weight="400" fill="rgba(255,255,255,0.98)" font-family="'Autaut Grotesk', sans-serif">
    <tspan x="300" dy="0">PROPORCIÓN</tspan>
    <tspan x="300" dy="16">VIDRIADA</tspan>
  </text>

  <!-- 6. PROTECCIÓN SOLAR — bottom-left (225°) -->
  <circle cx="151" cy="449" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.92)" stroke-width="2" />
  <text x="131" y="445" text-anchor="end" font-size="13" font-weight="400" fill="rgba(255,255,255,0.98)" font-family="'Autaut Grotesk', sans-serif">
    <tspan x="131" dy="0">PROTECCIÓN</tspan>
    <tspan x="131" dy="16">SOLAR</tspan>
  </text>

  <!-- 7. VENTILACIÓN NATURAL Y NOCTURNA — left (270°) -->
  <circle cx="90" cy="300" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.92)" stroke-width="2" />
  <text x="70" y="284" text-anchor="end" font-size="13" font-weight="400" fill="rgba(255,255,255,0.98)" font-family="'Autaut Grotesk', sans-serif">
    <tspan x="70" dy="0">VENTILACIÓN</tspan>
    <tspan x="70" dy="16">NATURAL</tspan>
    <tspan x="70" dy="16">Y NOCTURNA</tspan>
  </text>

  <!-- 8. CUBIERTAS VERDES — top-left (315°) -->
  <circle cx="151" cy="151" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.92)" stroke-width="2" />
  <text x="131" y="142" text-anchor="end" font-size="13" font-weight="400" fill="rgba(255,255,255,0.98)" font-family="'Autaut Grotesk', sans-serif">
    <tspan x="131" dy="0">CUBIERTAS</tspan>
    <tspan x="131" dy="16">VERDES</tspan>
  </text>
</svg>
```

---

## Paso 2: Cambios en `assets/css/styles.css`

### Eliminar TODAS las reglas del diagrama viejo:

Eliminar desde `.sust-overview__diagram {` hasta `.sust-overview__point-label {` inclusive (todas las reglas que empiezan con `.sust-overview__diagram`, `.sust-overview__ring`, `.sust-overview__glow`, `.sust-overview__center-label`, `.sust-overview__point`).

También eliminar las reglas responsive del diagrama dentro de los media queries existentes (`.sust-overview__diagram` y `.sust-overview__point-label` dentro de `@media (max-width: 768px)`).

### Agregar en su lugar:

```css
/* Diagrama SVG de estrategias */
.sust-overview__diagram-svg {
  width: min(100%, 600px);
  height: auto;
  margin: 0 auto;
  display: block;
  overflow: visible;
}

@media (max-width: 768px) {
  .sust-overview__diagram-svg {
    width: min(100%, 420px);
  }

  .sust-overview__diagram-svg text {
    font-size: 11px;
  }
}
```

---

## Verificación esperada

1. El diagrama se ve como un círculo con 8 puntos blancos distribuidos uniformemente.
2. Cada punto tiene un label en mayúsculas: ALBEDO (arriba), ORIENTACIÓN CORRECTA (arriba-derecha), TRANSMITANCIA TÉRMICA (derecha), MASA TÉRMICA (abajo-derecha), PROPORCIÓN VIDRIADA (abajo), PROTECCIÓN SOLAR (abajo-izquierda), VENTILACIÓN NATURAL Y NOCTURNA (izquierda), CUBIERTAS VERDES (arriba-izquierda).
3. Los labels de la derecha están alineados a la izquierda del punto; los de la izquierda alineados a la derecha del punto.
4. En el centro hay un glow difuso verde oscuro y la palabra "ESTRATEGIAS".
5. El fondo verde oliva de la sección se mantiene (`#b8b37a`).
6. El texto de la columna izquierda (título + párrafos) no se modifica.
7. El diagrama escala correctamente en mobile.
8. No hay errores en consola.
9. No quedan reglas CSS huérfanas del diagrama viejo.
