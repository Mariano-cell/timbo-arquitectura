# Prompt para Claude Code / Codex — Fondo crema en páginas de proyecto

## Contexto

Sitio web Timbó Arquitectura. Stack: vanilla HTML/CSS/JS, sin frameworks. Ver `prompts/CONTEXTO_PROYECTO.md` para contexto completo.

La variable `--color-crema: #f0ebe3` ya está definida en `assets/css/variables.css` pero no se usa todavía.

## Lo que hay que hacer

Las páginas de detalle de proyecto (en `proyectos/`) actualmente usan `<body class="page--dark">`, que aplica fondo `#0a0a0a` y texto blanco. Hay que cambiarlas para que usen fondo crema (`--color-crema`) con texto oscuro.

**IMPORTANTE**: `proyectos.html` (el listado de proyectos) debe mantenerse con `.page--dark`. Solo hay que cambiar las páginas dentro de la carpeta `proyectos/`.

### Paso 1 — Agregar clase `.page--crema` en `assets/css/styles.css`

Agregar esta regla nueva (puede ir justo debajo de `.page--dark`):

```css
.page--crema {
  background-color: var(--color-crema);
  color: var(--color-text-primary);
}
```

### Paso 2 — Cambiar la clase en los HTML de cada proyecto

En cada uno de estos archivos, cambiar `class="page--dark"` por `class="page--crema"` en la etiqueta `<body>`:

- `proyectos/proyecto-exuma-lodge.html`
- `proyectos/proyecto-haras-san-pablo.html`
- `proyectos/proyecto-tobar-lodge.html`
- `proyectos/proyecto-cherokee-ave.html`
- `proyectos/proyecto-cabana-suinda.html`

### Paso 3 — Revisar el navbar en páginas crema

El navbar en estas páginas usa `data-nav-theme` para cambiar de color. Verificar que la sección hero o primera sección de cada página tenga `data-nav-theme="dark"` (para que el nav use texto oscuro sobre fondo claro). Si alguna página tiene `data-nav-theme="light"` en la primera sección, cambiarlo a `"dark"`.

## Archivos a modificar

- `assets/css/styles.css` — agregar regla `.page--crema`
- `proyectos/proyecto-exuma-lodge.html`
- `proyectos/proyecto-haras-san-pablo.html`
- `proyectos/proyecto-tobar-lodge.html`
- `proyectos/proyecto-cherokee-ave.html`
- `proyectos/proyecto-cabana-suinda.html`

## Archivos que NO hay que modificar

- `proyectos.html` — debe mantener `.page--dark`
- `assets/css/variables.css`

## Verificación

1. Abrir cada página de proyecto en el browser
2. El fondo debe ser crema cálido (`#f0ebe3`), no negro
3. El texto debe ser oscuro (legible sobre fondo claro)
4. Abrir `proyectos.html` — debe seguir con fondo negro (`#0a0a0a`)
5. El navbar debe verse correctamente (texto oscuro) al cargar cada página de proyecto
