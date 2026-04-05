# Prompt para Claude Code / Codex — Fix orphan `</div>` en index.html

## Contexto

Sitio web Timbó Arquitectura. Stack: vanilla HTML/CSS/JS, sin frameworks. Ver `prompts/CONTEXTO_PROYECTO.md` para contexto completo.

## El problema

En `index.html`, dentro de la sección `.philosophy`, hay dos `</div>` huérfanos y un comentario que quedaron de una edición previa. No tienen etiqueta de apertura correspondiente y rompen la estructura del DOM.

Las líneas problemáticas son aproximadamente estas (buscalas por el comentario):

```html
<section class="philosophy" id="philosophy" data-nav-theme="light">
  <!-- DUPLICÁ TODO EL BLOQUE ORIGINAL UNA SEGUNDA VEZ -->
  </div>
  </div>
  <div class="container container--wide">
```

## Lo que hay que hacer

En `index.html`, eliminar exactamente estas tres líneas:

```
  <!-- DUPLICÁ TODO EL BLOQUE ORIGINAL UNA SEGUNDA VEZ -->
  </div>
  </div>
```

No tocar nada más de esa sección. El `<div class="container container--wide">` que sigue debe quedar intacto.

## Archivo a modificar

- `index.html`

## Verificación

1. Abrir `index.html` en el browser
2. Inspeccionar el DOM de la sección `.philosophy` — no debe haber elementos mal anidados
3. El validador HTML no debe reportar etiquetas de cierre sin apertura en esa sección
4. Sin cambios visuales visibles (era un bug estructural, no visual)
