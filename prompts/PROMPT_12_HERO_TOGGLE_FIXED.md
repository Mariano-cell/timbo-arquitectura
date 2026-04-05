# PROMPT 12 — Corregir posición del botón toggle del hero

## Contexto

El hero de `index.html` ahora mide más de 100vh. El botón `.hero__bg-toggle` está actualmente con `position: absolute` dentro del hero, lo que lo deja fuera del viewport inicial. Hay que cambiar su posicionamiento a `position: fixed` para que siempre aparezca en la esquina inferior derecha de la **pantalla** mientras el hero esté visible.

El módulo `heroBgToggle` en `main.js` ya usa un `IntersectionObserver` para mostrar/ocultar el botón — esa lógica no cambia.

---

## Cambio en `assets/css/styles.css`

Buscar la regla actual:

```css
.hero__bg-toggle {
  position: absolute;
  bottom: var(--space-lg, 2rem);
  right: var(--space-lg, 2rem);
  z-index: 30;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  padding: 8px 12px;
  transition: color 200ms ease, opacity 300ms ease;
  opacity: 1;
}
```

Reemplazarla por:

```css
.hero__bg-toggle {
  position: fixed;
  bottom: var(--space-lg, 2rem);
  right: var(--space-lg, 2rem);
  z-index: 200;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  padding: 8px 12px;
  transition: color 200ms ease, opacity 300ms ease;
  opacity: 1;
}
```

Los únicos cambios son `position: absolute` → `position: fixed` y `z-index: 30` → `z-index: 200` (para asegurar que quede por encima de la nav y otros elementos fixed).

---

## Cambio en `index.html`

El botón actualmente está dentro de `<section class="hero">`. Con `position: fixed` puede estar en cualquier lugar del DOM — pero para claridad semántica, moverlo **fuera del hero** y colocarlo justo después del cierre `</section>` del hero, antes de la siguiente sección:

```html
</section><!-- fin .hero -->

<button class="hero__bg-toggle" id="heroBgToggle" aria-label="Cambiar fondo">[ - ]</button>
```

Si ya está fuera del hero, no hace falta moverlo — dejarlo donde esté.

---

## Sin cambios en `main.js`

El `IntersectionObserver` sobre `#hero` ya maneja correctamente el show/hide del botón. No requiere modificaciones.

---

## Verificación esperada

1. Al cargar `index.html`, el botón `[ - ]` aparece en la esquina inferior derecha de la pantalla, visible sin necesidad de scrollear.
2. El botón permanece en esa posición fija mientras el hero esté en el viewport.
3. Al hacer click, el fondo cambia normalmente (video → fotos → video).
4. Al scrollear hasta salir completamente del hero, el botón desaparece.
5. Al volver a scrollear hacia arriba al hero, el botón reaparece.
6. No hay errores en consola.
