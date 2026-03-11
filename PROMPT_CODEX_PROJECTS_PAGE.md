# Prompt para Codex — Cambios visuales en página de proyectos

En `proyectos.html`, `assets/css/styles.css`, `assets/js/data.js` y `assets/js/main.js`, hacer los siguientes cambios:

## 1. Fondo más oscuro
El fondo de la página de proyectos debe ser casi negro. Cambiar el background de `.page--dark` o del body de `proyectos.html` a `#0a0a0a` o `#080808`.

## 2. Sin bold en tipografías
Todos los textos dentro de `.projects__item` deben tener `font-weight: var(--fw-regular)` (400): nombre del proyecto, región, y botón. El estado hover tampoco debe aplicar bold.

## 3. Border-radius en la imagen de preview
El elemento de imagen que aparece con el hover (el `<img>` dentro de `.projects__preview`) debe tener `border-radius: 5px`.

## 4. Categoría debajo de la imagen en el hover
En lugar de repetir el nombre del proyecto debajo de la imagen, mostrar la categoría del proyecto.

Agregar el campo `category` a cada proyecto en `SITE_DATA.projects` en `data.js`, con estos valores en ambos idiomas (`es` y `en`):

- Exuma Lodge → `"Hospitality Lodge"`
- Haras San Pablo → `"Residential + Productive"` / `"Residencial + Productivo"`
- Tobar Lodge → `"Hospitality / Retreat"` / `"Hospitalidad / Retiro"`
- Cherokee Ave → `"Urban Housing"` / `"Vivienda Urbana"`

Actualizar el render del preview en `Timbo.projectsList.render()` en `main.js` para que muestre `project.category` en el `previewMeta` en lugar de `project.name`.

## 5. Región al mismo tamaño que el nombre del proyecto
En `.projects__item-location`, igualar el `font-size` exactamente al de `.projects__item-name`. Actualmente la región se muestra más chica.

## 6. Botón "View project" en minúscula y apoyado en el piso
- Quitar cualquier `text-transform: uppercase` del botón `.projects__item-cta`.
- En `data.js`, cambiar `viewProject` a `"View project"` en `en` y `"Ver proyecto"` en `es`.
- El botón actualmente está alineado al centro verticalmente dentro de su contenedor. Debe pasar a estar en el **piso** del contenedor, al mismo nivel en el eje Y que el texto de la región. Por ejemplo, el primer item debe verse así:

```
Exuma Lodge
Bahamas    View project →
```

Para lograrlo, cambiar el layout de `.projects__item-link` o `.projects__item-info` para que el nombre quede arriba y la región + botón queden abajo alineados entre sí. Usar `display: flex` con `align-items: flex-end` o `justify-content: space-between` según corresponda.
