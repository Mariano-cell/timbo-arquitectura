# Contexto del proyecto — Timbó Arquitectura

## Qué es el proyecto

Sitio web para **Timbó**, un estudio de arquitectura bioclimática con base en Buenos Aires. El sitio es un portfolio + presentación de servicios. Stack: **vanilla HTML/CSS/JS, sin frameworks, sin bundler**.

## Estructura de archivos

```
timbo-arquitectura/
├── index.html                        ← Home (sección principal)
├── proyectos.html                    ← Listado de proyectos
├── sustentabilidad.html              ← En construcción
├── sobre-nosotros.html               ← En construcción
├── contacto.html                     ← En construcción
├── proyectos/
│   ├── proyecto-exuma-lodge.html
│   ├── proyecto-haras-san-pablo.html
│   ├── proyecto-tobar-lodge.html
│   ├── proyecto-cherokee-ave.html
│   └── proyecto-cabana-suinda.html
├── assets/
│   ├── css/
│   │   ├── variables.css             ← Tokens de diseño (colores, tipografía, espaciado)
│   │   ├── base.css                  ← Reset y estilos base (deprecated, no se importa)
│   │   └── styles.css                ← Todos los estilos del sitio
│   ├── js/
│   │   ├── main.js                   ← Lógica JS completa (~1600 líneas)
│   │   └── data.js                   ← Contenido bilingüe (ES/EN) centralizado
│   ├── images/
│   └── fonts/
│       └── autaut-grotesk/           ← Fuente propia (5 pesos: 400, 500, 600, 700, 900)
```

## Arquitectura JS

Todo el JS vive en el objeto global `Timbo` en `main.js`, con módulos que tienen `init()`. Se inicializa en `DOMContentLoaded`.

Módulos principales:
- `Timbo.i18n` — sistema de idiomas (ES/EN), lee de `data.js`
- `Timbo.navScroll` / `Timbo.navTheme` — comportamiento del navbar
- `Timbo.floatingLogo` — logo fijo esquina inferior izquierda
- `Timbo.heroIntro` — animación de entrada del hero (espera al video)
- `Timbo.projectsList` — renderiza lista de proyectos en proyectos.html
- `Timbo.projectPage` — renderiza detalle de cada proyecto
- `Timbo.valuesBreakdown` — carousel de 8 pilares climáticos + paneles
- `Timbo.projectMap` — mapa interactivo con MapLibre GL JS (en páginas de proyecto)
- `Timbo.scrollReveal` — anima elementos con `.anim-fade-up`, `.anim-fade-in`

## Variables CSS clave (en variables.css)

```css
--color-crema: #f0ebe3      /* fondo cálido para páginas de proyecto */
--color-azul: #1d4363       /* azul oscuro del estudio */
--color-celeste: #BCD8ED    /* celeste claro */
--color-text-primary: #1A1A1A
--color-text-light: #FFFFFF
--color-gray-300: #A0A0A0

--fw-regular: 400
--fw-medium: 500
--fw-semibold: 600
--fw-bold: 700
--fw-black: 900

--space-md: 1rem
--space-lg: 1.5rem
--space-xl: 2rem
--space-2xl: 3rem
--space-4xl: 6rem

--transition-base: 300ms ease
```

## Clases de body importantes

- `.page--dark` → fondo `#0a0a0a`, texto blanco. La usan: `proyectos.html` y todas las páginas de proyecto en `proyectos/`.
- Sin clase especial → fondo blanco, texto oscuro. La usa `index.html`.

## Convenciones

- BEM para CSS: `.block__element--modifier`
- `data-i18n="seccion.clave"` en elementos que se traducen
- `data-nav-theme="dark|light"` en secciones para cambiar color del nav
- `data-project-slug` en la sección principal de cada página de proyecto
- Contenido bilingüe siempre en `data.js`, nunca hardcodeado en HTML (excepción: algunos textos legacy todavía sin migrar)
