# PROMPT 14 — Agregar segundo bloque a la sección intro (index.html)

## Contexto del proyecto
Proyecto: Timbó Arquitectura — sitio web estático.
Stack: HTML + CSS + JS vanilla. Sin frameworks, sin bundler.
Convenciones: BEM, CSS custom properties en `variables.css`.
Archivos a modificar: `index.html`, `assets/css/styles.css`.

---

## Objetivo

Agregar un **segundo bloque** dentro de la sección `.intro`, debajo del bloque existente. Este bloque tiene la disposición inversa al primero:

- **Columna izquierda (~60%):** foto grande con bordes redondeados
- **Columna derecha (~40%):** icono SVG arriba + dos párrafos de texto debajo

Archivos a usar:
- Foto: `assets/images/intro-section/DSC01983.jpg`
- Icono SVG: `assets/images/intro-section/casita-y-sol.svg`

---

## Cambios en `index.html`

### Localizar el cierre de `.intro__container` (la línea `</div>` que cierra el div con clase `intro__container`) y agregar el nuevo bloque ANTES del cierre de `</section>`.

El HTML actual termina así:
```html
      </div><!-- cierre intro__container -->
    </section>
```

Reemplazar por:
```html
      </div><!-- cierre intro__container -->

      <!-- Bloque 2: foto izquierda + icono y texto derecha -->
      <div class="container intro__container intro__container--reverse">

        <!-- Columna izquierda: foto -->
        <figure class="intro__photo-single">
          <img src="assets/images/intro-section/DSC01983.jpg" alt="Timbó — arquitectura y naturaleza" loading="lazy">
        </figure>

        <!-- Columna derecha: icono + texto -->
        <div class="intro__body intro__body--with-icon">
          <img class="intro__icon" src="assets/images/intro-section/casita-y-sol.svg" alt="">
          <p class="intro__text">
            Mediante el análisis de datos climáticos, los proyectos se adaptan a las condiciones
            específicas de cada lugar, asegurando una baja demanda energética y una alta calidad ambiental
            tanto en espacios interiores como exteriores.
          </p>
          <p class="intro__text intro__text--emphasis">
            Los elementos de la naturaleza configuran el lenguaje arquitectónico y dan forma a
            espacios que establecen un diálogo duradero entre las personas y el mundo natural.
          </p>
        </div>

      </div><!-- cierre intro__container--reverse -->

    </section>
```

---

## Cambios en `assets/css/styles.css`

Agregar al final del bloque de estilos de `.intro` (después de las reglas existentes de `.intro__name`):

```css
/* ---- Intro bloque 2 ---- */

.intro__container--reverse {
  grid-template-columns: 3fr 2fr;
  margin-top: var(--space-4xl);
  align-items: center;
}

.intro__photo-single {
  margin: 0;
  overflow: hidden;
  border-radius: 12px;
}

.intro__photo-single img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  aspect-ratio: 4 / 3;
}

.intro__body--with-icon {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding-left: var(--space-xl);
}

.intro__icon {
  width: 80px;
  height: auto;
  display: block;
}

.intro__text--emphasis {
  font-weight: var(--fw-bold);
  color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 900px) {
  .intro__container--reverse {
    grid-template-columns: 1fr;
  }

  .intro__body--with-icon {
    padding-left: 0;
  }
}
```

---

## Verificación esperada

1. Debajo del bloque existente (texto+fotos), aparece un nuevo bloque.
2. El nuevo bloque tiene la foto a la izquierda (grande, con bordes redondeados) y el contenido textual a la derecha.
3. A la derecha: el SVG de la casita aparece arriba, luego el párrafo regular, luego el párrafo en negrita.
4. En mobile (< 900px), la foto aparece arriba y el texto debajo.
5. El primer bloque de la sección no se ve afectado.
6. No hay errores en consola.
