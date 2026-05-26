# Inventario de assets — proyectos a migrar

Inventario hecho en la tarea 5. Cruzamos las imágenes que cada proyecto
necesita según el estándar contra las que existen hoy en
`assets/images/projects/{slug}/`.

> **Placeholder de transición:** cuando falte una imagen, se usa
> `assets/images/fondo-transitorio.png`. El cliente reemplaza la imagen
> real al editar cada proyecto.

---

## Imágenes que cada proyecto necesita (según el estándar)

| Slot | Archivo canónico | Sección que la usa |
|---|---|---|
| Hero | `hero.jpg` | `project-hero` |
| Overview foto 1 | `overview-01.jpg` | `project-overview` (slider) |
| Overview foto 2 | `overview-02.jpg` | `project-overview` (slider) |
| Refuge foto 1 | `refuge-01.jpg` | `project-refuge` gallery |
| Refuge foto 2 | `refuge-02.jpg` | `project-refuge` gallery |
| Frame | `frame-01.jpg` | `project-frame` |
| Phrase A | `phrase-01.jpg` | `project-phrase` (efecto zoom) |
| Phrase B | `phrase-02.jpg` | `project-phrase` (efecto pan + reveal) |
| Highlight | `highlight-01.jpg` | `project-highlight` (con título overlay) |
| Palette A | `palette-01.jpg` | `project-palette` (lado izquierdo del drag) |
| Palette B | `palette-02.jpg` | `project-palette` (lado derecho del drag) |
| Final | `final.jpg` | `project-final` (fondo) |

Total: **12 slots por proyecto** × 8 proyectos = 96 imágenes esperadas.

---

## Estado actual por proyecto

Leyenda:
- ✅ existe con nombre canónico
- 🔄 existe con otro nombre (hay que renombrar o ajustar el path)
- ❌ falta (se usa placeholder)

### cabana-suinda — 9/12

| Slot | Estado | Notas |
|---|---|---|
| hero | ✅ | `hero.jpg` |
| overview-01 | ✅ | |
| overview-02 | ✅ | |
| refuge-01 | ✅ | |
| refuge-02 | ✅ | |
| frame-01 | ✅ | |
| phrase-01 | ❌ | placeholder |
| phrase-02 | ❌ | placeholder |
| highlight-01 | ❌ | placeholder |
| palette-01 | ✅ | (existen también `palette-03`, `palette-04` sin usar) |
| palette-02 | ✅ | |
| final | ✅ | `final.jpg` |

### cardano — 0/12

| Slot | Estado | Notas |
|---|---|---|
| Todos | ❌ | Sólo hay 4 archivos con nombre `IMG_4611.JPG` ... `IMG_4614.JPG`. Hasta que se renombren, **todo el proyecto va con placeholder**. |

### chacras-de-murray — 8/12

| Slot | Estado | Notas |
|---|---|---|
| hero | ✅ | |
| overview-01 | ✅ | |
| overview-02 | ✅ | |
| refuge-01 | ✅ | |
| refuge-02 | ✅ | |
| frame-01 | ✅ | |
| phrase-01 | ❌ | placeholder |
| phrase-02 | ❌ | placeholder |
| highlight-01 | ❌ | placeholder |
| palette-01 | ✅ | |
| palette-02 | ✅ | |
| final | 🔄 | existe `final-01.jpg`, no `final.jpg`. **Decisión**: ajustar el path en el HTML migrado a `final-01.jpg`. |

### cherokee-ave — 8/12

| Slot | Estado | Notas |
|---|---|---|
| hero | ✅ | |
| overview-01 | ✅ | |
| overview-02 | ✅ | |
| refuge-01 | ✅ | |
| refuge-02 | ✅ | |
| frame-01 | ✅ | |
| phrase-01 | ❌ | placeholder |
| phrase-02 | ❌ | placeholder |
| highlight-01 | ❌ | placeholder |
| palette-01 | ✅ | con extensión `.JPG` mayúscula (Linux y servidores web son case-sensitive — revisar) |
| palette-02 | ✅ | |
| final | 🔄 | existe `final-02.jpg`, no `final.jpg`. Ajustar path. |

### club-de-mar — 0/12

| Slot | Estado | Notas |
|---|---|---|
| Todos | ❌ | Las 5 imágenes que hay tienen nombres descriptivos largos (`jose ignacio - house-luxury-architecture-beach house...`). **Todo el proyecto va con placeholder** hasta renombrar. |

