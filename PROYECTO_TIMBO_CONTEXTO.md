# TIMBÓ - Contexto del Proyecto

## 1. BRIEFING DEL CLIENTE

**Nombre:** Timbó (Estudio de Arquitectura)
**Origen:** Buenos Aires, Argentina
**Especialidad:** Arquitectura ecológica y bioclimática
**Propuesta Única:** Diseño de espacios basados en análisis de datos climáticos y geográficos del territorio

**Tagline ES:** "Arquitectura en armonía con el clima y la naturaleza"
**Tagline EN:** (pendiente de traducción oficial)
**Claim:** "Entre lo salvaje y las personas" / "Between the wild and the people"

**Objetivo de la Web:** Portfolio + Servicios
**Público Objetivo:** Personas (casas, departamentos) + Empresas/Desarrolladores inmobiliarios
**Diferencial:** Proceso (análisis geográfico/climático) + Resultado (espacios únicos) + Filosofía (conexión con naturaleza) — los tres en balance

---

## 2. ESTRUCTURA DE LA WEB

Secciones (definidas por la diseñadora):
1. **Home** (Inicio) — Landing principal con hero inmersivo
2. **Proyectos** (Projects) — Portfolio de casos de estudio
3. **Sustentabilidad** (Sustainability) — Propuesta ecológica y proceso
4. **Sobre Nosotros** (About Us) — Equipo y visión
5. **Contacto** (Contact) — Formulario y datos

**Multiidioma:** Español e Inglés (selector dinámico, misma estructura)
**Navegación:** Misma estructura en ambos idiomas, textos traducidos

---

## 3. IDENTIDAD VISUAL Y ESTILOS

### 3.1 Logo
- **Marca:** TIMBÓ (con tilde)
- **Estilo:** Tipografía bold/black, grotesca, muy pesada
- **Isotipo:** Tres siluetas de árboles timbó en negro (variaciones de copa redondeada)
- **Aplicación:** Header, footer, y como elemento gráfico superpuesto en fotografías

### 3.2 Paleta Cromática (Opción B)

