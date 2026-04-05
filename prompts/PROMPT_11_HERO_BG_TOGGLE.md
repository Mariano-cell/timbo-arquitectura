# PROMPT 11 — Toggle de fondo en el hero (index.html)

## Contexto del proyecto

Proyecto: Timbó Arquitectura — sitio web estático.
Stack: HTML + CSS + JS vanilla. Sin frameworks, sin bundler, sin npm.
Convenciones: BEM, CSS custom properties en `variables.css`, módulos en el objeto global `Timbo` dentro de `assets/js/main.js`.
Archivo principal a modificar: `index.html`
Estilos: `assets/css/styles.css`
JS: `assets/js/main.js`

---

## Objetivo

Agregar un botón de toggle en el hero de `index.html` que permita cambiar el fondo entre el video actual y una serie de fotos alternativas. El botón es visualmente mínimo y desaparece automáticamente cuando el hero sale del viewport.

---

## Fondos disponibles (en orden de aparición)

```
1. (predeterminado) Video:  assets/images/hero/hero-video_002.mp4
2. Foto:  assets/images/hero/alternate-hero-photos/foto-montañas-fondo.jpg
3. Foto:  assets/images/hero/alternate-hero-photos/DJI_0475 (1).jpg
4. Foto:  assets/images/hero/alternate-hero-photos/DJI_20240305170434_0265_D.jpg
5. Foto:  assets/images/hero/alternate-hero-photos/DSC01983.jpg
6. Foto:  assets/images/hero/alternate-hero-photos/DSC01984.jpg
7. Foto:  assets/images/hero/alternate-hero-photos/DSC02312.jpg
```

---

## Cambios en `index.html`

### 1. Agregar imagen de fondo alternativa dentro de `.hero__bg`

Dentro del `<div class="hero__bg">`, después del `<video>`, agregar:

```html
<div class="hero__bg-photo" id="heroBgPhoto" aria-hidden="true"></div>
```

### 2. Agregar el botón toggle dentro de `<section class="hero">`

Justo antes del cierre `</section>` del hero, agregar:

```html
<button class="hero__bg-toggle" id="heroBgToggle" aria-label="Cambiar fondo">[ - ]</button>
```

El HTML final del hero debe quedar así:

```html
<section class="hero" id="hero" data-nav-theme="dark">
  <div class="hero__bg">
    <video muted loop playsinline preload="auto">
      <source src="assets/images/hero/hero-video_002.mp4" type="video/mp4">
    </video>
    <div class="hero__bg-photo" id="heroBgPhoto" aria-hidden="true"></div>
  </div>
  <div class="hero__content">
    <h1 class="hero__tagline" data-i18n="home.heroTagline">
      Arquitectura en armonía con el clima y la naturaleza.
    </h1>
    <img src="assets/images/logo/logo-nuevo-blanco-15.svg" alt="Timbó" class="hero__logo">
  </div>
  <button class="hero__bg-toggle" id="heroBgToggle" aria-label="Cambiar fondo">[ - ]</button>
</section>
```

---

## Cambios en `assets/css/styles.css`

Agregar al final del bloque del hero (después de `.hero__content.is-visible .hero__tagline`):

```css
/* ---- Hero background photo layer ---- */
.hero__bg-photo {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 800ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.hero__bg-photo.is-active {
  opacity: 1;
}

/* ---- Hero background toggle button ---- */
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

.hero__bg-toggle:hover {
  color: rgba(255, 255, 255, 0.9);
}

.hero__bg-toggle.is-hidden {
  opacity: 0;
  pointer-events: none;
}
```

---

## Cambios en `assets/js/main.js`

Agregar un nuevo módulo `heroBgToggle` dentro del objeto `Timbo`, junto a los demás módulos existentes:

```js
heroBgToggle: {

  BACKGROUNDS: [
    { type: 'video', src: null }, // el video ya existe en el HTML, no hace falta src
    { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/foto-montañas-fondo.jpg' },
    { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DJI_0475 (1).jpg' },
    { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DJI_20240305170434_0265_D.jpg' },
    { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DSC01983.jpg' },
    { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DSC01984.jpg' },
    { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DSC02312.jpg' },
  ],

  currentIndex: 0,

  init() {
    const btn      = document.getElementById('heroBgToggle');
    const photoEl  = document.getElementById('heroBgPhoto');
    const heroEl   = document.getElementById('hero');
    const videoEl  = heroEl ? heroEl.querySelector('video') : null;

    if (!btn || !photoEl || !heroEl || !videoEl) return;

    // Ciclar al siguiente fondo al hacer click
    btn.addEventListener('click', () => {
      this.currentIndex = (this.currentIndex + 1) % this.BACKGROUNDS.length;
      const bg = this.BACKGROUNDS[this.currentIndex];

      if (bg.type === 'video') {
        // Volver al video
        photoEl.style.backgroundImage = '';
        photoEl.classList.remove('is-active');
        videoEl.style.opacity = '';
      } else {
        // Mostrar foto
        photoEl.style.backgroundImage = `url('${bg.src}')`;
        photoEl.classList.add('is-active');
        videoEl.style.opacity = '0';
      }
    });

    // Ocultar el botón cuando el hero sale del viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          btn.classList.remove('is-hidden');
        } else {
          btn.classList.add('is-hidden');
        }
      });
    }, { threshold: 0.1 });

    observer.observe(heroEl);
  },
},
```

### También: llamar `Timbo.heroBgToggle.init()` en el bloque de inicialización

Dentro del `DOMContentLoaded` (o donde se llaman los demás módulos), agregar:

```js
Timbo.heroBgToggle.init();
```

---

## Verificación esperada

1. Al cargar `index.html`, el video se reproduce como de costumbre.
2. El botón `[ - ]` aparece en la esquina inferior derecha del hero, semitransparente.
3. Al hacer click, el fondo cambia a `foto-montañas-fondo.jpg` con un fade suave.
4. Cada click subsiguiente avanza al siguiente fondo en el array.
5. Al llegar al último, el próximo click vuelve al video.
6. Al hacer scroll y salir del hero, el botón desaparece (fade out).
7. Al volver a scrollear hacia arriba al hero, el botón reaparece.
8. No hay errores en consola.
9. El resto del hero (logo, tagline, animaciones de entrada) funciona sin cambios.

---

## Notas

- El `<video>` queda en el DOM siempre; cuando se muestra una foto simplemente se pone `opacity: 0` sobre el video (que sigue corriendo en background sin interrumpirse).
- `.hero__bg-photo` tiene `z-index: 1`, igual que el video — pero al tener `is-active` y estar posicionado después en el DOM, queda visualmente encima. El overlay `::after` de `.hero__bg` (z-index: 2) sigue funcionando sobre ambos.
- No se necesita preload de imágenes — el browser las carga al asignar `backgroundImage`.
- El módulo solo se activa si `#heroBgToggle` existe en el DOM, por lo que no afecta otras páginas.
