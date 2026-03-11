# Prompt para Claude Code — Animación de óvalo hand-drawn en el .intro__link

## Contexto

El sitio ya tiene un sistema de animación de trazo SVG hand-drawn funcionando para el hover de los nav links (`Timbo.navLinkUnderline`) y para subrayar una frase en el texto intro (`Timbo.introPhraseUnderline`). Ambos usan el mismo patrón:

- Un SVG se inyecta en el DOM via JS
- El path tiene `stroke-dasharray` y `stroke-dashoffset` en CSS
- Al activarse, una animación CSS lleva `stroke-dashoffset` a 0, dibujando el trazo
- El SVG usa `stroke: currentColor` para heredar el color del elemento padre

## Lo que hay que hacer

Aplicar ese mismo sistema de animación al `.intro__link` (el botón "See more" / "Ver más" de la sección intro del home), pero en lugar de un subrayado, usar un **óvalo que engloba el texto del link**.

El óvalo fue dibujado a mano en Excalidraw. El archivo está en `assets/images/svg/ovalo_001.svg`. **No usar ese archivo directamente** — extraer el path y construir el SVG dinámicamente en JS, igual que hacen `navLinkUnderline` e `introPhraseUnderline`.

## El path del óvalo

Del archivo `assets/images/svg/ovalo_001.svg`, el path relevante (ya limpio y simplificado para uso como stroke) es el contorno exterior del óvalo. El SVG original de Excalidraw usa `fill` en lugar de `stroke`, así que hay que adaptarlo.

**Estrategia de adaptación**: En lugar de usar el path de fill de Excalidraw (que es muy verboso y describe el área sólida), construir un path de stroke equivalente que trace el contorno del óvalo. Basándose en el viewBox original (`338.75 x 117.70`) y la forma del path, el óvalo tiene proporciones aproximadas 3:1 (ancho:alto) con irregularidades orgánicas.

Crear un nuevo path de stroke que capture esa forma orgánica. Puede ser una curva bezier simplificada que trace una elipse irregular, por ejemplo:

```
M 8 30 C 20 8, 80 2, 160 4 C 240 6, 310 10, 328 28 C 346 46, 330 80, 310 95 C 260 115, 180 118, 100 116 C 40 114, 8 100, 4 78 C 0 56, 4 42, 8 30
```

(Este es un punto de partida aproximado — ajustalo para que visualmente se vea orgánico y desprolijo, coherente con el estilo hand-drawn del subrayado existente.)

## Implementación en `main.js`

Crear un nuevo módulo `Timbo.introLinkOval` siguiendo exactamente la misma arquitectura que `Timbo.navLinkUnderline`:

```js
introLinkOval: {
  OVAL_PATH: '...', // el path del óvalo

  init() {
    const link = document.querySelector('.intro__link');
    if (!link) return;
    this.injectSvg(link);
    this.bindHover(link);
  },

  injectSvg(link) {
    // Hacer el link position: relative si no lo es
    // Crear el SVG con viewBox proporcional al óvalo (ej: "0 0 340 120")
    // Agregar el path con stroke: currentColor, fill: none
    // Posicionar el SVG absolute sobre el link, centrado
    // Inicialmente opacity: 0 y stroke-dashoffset = longitud total del path
  },

  bindHover(link) {
    // En mouseenter: agregar clase intro-link--oval-draw
    // En mouseleave: remover clase intro-link--oval-draw
  },
},
```

Y llamarlo en `Timbo.init()`:
```js
this.introLinkOval.init();
```

## CSS a agregar en `styles.css`

```css
.intro__link {
  position: relative;
  display: inline-block; /* si no lo tiene ya */
}

.intro-link__oval {
  position: absolute;
  /* centrado sobre el link con algo de padding visual */
  top: -12px;
  left: -16px;
  width: calc(100% + 32px);
  height: calc(100% + 24px);
  overflow: visible;
  pointer-events: none;
  opacity: 0;
  transition: opacity 100ms ease;
}

.intro-link__oval path {
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 900; /* ajustar a la longitud real del path */
  stroke-dashoffset: 900;
}

.intro__link--oval-draw .intro-link__oval {
  opacity: 1;
}

.intro__link--oval-draw .intro-link__oval path {
  animation: intro-oval-draw 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes intro-oval-draw {
  to {
    stroke-dashoffset: 0;
  }
}
```

## Comportamiento esperado

- En **hover** sobre `.intro__link`: el óvalo se dibuja animado en ~700ms, englobando el texto del botón
- Al **salir** del hover: el óvalo desaparece (sin animación inversa, o con un fade-out rápido — lo que quede mejor visualmente)
- El óvalo debe verse claramente más grande que el texto, con padding visual generoso para que no quede pegado a las letras
- `stroke: currentColor` para que herede el color del link (funciona tanto en versión clara como oscura)
- Respetar `prefers-reduced-motion`: si está activo, mostrar el óvalo sin animación directamente en hover

## Archivos a modificar

- `assets/js/main.js` — agregar módulo `Timbo.introLinkOval` y su llamada en `init()`
- `assets/css/styles.css` — agregar los estilos del óvalo

## Archivos que NO hay que modificar

- `assets/images/svg/ovalo_001.svg` — solo se usó como referencia visual para extraer el path
- `assets/js/data.js`
- `assets/css/variables.css`
- Los módulos `navLinkUnderline` e `introPhraseUnderline` existentes

## Verificación

1. Abrir `index.html` en el browser
2. Hacer hover sobre el botón "See more" / "Ver más"
3. El óvalo debe dibujarse animado englobando el texto
4. El óvalo no debe quedar cortado — verificar que `overflow: visible` esté aplicado
5. Sin errores en consola
6. Verificar que los módulos existentes (`navLinkUnderline`, `introPhraseUnderline`) siguen funcionando normalmente