**Escala de grises (fila superior):**
- Blanco puro (#FFFFFF o muy cercano)
- Gris muy claro (~#D9D9D9)
- Gris medio (~#A0A0A0)
- Gris oscuro (~#707070)
- Gris carbón (~#4A4A4A)
- Negro (~#2A2A2A / #1A1A1A)

**Acentos de color (fila inferior):**
- Celeste claro (~#A8CBE0) — cielo, aire, ligereza
- Verde oliva/musgo (~#8BA63A) — vegetación, naturaleza viva
- Verde bosque oscuro (~#3D6B5E) — profundidad, ecología

**Carácter general:** Paleta FRÍA y SOBRIA. No cálida. Los grises dominan, los verdes y celeste son acentos.
**Fondos principales:** Blanco roto / gris muy claro (#F5F5F5 aprox.) para secciones de texto
**Fondos oscuros:** Gris carbón / casi negro para secciones de contraste (ej: About Us con Mia Morrone)

*NOTA: Los valores HEX son aproximados. Extraer los exactos de los archivos de diseño originales.*

### 3.3 Tipografía
- **Fuente Principal:** Autaut Grotesk
- **Archivos:** Disponibles (solicitar al equipo .woff2/.ttf para web)
- **Pesos usados en la presentación:**
  - Light/Thin: body text en About, descripciones de proyectos
  - Regular: navegación, textos secundarios
  - Bold/Black: títulos, logo, statements grandes
- **Estilo:** Grotesca contemporánea, limpia, con buena legibilidad

### 3.4 Dirección Estética General

**Estilo:** Minimalista editorial con momentos inmersivos
**Ritmo visual:**
- Alternancia entre secciones full-bleed con fotografía y secciones limpias de texto
- Tipografía como elemento gráfico (títulos enormes que dominan la composición)
- Mucho espacio en blanco / respiro

**Elementos de identidad visual:**
- Patrón generativo de barras verticales verdes (pág. 6 de la presentación) — posible recreación con CSS/canvas
- Logo TIMBÓ superpuesto en fotografías como marca de agua o elemento compositivo
- Fotografía de naturaleza y arquitectura como protagonista
- Texto underlined para destacar conceptos clave en el body copy

**Layouts observados:**
- Hero: fotografía full-screen con tipografía enorme superpuesta
- Proyecto individual: imagen grande con rounded corners + nombre/ubicación debajo
- About: fondo oscuro, tipografía light, tono contemplativo
- Sustentabilidad: lista de variables climáticas como declaración tipográfica
- Detalle de proyecto: layout asimétrico (texto a la izquierda, imagen a la derecha)

---

## 4. DECISIONES TÉCNICAS

### Stack
- **HTML/CSS/JS vanilla** (sin frameworks ni build tools)
- **D3.js vía CDN** para futuras infografías climáticas
- **Desktop-first**, mobile después

### Estrategia de idiomas
- **Un solo HTML por página** con contenido dinámico
- JavaScript carga textos según idioma seleccionado
- Datos de contenido centralizados en archivo(s) JS
- URLs con hash o parámetro para indicar idioma

### Estructura de archivos (revisada)
```
timbo-arquitectura/
├── index.html                    # Home
├── proyectos.html                # Portfolio
├── sustentabilidad.html          # Propuesta ecológica
├── sobre-nosotros.html           # About
├── contacto.html                 # Contacto
├── assets/
│   ├── css/
│   │   ├── variables.css         # Custom properties, reset, tipografía
│   │   └── styles.css            # Todos los estilos
│   ├── js/
│   │   ├── main.js               # Inicialización, idioma, componentes compartidos
│   │   ├── data.js               # Contenido en ES e EN
│   │   └── utils.js              # Funciones auxiliares
│   ├── images/
│   │   ├── logo/
│   │   ├── projects/
│   │   └── hero/
│   └── fonts/
│       └── autaut-grotesk/       # Archivos .woff2/.ttf
└── PROYECTO_TIMBO_CONTEXTO.md    # Este archivo
```

### CSS Architecture
- `variables.css`: custom properties (colores, tipografía, espaciado, breakpoints), CSS reset, @font-face
- `styles.css`: componentes, layout, páginas — todo junto hasta que crezca lo suficiente para justificar separación

---

## 5. CONTENIDO Y DATOS

### 5.1 Proyectos
**Estado:** Pendiente (cliente los pasará próximamente)

**Proyectos vistos en la presentación (referencia):**
- Atmos Lab (Londres, UK) — análisis solar de oficina
- Haras San Pablo (Argentina) — casa rural con paneles solares en techo verde
- Praderas (Argentina) — cabaña de madera en entorno nevado/montaña
- Casa sobre río (ubicación sin confirmar) — estructura elevada sobre pilotes en zona fluvial/selvática

**Estructura esperada por proyecto:**
- Nombre / Name
- Ubicación / Location
- Descripción / Description
- Análisis climático (7 variables)
- Galería de imágenes

### 5.2 Sustentabilidad
**Las 7 variables climáticas que analiza Timbó:**
1. Zona climática / Climate Zone
2. Trayectoria solar / Solar Path
3. Temperatura exterior / Outdoor Temperature
4. Radiación solar / Solar Radiation
5. Humedad / Humidity
6. Precipitación / Precipitation
7. Patrones de viento / Wind Patterns

### 5.3 About Us
**Persona:** Mia Morrone — Arquitecta
**Bio:** Especializada en viviendas bioclimáticas y sostenibles. Integra tecnologías de evaluación ambiental como herramientas de diseño.
**Tratamiento visual:** Fondo oscuro, tipografía light, tono contemplativo/profesional

---

## 6. FLUJO DE TRABAJO

### Equipo
- **Diseñadora:** Define estructura, estilos, dirección creativa
- **Programador (Mariano):** Implementa código, aporta ideas creativas al diseño
- **Claude:** Asistente de desarrollo con revisión de arquitectura global

### Forma de trabajar con Claude
- Revisión global de código: arquitectura, patrones, escalabilidad
- Análisis de decisiones técnicas ANTES de implementar
- Explicación del "por qué" de cada decisión
- Code reviews internos con resumen de decisiones
- Documentación de decisiones importantes en este archivo

### Archivo de contexto
- Este documento se actualiza a medida que avanza el proyecto
- Se comparte al inicio de cada sesión de desarrollo
- Base para decisiones arquitectónicas y de diseño

---

## 7. PRÓXIMOS PASOS

1. ~~Definir stack tecnológico~~ ✓ (Vanilla HTML/CSS/JS)
2. ~~Definir estrategia de idiomas~~ ✓ (HTML único + JS dinámico)
3. **Cargar archivos de fuente Autaut Grotesk**
4. **Extraer colores exactos de la paleta** (pedir a diseñadora o extraer de archivos)
5. **Crear archivos base del proyecto** (HTML, CSS, JS)
6. **Desarrollar Home** como primera página
7. Esperar contenido de proyectos del cliente

---

**Actualizado:** 2026-03-07
**Estado:** Contexto revisado con Opus 4.6 — Correcciones de paleta, arquitectura y estructura aplicadas
