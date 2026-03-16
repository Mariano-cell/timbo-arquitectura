/* ============================================================
   TIMBÓ — data.js
   Contenido bilingüe centralizado.

   CÓMO FUNCIONA:
   Todo el texto visible de la web vive acá. Cada clave tiene
   su versión en español (es) e inglés (en). Cuando el usuario
   cambia de idioma, main.js lee estos datos y actualiza el DOM.

   CÓMO AGREGAR CONTENIDO:
   1. Buscá la sección correspondiente (nav, home, projects, etc.)
   2. Agregá la clave nueva con su valor en ambos idiomas
   3. En el HTML, usá data-i18n="seccion.clave" en el elemento
   ============================================================ */

const SITE_DATA = {

  /* ----- Navegación ----- */
  nav: {
    es: {
      home:             'Inicio',
      projects:         'Proyectos',
      sustainability:   'Sustentabilidad',
      about:            'Sobre Nosotros',
      contact:          'Contacto',
    },
    en: {
      home:             'Home',
      projects:         'Projects',
      sustainability:   'Sustainability',
      about:            'About Us',
      contact:          'Contact',
    },
  },

  /* ----- Home ----- */
  home: {
    es: {
      heroTagline:      'Arquitectura en armonía con el clima y la naturaleza.',
      claim:            'Entre lo salvaje y las personas.',
      introName:        'TIMBÓ',
      introText:        'es un estudio de arquitectura, diseño, consultoría e investigación con origen en Buenos Aires. Comprometido con contribuir a un futuro bajo en carbono, permite a las personas experimentar la naturaleza en su máxima expresión. Mediante el análisis de datos climáticos, los proyectos se adaptan a las condiciones específicas de cada lugar, asegurando una baja demanda energética y una alta calidad ambiental tanto en espacios interiores como exteriores. Los elementos de la naturaleza configuran el lenguaje arquitectónico y dan forma a espacios que establecen un diálogo duradero entre las personas y el mundo natural.',
      sustainabilityStatement: 'Diseño resiliente y adaptado a las condiciones ambientales',
      featuredProjectBtn: 'Ver proyectos',
    },
    en: {
      heroTagline:      'Architecture in harmony with nature and climate.',
      claim:            'Between the wild and the people.',
      introName:        'TIMBÓ',
      introText:        'is an architecture, design, consultancy, and research studio based in Buenos Aires. Committed to contributing to a low-carbon future, it enables people to experience nature at its fullest. Through climate data analysis, projects adapt to the specific conditions of each place, ensuring low energy demand and high environmental quality in both indoor and outdoor spaces. Elements of nature shape the architectural language and give form to spaces that establish a lasting dialogue between people and the natural world.',
      sustainabilityStatement: 'Resilient design in response to environmental conditions',
      featuredProjectBtn: 'View projects',
    },
  },

  /* ----- Sustentabilidad ----- */
  sustainability: {
    es: {
      title:            'Sustentabilidad',
      variables: [
        'Zona climática',
        'Trayectoria solar',
        'Temperatura exterior',
        'Radiación solar',
        'Humedad',
        'Precipitación',
        'Patrones de viento',
        'Cobertura del cielo',
      ],
    },
    en: {
      title:            'Sustainability',
      variables: [
        'Climate Zone',
        'Solar Path',
        'Outdoor Temperature',
        'Solar Radiation',
        'Humidity',
        'Precipitation',
        'Wind Patterns',
        'Sky Coverage',
      ],
    },
  },

  /* ----- Proyectos ----- */
  projects: {
    es: {
      title:            'Proyectos Seleccionados',
      viewProject:      'Ver proyecto',
      items: [
        { slug: 'exuma-lodge',     page: 'proyectos/proyecto-exuma-lodge.html',     name: 'Exuma Lodge',     category: 'Hospitality Lodge',        location: 'Bahamas',        image: 'assets/images/projects/project-covers/cover_001.jpg' },
        { slug: 'haras-san-pablo', page: 'proyectos/proyecto-haras-san-pablo.html', name: 'Haras San Pablo', category: 'Residencial + Productivo', location: 'Argentina',      image: 'assets/images/projects/project-covers/cover_002.jpg' },
        { slug: 'tobar-lodge',     page: 'proyectos/proyecto-tobar-lodge.html',     name: 'Tobar Lodge',     category: 'Hospitalidad / Retiro',    location: 'Argentina',      image: 'assets/images/projects/project-covers/cover_003.jpg' },
        { slug: 'cherokee-ave',    page: 'proyectos/proyecto-cherokee-ave.html',    name: 'Cherokee Ave',    category: 'Vivienda Urbana',          location: 'Estados Unidos', image: 'assets/images/projects/project-covers/cover_004.jpg' },
        { slug: 'cabana-suinda',   page: 'proyectos/proyecto-cabana-suinda.html',   name: 'Cabaña Suindá',   category: 'Cabaña / Refugio',         location: 'Argentina',      image: 'assets/images/projects/project-covers/cover_005.jpg' },
      ],
    },
    en: {
      title:            'Selected Projects',
      viewProject:      'View project',
      items: [
        { slug: 'exuma-lodge',     page: 'proyectos/proyecto-exuma-lodge.html',     name: 'Exuma Lodge',     category: 'Hospitality Lodge',       location: 'Bahamas',       image: 'assets/images/projects/project-covers/cover_001.jpg' },
        { slug: 'haras-san-pablo', page: 'proyectos/proyecto-haras-san-pablo.html', name: 'Haras San Pablo', category: 'Residential + Productive', location: 'Argentina',     image: 'assets/images/projects/project-covers/cover_002.jpg' },
        { slug: 'tobar-lodge',     page: 'proyectos/proyecto-tobar-lodge.html',     name: 'Tobar Lodge',     category: 'Hospitality / Retreat',    location: 'Argentina',     image: 'assets/images/projects/project-covers/cover_003.jpg' },
        { slug: 'cherokee-ave',    page: 'proyectos/proyecto-cherokee-ave.html',    name: 'Cherokee Ave',    category: 'Urban Housing',           location: 'United States', image: 'assets/images/projects/project-covers/cover_004.jpg' },
        { slug: 'cabana-suinda',   page: 'proyectos/proyecto-cabana-suinda.html',   name: 'Cabaña Suindá',   category: 'Cabin / Retreat',         location: 'Argentina',     image: 'assets/images/projects/project-covers/cover_005.jpg' },
      ],
    },
  },

  /* ----- Página de Proyecto (detalle) ----- */
  projectPages: {
    es: {
      backToProjects: 'Volver a proyectos',
      locationLabel:  'Ubicación',
      typeLabel:      'Tipología',
      statusLabel:    'Estado',
      projects: {
        'exuma-lodge': {
          name:         'Exuma Lodge',
          location:     'Bahamas',

          summary:      'Un refugio costero diseñado para maximizar ventilación cruzada, sombra profunda y relación directa con el paisaje marino.',
          type:         'Hospitality Lodge',
          status:       'En desarrollo',
          description1: 'La propuesta se implanta con una lógica de bajo impacto sobre el terreno, elevando los espacios habitables y priorizando materiales durables frente al ambiente salino. El sistema de envolvente combina protección solar pasiva y aperturas estratégicas para reducir cargas térmicas sin sacrificar vistas.',
          description2: 'La arquitectura organiza las áreas comunes y privadas alrededor de patios de aire y recorridos exteriores cubiertos. El objetivo es sostener confort térmico con mínima dependencia mecánica, manteniendo una experiencia inmersiva con el entorno natural de Exuma.',
        },
        'haras-san-pablo': {
          name:         'Haras San Pablo',
          location:     'Argentina',

          summary:      'Infraestructura residencial y productiva integrada al paisaje rural, con estrategias bioclimáticas para estaciones marcadas.',
          type:         'Residencial + Productivo',
          status:       'Construido',
          description1: 'El masterplan articula vivienda, servicios y espacios de trabajo ecuestre mediante piezas de escala controlada y transiciones semicubiertas. La orientación de los volúmenes responde al asoleamiento y a los vientos predominantes para optimizar confort durante todo el año.',
          description2: 'Se priorizaron materiales locales y sistemas constructivos de mantenimiento eficiente, junto con manejo hídrico de superficie y áreas de sombra vegetada. El resultado es un conjunto que combina desempeño ambiental con una lectura sobria del paisaje pampeano.',
        },
        'tobar-lodge': {
          name:         'Tobar Lodge',
          location:     'Argentina',

          summary:      'Arquitectura de baja huella para estancias temporarias, enfocada en confort pasivo y una fuerte continuidad interior-exterior.',
          type:         'Hospitality / Retiro',
          status:       'Anteproyecto',
          description1: 'El proyecto propone una secuencia de pabellones conectados por galerías que filtran radiación y lluvia, permitiendo habitar el borde natural durante todo el año. Cada unidad se dimensiona para captar luz controlada y ventilación cruzada efectiva.',
          description2: 'La materialidad contempla madera tratada, cerramientos livianos de alto desempeño y una paleta neutra que reduce el contraste con el sitio. La estrategia energética prioriza demanda reducida y operación simple en contextos alejados de redes intensivas.',
        },
        'cherokee-ave': {
          name:         'Cherokee Ave',
          location:     'Estados Unidos',

          summary:      'Intervención urbana compacta con foco en eficiencia térmica, iluminación natural y resiliencia climática en trama consolidada.',
          type:         'Vivienda Urbana',
          status:       'En obra',
          description1: 'La operación reorganiza una parcela existente para mejorar ventilación, asoleamiento y privacidad sin perder densidad. Se incorporan estrategias de envolvente continua, control solar móvil y aperturas de alto rendimiento para mejorar desempeño energético.',
          description2: 'El lenguaje arquitectónico combina precisión técnica con una expresión sobria y materialidad durable. El proyecto busca demostrar que en tejidos urbanos exigentes es posible lograr confort ambiental y bajo consumo sin recurrir a soluciones invasivas.',
        },
        'cabana-suinda': {
          name:         'Cabaña Suindá',
          location:     'Corrientes, Argentina',

          summary:      'Un refugio en el litoral argentino integrado al paisaje de esteros, diseñado con criterios bioclimáticos para el clima subtropical húmedo.',
          type:         'Cabaña / Refugio',
          status:       'En desarrollo',
          description1: 'El proyecto se inserta en un entorno de humedales y vegetación nativa, elevando la construcción para minimizar el impacto sobre el terreno natural y favorecer la ventilación cruzada en un clima de alta humedad.',
          description2: 'La arquitectura prioriza materiales regionales y sistemas constructivos adaptados a las condiciones del litoral, buscando confort térmico pasivo y una relación continua entre los espacios habitables y el paisaje circundante.',
        },
      },
    },
    en: {
      backToProjects: 'Back to projects',
      locationLabel:  'Location',
      typeLabel:      'Typology',
      statusLabel:    'Status',
      projects: {
        'exuma-lodge': {
          name:         'Exuma Lodge',
          location:     'Bahamas',

          summary:      'A coastal retreat designed to maximize cross ventilation, deep shade, and a direct relationship with the marine landscape.',
          type:         'Hospitality Lodge',
          status:       'In development',
          description1: 'The proposal is set with a low-impact footprint, lifting habitable areas and prioritizing durable materials for saline conditions. The envelope combines passive solar protection and strategic openings to reduce thermal load while preserving key views.',
          description2: 'Architecture organizes shared and private spaces around air patios and covered exterior circulation. The goal is stable thermal comfort with minimal mechanical dependence, while keeping an immersive connection to Exuma\'s natural setting.',
        },
        'haras-san-pablo': {
          name:         'Haras San Pablo',
          location:     'Argentina',

          summary:      'Residential and productive infrastructure integrated into a rural landscape, with bioclimatic strategies for marked seasons.',
          type:         'Residential + Productive',
          status:       'Built',
          description1: 'The masterplan links housing, service areas, and equestrian workspaces through controlled-scale pieces and semi-covered transitions. Building orientation responds to sun path and prevailing winds to optimize comfort throughout the year.',
          description2: 'Local materials and low-maintenance systems were prioritized, along with surface water management and vegetated shade zones. The result is a compound that balances environmental performance with a sober reading of the pampas landscape.',
        },
        'tobar-lodge': {
          name:         'Tobar Lodge',
          location:     'Argentina',

          summary:      'Low-footprint architecture for temporary stays, focused on passive comfort and strong indoor-outdoor continuity.',
          type:         'Hospitality / Retreat',
          status:       'Concept design',
          description1: 'The project proposes a sequence of pavilions connected by galleries that filter radiation and rain, allowing year-round use of the natural edge. Each unit is dimensioned to capture controlled daylight and effective cross ventilation.',
          description2: 'Materiality combines treated timber, high-performance lightweight enclosures, and a neutral palette that reduces contrast with the site. The energy strategy prioritizes low demand and simple operation in contexts far from intensive infrastructure.',
        },
        'cherokee-ave': {
          name:         'Cherokee Ave',
          location:     'United States',

          summary:      'A compact urban intervention focused on thermal efficiency, daylight access, and climate resilience in a consolidated fabric.',
          type:         'Urban Housing',
          status:       'Under construction',
          description1: 'The operation reorganizes an existing lot to improve ventilation, solar access, and privacy without losing density. Continuous envelope strategies, adjustable solar control, and high-performance openings strengthen overall energy behavior.',
          description2: 'The architectural language combines technical precision with restrained expression and durable materials. The project aims to show that even in demanding urban fabrics, high environmental comfort and low consumption are achievable without invasive systems.',
        },
        'cabana-suinda': {
          name:         'Cabaña Suindá',
          location:     'Corrientes, Argentina',

          summary:      'A retreat in the Argentine littoral integrated into the wetland landscape, designed with bioclimatic criteria for the humid subtropical climate.',
          type:         'Cabin / Retreat',
          status:       'In development',
          description1: 'The project is set within a wetland environment with native vegetation, raising the structure to minimize impact on natural ground and promote cross ventilation in a high-humidity climate.',
          description2: 'The architecture prioritizes regional materials and construction systems adapted to littoral conditions, seeking passive thermal comfort and a continuous relationship between habitable spaces and the surrounding landscape.',
        },
      },
    },
  },

  /* ----- About ----- */
  about: {
    es: {
      title:            'Sobre Nosotros',
      team: [
        {
          name:         'Mia Morrone',
          role:         'Arquitecta',
          bio:          'Arquitecta especializada en el desarrollo de viviendas bioclimáticas y sostenibles, enfocada en el confort y la relación con el clima y el exterior. Integra tecnologías de evaluación ambiental y performática (radiación, iluminación natural, calidad del aire, temperatura y ventilación) como herramientas de diseño para mejorar la habitabilidad y el desempeño climático.',
        },
      ],
    },
    en: {
      title:            'About Us',
      team: [
        {
          name:         'Mia Morrone',
          role:         'Architect',
          bio:          'Architect specializing in the development of bioclimatic and sustainable housing, focused on comfort and the relationship with climate and the outdoors. She integrates environmental and performance assessment technologies (radiation, natural lighting, air quality, temperature and ventilation) as design tools to improve habitability and climate performance.',
        },
      ],
    },
  },

  /* ----- Contacto ----- */
  contact: {
    es: {
      title:            'Contacto',
      nameLabel:        'Nombre',
      emailLabel:       'Email',
      messageLabel:     'Mensaje',
      submitBtn:        'Enviar',
    },
    en: {
      title:            'Contact',
      nameLabel:        'Name',
      emailLabel:       'Email',
      messageLabel:     'Message',
      submitBtn:        'Send',
    },
  },

  /* ----- Values Breakdown ----- */
  valuesBreakdown: {
    en: [
      {
        id: 'climatic-zone',
        title: 'Climatic Zone',
        body: 'Every project begins with a rigorous classification of its geographic location according to altitude, latitude, and regional climate patterns. Understanding the climatic zone establishes the non-negotiable baseline: it defines the range of temperatures the building must handle, the seasonal extremes to anticipate, and the passive strategies available. A high-altitude Andean site and a subtropical coastal site demand entirely different architectural responses — and that difference starts here.',
        metrics: [
          { value: '30+', label: 'climate variables analyzed per site' },
          { value: '5', label: 'Köppen zones studied across current projects' },
          { value: '100%', label: 'of projects climate-classified before design begins' },
        ],
      },
      {
        id: 'sun-path',
        title: 'Sun Path',
        body: 'The trajectory of the sun — its daily arc and seasonal shift — is the primary organizer of architectural form. By mapping the sun path for each specific latitude and longitude, we determine the optimal orientation of every façade, overhang depth, and glazing ratio. A window that admits warming winter sun while blocking the high summer sun is not an accident: it is the result of precise solar geometry applied at the earliest stage of design.',
        metrics: [
          { value: '23.5°', label: 'axial tilt driving seasonal sun angle variation' },
          { value: '4', label: 'seasonal sun path simulations per project' },
          { value: '↓40%', label: 'average solar heat gain reduction through passive shading' },
        ],
      },
      {
        id: 'outdoor-temperature',
        title: 'Outdoor Temperature',
        body: 'Thermal comfort is not a single number — it is a range that shifts with the seasons and fluctuates hour by hour. We analyze annual temperature curves, diurnal swings, and heating and cooling degree days to understand how much the building envelope must work. This data directly informs insulation strategy, thermal mass placement, and the decision between passive heating, natural ventilation, or minimal mechanical conditioning.',
        metrics: [
          { value: '8,760', label: 'hourly temperature data points analyzed per year' },
          { value: '18–26°C', label: 'target indoor comfort range without mechanical systems' },
          { value: '↓60%', label: 'energy demand reduction vs. conventional construction' },
        ],
      },
      {
        id: 'solar-radiation',
        title: 'Solar Radiation',
        body: 'Solar radiation quantifies the actual energy arriving at exterior surfaces — not just whether the sun is up, but how intensely it strikes walls, roofs, and glazing throughout the year. We calculate global horizontal irradiance and direct normal irradiance to evaluate overheating risk, passive solar gain potential, and photovoltaic viability. Every surface of a Timbó building is modeled for its annual radiation load before a single material is specified.',
        metrics: [
          { value: '5.2', label: 'avg kWh/m²/day peak solar resource across project sites' },
          { value: '3', label: 'surface orientations radiation-modeled per design iteration' },
          { value: '↓35%', label: 'cooling load reduction through radiation-informed shading' },
        ],
      },
      {
        id: 'humidity',
        title: 'Humidity',
        body: 'Moisture in the air affects not only how people feel, but how buildings perform over time. High humidity accelerates material degradation, promotes mold growth, and can undermine insulation effectiveness; low humidity dries out materials and raises perceived cold. We map relative humidity patterns across seasons to select hygroscopic materials that regulate moisture naturally, detail ventilation paths that prevent condensation, and design spaces where the air itself contributes to comfort.',
        metrics: [
          { value: '40–65%', label: 'relative humidity target range for optimal comfort' },
          { value: '12', label: 'monthly humidity profiles analyzed per project' },
          { value: '↑30%', label: 'occupant comfort improvement through humidity-responsive design' },
        ],
      },
      {
        id: 'precipitation',
        title: 'Precipitation',
        body: 'Rain and snow are not just weatherproofing concerns — they are design inputs. Annual precipitation volumes, seasonal distribution, and peak intensity events inform roof geometry, drainage strategy, water harvesting potential, and landscape design. In water-scarce climates, precipitation becomes a resource to capture and store; in flood-prone zones, it becomes a force to redirect and dissipate. Either way, the building must be conceived as part of its hydrological context.',
        metrics: [
          { value: '365', label: 'daily precipitation records analyzed per site per year' },
          { value: '↑80%', label: 'stormwater managed on-site through passive design' },
          { value: '100%', label: 'of roofs designed for rainwater harvesting where feasible' },
        ],
      },
      {
        id: 'wind-patterns',
        title: 'Wind Patterns',
        body: 'Prevailing wind direction and intensity shape everything from cross-ventilation strategy to structural loads and outdoor comfort. A wind rose analysis reveals the dominant directions across all seasons, allowing us to position openings for maximum natural airflow in summer while shielding occupants from cold winter winds. Wind is a free energy source when harnessed — and a thermal penalty when ignored.',
        metrics: [
          { value: '16', label: 'wind directions tracked in rose analysis' },
          { value: '↑70%', label: 'naturally ventilated floor area in wind-optimized projects' },
          { value: '↓50%', label: 'mechanical ventilation need through passive airflow design' },
        ],
      },
      {
        id: 'sky-coverage',
        title: 'Sky Coverage',
        body: 'The fraction of sky covered by clouds determines the quality and quantity of natural light reaching interior spaces. An overcast climate calls for maximizing diffuse daylight through generous glazing and light-colored surfaces; a predominantly clear sky demands precise solar control to prevent glare and overheating. Sky coverage data guides our daylight simulations, helping us design spaces that feel luminous and comfortable without depending on artificial lighting during daytime hours.',
        metrics: [
          { value: '300+', label: 'annual clear sky hours analyzed per project site' },
          { value: '↓45%', label: 'artificial lighting energy use through daylight design' },
          { value: '2–3%', label: 'minimum daylight factor target for all occupied spaces' },
        ],
      },
    ],
  },

  /* ----- Footer ----- */
  footer: {
    es: {
      rights:           '© 2026 Timbó. Todos los derechos reservados.',
    },
    en: {
      rights:           '© 2026 Timbó. All rights reserved.',
    },
  },

};
