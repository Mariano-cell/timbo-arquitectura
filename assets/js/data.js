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
      services:         'Servicios',
      about:            'Sobre Nosotros',
      contact:          'Contacto',
    },
    en: {
      home:             'Home',
      projects:         'Projects',
      sustainability:   'Sustainability',
      services:         'Services',
      about:            'About Us',
      contact:          'Contact',
    },
  },

  /* ----- Home ----- */
  home: {
    es: {
      heroTagline:      '<strong>Arquitectura</strong> en armonía<br>con el <strong>clima</strong> y la <strong>naturaleza</strong>.',
      introLabel:       'Lo que hacemos',
      claim:            '<span class="intro__claim-line"><span class="intro__claim-line-inner">Entre lo salvaje y</span></span><span class="intro__claim-line"><span class="intro__claim-line-inner">las personas.</span></span>',
      introText:        'Timbó es un estudio de arquitectura, diseño, consultoría e investigación con origen en Buenos Aires. Comprometido con contribuir a un futuro bajo en carbono, permite a las personas experimentar la naturaleza en su máxima expresión.',
      sustainabilityStatement: '<span class="philosophy__statement-line"><span class="philosophy__statement-line-inner">Diseño resiliente y</span></span><span class="philosophy__statement-line"><span class="philosophy__statement-line-inner">adaptado</span></span><span class="philosophy__statement-line"><span class="philosophy__statement-line-inner">a las condiciones</span></span><span class="philosophy__statement-line"><span class="philosophy__statement-line-inner">ambientales</span></span>',
      philosophyText:   'Mediante el análisis de datos climáticos, los proyectos se adaptan a las condiciones específicas de cada lugar, asegurando una baja demanda energética y una alta calidad ambiental tanto en espacios interiores como exteriores.',
      natureDialogueText: 'Los elementos de la naturaleza configuran el lenguaje arquitectónico de cada una de nuestras propuestas, y dan forma a espacios que establecen un diálogo duradero entre las personas y el mundo natural.',
      philosophyCta:    'VER MÁS',
      philosophyClimateZone: 'Zona<br>climática',
      philosophySunPath: 'Trayectoria<br>solar',
      philosophyOutdoorTemperature: 'Temperatura<br>exterior',
      philosophyHumidity: 'Humedad',
      philosophyPrecipitation: 'Precipitación',
      philosophyWindPatterns: 'Patrones<br>de viento',
      philosophySkyCoverage: 'Cobertura<br>del cielo',
    },
    en: {
      heroTagline:      '<strong>Architecture</strong> shaped by<br><strong>climate</strong> and <strong>place</strong>.',
      introLabel:       'Our practice',
      claim:            '<span class="intro__claim-line"><span class="intro__claim-line-inner">Between the wild</span></span><span class="intro__claim-line"><span class="intro__claim-line-inner">and the people</span></span>',
      introText:        'Timbó is a Buenos Aires–based architecture, design, and research consultancy. We are committed to a low-carbon future and design spaces that respond directly to their natural environment.',
      sustainabilityStatement: '<span class="philosophy__statement-line"><span class="philosophy__statement-line-inner">Resilient design,</span></span><span class="philosophy__statement-line"><span class="philosophy__statement-line-inner">grounded in climate</span></span><span class="philosophy__statement-line"><span class="philosophy__statement-line-inner">and place.</span></span>',
      philosophyText:   'Our work is grounded in climate data and environmental analysis, ensuring each project is adapted to its specific conditions. This approach reduces energy demand and improves environmental performance and user comfort.',
      natureDialogueText: 'We prioritise natural systems in the design process, allowing site conditions, climate, and landscape to inform the architectural language. The result is architecture that is efficient, resilient, and closely connected to its surroundings.',
      philosophyCta:    'SEE MORE',
      philosophyClimateZone: 'Climate<br>zone',
      philosophySunPath: 'Solar<br>path',
      philosophyOutdoorTemperature: 'Outdoor<br>temperature',
      philosophyHumidity: 'Humidity',
      philosophyPrecipitation: 'Precipitation',
      philosophyWindPatterns: 'Wind<br>patterns',
      philosophySkyCoverage: 'Sky<br>coverage',
    },
  },

  /* ----- Sustentabilidad ----- */
  sustainability: {
    es: {
      title:            'Sustentabilidad',
      heroTitle:        'Sustentabilidad<br>no es un rótulo ni<br>una etiqueta.',
      heroText:         'Para nosotros, significa diseñar arquitectura que consuma menos energía, dure más años y profundice la relación entre las personas y la naturaleza. <br><br>Es la base de cómo proyectamos.',
      processTitle:     'Nuestro proceso<br>comienza con la<br>investigación.',
      processText:      'A través del método científico, reducimos la dependencia de los edificios en energía proveniente de combustibles fósiles. Mediante la orientación, la forma y la materialidad, maximizamos el confort y la calidad ambiental interior.',
      climateTitle:     '<span class="sust-climate__title-line"><span class="sust-climate__title-line-inner">Trabajamos</span></span><span class="sust-climate__title-line"><span class="sust-climate__title-line-inner">con el sol, el viento</span></span><span class="sust-climate__title-line"><span class="sust-climate__title-line-inner">y el territorio.</span></span>',
      climateText:      'Analizamos datos climáticos locales (radiación solar, patrones de viento, humedad y variaciones estacionales) y medimos condiciones reales en el sitio. Modelamos el desempeño mediante simulaciones dinámicas, donde cada decisión se prueba, se calibra y se valida.<br><br>No se supone: se comprueba.',
      outdoorClimate: {
        figureAriaLabel:         'Datos climáticos anuales de Buenos Aires, Argentina',
        koppen:                  'Clima subtropical húmedo',
        months: {
          jan: 'Ene',
          feb: 'Feb',
          mar: 'Mar',
          apr: 'Abr',
          may: 'May',
          jun: 'Jun',
          jul: 'Jul',
          aug: 'Ago',
          sep: 'Sep',
          oct: 'Oct',
          nov: 'Nov',
          dec: 'Dic',
        },
        tempPanelLabel:          'Temperatura',
        tempPanelAriaLabel:      'Temperatura y humedad mensual',
        tempReadoutDefaultDesktop: 'Pasá el cursor sobre el gráfico para ver los valores mes a mes',
        tempReadoutDefaultMobile:  'Mantené pulsado el gráfico para ver los valores mes a mes',
        tempLegendMeanDesktop:   'Temperatura media',
        tempLegendMeanMobile:    'Temp. media',
        tempLegendRange:         'Rango min — máx',
        tempLegendHumidity:      'Humedad relativa',
        radiationPanelLabel:     'Radiación solar + lluvia',
        radiationPanelAriaLabel: 'Radiación solar y lluvia mensual',
        radiationReadoutDefault: 'Radiación global horizontal y precipitación mensual',
        radiationLegendGlobal:   'Radiación global',
        radiationLegendRain:     'Lluvia',
        windPanelLabel:          'Viento',
        windPanelAriaLabel:      'Velocidad media del viento mensual',
        windReadoutDefault:      'Velocidad media superficial',
        windLegend:              'Viento',
        readout: {
          weekAbbr: 'sem',
          mean:     'Media',
          min:      'Mín',
          max:      'Máx',
          humidity: 'Humedad',
          radiation:'Radiación',
          rain:     'Lluvia',
          speed:    'Velocidad',
        },
      },
      pillars: {
        items: {
          temperatura: {
            title: 'TEMPERATURA',
            description: 'Estudio de las condiciones térmicas internas y externas del edificio. Se mide la cantidad de calor ganado y perdido a lo largo del tiempo, teniendo en cuenta la ocupación, el equipamiento, la envolvente y la geometría del edificio. Las simulaciones térmicas dinámicas (DTS) permiten modelar los distintos mecanismos de transferencia de calor.',
            icon: 'assets/images/sustainability/sust-pilars/temperatura.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/temperatura-texto.svg',
          },
          radiacion: {
            title: 'RADIACIÓN',
            description: 'Evalúa el impacto de la energía solar en el edificio, teniendo en cuenta la radiación solar directa y la difusa. Representa un elemento esencial en el diseño pasivo, por su directa influencia sobre la temperatura interior y el gasto energético asociado. Su análisis posibilita la mejora del rendimiento térmico y la maximización de la eficiencia en sistemas solares.',
            icon: 'assets/images/sustainability/sust-pilars/radioacion.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/radiacion-texto.svg',
          },
          luz: {
            title: 'LUZ',
            description: 'Análisis y optimización de la entrada de luz natural en el interior y exterior del edificio, considerando el programa de necesidades y el uso previsto para cada área. Se busca garantizar una condición lumínica de calidad, reduciendo la dependencia de sistemas artificiales. Se simulan los niveles de iluminancia y luminancia.',
            icon: 'assets/images/sustainability/sust-pilars/luz.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/luz-texto.svg',
          },
          flujo_aire: {
            title: 'FLUJO DE AIRE',
            description: 'Describe la presencia y el movimiento del aire en el interior y en el exterior del edificio. Permite detectar oportunidades para ventilación natural y enfriamiento pasivo, mediante el análisis de patrones de viento. Se utilizan herramientas de dinámica de fluidos computacional (CFD) para simular y controlar estos patrones.',
            icon: 'assets/images/sustainability/sust-pilars/flujo-de-aire.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/flujo-de-aire-texto.svg',
          },
          calidad_aire: {
            title: 'CALIDAD DE AIRE',
            description: 'Registro de los niveles de CO₂ y otros contaminantes. Se monitorea para asegurar un ambiente saludable. Una buena calidad de aire mejora el bienestar, manteniendo niveles adecuados de oxígeno y reduciendo sustancias nocivas. Esto requiere ventilación eficiente y el uso de materiales no tóxicos.',
            icon: 'assets/images/sustainability/sust-pilars/calidad-de-aire.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/calidad-de-aire-texto.svg',
          },
          emisiones: {
            title: 'EMISIONES DE CARBONO',
            description: 'Incluye la suma de las emisiones de carbono, tanto las asociadas a los materiales como a la operación, a lo largo de la vida útil completa del edificio. Abarca la calefacción, refrigeración, iluminación y otros consumos energéticos. Mediante herramientas como EPD y SUPIM se evalúan estas emisiones y se diseñan estrategias para reducirlas.',
            icon: 'assets/images/sustainability/sust-pilars/emision-de-carbono.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/emisiones-de-carbono-texto.svg',
          },
        },
      },
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
      emissionsChartTitle:     'Emisiones globales<br>de CO<sub>2</sub> por sectores',
      emissionsLabelOther:     'Otros',
      emissionsLabelTransport: 'Transporte',
      emissionsLabelIndustry:  'Industria',
      emissionsLabelMaterials: 'Materiales de construcción',
      emissionsLabelBuildings: 'Consumo energético en edificios',
    },
    en: {
      title:            'Sustainability',
      heroTitle:        'Sustainability<br>is not a label.',
      heroText:         'For us, it means designing architecture that consumes less energy, lasts longer, and strengthens the relationship between people and nature. It is not an add-on: <br><br>It is the foundation of how we design.',
      processTitle:     'Our process<br>begins<br>with research.',
      processText:      'Through the scientific method, we reduce buildings’ dependence on fossil-fuel energy. Orientation, form, and materiality are used to maximise comfort and indoor environmental quality.',
      climateTitle:     '<span class="sust-climate__title-line"><span class="sust-climate__title-line-inner">We work</span></span><span class="sust-climate__title-line"><span class="sust-climate__title-line-inner">with the sun, the wind,</span></span><span class="sust-climate__title-line"><span class="sust-climate__title-line-inner">and the land.</span></span>',
      climateText:      'We analyse local climate data, such as solar radiation, wind patterns, humidity, and seasonal variations, and measure real conditions on site. Performance is modelled through dynamic simulations, where each decision is tested, calibrated, and validated.<br><br>It is not assumed, it is verified.',
      outdoorClimate: {
        figureAriaLabel:         'Annual climate data for Buenos Aires, Argentina',
        koppen:                  'Humid subtropical climate',
        months: {
          jan: 'Jan',
          feb: 'Feb',
          mar: 'Mar',
          apr: 'Apr',
          may: 'May',
          jun: 'Jun',
          jul: 'Jul',
          aug: 'Aug',
          sep: 'Sep',
          oct: 'Oct',
          nov: 'Nov',
          dec: 'Dec',
        },
        tempPanelLabel:          'Temperature',
        tempPanelAriaLabel:      'Monthly temperature and humidity',
        tempReadoutDefaultDesktop: 'Hover over the chart to view month-by-month values',
        tempReadoutDefaultMobile:  'Press and hold the chart to view month-by-month values',
        tempLegendMeanDesktop:   'Mean temperature',
        tempLegendMeanMobile:    'Mean temp.',
        tempLegendRange:         'Min-max range',
        tempLegendHumidity:      'Relative humidity',
        radiationPanelLabel:     'Solar radiation + rainfall',
        radiationPanelAriaLabel: 'Monthly solar radiation and rainfall',
        radiationReadoutDefault: 'Global horizontal radiation and monthly precipitation',
        radiationLegendGlobal:   'Global radiation',
        radiationLegendRain:     'Rainfall',
        windPanelLabel:          'Wind',
        windPanelAriaLabel:      'Monthly average wind speed',
        windReadoutDefault:      'Average surface wind speed',
        windLegend:              'Wind',
        readout: {
          weekAbbr: 'wk',
          mean:     'Mean',
          min:      'Min',
          max:      'Max',
          humidity: 'Humidity',
          radiation:'Radiation',
          rain:     'Rain',
          speed:    'Speed',
        },
      },
      pillars: {
        items: {
          temperatura: {
            title: 'TEMPERATURE',
            description: 'This analysis looks at how heat is gained and lost within a space over a specific period of time, helping to understand how elements like occupancy, equipment, building envelope, and overall form affect indoor temperatures. Dynamic Thermal Simulations (DTS) are used to model the different types of heat transfer, convective, conductive, and radiative, within the building. The aim is to create indoor environments that maintain thermal comfort for occupants throughout the year.',
            icon: 'assets/images/sustainability/sust-pilars/temperatura.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/english/temperature.svg',
          },
          radiacion: {
            title: 'RADIATION',
            description: 'This refers to the impact of solar energy on a building, including both direct sunlight and diffuse radiation scattered by the atmosphere. Solar radiation is a key factor in passive design, as it affects indoor temperatures and overall energy use. By analysing radiation patterns, we can improve thermal performance and optimise the efficiency of solar energy systems.',
            icon: 'assets/images/sustainability/sust-pilars/radioacion.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/english/radiation.svg',
          },
          luz: {
            title: 'DAYLIGHT',
            description: 'This involves assessing access to natural light, both direct sunlight and diffuse light, inside and outside the building. The goal is to ensure high-quality lighting while maximising energy efficiency. This is achieved through illuminance and luminance modeling, lighting energy calculations, and simulations.',
            icon: 'assets/images/sustainability/sust-pilars/luz.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/english/light.svg',
          },
          flujo_aire: {
            title: 'AIRFLOW',
            description: 'This is about understanding how wind moves in and around buildings, with the goal of identifying airflow requirements for passive cooling and exploring natural ventilation strategies to supply fresh air. Computational Fluid Dynamics (CFD) tools are used to simulate and analyse these patterns.',
            icon: 'assets/images/sustainability/sust-pilars/flujo-de-aire.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/english/air-flow.svg',
          },
          calidad_aire: {
            title: 'AIR QUALITY',
            description: 'This involves monitoring levels of CO2 and other indoor pollutants to ensure a healthy, comfortable environment for occupants. Good air quality supports wellbeing by maintaining adequate oxygen levels and reducing exposure to harmful substances. Achieving this requires efficient ventilation systems and the use of non-toxic, low-emission materials throughout the building.',
            icon: 'assets/images/sustainability/sust-pilars/calidad-de-aire.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/english/air-quality.svg',
          },
          emisiones: {
            title: 'CARBON EMISSIONS',
            description: 'This refers to the total carbon emissions linked to a building\'s lifecycle, from the production, transport, and assembly of materials (embodied carbon) to the emissions generated during its use (operational carbon), including energy consumed for heating, cooling, lighting, and other functions. Together, they define the building\'s overall carbon footprint and environmental impact. Tools like Environmental Product Declarations (EPD) and Sustainable Urban Project Information Modeling (SUPIM) help assess these emissions and guide cost-effective strategies for reducing carbon throughout the building\'s life.',
            icon: 'assets/images/sustainability/sust-pilars/emision-de-carbono.svg',
            labelSvg: 'assets/images/sustainability/sust-pilars/english/carbon-emissions.svg',
          },
        },
      },
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
      emissionsChartTitle:     'Global CO<sub>2</sub> emissions<br>by sector',
      emissionsLabelOther:     'Other',
      emissionsLabelTransport: 'Transport',
      emissionsLabelIndustry:  'Industry',
      emissionsLabelMaterials: 'Building materials',
      emissionsLabelBuildings: 'Building energy consumption',
    },
  },

  /* ----- Proyectos ----- */
  projects: {
    es: {
      title:            'Nuestros proyectos',
      viewProject:      'Ver proyecto',
      items: [
        { slug: 'exuma-lodge',     page: 'proyectos/proyecto-exuma-lodge.html',     name: 'Exuma Lodge',                    category: 'Hospitality Lodge',        location: 'Bahamas',                image: 'assets/images/projects/project-covers/exuma-lodge-bahamas-01.jpg' },
        { slug: 'haras-san-pablo', page: 'proyectos/proyecto-haras-san-pablo.html', name: 'Haras San Pablo Private Estate', category: 'Residencial + Productivo', location: 'Buenos Aires, Argentina', image: 'assets/images/projects/project-covers/haras-sanpablo-001.jpg' },
        { slug: 'tobar-lodge',     page: 'proyectos/proyecto-tobar-lodge.html',     name: 'Tobar Lodge',                    category: 'Hospitalidad / Retiro',    location: 'Tucumán, Argentina',      image: 'assets/images/projects/project-covers/tobar-lodge-02.jpg' },
        { slug: 'cabana-suinda',   page: 'proyectos/proyecto-cabana-suinda.html',   name: 'Suindá Lodge',                   category: 'Cabaña / Refugio',         location: 'Corrientes, Argentina',   image: 'assets/images/projects/project-covers/cabana-suinda.jpg' },
      ],
    },
    en: {
      title:            'Our Projects',
      viewProject:      'View project',
      items: [
        { slug: 'exuma-lodge',     page: 'proyectos/proyecto-exuma-lodge.html',     name: 'Exuma Lodge',                    category: 'Hospitality Lodge',        location: 'Bahamas',                 image: 'assets/images/projects/project-covers/exuma-lodge-bahamas-01.jpg' },
        { slug: 'haras-san-pablo', page: 'proyectos/proyecto-haras-san-pablo.html', name: 'Haras San Pablo Private Estate', category: 'Residential + Productive', location: 'Buenos Aires, Argentina', image: 'assets/images/projects/project-covers/haras-sanpablo-001.jpg' },
        { slug: 'tobar-lodge',     page: 'proyectos/proyecto-tobar-lodge.html',     name: 'Tobar Lodge',                    category: 'Hospitality / Retreat',    location: 'Tucumán, Argentina',      image: 'assets/images/projects/project-covers/tobar-lodge-02.jpg' },
        { slug: 'cabana-suinda',   page: 'proyectos/proyecto-cabana-suinda.html',   name: 'Suindá Lodge',                   category: 'Cabin / Retreat',          location: 'Corrientes, Argentina',   image: 'assets/images/projects/project-covers/cabana-suinda.jpg' },
      ],
    },
  },

  /* ----- Galería de Proyectos (proyectos.html) ----- */
  projectsGallery: {
    es: {
      factLabels: {
        climate:     'CLIMA /',
        biome:       'BIOMA /',
        terrain:     'TERRENO /',
        coveredArea: 'ÁREA CUBIERTA /',
      },
      items: {
        'exuma-lodge': {
          name:        'Exuma Lodge',
          location:    'Bahamas',
          category:    'Comercial',
          climate:     'Tropical',
          biome:       'Bosque seco',
          terrain:     '5.640 m²',
          coveredArea: '800 m²',
        },
        'tobar-lodge': {
          name:        'Tobar Lodge',
          location:    'Tucumán, Argentina',
          category:    'Comercial',
          climate:     'Subtropical seco',
          biome:       'Bosque chaqueño',
          terrain:     '60.000 m2',
          coveredArea: '420 m2',
        },
        'praderas-cabin': {
          name:        'Praderas Cabin',
          location:    'Cerro Perito Moreno, Río Negro, Argentina',
          category:    'Comercial',
          climate:     'Patagónico',
          biome:       'Bosque andino',
          terrain:     '3.000 m2',
          coveredArea: '220 m2',
        },
        'cabana-suinda': {
          name:        'Suindá Lodge',
          location:    'Corrientes, Argentina',
          category:    'Comercial',
          climate:     'Húmedo subtropical',
          biome:       'Humedales',
          terrain:     '7.000 m2',
          coveredArea: '120 m2',
        },
        'cardano-clubhouse': {
          name:        'Clubhouse Barrio Cardano',
          location:    'Buenos Aires, Argentina',
          category:    'Comercial',
          climate:     'Templado subtropical',
          biome:       'Pampa',
          terrain:     '5.800 m2',
          coveredArea: '450 m2',
        },
        'haras-san-pablo': {
          name:        'Casa de Campo<br>Haras San Pablo',
          location:    'Buenos Aires, Argentina',
          category:    'Residencial',
          climate:     'Templado subtropical',
          biome:       'Pampa',
          terrain:     '3.200 m2',
          coveredArea: '950 m2',
        },
        'chacras-de-murray': {
          name:        'Casa de Campo<br>Chacras de Murray',
          location:    'Buenos Aires, Argentina',
          category:    'Residencial',
          climate:     'Templado subtropical',
          biome:       'Pampa',
          terrain:     '3.000 m2',
          coveredArea: '400 m2',
        },
        'club-de-mar': {
          name:        'Casa de Playa Club de Mar',
          location:    'José Ignacio, Uruguay',
          category:    'Residencial',
          climate:     'Atlántico',
          biome:       'Pastizal litoral',
          terrain:     '2.500 m2',
          coveredArea: '120 m2',
        },
        'cherokee-ave': {
          name:        'Casa Cherokee',
          location:    'Miami, Estados Unidos',
          category:    'Residencial',
          climate:     'Tropical monzónico',
          biome:       'Bosque costero',
          terrain:     '1.000 m2',
          coveredArea: '420 m2',
        },
      },
    },
    en: {
      factLabels: {
        climate:     'CLIMATE /',
        biome:       'BIOME /',
        terrain:     'LAND /',
        coveredArea: 'BUILT AREA /',
      },
      items: {
        'exuma-lodge': {
          name:        'Exuma Lodge',
          location:    'Bahamas',
          category:    'Commercial',
          climate:     'Tropical',
          biome:       'Dry forest',
          terrain:     '5,640 m²',
          coveredArea: '800 m²',
        },
        'tobar-lodge': {
          name:        'Tobar Lodge',
          location:    'Tucumán, Argentina',
          category:    'Commercial',
          climate:     'Subtropical dry',
          biome:       'Chaco forest',
          terrain:     '60.000 m2',
          coveredArea: '420 m2',
        },
        'praderas-cabin': {
          name:        'Praderas Cabin',
          location:    'Cerro Perito Moreno, Río Negro, Argentina',
          category:    'Commercial',
          climate:     'Patagonian',
          biome:       'Andean forest',
          terrain:     '3.000 m2',
          coveredArea: '220 m2',
        },
        'cabana-suinda': {
          name:        'Suindá Lodge',
          location:    'Corrientes, Argentina',
          category:    'Commercial',
          climate:     'Humid subtropical',
          biome:       'Wetlands',
          terrain:     '7.000 m2',
          coveredArea: '120 m2',
        },
        'cardano-clubhouse': {
          name:        'Cardano Clubhouse',
          location:    'Buenos Aires, Argentina',
          category:    'Commercial',
          climate:     'Subtropical temperate',
          biome:       'Pampas grasslands',
          terrain:     '5.800 m2',
          coveredArea: '450 m2',
        },
        'haras-san-pablo': {
          name:        'Haras San Pablo<br>Private Estate',
          location:    'Buenos Aires, Argentina',
          category:    'Residential',
          climate:     'Subtropical temperate',
          biome:       'Pampas grasslands',
          terrain:     '3.200 m2',
          coveredArea: '950 m2',
        },
        'chacras-de-murray': {
          name:        'Chacras de Murray<br>Private Estate',
          location:    'Buenos Aires, Argentina',
          category:    'Residential',
          climate:     'Subtropical temperate',
          biome:       'Pampas grasslands',
          terrain:     '3.000 m2',
          coveredArea: '400 m2',
        },
        'club-de-mar': {
          name:        'Club de Mar Beach House',
          location:    'José Ignacio, Uruguay',
          category:    'Residential',
          climate:     'Atlantic',
          biome:       'Shore grassland',
          terrain:     '2.500 m2',
          coveredArea: '120 m2',
        },
        'cherokee-ave': {
          name:        'Cherokee Residence',
          location:    'Miami, United States',
          category:    'Residential',
          climate:     'Tropical monsoon',
          biome:       'Coastal forest',
          terrain:     '1.000 m2',
          coveredArea: '420 m2',
        },
      },
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
          name:         'Haras San Pablo Private Estate',
          location:     'Buenos Aires, Argentina',

          summary:      'Infraestructura residencial y productiva integrada al paisaje rural, con estrategias bioclimáticas para estaciones marcadas.',
          type:         'Residencial + Productivo',
          status:       'Construido',
          description1: 'El masterplan articula vivienda, servicios y espacios de trabajo ecuestre mediante piezas de escala controlada y transiciones semicubiertas. La orientación de los volúmenes responde al asoleamiento y a los vientos predominantes para optimizar confort durante todo el año.',
          description2: 'Se priorizaron materiales locales y sistemas constructivos de mantenimiento eficiente, junto con manejo hídrico de superficie y áreas de sombra vegetada. El resultado es un conjunto que combina desempeño ambiental con una lectura sobria del paisaje pampeano.',
        },
        'tobar-lodge': {
          name:         'Tobar Lodge',
          location:     'Tucumán, Argentina',

          summary:      'Arquitectura de baja huella para estancias temporarias, enfocada en confort pasivo y una fuerte continuidad interior-exterior.',
          type:         'Hospitality / Retiro',
          status:       'Anteproyecto',
          description1: 'El proyecto propone una secuencia de pabellones conectados por galerías que filtran radiación y lluvia, permitiendo habitar el borde natural durante todo el año. Cada unidad se dimensiona para captar luz controlada y ventilación cruzada efectiva.',
          description2: 'La materialidad contempla madera tratada, cerramientos livianos de alto desempeño y una paleta neutra que reduce el contraste con el sitio. La estrategia energética prioriza demanda reducida y operación simple en contextos alejados de redes intensivas.',
        },
        'cherokee-ave': {
          name:         'Cherokee Residence',
          location:     'Miami, Florida, EE.UU.',

          summary:      'Intervención urbana compacta con foco en eficiencia térmica, iluminación natural y resiliencia climática en trama consolidada.',
          type:         'Vivienda Urbana',
          status:       'En obra',
          description1: 'La operación reorganiza una parcela existente para mejorar ventilación, asoleamiento y privacidad sin perder densidad. Se incorporan estrategias de envolvente continua, control solar móvil y aperturas de alto rendimiento para mejorar desempeño energético.',
          description2: 'El lenguaje arquitectónico combina precisión técnica con una expresión sobria y materialidad durable. El proyecto busca demostrar que en tejidos urbanos exigentes es posible lograr confort ambiental y bajo consumo sin recurrir a soluciones invasivas.',
        },
        'cabana-suinda': {
          name:         'Suindá Lodge',
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
          name:         'Haras San Pablo Private Estate',
          location:     'Buenos Aires, Argentina',

          summary:      'Residential and productive infrastructure integrated into a rural landscape, with bioclimatic strategies for marked seasons.',
          type:         'Residential + Productive',
          status:       'Built',
          description1: 'The masterplan links housing, service areas, and equestrian workspaces through controlled-scale pieces and semi-covered transitions. Building orientation responds to sun path and prevailing winds to optimize comfort throughout the year.',
          description2: 'Local materials and low-maintenance systems were prioritized, along with surface water management and vegetated shade zones. The result is a compound that balances environmental performance with a sober reading of the pampas landscape.',
        },
        'tobar-lodge': {
          name:         'Tobar Lodge',
          location:     'Tucumán, Argentina',

          summary:      'Low-footprint architecture for temporary stays, focused on passive comfort and strong indoor-outdoor continuity.',
          type:         'Hospitality / Retreat',
          status:       'Concept design',
          description1: 'The project proposes a sequence of pavilions connected by galleries that filter radiation and rain, allowing year-round use of the natural edge. Each unit is dimensioned to capture controlled daylight and effective cross ventilation.',
          description2: 'Materiality combines treated timber, high-performance lightweight enclosures, and a neutral palette that reduces contrast with the site. The energy strategy prioritizes low demand and simple operation in contexts far from intensive infrastructure.',
        },
        'cherokee-ave': {
          name:         'Cherokee Residence',
          location:     'Miami, Florida, U.S.',

          summary:      'A compact urban intervention focused on thermal efficiency, daylight access, and climate resilience in a consolidated fabric.',
          type:         'Urban Housing',
          status:       'Under construction',
          description1: 'The operation reorganizes an existing lot to improve ventilation, solar access, and privacy without losing density. Continuous envelope strategies, adjustable solar control, and high-performance openings strengthen overall energy behavior.',
          description2: 'The architectural language combines technical precision with restrained expression and durable materials. The project aims to show that even in demanding urban fabrics, high environmental comfort and low consumption are achievable without invasive systems.',
        },
        'cabana-suinda': {
          name:         'Suindá Lodge',
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
      heroTitle:        'Somos Gerónimo Vigil<br>y Mia Morrone',
      heroTextLead:     'Arquitectos argentinos y apasionados por la naturaleza.',
      heroTextBody:     'Timbó nació de una convicción compartida: que la arquitectura debe profundizar nuestra conexión con la naturaleza y enriquecer la forma en que la habitamos, respondiendo de manera inteligente al clima y al lugar.',
      foundersText1:    'Gerónimo, graduado en la Universidad de Belgrano, lidera el área de diseño del estudio. Su experiencia proyectando en paisajes silvestres y prístinos dio forma a un enfoque sensible y profundamente contextual. Cada proyecto nace del entorno, equilibrando materialidad, proporción y simplicidad contemporánea, con una identidad clara y coherente.',
      foundersText2:    'Mía completó sus estudios de grado y posgrado en la Universidad Torcuato Di Tella y obtuvo un Master of Science in Sustainable Environmental Design en la Architectural Association de Londres. Lidera el área de desempeño ambiental e investigación, aplicando estrategias rigurosas, medibles y basadas en evidencia para asegurar que cada diseño alcance los más altos estándares ambientales.',
      approachText:     'Nuestros diseños responden al clima y anticipan los desafíos de un entorno cambiante, combinando territorio, arquitectura y ciencia. Nuestro principal objetivo es el bienestar de las personas: crear espacios que promuevan disfrute y confort.<br><br>Jardines, campos, montañas o ciudades: cada paisaje es una oportunidad para diseñar en diálogo con la naturaleza. Abordamos cada desafío, sin importar la escala, el clima o el contexto, con responsabilidad y creatividad.',
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
      heroTitle:        'We are Gerónimo Vigil and Mía Morrone',
      heroTextLead:     'Argentine architects and lifelong observers of the natural world.',
      heroTextBody:     'Timbó was founded on a shared belief: architecture should strengthen our connection to nature and enrich the way we inhabit it, responding intelligently to climate and place.',
      foundersText1:    'Gerónimo, a graduate of Universidad de Belgrano, leads the studio’s design vision. His experience working in remote and sensitive landscapes has shaped a contextual approach in which each project emerges from its surroundings, balancing materiality, proportion, and contemporary simplicity with a clear and coherent identity.',
      foundersText2:    'Mía completed her graduate and postgraduate studies at the Universidad Torcuato Di Tella and holds a Master of Science in Sustainable Environmental Design from the Architectural Association in London. She leads environmental performance and research, applying rigorous, measurable, and evidence-based strategies to ensure each project meets high environmental standards.',
      approachText:     'Our work brings together architecture and science. We design in response to climate and anticipate the challenges of a changing environment, with a focus on human wellbeing: creating spaces that support comfort, use and daily life.<br><br>Gardens, fields, mountains or cities: every landscape is an opportunity to work in dialogue with its conditions. We approach every project, regardless of scale, climate, or context, with the same level of attention, responsibility and care.',
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
      callAction:       'Llamar',
      whatsappAction:   'WhatsApp',
      nameLabel:        'Nombre',
      emailLabel:       'Email',
      messageLabel:     'Mensaje',
      submitBtn:        'Enviar',
    },
    en: {
      title:            'Contact',
      callAction:       'Call',
      whatsappAction:   'WhatsApp',
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