### exuma-lodge — 8/12

| Slot | Estado | Notas |
|---|---|---|
| hero | 🔄 | existe `exuma-hero.jpg` y `bahamas-portada.jpg`. Ajustar path. |
| overview-01 | ✅ | |
| overview-02 | ✅ | |
| refuge-01 | ✅ | |
| refuge-02 | ✅ | |
| frame-01 | ✅ | |
| phrase-01 | ❌ | placeholder |
| phrase-02 | ❌ | placeholder |
| highlight-01 | ❌ | placeholder |
| palette-01 | ✅ | |
| palette-02 | ✅ | |
| final | ❌ | no hay imagen final clara. placeholder. |

### haras-san-pablo — 2/12

| Slot | Estado | Notas |
|---|---|---|
| hero | 🔄 | existe `portada-haras.jpg`. Ajustar path. |
| overview-01 | 🔄 | existe `haras-intro_001.jpg`. Ajustar path. |
| overview-02 | 🔄 | existe `haras-intro_002.jpg`. Ajustar path. |
| refuge-01 | 🔄 | existe `haras-refuge-001.jpg`. Ajustar path. |
| refuge-02 | 🔄 | existe `haras-refuge-002.jpg`. Ajustar path. |
| frame-01 | 🔄 | existe `haras-frame.jpg`. Ajustar path. |
| phrase-01 | ❌ | placeholder |
| phrase-02 | ❌ | placeholder |
| highlight-01 | ❌ | placeholder |
| palette-01 | ✅ | (existe también `paleta-01.jpg`, ojo con la duplicación) |
| palette-02 | ✅ | (idem `paleta-02.jpg`) |
| final | 🔄 | existe `end-page.jpg` y `final-haras.jpg`. Ajustar path. |

> Haras tiene el patrón completo de imágenes pero con prefijo `haras-`. Las
> rutas del HTML actual ya apuntan a esos nombres. La migración respeta los
> paths existentes y NO renombra archivos.

### tobar-lodge — 9/12

| Slot | Estado | Notas |
|---|---|---|
| hero | ✅ | |
| overview-01 | ✅ | |
| overview-02 | ✅ | |
| refuge-01 | ✅ | (existe también `refuge-03.jpg` sin usar) |
| refuge-02 | ✅ | |
| frame-01 | ✅ | |
| phrase-01 | ❌ | placeholder |
| phrase-02 | ❌ | placeholder |
| highlight-01 | ❌ | placeholder |
| palette-01 | ✅ | (existe también `palette-03.jpg` sin usar) |
| palette-02 | ✅ | |
| final | 🔄 | existe `final-01.jpg`. Ajustar path. |

---

## Resumen ejecutivo

- **Proyectos completamente migrables (con placeholder en 3 slots):** cabana-suinda,
  tobar-lodge (los más cercanos al estándar).
- **Proyectos migrables con ajustes de path:** chacras-de-murray, cherokee-ave,
  exuma-lodge, haras-san-pablo, tobar-lodge.
- **Proyectos que van casi 100% con placeholder hasta renombrar archivos:**
  cardano, club-de-mar.

---

## Regla de migración respecto a paths

**No se renombran archivos de imagen.** El HTML migrado adapta el `src` a lo
que realmente existe en cada carpeta. Si la imagen real no existe, se usa
`../assets/images/fondo-transitorio.png`.

Esto permite migrar la estructura HTML sin tener que tocar archivos de
imagen (que es trabajo de la diseñadora / del cliente).

### Path del placeholder

Desde una página de proyecto (`/proyectos/proyecto-{slug}.html`):

```html
<img src="../assets/images/fondo-transitorio.png" alt="..." loading="lazy" decoding="async">
```

---

## Pendientes para el cliente (Mariano)

Cuando estés listo, ordena los archivos así por proyecto y la migración
queda más limpia:

1. Subir las imágenes nuevas (`phrase-01.jpg`, `phrase-02.jpg`,
   `highlight-01.jpg`) en cada carpeta `assets/images/projects/{slug}/`.
2. Renombrar las imágenes con nombres "raros" (cardano, club-de-mar, haras,
   exuma) al estándar `hero.jpg`, `overview-01.jpg`, etc. — o avisame y las
   dejamos como están con los paths adaptados.
3. Decidir qué imagen final usar en chacras, cherokee, exuma, haras, tobar,
   ya que el archivo `final.jpg` canónico no existe.

Mientras tanto, la migración avanza con el placeholder.
