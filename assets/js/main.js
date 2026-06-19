/* ============================================================
   TIMBÓ — main.js
   Inicialización, sistema de idiomas, componentes compartidos.

   ARQUITECTURA:
   - Timbo: objeto principal que orquesta todo
   - Timbo.i18n: manejo de idioma (leer, cambiar, aplicar)
   - Timbo.navTheme: cambia color del nav según la sección visible
   - Timbo.footer: renderiza el footer
   - Timbo.init(): punto de entrada, se llama en DOMContentLoaded
   ============================================================ */

const Timbo = {

  /* ---- Estado global ---- */
  state: {
    lang: 'es',
  },

  extractLineRevealSource(element) {
    if (!element) return '';

    const chunks = [];

    const walk = (node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          chunks.push(child.textContent || '');
          return;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) return;

        if (child.tagName === 'BR') {
          chunks.push('\n');
          return;
        }

        walk(child);
      });
    };

    walk(element);

    return chunks
      .join('')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length)
      .join('\n');
  },

  splitTextIntoVisualLines(element, { lineClass, innerClass }) {
    if (!element || !lineClass || !innerClass) return;

    const sourceText =
      element.dataset.lineRevealSource ||
      this.extractLineRevealSource(element);

    if (!sourceText) return;

    element.dataset.lineRevealSource = sourceText;

    const measureVisualLines = (sourceLine) => {
      const cleanLine = sourceLine.replace(/\s+/g, ' ').trim();
      if (!cleanLine) return [];

      element.replaceChildren();

      const words = cleanLine.split(' ');
      const measureNodes = [];

      words.forEach((word, index) => {
        const node = document.createElement('span');
        node.textContent = index === words.length - 1 ? word : `${word} `;
        measureNodes.push(node);
        element.appendChild(node);
      });

      const lines = [];
      let currentTop = null;
      let currentLine = [];

      measureNodes.forEach((node) => {
        const top = node.offsetTop;

        if (currentTop === null || Math.abs(top - currentTop) <= 1) {
          currentLine.push(node.textContent);
          currentTop = currentTop ?? top;
          return;
        }

        lines.push(currentLine.join('').trimEnd());
        currentLine = [node.textContent];
        currentTop = top;
      });

      if (currentLine.length) {
        lines.push(currentLine.join('').trimEnd());
      }

      return lines;
    };

    const lines = sourceText
      .split('\n')
      .flatMap((sourceLine) => measureVisualLines(sourceLine));

    const fragment = document.createDocumentFragment();

    lines.forEach((lineText) => {
      const line = document.createElement('span');
      const inner = document.createElement('span');

      line.className = lineClass;
      inner.className = innerClass;
      inner.textContent = lineText;

      line.appendChild(inner);
      fragment.appendChild(line);
    });

    element.replaceChildren(fragment);
  },


  /* ============================================================
     SISTEMA DE IDIOMAS (i18n)
     ============================================================ */
  i18n: {

    /**
     * Detecta el idioma preferido.
     * Prioridad: URL param > localStorage > navegador > default (es)
     */
    detect() {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'en' || urlLang === 'es') return urlLang;

      const saved = localStorage.getItem('timbo-lang');
      if (saved === 'en' || saved === 'es') return saved;

      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === 'en') return 'en';

      return 'es';
    },

    /**
     * Cambia el idioma activo y actualiza toda la página.
     */
    set(lang) {
      if (lang !== 'es' && lang !== 'en') return;

      Timbo.state.lang = lang;
      localStorage.setItem('timbo-lang', lang);
      document.documentElement.setAttribute('lang', lang);

      // Actualizar URL sin recargar
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);

      // Aplicar traducciones
      this.apply();
      this.updateToggle();
      Timbo.pageTitle.update();

      // El largo de los labels del nav cambia con el idioma
      // (ej. SUSTENTABILIDAD vs SUSTAINABILITY) → recalcular el ancho
      // del underline SVG de cada link.
      Timbo.navLinkUnderline.updateAllWidths();

      // Re-renderizar componentes dinámicos que dependen del idioma
      Timbo.projectPage.render();
      Timbo.sustPilaresDetail.refresh?.();
      Timbo.sustStrategiesDetail.refresh?.();
    },

    /**
     * Recorre todos los elementos con data-i18n y les pone el texto
     * correspondiente al idioma activo.
     */
    apply() {
      const lang = Timbo.state.lang;
      const elements = document.querySelectorAll('[data-i18n]');

      elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = this.resolve(key, lang);

        if (value !== undefined) {
          const attrTarget = el.getAttribute('data-i18n-attr');
          if (attrTarget) {
            el.setAttribute(attrTarget, value);
            return;
          }

          // Algunos reveals parten el texto en lineas y cachean la fuente
          // original en data-line-reveal-source. Si no la limpiamos al
          // traducir, un refresh posterior puede reinstalar el idioma viejo.
          delete el.dataset.lineRevealSource;

          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = value;
          } else if (el.getAttribute('data-i18n-html') === 'true') {
            el.innerHTML = value;
          } else {
            el.textContent = value;
          }
        }
      });
    },

    /**
     * Resuelve una clave de cualquier profundidad buscando en SITE_DATA.
     * Ej: "home.heroTagline" → SITE_DATA.home[lang].heroTagline
     * Ej: "projectPages.projects.exuma-lodge.refugeParagraph1"
     *     → SITE_DATA.projectPages[lang].projects['exuma-lodge'].refugeParagraph1
     * El primer segmento es la sección, después se inserta [lang], y desde ahí
     * se baja por el resto del path. Devuelve undefined si no encuentra el valor.
     */
    resolve(key, lang) {
      const parts = key.split('.');
      if (parts.length < 2) return undefined;

      const section = parts.shift();
      let node = SITE_DATA[section] && SITE_DATA[section][lang];

      for (const part of parts) {
        if (node == null) return undefined;
        node = node[part];
      }
      return node;
    },

    /**
     * Actualiza el estado visual del toggle de idioma.
     */
    updateToggle() {
      const lang = Timbo.state.lang;
      document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.toggle('lang-option--active', btn.dataset.lang === lang);
      });
    },
  },




  /* ============================================================
     NAV SCROLL — Fondo al hacer scroll
     Agrega clase main-nav--scrolled cuando el usuario baja
     más de SCROLL_THRESHOLD píxeles.
     ============================================================ */
  navScroll: {
    SCROLL_THRESHOLD: 900,  // ← Cambiá este número para ajustar cuándo aparece el fondo (desktop default)
    ABOUT_SCROLL_THRESHOLD: 300,
    SUST_SCROLL_THRESHOLD: 80,  // sustentabilidad: que aparezca casi de inmediato
    // Mobile: el header scrolled aparece cuando el usuario sube y cruza este
    // umbral. Coordina con navHide.MOBILE_HIDE_AFTER_PX (que quita --hidden
    // en el mismo punto). El umbral para QUITAR --scrolled en mobile es más
    // bajo (MOBILE_REMOVE_SCROLLED_BELOW) para que entre ese valor y
    // MOBILE_SCROLL_THRESHOLD el nav esté oculto (--hidden todavía activo)
    // mientras cambia su altura de barra (60px) a bloque desplegado, sin
    // que el usuario lo perciba.
    MOBILE_SCROLL_THRESHOLD: 600,
    MOBILE_REMOVE_SCROLLED_BELOW: 200,  // mobile: --scrolled se quita en 200 (no en 600) para que el cambio
                                        // de altura ocurra mientras el nav está oculto vía --hidden (entre 100 y 600).
                                        // Cuanto más cerca de 100 esté este valor, más tiempo tiene la transición
                                        // --hidden de completarse antes de que cambie la altura — clave en scrolls rápidos.

    init() {
      const nav = document.querySelector('.main-nav');
      if (!nav) return;

      const isAboutPage = document.body.classList.contains('page--about-light')
        && Boolean(document.querySelector('.about-hero'));
      const isSustPage = Boolean(document.querySelector('.sust-hero'));

      // Casos en los que main-nav--scrolled sólo debe aparecer cuando el usuario
      // scrollea HACIA ARRIBA. Aplica a sustentabilidad desktop (nav transparente
      // que no debe pintarse al bajar). En mobile no aplica: el scrolled debe
      // mostrarse también al bajar pasando MOBILE_SCROLL_THRESHOLD.
      const desktopMQ = window.matchMedia('(min-width: 1024px)');
      const isMobile = !desktopMQ.matches;
      const sustDesktop = isSustPage && desktopMQ.matches;
      const onlyOnScrollUp = sustDesktop;

      // Threshold para AGREGAR --scrolled.
      let threshold = this.SCROLL_THRESHOLD;
      if (isMobile) threshold = this.MOBILE_SCROLL_THRESHOLD;
      else if (isAboutPage) threshold = this.ABOUT_SCROLL_THRESHOLD;
      else if (isSustPage) threshold = this.SUST_SCROLL_THRESHOLD;

      // Threshold para QUITAR --scrolled. En general es el mismo que para
      // agregar (comportamiento simétrico). En mobile usamos uno más bajo
      // para que entre ambos umbrales el nav esté oculto (--hidden activo)
      // mientras cambia su altura de barra a bloque desplegado.
      const removeThreshold = isMobile ? this.MOBILE_REMOVE_SCROLLED_BELOW : threshold;

      let lastY = window.scrollY;
      window.addEventListener('scroll', () => {
        const currentY = window.scrollY;
        const goingUp = currentY < lastY;
        lastY = currentY;

        if (currentY >= threshold) {
          if (onlyOnScrollUp) {
            // Solo agregar cuando se viene scrolleando hacia arriba.
            if (goingUp) nav.classList.add('main-nav--scrolled');
          } else {
            nav.classList.add('main-nav--scrolled');
          }
        } else if (currentY < removeThreshold) {
          nav.classList.remove('main-nav--scrolled');
        }
        // Zona intermedia (mobile, entre removeThreshold y threshold):
        // mantenemos --scrolled como estaba. El nav está oculto vía --hidden.
      }, { passive: true });
    },
  },


  /* ============================================================
     NAV MOBILE — Transición scroll
     Sólo aplica en mobile (<1024px). Tres fases:
       - scrollY <  HIDE_NAV_LIST_AT     → muestra la nav desplegada.
       - rango intermedio                → no muestra nada.
       - scrollY >= SHOW_FLOATING_AT     → muestra floating logo + hamburguesa.
     ============================================================ */
  navMobile: {
    HIDE_NAV_LIST_AT: 100,    // scrollY donde la lista desplegada desaparece
    SHOW_FLOATING_AT: 500,    // scrollY donde aparecen logo + hamburguesa
    MOBILE_QUERY: '(max-width: 1023.98px)',

    init() {
      const mediaQuery = window.matchMedia(this.MOBILE_QUERY);

      const onScroll = () => {
        const y = window.scrollY;
        // Fase 1: lista visible
        document.body.classList.toggle('nav-mobile-hide-list', y >= this.HIDE_NAV_LIST_AT);
        // Fase 2: floating logo + hamburguesa visibles
        document.body.classList.toggle('nav-mobile-show-floating', y >= this.SHOW_FLOATING_AT);
      };

      let scrollListenerAttached = false;

      const enable = () => {
        if (scrollListenerAttached) return;
        window.addEventListener('scroll', onScroll, { passive: true });
        scrollListenerAttached = true;
        onScroll(); // estado inicial
      };

      const disable = () => {
        if (!scrollListenerAttached) return;
        window.removeEventListener('scroll', onScroll);
        scrollListenerAttached = false;
        document.body.classList.remove('nav-mobile-hide-list');
        document.body.classList.remove('nav-mobile-show-floating');
      };

      if (mediaQuery.matches) enable();

      // Si el usuario rota el dispositivo o cambia el tamaño de ventana,
      // activamos/desactivamos el listener acorde al viewport.
      mediaQuery.addEventListener('change', (e) => {
        if (e.matches) enable();
        else disable();
      });

      // ====== TOGGLE DEL MENÚ HAMBURGUESA ======
      // Click en .nav-toggle-mobile abre/cierra el menú agregando
      // body.nav-mobile-open. El CSS hace el resto (overlay gris,
      // bloqueo de scroll, navlinks visibles, animación X).
      // Click en el overlay (target = body con la clase) cierra.
      const toggleBtn = document.querySelector('.nav-toggle-mobile');
      if (toggleBtn) {
        // Duración de la animación de las barras (debe coincidir con el CSS:
        // .nav-toggle-mobile__bar { transition: transform 600ms ... }).
        const CLOSE_ANIM_MS = 600;
        let closingTimeoutId = null;

        const openMenu = () => {
          // Si veníamos cerrando, cancelamos el cierre y abrimos directo.
          if (closingTimeoutId) {
            clearTimeout(closingTimeoutId);
            closingTimeoutId = null;
            document.body.classList.remove('nav-mobile-closing');
          }
          document.body.classList.add('nav-mobile-open');
          toggleBtn.setAttribute('aria-expanded', 'true');
          toggleBtn.setAttribute('aria-label', 'Cerrar menú');
        };

        const closeMenu = () => {
          // Si ya estamos cerrando, no hacer nada.
          if (closingTimeoutId) return;
          // Si no estamos abiertos, tampoco hay nada que cerrar.
          if (!document.body.classList.contains('nav-mobile-open')) return;

          // Fase de cierre: agregamos .nav-mobile-closing PERO mantenemos
          // .nav-mobile-open. La combinación de ambas clases hace que el
          // selector "body.nav-mobile-closing .bar" gane sobre el de "open"
          // gracias al orden en el CSS (closing aparece después), llevando
          // las barras a rotate(±360deg).
          document.body.classList.add('nav-mobile-closing');
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.setAttribute('aria-label', 'Abrir menú');

          closingTimeoutId = setTimeout(() => {
            // Al terminar la animación, salimos limpio de ambos estados.
            // Desactivamos transiciones un instante para que el cambio
            // de rotate(180deg) → rotate(0deg) sea instantáneo y no se
            // vea un segundo giro. Forzamos reflow y reactivamos.
            document.body.classList.add('nav-mobile-no-transition');
            document.body.classList.remove('nav-mobile-open');
            document.body.classList.remove('nav-mobile-closing');
            // Forzar reflow: leer una propiedad de layout fuerza al
            // navegador a aplicar el estado actual antes de seguir.
            void document.body.offsetHeight;
            document.body.classList.remove('nav-mobile-no-transition');
            closingTimeoutId = null;
          }, CLOSE_ANIM_MS);
        };

        const toggleMenu = () => {
          if (document.body.classList.contains('nav-mobile-open') && !closingTimeoutId) {
            closeMenu();
          } else if (!document.body.classList.contains('nav-mobile-open')) {
            openMenu();
          }
          // Si estamos en medio de cerrando, no hacemos nada: que termine.
        };

        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleMenu();
        });

        // Click en cualquier parte del overlay (el body) cierra,
        // pero ignoramos clicks dentro del nav o del floating mobile
        // para no cerrar al tocar un link.
        document.addEventListener('click', (e) => {
          if (!document.body.classList.contains('nav-mobile-open')) return;
          const insideNav = e.target.closest('.main-nav, .nav-floating-mobile');
          if (insideNav) return;
          closeMenu();
        });

        // Click en un navlink cierra el menú (después navega).
        document.querySelectorAll('.nav__link').forEach((link) => {
          link.addEventListener('click', () => {
            if (document.body.classList.contains('nav-mobile-open')) {
              closeMenu();
            }
          });
        });

        // Si pasamos a desktop con el menú abierto, lo cerramos
        // para no dejar el overflow:hidden ni la clase colgada.
        mediaQuery.addEventListener('change', (e) => {
          if (!e.matches) closeMenu();
        });
      }
    },
  },

  /* ============================================================
     REFUGE PHOTO SLIDE — Imagen B (derecha) de .project-refuge
     Dos rangos de scroll independientes:
       - X (desplazamiento horizontal): entre X_START_Y y X_END_Y.
       - Crecimiento (escala 0.95→1 y opacidad 0.6→1): entre
         GROW_START_Y y GROW_END_Y.
     ============================================================ */
  refugePhotoSlide: {
    X_START_Y: 1000,               // ← scrollY en el que arranca el desplazamiento en X
    X_END_Y: 1700,                 // ← 1000 + 700 (rate home: 100% / 700px)
    GROW_START_Y: 1700,            // ← scrollY en el que arrancan a crecer escala y opacidad
    GROW_END_Y: 1750,              // ← 1700 + 50 (mismo lapso que home)

    init() {
      const photo = document.querySelector('.project-refuge__image--slide-x');
      if (!photo) return;

      photo.classList.add('is-active');

      let ticking = false;

      // Helper: mapea scrollY al progreso 0–1 dentro de [startY, endY], capado.
      const rangeProgress = (y, startY, endY) => {
        const range = endY - startY;
        if (range <= 0) return y >= endY ? 1 : 0;
        return Math.max(0, Math.min(1, (y - startY) / range));
      };

      const update = () => {
        ticking = false;
        const y = window.scrollY;

        // Progreso de X (0–1) entre X_START_Y y X_END_Y.
        const xT = rangeProgress(y, this.X_START_Y, this.X_END_Y);
        const tx = -(1 - xT) * 100;   // -100% → 0%

        // Progreso de crecimiento (0–1) entre GROW_START_Y y GROW_END_Y.
        const growT = rangeProgress(y, this.GROW_START_Y, this.GROW_END_Y);
        const scale = 0.95 + (1 - 0.95) * growT;
        const opacity = 0.6 + (1 - 0.6) * growT;

        photo.style.transform = 'translateX(' + tx + '%) scale(' + scale + ')';
        photo.style.opacity = String(opacity);
      };

      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      };

      update();  // estado inicial (por si la página carga ya scrolleada)
      window.addEventListener('scroll', onScroll, { passive: true });
    },
  },


  /* ============================================================
     REFUGE PHOTO A — Imagen A (izquierda) de .project-refuge
     Tres etapas independientes, todas atadas al scroll y reversibles:
       1. Z_FLIP_Y: la imagen pasa a estar detrás de la B.
       2. SHRINK_START_Y → SHRINK_END_Y: se achica y baja opacidad.
       3. SLIDE_START_Y → SLIDE_END_Y: se desplaza a la derecha.
     ============================================================ */
  refugePhotoA: {
    Z_FLIP_Y: 2100,              // ← scrollY en el que la imagen pasa a estar detrás de la B
    SHRINK_START_Y: 2240,        // ← 2100 + 140 (mismo hueco que home)
    SHRINK_END_Y: 2300,          // ← 2240 + 60 (mismo lapso de shrink que home)
    SLIDE_START_Y: 2300,         // ← scrollY en el que arranca a deslizarse a la derecha
    SLIDE_END_Y: 2790,           // ← 2300 + 490 (rate home: 70% / 490px)
    SLIDE_DISTANCE_PCT: 70,      // ← cuánto se desplaza a la derecha (% del propio ancho)

    init() {
      const photo = document.querySelector('.project-refuge__image--slide-a');
      if (!photo) return;

      let ticking = false;

      // Helper: mapea scrollY al progreso 0–1 dentro de [startY, endY], capado.
      const rangeProgress = (y, startY, endY) => {
        const range = endY - startY;
        if (range <= 0) return y >= endY ? 1 : 0;
        return Math.max(0, Math.min(1, (y - startY) / range));
      };

      const update = () => {
        ticking = false;
        const y = window.scrollY;

        // 1) Z-index: instantáneo en Z_FLIP_Y. Antes: por encima (3). Después: por debajo (0).
        //    La imagen B tiene z-index 1 en CSS, así que con 0 queda detrás y con 3 queda adelante.
        photo.style.zIndex = y >= this.Z_FLIP_Y ? '0' : '3';

        // 2) Shrink + opacidad.
        const shrinkT = rangeProgress(y, this.SHRINK_START_Y, this.SHRINK_END_Y);
        const scale = 1 - (1 - 0.95) * shrinkT;       // 1 → 0.95
        const opacity = 1 - (1 - 0.7) * shrinkT;      // 1 → 0.7

        // 3) Slide a la derecha.
        const slideT = rangeProgress(y, this.SLIDE_START_Y, this.SLIDE_END_Y);
        const tx = this.SLIDE_DISTANCE_PCT * slideT;  // 0% → SLIDE_DISTANCE_PCT %

        photo.style.transform = 'translateX(' + tx + '%) scale(' + scale + ')';
        photo.style.opacity = String(opacity);
      };

      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      };

      update();  // estado inicial
      window.addEventListener('scroll', onScroll, { passive: true });
    },
  },


  /* ============================================================
     NAV HIDE ON SCROLL (directional)
     - Al scrollear hacia abajo pasado HIDE_AFTER_PX, esconde el nav.
     - Al scrollear hacia arriba más de UP_THRESHOLD_PX, lo muestra.
     - En el tope absoluto (scrollY === 0) siempre visible.
     ============================================================ */
  navHide: {
    HIDE_AFTER_PX: 600,         // default desktop: desde qué scroll puede empezar a esconderse
    SUST_HIDE_AFTER_PX: 80,     // sustentabilidad: que el nav transparente se vaya apenas pasa el hero
    MOBILE_HIDE_AFTER_PX: 600,  // mobile: umbral del scrolled. Por encima de esto vive el header
                                // scrolled (visible). Por debajo (hasta MOBILE_REVEAL_BELOW_PX) el
                                // nav queda oculto: ahí ocurre el cambio de altura sin que se vea.
    MOBILE_REVEAL_BELOW_PX: 100, // mobile: por debajo de este scrollY reaparece el header desplegado
                                 // del hero (la primera fase, sin fondo blanco).
    UP_THRESHOLD_PX: 8,         // cuánto hay que subir para re-mostrarlo

    init() {
      const nav = document.querySelector('.main-nav');
      if (!nav) return;

      // Detectamos mobile para usar otro umbral. Antes este módulo se desactivaba
      // en mobile porque el .main-nav contenía el floating logo y la hamburguesa
      // y al esconderlo se iban con él. Ahora esos elementos tienen position: fixed
      // propia, así que el hide-on-scroll también funciona en mobile.
      const desktopMQ = window.matchMedia('(min-width: 1024px)');
      const isMobile = !desktopMQ.matches;

      // Páginas con comportamiento estricto (solo desktop):
      // el nav se oculta apenas hay scroll y solo reaparece al volver al top exacto.
      // Aplica a proyectos.
      const isProjectsPage = document.body.classList.contains('page--projects-light');
      const isSustPage = document.body.classList.contains('page--sust-light');

      // Umbral para esconder.
      // - Mobile: 600px (coincide con navScroll.MOBILE_SCROLL_THRESHOLD).
      // - Desktop sust: 80px (apenas pasa el hero).
      // - Desktop default: 600px.
      let hideAfter = this.HIDE_AFTER_PX;
      if (isMobile) hideAfter = this.MOBILE_HIDE_AFTER_PX;
      else if (isSustPage) hideAfter = this.SUST_HIDE_AFTER_PX;

      // Modo estricto (solo desktop, página proyectos): el nav se oculta apenas
      // hay scroll y solo reaparece al volver al top exacto. En mobile no aplica.
      if (isProjectsPage && !isMobile) {
        let tickingStrict = false;
        const updateStrict = () => {
          if (window.scrollY <= 0) {
            nav.classList.remove('main-nav--hidden');
          } else {
            nav.classList.add('main-nav--hidden');
          }
          tickingStrict = false;
        };
        window.addEventListener('scroll', () => {
          if (!tickingStrict) {
            window.requestAnimationFrame(updateStrict);
            tickingStrict = true;
          }
        }, { passive: true });
        return;
      }

      let lastY = window.scrollY;
      let accumulatedUp = 0;
      let ticking = false;

      const update = () => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        // Si el menú mobile está abierto, el nav debe quedarse visible y
        // no reaccionar al scroll (aunque el scroll esté bloqueado, por las
        // dudas de que algún gesto residual dispare el handler).
        if (document.body.classList.contains('nav-mobile-open')) {
          lastY = currentY;
          ticking = false;
          return;
        }

        if (isMobile) {
          // Mobile: lógica por zonas, independiente de la dirección del scroll.
          //   [0, REVEAL_BELOW]          → visible (header desplegado del hero).
          //   (REVEAL_BELOW, HIDE_AFTER) → oculto (franja invisible donde el nav
          //                                cambia su altura sin que se perciba).
          //   [HIDE_AFTER, ∞]            → visible (header scrolled).
          // Regla simple: arriba de HIDE_AFTER hay header, debajo no, salvo en
          // la zona del desplegado. El cambio de clase --scrolled lo hace
          // navScroll en MOBILE_REMOVE_SCROLLED_BELOW (200), dentro de la franja
          // invisible, así no se percibe el cambio de altura.
          const revealBelow = this.MOBILE_REVEAL_BELOW_PX;

          if (currentY <= revealBelow) {
            nav.classList.remove('main-nav--hidden');
          } else if (currentY < hideAfter) {
            nav.classList.add('main-nav--hidden');
          } else {
            nav.classList.remove('main-nav--hidden');
          }

          // Reset por compatibilidad con desktop si el viewport se reescala.
          accumulatedUp = 0;
          lastY = currentY;
          ticking = false;
          return;
        }

        // Desktop (lógica direccional original).
        // En el tope: siempre visible y se resetea el acumulador.
        if (currentY <= 0) {
          nav.classList.remove('main-nav--hidden');
          accumulatedUp = 0;
        } else if (delta > 0) {
          // Scroll hacia abajo: esconder una vez pasado el umbral mínimo.
          accumulatedUp = 0;
          if (currentY > hideAfter) {
            nav.classList.add('main-nav--hidden');
          }
        } else if (delta < 0) {
          // Scroll hacia arriba: acumular distancia; al superar el umbral, mostrar.
          accumulatedUp += -delta;
          if (accumulatedUp > this.UP_THRESHOLD_PX) {
            nav.classList.remove('main-nav--hidden');
          }
        }

        lastY = currentY;
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });
    },
  },


  /* ============================================================
     NAV THEME — Intersection Observer
     Usa la sección activa bajo el nav mediante `data-nav-theme`.
     ============================================================ */
  navTheme: {

    init() {
      const nav = document.querySelector('.main-nav');
      const themedSections = Array.from(document.querySelectorAll('[data-nav-theme]'));
      if (!nav || themedSections.length === 0) return;

      const applyTheme = (theme) => {
        nav.classList.remove('main-nav--dark', 'main-nav--light');
        nav.classList.add(theme === 'dark' ? 'main-nav--dark' : 'main-nav--light');
      };

      const updateThemeFromSections = () => {
        const navLine = nav.getBoundingClientRect().bottom + 1;
        const activeSection = themedSections.find((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top <= navLine && rect.bottom > navLine;
        });

        applyTheme(activeSection?.dataset.navTheme || 'light');
      };

      updateThemeFromSections();

      const observer = new IntersectionObserver(() => {
        updateThemeFromSections();
      }, {
        threshold: [0, 0.01, 1],
      });

      themedSections.forEach((section) => observer.observe(section));
      window.addEventListener('scroll', updateThemeFromSections, { passive: true });
      window.addEventListener('resize', updateThemeFromSections);
    },
  },

  /* ============================================================
     NAV LINK UNDERLINE (SVG hand-drawn en hover)
     ============================================================ */
  navLinkUnderline: {
    UNDERLINE_PATH: 'M2 8 C20 8, 35 4, 60 6 C85 8, 100 3, 130 5 C160 7, 175 4, 200 6 C225 8, 245 3, 270 5 C295 7, 305 5, 318 6',

    updateWidth(link) {
      const label = link.querySelector('.nav__link-label');
      const underline = link.querySelector('.nav__link-underline');
      if (!label || !underline) return;

      const labelWidth = Math.ceil(label.getBoundingClientRect().width);
      underline.style.width = `${Math.max(labelWidth, 1)}px`;
    },

    updateAllWidths() {
      const links = document.querySelectorAll('.main-nav .nav__link');
      links.forEach((link) => this.updateWidth(link));
    },

    init() {
      const links = document.querySelectorAll('.main-nav .nav__link');
      if (links.length === 0) return;

      links.forEach((link) => {
        if (link.dataset.underlineReady === 'true') return;

        const labelText = link.textContent.trim();
        if (!labelText) return;

        const label = document.createElement('span');
        label.className = 'nav__link-label';
        label.textContent = labelText;

        // El data-i18n se muda del <a> al span: así i18n.apply() escribe el
        // texto en el label y nunca borra el SVG del underline (que es hijo
        // directo del <a>). Sin esto, cada apply() destruía el underline.
        const i18nKey = link.getAttribute('data-i18n');
        if (i18nKey) {
          label.setAttribute('data-i18n', i18nKey);
          link.removeAttribute('data-i18n');
        }

        const svgNS = 'http://www.w3.org/2000/svg';
        const underline = document.createElementNS(svgNS, 'svg');
        underline.classList.add('nav__link-underline');
        underline.setAttribute('viewBox', '0 0 320 12');
        underline.setAttribute('preserveAspectRatio', 'none');
        underline.setAttribute('aria-hidden', 'true');

        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', this.UNDERLINE_PATH);
        underline.appendChild(path);

        link.textContent = '';
        link.append(label, underline);
        link.dataset.underlineReady = 'true';

        this.updateWidth(link);
      });

      this.updateAllWidths();
      window.addEventListener('resize', () => this.updateAllWidths());

      if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready.then(() => this.updateAllWidths());
      }
    },
  },

  /* ============================================================
     INTRO LINK OVAL (óvalo hand-drawn en hover de "See more")
     ============================================================ */
  introLinkOval: {
    init() {
      const link = document.querySelector('.intro__link');
      if (!link) return;

      const depth = window.location.pathname.includes('/proyectos/') ? '../' : '';
      const img = document.createElement('img');
      img.classList.add('intro-link__oval');
      img.src = `${depth}assets/images/svg/ovalo_001.svg`;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      link.appendChild(img);

      link.addEventListener('mouseenter', () => {
        link.classList.add('intro__link--oval-draw');
      });

      link.addEventListener('mouseleave', () => {
        link.classList.remove('intro__link--oval-draw');
      });
    },
  },

  /* ============================================================
     NAV INTRO (animación al cargar)
     ============================================================ */
  navIntro: {
    init() {
      const nav = document.querySelector('.main-nav');
      if (!nav) return;

      // Fuerza estado inicial para que la animación se dispare en todas las páginas.
      nav.classList.remove('is-visible');
      void nav.offsetWidth;

      setTimeout(() => {
        nav.classList.add('is-visible');
      }, 650);
    },
  },

  /* ============================================================
     PAGE TRANSITION
     Entrada suave en Home y salida genérica desde páginas de detalle.
     ============================================================ */
  pageTransition: {
    HOME_ENTER_CLASS: 'is-entering-home',
    HOME_ENTER_ACTIVE_CLASS: 'is-entering-home-active',
    EXIT_DURATION_MS: 440,
    isTransitioning: false,

    getPageName(pathname = window.location.pathname) {
      const raw = pathname.split('/').pop() || 'index.html';
      return raw.toLowerCase();
    },

    shouldAnimate() {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    isSimpleNavigationClick(event, link) {
      if (event.defaultPrevented) return false;
      if (event.button !== 0) return false;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
      if (!link || !link.href) return false;
      if (link.target && link.target !== '_self') return false;
      if (link.hasAttribute('download')) return false;
      return true;
    },

    getInternalUrl(link) {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return null;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch (_err) {
        return null;
      }
      if (url.origin !== window.location.origin) return null;
      return url;
    },

    isProjectPage() {
      return window.location.pathname.includes('/proyectos/proyecto-');
    },

    startGenericExit(targetUrl) {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      document.documentElement.classList.add('is-leaving');

      window.setTimeout(() => {
        window.location.assign(targetUrl.href);
      }, this.EXIT_DURATION_MS);
    },

    bindExitLinks() {
      const links = document.querySelectorAll('a[href]');
      if (links.length === 0) return;

      links.forEach((link) => {
        link.addEventListener('click', (event) => {
          if (!this.shouldAnimate()) return;
          if (!this.isSimpleNavigationClick(event, link)) return;

          const targetUrl = this.getInternalUrl(link);
          if (!targetUrl) return;

          const currentPage = this.getPageName(window.location.pathname);
          const targetPage = this.getPageName(targetUrl.pathname);
          if (targetPage === currentPage) return;

          // Project detail pages → any other page
          if (this.isProjectPage()) {
            event.preventDefault();
            this.startGenericExit(targetUrl);
            return;
          }
        });
      });
    },

    runHomeEntry() {
      if (!this.shouldAnimate()) return;
      if (this.getPageName(window.location.pathname) !== 'index.html') return;

      const root = document.documentElement;
      root.classList.add(this.HOME_ENTER_CLASS);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.add(this.HOME_ENTER_ACTIVE_CLASS);
        });
      });

      window.setTimeout(() => {
        root.classList.remove(this.HOME_ENTER_CLASS, this.HOME_ENTER_ACTIVE_CLASS);
      }, 1300);
    },

    init() {
      this.runHomeEntry();
      this.bindExitLinks();
    },
  },

  /* ============================================================
     FOOTER
     ============================================================ */
  footer: {

    render() {
      const footer = document.getElementById('main-footer');
      if (!footer) return;

      const isDarkPage = document.body.classList.contains('page--dark');
      const depth = window.location.pathname.includes('/proyectos/') ? '../' : '';
      const logoSrc = isDarkPage
        ? `${depth}assets/images/logo/timbo-blanco.svg`
        : `${depth}assets/images/logo/timbo-negro.svg`;

      footer.innerHTML = `
        <div class="footer__inner">
          <img src="${logoSrc}" alt="Timbó" class="footer__logo">
          <p class="footer__rights" data-i18n="footer.rights">© 2026 Timbó. Todos los derechos reservados.</p>
        </div>
      `;
    },
  },

  /* ============================================================
     PAGE TITLE
     Centraliza lo que se muestra en la pestaña del navegador.
     ============================================================ */
  pageTitle: {
    STATIC_PAGE_KEYS: {
      'index.html': 'home',
      'proyectos.html': 'projects',
      'sustentabilidad.html': 'sustainability',
      'servicios.html': 'services',
      'sobre-nosotros.html': 'about',
      'contacto.html': 'contact',
    },

    getPageName(pathname = window.location.pathname) {
      const raw = pathname.split('/').pop() || 'index.html';
      return raw.toLowerCase();
    },

    getStaticTitle(lang) {
      const meta = SITE_DATA.pageMeta?.[lang];
      if (!meta) return '';

      const pageName = this.getPageName();
      const pageKey = this.STATIC_PAGE_KEYS[pageName];
      if (!pageKey) return meta.brand || '';

      return meta[pageKey] || meta.brand || '';
    },

    getProjectTitle(lang) {
      const page = document.querySelector('[data-project-slug]');
      const slug = page?.getAttribute('data-project-slug');
      if (!slug) return '';

      const project = SITE_DATA.projectPages?.[lang]?.projects?.[slug];
      const brand = SITE_DATA.pageMeta?.[lang]?.brand || 'Timbó';
      if (!project?.name) return brand;

      return `${brand} — ${project.name}`;
    },

    update() {
      const lang = Timbo.state.lang || 'es';
      const title = this.getProjectTitle(lang) || this.getStaticTitle(lang);
      if (!title) return;

      document.title = title;
    },
  },

  /* ============================================================
     PROJECT PAGE (detalle)
     Renderiza contenido de cada página de proyecto por slug
     ============================================================ */
  projectPage: {
    render() {
      const page = document.querySelector('[data-project-slug]');
      if (!page) return;

      const slug = page.getAttribute('data-project-slug');
      if (!slug) return;

      // El cover del hero debe revelarse aunque todavía no exista metadata
      // del proyecto en SITE_DATA.
      const coverImg = document.getElementById('project-cover');
      if (coverImg) {
        const reveal = () => coverImg.classList.add('is-loaded');
        if (coverImg.complete) {
          requestAnimationFrame(reveal);
        } else {
          coverImg.addEventListener('load', reveal, { once: true });
        }
      }

      const lang = Timbo.state.lang;
      const pageData = SITE_DATA.projectPages?.[lang];
      const project = pageData?.projects?.[slug];
      if (!pageData || !project) return;

      const setText = (id, value) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById(id);
        if (!el) return;
        el.hidden = false;
        el.textContent = value;
      };

      const setOptionalText = (id, value) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById(id);
        if (!el) return;
        el.hidden = value === '';
        if (/<br\s*\/?>/i.test(value)) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      };

      const setHTML = (id, value) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = value;
      };

      const setOverviewTitle = (desktopValue, mobileValue = desktopValue) => {
        if (desktopValue === undefined || desktopValue === null) return;
        const el = document.getElementById('project-overview-title');
        if (!el) return;

        el.dataset.lineRevealSourceDesktop = desktopValue;
        el.dataset.lineRevealSourceMobile = mobileValue;
        el.dataset.lineRevealSource = desktopValue;

        Timbo.splitTextIntoVisualLines(el, {
          lineClass: 'project-overview__title-line',
          innerClass: 'project-overview__title-line-inner',
        });
      };

      const setLineRevealText = (id, value, { lineClass, innerClass }) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById(id);
        if (!el) return;

        el.dataset.lineRevealSource = value;
        Timbo.splitTextIntoVisualLines(el, { lineClass, innerClass });
      };

      const setOptionalLineRevealText = (id, value, { lineClass, innerClass }) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById(id);
        if (!el) return;

        if (value === '') {
          delete el.dataset.lineRevealSource;
          el.hidden = true;
          el.innerHTML = '';
          return;
        }

        el.hidden = false;
        setLineRevealText(id, value, { lineClass, innerClass });
      };

      const setPaletteText = (value) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById('project-palette-text');
        if (!el) return;

        if (value === '') {
          delete el.dataset.lineRevealSource;
          el.hidden = true;
          el.innerHTML = '';
          return;
        }

        el.hidden = false;

        const section = el.closest('.project-palette');
        const hasHtmlBreaks = /<br\s*\/?>/i.test(value);

        if (section?.dataset.paletteReveal === 'off' || hasHtmlBreaks) {
          delete el.dataset.lineRevealSource;
          el.innerHTML = value;
          return;
        }

        setLineRevealText('project-palette-text', value, {
          lineClass: 'project-palette__text-line',
          innerClass: 'project-palette__text-line-inner',
        });
      };

      const setPhraseText = (value) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById('project-phrase-text');
        if (!el) return;

        const section = el.closest('.project-phrase');
        const hasHtmlBreaks = /<br\s*\/?>/i.test(value);

        if (section?.dataset.phraseReveal === 'off' || hasHtmlBreaks) {
          delete el.dataset.lineRevealSource;
          el.innerHTML = value;
          return;
        }

        setLineRevealText('project-phrase-text', value, {
          lineClass: 'project-phrase__text-line',
          innerClass: 'project-phrase__text-line-inner',
        });
      };

      const setPaletteIntro = (value) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById('project-palette-intro');
        if (!el) return;
        el.hidden = value === '';
        el.innerHTML = value;
      };

      const setPaletteMobileText = (value) => {
        const el = document.getElementById('project-palette-mobile-text');
        if (!el) return;

        if (value === undefined || value === null || value === '') {
          delete el.dataset.lineRevealSource;
          el.hidden = true;
          el.innerHTML = '';
          return;
        }

        el.hidden = false;
        el.innerHTML = value;
      };

      setHTML('project-title', project.name);
      setText('project-location', project.location);
      setText('project-meta-location', project.location);
      setText('project-summary', project.summary);
      setText('project-type', project.type);
      setText('project-status', project.status);
      setText('project-description-1', project.description1);
      setText('project-description-2', project.description2);
      setOverviewTitle(
        project.overviewTitleDesktop || project.overviewTitle,
        project.overviewTitleMobile || project.overviewTitleDesktop || project.overviewTitle,
      );
      setText('project-overview-climate', project.overviewClimate);
      setText('project-overview-biome', project.overviewBiome);
      setText('project-overview-land', project.overviewLand);
      setText('project-overview-built-area', project.overviewBuiltArea);
      setHTML('project-overview-location', project.overviewLocation);
      setOptionalText('project-refuge-text', project.refugeText);
      setOptionalLineRevealText('project-refuge-super-phrase', project.refugeSuperPhrase, {
        lineClass: 'project-refuge__super-phrase-line',
        innerClass: 'project-refuge__super-phrase-line-inner',
      });
      setOptionalText('project-refuge-text-1', project.refugeText1);
      setOptionalText('project-refuge-text-2', project.refugeText2);
      setOptionalText('project-frame-text', project.frameText);
      setOptionalLineRevealText('project-frame-super-phrase', project.frameSuperPhrase, {
        lineClass: 'project-frame__super-phrase-line',
        innerClass: 'project-frame__super-phrase-line-inner',
      });
      setOptionalText('project-frame-text-1', project.frameText1);
      setOptionalText('project-frame-text-2', project.frameText2);
      setPhraseText(project.phraseText);
      setOptionalLineRevealText('project-phrase-super-phrase', project.phraseSuperPhrase, {
        lineClass: 'project-phrase__super-phrase-line',
        innerClass: 'project-phrase__super-phrase-line-inner',
      });
      setLineRevealText('project-highlight-title', project.highlightTitle, {
        lineClass: 'project-highlight__title-line',
        innerClass: 'project-highlight__title-line-inner',
      });
      setPaletteIntro(project.paletteIntro);
      setPaletteMobileText(project.paletteMobileText);
      setPaletteText(project.paletteText);

      setText('project-meta-location-label', pageData.locationLabel);
      setText('project-meta-type-label', pageData.typeLabel);
      setText('project-meta-status-label', pageData.statusLabel);
      setText('project-back-link', pageData.backToProjects);

      const depth = window.location.pathname.includes('/proyectos/') ? '../' : '';



      const backLink = document.getElementById('project-back-link');
      if (backLink) {
        backLink.href = `${depth}proyectos.html?lang=${lang}`;
      }
    },
  },


  /* ============================================================
     LOGO FIJO (esquina inferior izquierda)
     ============================================================ */
  floatingLogo: {
    HERO_RELEASE_OFFSET_PX: 140, // Mayor valor = el logo sale antes desde debajo del hero
    logoEl: null,
    heroSectionEl: null,
    dialogueImageEl: null,
    valuesBreakdownEl: null,
    philosophyEl: null,
    sustBreatheEl: null,

    render() {
      const existingLogo = document.querySelector('.floating-logo');
      if (existingLogo) {
        this.logoEl = existingLogo;
        return existingLogo;
      }

      const depth = window.location.pathname.includes('/proyectos/') ? '../' : '';
      const logo = document.createElement('a');
      logo.href = `${depth}index.html`;
      logo.className = 'floating-logo';
      logo.setAttribute('aria-label', 'Ir al inicio');
      logo.innerHTML = `
        <span class="floating-logo__stack" aria-hidden="true">
          <img src="${depth}assets/images/logo/timbo-negro.svg" alt="Timbó" class="floating-logo__img floating-logo__img--black">
          <img src="${depth}assets/images/logo/timbo-blanco.svg" alt="Timbó" class="floating-logo__img floating-logo__img--white">
        </span>
      `;

      document.body.appendChild(logo);
      this.logoEl = logo;
      return logo;
    },

    updateHeroLayer() {
      if (!this.logoEl) return;

      if (!this.heroSectionEl) {
        this.logoEl.classList.remove('floating-logo--under-hero');
        return;
      }

      const heroRect = this.heroSectionEl.getBoundingClientRect();
      const logoRect = this.logoEl.getBoundingClientRect();

      // Fase 1: hero por encima del logo.
      // Fase 2: liberar logo un poco antes (offset) para que no aparezca tarde.
      const releaseLine = logoRect.top + this.HERO_RELEASE_OFFSET_PX;
      const heroStillAboveLogoLine = heroRect.bottom > releaseLine;
      this.logoEl.classList.toggle('floating-logo--under-hero', heroStillAboveLogoLine);
    },

    updateDialogueImageBlend() {
      if (!this.logoEl) return;
      if (!this.dialogueImageEl) {
        this.logoEl.classList.remove('floating-logo--on-dialogue-blend');
        this.logoEl.style.setProperty('--dialogue-overlap-top', '100%');
        this.logoEl.style.setProperty('--dialogue-overlap-bottom', '0px');
        this.logoEl.style.setProperty('--dialogue-overlap-left', '0px');
        this.logoEl.style.setProperty('--dialogue-overlap-right', '0px');
        return;
      }

      const logoRect = this.logoEl.getBoundingClientRect();
      const dialogueRect = this.dialogueImageEl.getBoundingClientRect();
      const overlapTop = Math.max(logoRect.top, dialogueRect.top);
      const overlapBottom = Math.min(logoRect.bottom, dialogueRect.bottom);
      const overlapLeft = Math.max(logoRect.left, dialogueRect.left);
      const overlapRight = Math.min(logoRect.right, dialogueRect.right);
      const hasOverlap = overlapBottom > overlapTop && overlapRight > overlapLeft;

      if (!hasOverlap) {
        this.logoEl.classList.remove('floating-logo--on-dialogue-blend');
        this.logoEl.style.setProperty('--dialogue-overlap-top', `${logoRect.height}px`);
        this.logoEl.style.setProperty('--dialogue-overlap-bottom', '0px');
        this.logoEl.style.setProperty('--dialogue-overlap-left', '0px');
        this.logoEl.style.setProperty('--dialogue-overlap-right', `${logoRect.width}px`);
        return;
      }

      const topInset = Math.max(0, overlapTop - logoRect.top);
      const bottomInset = Math.max(0, logoRect.bottom - overlapBottom);
      const leftInset = Math.max(0, overlapLeft - logoRect.left);
      const rightInset = Math.max(0, logoRect.right - overlapRight);

      this.logoEl.style.setProperty('--dialogue-overlap-top', `${topInset}px`);
      this.logoEl.style.setProperty('--dialogue-overlap-bottom', `${bottomInset}px`);
      this.logoEl.style.setProperty('--dialogue-overlap-left', `${leftInset}px`);
      this.logoEl.style.setProperty('--dialogue-overlap-right', `${rightInset}px`);
      this.logoEl.classList.add('floating-logo--on-dialogue-blend');
    },

    updateValuesBreakdownBlend() {
      if (!this.logoEl) return;
      if (!this.valuesBreakdownEl) {
        this.logoEl.classList.remove('floating-logo--on-values');
        this.logoEl.style.setProperty('--values-overlap-top', '100%');
        this.logoEl.style.setProperty('--values-overlap-bottom', '0px');
        return;
      }

      const logoRect = this.logoEl.getBoundingClientRect();
      const valuesRect = this.valuesBreakdownEl.getBoundingClientRect();
      const overlapTop = Math.max(logoRect.top, valuesRect.top);
      const overlapBottom = Math.min(logoRect.bottom, valuesRect.bottom);
      const hasOverlap = overlapBottom > overlapTop;

      if (!hasOverlap) {
        this.logoEl.classList.remove('floating-logo--on-values');
        this.logoEl.style.setProperty('--values-overlap-top', `${logoRect.height}px`);
        this.logoEl.style.setProperty('--values-overlap-bottom', '0px');
        return;
      }

      const topInset = Math.max(0, overlapTop - logoRect.top);
      const bottomInset = Math.max(0, logoRect.bottom - overlapBottom);

      this.logoEl.style.setProperty('--values-overlap-top', `${topInset}px`);
      this.logoEl.style.setProperty('--values-overlap-bottom', `${bottomInset}px`);
      this.logoEl.classList.add('floating-logo--on-values');
    },

    updatePhilosophyBlend() {
      if (!this.logoEl) return;
      if (!this.philosophyEl) {
        this.logoEl.classList.remove('floating-logo--on-philosophy');
        this.logoEl.style.setProperty('--philosophy-overlap-top', '100%');
        this.logoEl.style.setProperty('--philosophy-overlap-bottom', '0px');
        return;
      }

      const logoRect = this.logoEl.getBoundingClientRect();
      const philosophyRect = this.philosophyEl.getBoundingClientRect();
      const overlapTop = Math.max(logoRect.top, philosophyRect.top);
      const overlapBottom = Math.min(logoRect.bottom, philosophyRect.bottom);
      const hasOverlap = overlapBottom > overlapTop;

      if (!hasOverlap) {
        this.logoEl.classList.remove('floating-logo--on-philosophy');
        this.logoEl.style.setProperty('--philosophy-overlap-top', `${logoRect.height}px`);
        this.logoEl.style.setProperty('--philosophy-overlap-bottom', '0px');
        return;
      }

      const topInset = Math.max(0, overlapTop - logoRect.top);
      const bottomInset = Math.max(0, logoRect.bottom - overlapBottom);

      this.logoEl.style.setProperty('--philosophy-overlap-top', `${topInset}px`);
      this.logoEl.style.setProperty('--philosophy-overlap-bottom', `${bottomInset}px`);
      this.logoEl.classList.add('floating-logo--on-philosophy');
    },

    updateSustHeroBlend() {
      if (!this.logoEl) return;
      if (!this.sustBreatheEl) {
        this.logoEl.classList.remove('floating-logo--on-sust-hero');
        this.logoEl.style.setProperty('--sust-hero-overlap-top', '100%');
        this.logoEl.style.setProperty('--sust-hero-overlap-bottom', '0px');
        return;
      }

      const logoRect = this.logoEl.getBoundingClientRect();
      const breatheRect = this.sustBreatheEl.getBoundingClientRect();
      const whiteZoneTop = breatheRect.top + (breatheRect.height / 2);
      const whiteZoneBottom = breatheRect.bottom;
      const overlapTop = Math.max(logoRect.top, whiteZoneTop);
      const overlapBottom = Math.min(logoRect.bottom, whiteZoneBottom);
      const hasOverlap = overlapBottom > overlapTop;

      if (!hasOverlap) {
        this.logoEl.classList.remove('floating-logo--on-sust-hero');
        this.logoEl.style.setProperty('--sust-hero-overlap-top', `${logoRect.height}px`);
        this.logoEl.style.setProperty('--sust-hero-overlap-bottom', '0px');
        return;
      }

      const topInset = Math.max(0, overlapTop - logoRect.top);
      const bottomInset = Math.max(0, logoRect.bottom - overlapBottom);

      this.logoEl.style.setProperty('--sust-hero-overlap-top', `${topInset}px`);
      this.logoEl.style.setProperty('--sust-hero-overlap-bottom', `${bottomInset}px`);
      this.logoEl.classList.add('floating-logo--on-sust-hero');
    },

    init() {
      const logo = this.render();
      if (!logo) return;
      this.heroSectionEl = document.getElementById('hero') || document.querySelector('.sust-hero');
      this.dialogueImageEl = document.querySelector('.nature-dialogue__image');
      this.valuesBreakdownEl = document.getElementById('values-breakdown');
      this.philosophyEl = document.getElementById('philosophy');
      this.sustBreatheEl = document.getElementById('sust-breathe');

      logo.classList.add('floating-logo--visible');
      const updateLogoState = () => {
        this.updateHeroLayer();
        this.updateDialogueImageBlend();
        this.updateValuesBreakdownBlend();
        this.updatePhilosophyBlend();
        this.updateSustHeroBlend();
      };

      updateLogoState();
      window.addEventListener('scroll', updateLogoState, { passive: true });
      window.addEventListener('resize', updateLogoState);
    },
  },

  /* ============================================================
     SCROLL REVEAL (genérico)
     Observa animaciones de entrada por scroll y activa .is-visible.
     ============================================================ */
  scrollReveal: {
    init() {
      const animatedElements = document.querySelectorAll('.anim-fade-up, .anim-wind-in, .anim-fade-in, .anim-zoom-in, .anim-title-drop, .anim-reveal-right, .anim-reveal-down');
      if (animatedElements.length === 0) return;

      animatedElements.forEach((el) => {
        const rawDelay = el.getAttribute('data-anim-delay');
        if (!rawDelay) return;

        const parsedDelay = Number(rawDelay);
        const normalizedDelay = Number.isFinite(parsedDelay) ? `${parsedDelay}ms` : rawDelay;
        el.style.setProperty('--anim-delay', normalizedDelay);
      });

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      }, {
        threshold: 0.2,
      });

      // Observer separado para .anim-title-drop: se dispara cuando el elemento
      // esta 100px mas adentro del viewport (rootMargin inferior negativo).
      const titleDropObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      }, {
        threshold: 0,
        rootMargin: '0px 0px -100px 0px',
      });

      animatedElements.forEach((el) => {
        if (el.classList.contains('anim-title-drop')) {
          titleDropObserver.observe(el);
        } else {
          observer.observe(el);
        }
      });
    },
  },

  sustBreatheTextReveal: {
    sectionEl: null,
    titleEl: null,
    textEl: null,
    ticking: false,
    FINAL_OFFSET_Y: -20,
    TITLE_START_Y: -200,
    TEXT_START_Y: 44,
    TEXT_MASK_FADE_PCT: 9,
    TEXT_START_EARLY_PX: 140,

    clamp(value, min = 0, max = 1) {
      return Math.min(Math.max(value, min), max);
    },

    applyTitle(progress) {
      // Animación de entrada del título migrada a sustProcessTitleReveal (mismo
      // efecto que .sust-process__title). Se deja el método vacío para no
      // romper llamadas existentes desde update().
    },

    applyText(progress) {
      // Animación de entrada del texto migrada a .anim-fade-up (mismo efecto
      // que .sust-process__text). Se deja el método vacío para no romper
      // llamadas existentes desde update().
    },

    update() {
      if (!this.sectionEl || !this.titleEl || !this.textEl) return;

      const viewportHeight = window.innerHeight;
      const titleRect = this.titleEl.getBoundingClientRect();
      const titleStart = viewportHeight * 0.92;
      const titleEnd = viewportHeight * 0.58;
      const titleProgress = this.clamp((titleStart - titleRect.top) / (titleStart - titleEnd));

      const textStart = titleEnd + this.TEXT_START_EARLY_PX;
      const textEnd = viewportHeight * 0.42;
      const textProgress = this.clamp((textStart - titleRect.top) / (textStart - textEnd));

      this.applyTitle(titleProgress);
      this.applyText(textProgress);
    },

    requestUpdate() {
      if (this.ticking) return;
      this.ticking = true;
      window.requestAnimationFrame(() => {
        this.ticking = false;
        this.update();
      });
    },

    init() {
      // Animaciones migradas a sustProcessTitleReveal y anim-fade-up.
      // El módulo queda disponible por si se reactiva; por ahora no hace nada.
      return;
    },
  },

  sustStrategiesOrbit: {
    api: null,

    init() {
      const module = this;
      module.api = {
        focusKey() {},
        setReferenceChangeCallback() {},
      };

      const svg = document.querySelector('.sust-strategies__diagram-svg');
      const orbitPoints = svg?.querySelector('.sust-strategies__orbit-points');
      const orbitLabels = svg?.querySelector('.sust-strategies__orbit-labels');
      const labelOrbitGuide = svg?.querySelector('.sust-strategies__label-orbit-guide');
      const labelOrbitItems = orbitLabels
        ? Array.from(orbitLabels.querySelectorAll('.sust-strategies__orbit-label-item[data-strategy]'))
        : [];

      if (!svg || !orbitPoints || !orbitLabels || !labelOrbitItems.length) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const wheelEase = 0.14;
      const autoFocusEase = 0.045;
      const centerX = Number(labelOrbitGuide?.getAttribute('cx')) || 400;
      const centerY = Number(labelOrbitGuide?.getAttribute('cy')) || 400;
      const labelRadiusX = Number(labelOrbitGuide?.getAttribute('rx')) || 310;
      const labelRadiusY = Number(labelOrbitGuide?.getAttribute('ry')) || 298;
      const state = {
        currentAngle: 0,
        targetAngle: 0,
        frameId: 0,
        trackReferenceSelection: false,
        lastReferenceKey: '',
        onReferenceChange: null,
        motionEase: wheelEase,
      };

      const normalizeAngleRad = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
      const normalizeAngleDeg = (angle) => {
        const wrapped = ((angle + 180) % 360 + 360) % 360;
        return wrapped - 180;
      };

      const labelOrbits = labelOrbitItems
        .map((item) => {
          const transform = item.getAttribute('transform') || '';
          const match = transform.match(/translate\(\s*(-?[\d.]+)[ ,]\s*(-?[\d.]+)\s*\)/);
          if (!match) return null;

          const x = Number(match[1]);
          const y = Number(match[2]);
          const key = item.dataset.strategy || '';
          if (!Number.isFinite(x) || !Number.isFinite(y) || !key) return null;

          return {
            item,
            key,
            baseAngle: Math.atan2(y - centerY, x - centerX),
          };
        })
        .filter(Boolean);

      if (!labelOrbits.length) return;

      const labelOrbitMap = new Map(labelOrbits.map((orbit) => [orbit.key, orbit]));

      const getReferenceOrbit = (angle = state.currentAngle) => {
        const angleInRadians = (angle * Math.PI) / 180;
        let nearestOrbit = null;

        labelOrbits.forEach((orbit) => {
          const orbitAngle = orbit.baseAngle + angleInRadians;
          const distanceToReference = Math.abs(normalizeAngleRad(orbitAngle));

          if (!nearestOrbit || distanceToReference < nearestOrbit.distanceToReference) {
            nearestOrbit = {
              key: orbit.key,
              distanceToReference,
            };
          }
        });

        return nearestOrbit;
      };

      const notifyReferenceChange = () => {
        if (!state.trackReferenceSelection || typeof state.onReferenceChange !== 'function') return;

        const nearestOrbit = getReferenceOrbit();
        if (!nearestOrbit || nearestOrbit.key === state.lastReferenceKey) return;

        state.lastReferenceKey = nearestOrbit.key;
        state.onReferenceChange(nearestOrbit.key);
      };

      const applyTransforms = (angle) => {
        const rotation = `rotate(${angle.toFixed(3)} ${centerX} ${centerY})`;
        orbitPoints.setAttribute('transform', rotation);

        const angleInRadians = (angle * Math.PI) / 180;
        labelOrbits.forEach(({ item, baseAngle }) => {
          const orbitAngle = baseAngle + angleInRadians;
          const x = centerX + labelRadiusX * Math.cos(orbitAngle);
          const y = centerY + labelRadiusY * Math.sin(orbitAngle);
          item.setAttribute('transform', `translate(${x.toFixed(3)} ${y.toFixed(3)})`);
        });
      };

      const finishFrame = () => {
        applyTransforms(state.currentAngle);
        notifyReferenceChange();
        state.frameId = 0;
      };

      const render = () => {
        if (reduceMotion) {
          state.currentAngle = state.targetAngle;
          finishFrame();
          return;
        }

        state.currentAngle += (state.targetAngle - state.currentAngle) * state.motionEase;
        applyTransforms(state.currentAngle);
        notifyReferenceChange();

        if (Math.abs(state.targetAngle - state.currentAngle) < 0.05) {
          state.currentAngle = state.targetAngle;
          finishFrame();
          return;
        }

        state.frameId = window.requestAnimationFrame(render);
      };

      const queueRender = () => {
        if (reduceMotion) {
          render();
          return;
        }

        if (state.frameId) return;
        state.frameId = window.requestAnimationFrame(render);
      };

      const normalizeWheelDelta = (event) => {
        let delta = event.deltaY;

        if (event.deltaMode === 1) delta *= 16;
        if (event.deltaMode === 2) delta *= window.innerHeight;

        return delta;
      };

      // En desktop el detail aparece a la derecha, así que el item activo se
      // lleva al este (ángulo 0°). En mobile el detail aparece debajo de la
      // rueda, así que el item debe ir al sur (ángulo 90° en coordenadas SVG,
      // donde Y positivo es abajo).
      const isMobileViewport = () =>
        window.matchMedia('(max-width: 1023.98px)').matches;

      module.api = {
        focusKey(key) {
          const orbit = labelOrbitMap.get(key);
          if (!orbit) return;

          // Posición destino del item: 0° = este (desktop), 90° = sur (mobile).
          const desiredFinalAngleDeg = isMobileViewport() ? 90 : 0;

          // Rotación que hay que aplicar al SVG para que el ángulo base del
          // item termine apuntando al desiredFinalAngleDeg.
          const baseTargetAngle =
            desiredFinalAngleDeg - (orbit.baseAngle * 180) / Math.PI;
          const shortestDelta = normalizeAngleDeg(baseTargetAngle - state.currentAngle);

          state.trackReferenceSelection = false;
          state.lastReferenceKey = key;
          state.motionEase = autoFocusEase;
          state.targetAngle = state.currentAngle + shortestDelta;
          queueRender();
        },

        setReferenceChangeCallback(callback) {
          state.onReferenceChange = callback;
        },
      };

      // Radio (en coords del viewBox) de la zona donde el wheel rota la rueda.
      // Por fuera de este círculo, el wheel se deja pasar al scroll de la página.
      const HOT_ZONE_RADIUS = 230;

      const isPointerInsideHotZone = (event) => {
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;

        // viewBox es 800x800 cuadrado; convertimos coords del mouse al espacio del viewBox.
        const viewBoxX = ((event.clientX - rect.left) / rect.width) * 800;
        const viewBoxY = ((event.clientY - rect.top) / rect.height) * 800;
        const dx = viewBoxX - centerX;
        const dy = viewBoxY - centerY;
        return (dx * dx + dy * dy) <= (HOT_ZONE_RADIUS * HOT_ZONE_RADIUS);
      };

      svg.addEventListener('wheel', (event) => {
        if (!isPointerInsideHotZone(event)) return; // dejá que la página scrollee

        const delta = normalizeWheelDelta(event);
        if (!Number.isFinite(delta) || Math.abs(delta) < 0.01) return;

        event.preventDefault();
        state.motionEase = wheelEase;
        state.targetAngle += delta * 0.06;
        state.trackReferenceSelection = true;

        queueRender();
      }, { passive: false });

      applyTransforms(0);
    },
  },

  sustStrategiesDetail: {
    init() {
      const section = document.querySelector('.sust-strategies');
      const detail = section?.querySelector('.sust-strategies__detail');
      const detailStack = detail?.querySelector('.sust-strategies__detail-stack');
      const detailIcon = detail?.querySelector('.sust-strategies__detail-icon');
      const detailLabel = detail?.querySelector('.sust-strategies__detail-label');
      const detailTitle = detail?.querySelector('.sust-strategies__detail-title');
      const detailText = detail?.querySelector('.sust-strategies__detail-text');
      const labelItems = section
        ? Array.from(section.querySelectorAll('.sust-strategies__orbit-label-item[data-strategy]'))
        : [];
      const orbitApi = Timbo.sustStrategiesOrbit.api;
      const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

      const detailMedia = detail?.querySelector('.sust-strategies__detail-media');

      if (!section || !detail || !detailMedia || !detailStack || !detailIcon || !detailLabel || !detailTitle || !detailText || !labelItems.length) return;

      // El aside está siempre abierto: marcamos el estado una sola vez en el init.
      section.classList.add('is-detail-open');

      const getStrategies = () => {
        const lang = Timbo.state.lang === 'en' ? 'en' : 'es';
        return SITE_DATA.sustainability?.[lang]?.strategies?.items
          || SITE_DATA.sustainability?.es?.strategies?.items
          || {};
      };

      let activeKey = '';
      let swapToken = 0;

      const cancelDetailAnimations = () => {
        detailStack.getAnimations().forEach((animation) => animation.cancel());
      };

      const setDetailContent = (strategy) => {
        detailMedia.dataset.strategy = strategy ? activeKey : '';
        const lang = Timbo.state.lang === 'en' ? 'en' : 'es';

        if (strategy) {
          detailIcon.src = strategy.icon;
          detailIcon.alt = lang === 'en'
            ? `Icon of ${strategy.title}`
            : `Icono de ${strategy.title}`;
          detailIcon.hidden = false;
        } else {
          detailIcon.removeAttribute('src');
          detailIcon.alt = '';
          detailIcon.hidden = true;
        }

        if (strategy?.labelSvg) {
          detailLabel.src = strategy.labelSvg;
          detailLabel.alt = '';
          detailLabel.hidden = false;
          detailTitle.classList.add('visually-hidden');
        } else {
          detailLabel.removeAttribute('src');
          detailLabel.alt = '';
          detailLabel.hidden = true;
          detailTitle.classList.remove('visually-hidden');
        }

        detailTitle.textContent = strategy ? strategy.title : '';
        detailText.textContent = strategy?.description || '';
        detailText.hidden = !strategy?.description;
      };

      const refreshInteractiveText = () => {
        const strategies = getStrategies();

        labelItems.forEach((item) => {
          const strategy = strategies[item.dataset.strategy];
          if (!strategy) return;
          item.setAttribute('aria-label', strategy.title);
        });

        if (!activeKey || !strategies[activeKey]) return;
        setDetailContent(strategies[activeKey]);
      };

      this.refresh = refreshInteractiveText;

      const animateDetailSwap = async (strategy, token) => {
        const exitAnimation = detailStack.animate([
          {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1)',
            filter: 'blur(0px)',
          },
          {
            opacity: 0,
            transform: 'translate3d(0, 3px, 0) scale(0.998)',
            filter: 'blur(4px)',
          },
        ], {
          duration: 150,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'forwards',
        });

        try {
          await exitAnimation.finished;
        } catch (_) {
          return;
        }

        if (token !== swapToken) return;

        setDetailContent(strategy);
        cancelDetailAnimations();

        const enterAnimation = detailStack.animate([
          {
            opacity: 0,
            transform: 'translate3d(0, 2px, 0) scale(0.999)',
            filter: 'blur(5px)',
          },
          {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1)',
            filter: 'blur(0px)',
          },
        ], {
          duration: 260,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        });

        enterAnimation.finished
          .catch(() => {})
          .finally(() => {
            if (token !== swapToken) return;
            cancelDetailAnimations();
          });
      };

      const setActive = (key = '') => {
        const strategies = getStrategies();

        // El aside está siempre abierto: ignoramos llamadas sin key
        // (que antes cerraban el detalle).
        if (!key || !strategies[key]) return;

        swapToken += 1;
        const token = swapToken;
        const previousKey = activeKey;
        const strategy = strategies[key];
        activeKey = key;

        labelItems.forEach((item) => {
          const isActive = item.dataset.strategy === activeKey;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });

        cancelDetailAnimations();

        // previousKey vacío = primera invocación → no animamos el swap.
        const shouldAnimateSwap = Boolean(
          strategy
          && previousKey
          && previousKey !== activeKey
          && !reduceMotionQuery?.matches
        );

        if (shouldAnimateSwap) {
          animateDetailSwap(strategy, token);
          return;
        }

        setDetailContent(strategy);
      };

      const openStrategy = (key) => {
        const strategies = getStrategies();
        if (!strategies[key]) return;

        setActive(key);
        orbitApi?.focusKey(key);
      };

      labelItems.forEach((item) => {
        const key = item.dataset.strategy;
        const strategies = getStrategies();
        const strategy = strategies[key];
        if (!strategy) return;

        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-controls', 'sust-strategies-detail');
        item.setAttribute('aria-expanded', 'false');
        item.setAttribute('aria-label', strategy.title);

        item.addEventListener('click', () => {
          if (activeKey === key) return;
          openStrategy(key);
        });

        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (activeKey === key) return;
            openStrategy(key);
          }
        });
      });

      orbitApi?.setReferenceChangeCallback((key) => {
        const strategies = getStrategies();
        if (!key || !strategies[key]) return;
        setActive(key);
      });

      // Estrategia inicial: en desktop arranca con la que queda a la derecha
      // (transmitancia, en (710, 400)); en mobile arranca con la que queda
      // al sur (proporcion, en (400, 698)).
      const isMobileViewport = window.matchMedia?.('(max-width: 1023.98px)').matches;
      const initialKey = isMobileViewport ? 'proporcion' : 'transmitancia';
      openStrategy(initialKey);
      refreshInteractiveText();
    },
  },

  sustPilaresOrbit: {
    api: null,

    init() {
      const module = this;
      module.api = {
        focusKey() {},
        setReferenceChangeCallback() {},
      };

      const svg = document.querySelector('.sust-pilares__diagram-svg');
      const orbitPoints = svg?.querySelector('.sust-pilares__orbit-points');
      const orbitLabels = svg?.querySelector('.sust-pilares__orbit-labels');
      const labelOrbitGuide = svg?.querySelector('.sust-pilares__label-orbit-guide');
      const labelOrbitItems = orbitLabels
        ? Array.from(orbitLabels.querySelectorAll('.sust-pilares__orbit-label-item[data-pilar]'))
        : [];

      if (!svg || !orbitPoints || !orbitLabels || !labelOrbitItems.length) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const wheelEase = 0.14;
      const autoFocusEase = 0.045;
      const centerX = Number(labelOrbitGuide?.getAttribute('cx')) || 400;
      const centerY = Number(labelOrbitGuide?.getAttribute('cy')) || 400;
      // Los labels se posicionan sobre un CÍRCULO (no elipse). El radio se
      // toma del atributo r del guide. Esto asegura alineación radial perfecta
      // entre cada punto y su label (mismo ángulo, distinta distancia).
      const labelRadius = Number(labelOrbitGuide?.getAttribute('r')) || 305;
      const state = {
        currentAngle: 0,
        targetAngle: 0,
        frameId: 0,
        trackReferenceSelection: false,
        lastReferenceKey: '',
        onReferenceChange: null,
        motionEase: wheelEase,
      };

      const normalizeAngleRad = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
      const normalizeAngleDeg = (angle) => {
        const wrapped = ((angle + 180) % 360 + 360) % 360;
        return wrapped - 180;
      };

      // baseAngle = ángulo del PUNTO. Como ahora los labels están sobre un
      // círculo en la misma línea radial que el punto, ese mismo ángulo sirve
      // para posicionar el label.
      const labelOrbits = labelOrbitItems
        .map((item) => {
          const key = item.dataset.pilar || '';
          if (!key) return null;

          const point = orbitPoints.querySelector(`circle[data-pilar="${key}"]`);
          if (!point) return null;

          const px = Number(point.getAttribute('cx'));
          const py = Number(point.getAttribute('cy'));
          if (!Number.isFinite(px) || !Number.isFinite(py)) return null;

          return {
            item,
            key,
            baseAngle: Math.atan2(py - centerY, px - centerX),
          };
        })
        .filter(Boolean);

      if (!labelOrbits.length) return;

      const labelOrbitMap = new Map(labelOrbits.map((orbit) => [orbit.key, orbit]));

      const getReferenceOrbit = (angle = state.currentAngle) => {
        const angleInRadians = (angle * Math.PI) / 180;
        let nearestOrbit = null;

        labelOrbits.forEach((orbit) => {
          const orbitAngle = orbit.baseAngle + angleInRadians;
          const distanceToReference = Math.abs(normalizeAngleRad(orbitAngle));

          if (!nearestOrbit || distanceToReference < nearestOrbit.distanceToReference) {
            nearestOrbit = {
              key: orbit.key,
              distanceToReference,
            };
          }
        });

        return nearestOrbit;
      };

      const notifyReferenceChange = () => {
        if (!state.trackReferenceSelection || typeof state.onReferenceChange !== 'function') return;

        const nearestOrbit = getReferenceOrbit();
        if (!nearestOrbit || nearestOrbit.key === state.lastReferenceKey) return;

        state.lastReferenceKey = nearestOrbit.key;
        state.onReferenceChange(nearestOrbit.key);
      };

      const applyTransforms = (angle) => {
        const rotation = `rotate(${angle.toFixed(3)} ${centerX} ${centerY})`;
        orbitPoints.setAttribute('transform', rotation);

        const angleInRadians = (angle * Math.PI) / 180;
        labelOrbits.forEach(({ item, baseAngle }) => {
          const orbitAngle = baseAngle + angleInRadians;
          const x = centerX + labelRadius * Math.cos(orbitAngle);
          const y = centerY + labelRadius * Math.sin(orbitAngle);
          item.setAttribute('transform', `translate(${x.toFixed(3)} ${y.toFixed(3)})`);
        });
      };

      const finishFrame = () => {
        applyTransforms(state.currentAngle);
        notifyReferenceChange();
        state.frameId = 0;
      };

      const render = () => {
        if (reduceMotion) {
          state.currentAngle = state.targetAngle;
          finishFrame();
          return;
        }

        state.currentAngle += (state.targetAngle - state.currentAngle) * state.motionEase;
        applyTransforms(state.currentAngle);
        notifyReferenceChange();

        if (Math.abs(state.targetAngle - state.currentAngle) < 0.05) {
          state.currentAngle = state.targetAngle;
          finishFrame();
          return;
        }

        state.frameId = window.requestAnimationFrame(render);
      };

      const queueRender = () => {
        if (reduceMotion) {
          render();
          return;
        }

        if (state.frameId) return;
        state.frameId = window.requestAnimationFrame(render);
      };

      const normalizeWheelDelta = (event) => {
        let delta = event.deltaY;

        if (event.deltaMode === 1) delta *= 16;
        if (event.deltaMode === 2) delta *= window.innerHeight;

        return delta;
      };

      // En desktop el detail aparece a la derecha, así que el item activo se
      // lleva al este (ángulo 0°). En mobile el detail aparece debajo de la
      // rueda, así que el item debe ir al sur (ángulo 90° en coordenadas SVG,
      // donde Y positivo es abajo).
      const isMobileViewport = () =>
        window.matchMedia('(max-width: 1023.98px)').matches;

      module.api = {
        focusKey(key) {
          const orbit = labelOrbitMap.get(key);
          if (!orbit) return;

          // Posición destino del item: 0° = este (desktop), 90° = sur (mobile).
          const desiredFinalAngleDeg = isMobileViewport() ? 90 : 0;

          // Rotación que hay que aplicar al SVG para que el ángulo base del
          // item termine apuntando al desiredFinalAngleDeg.
          const baseTargetAngle =
            desiredFinalAngleDeg - (orbit.baseAngle * 180) / Math.PI;
          const shortestDelta = normalizeAngleDeg(baseTargetAngle - state.currentAngle);

          state.trackReferenceSelection = false;
          state.lastReferenceKey = key;
          state.motionEase = autoFocusEase;
          state.targetAngle = state.currentAngle + shortestDelta;
          queueRender();
        },

        setReferenceChangeCallback(callback) {
          state.onReferenceChange = callback;
        },
      };

      // Radio del círculo donde el wheel debe rotar la rueda. Si el mouse
      // está fuera de este radio (aunque siga dentro del SVG), el scroll va
      // a la página normal.
      const interactiveRadius = 220;

      const isPointerInsideCircle = (event) => {
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        // El SVG renderiza con viewBox 0 0 800 800; mapeamos las coordenadas
        // del mouse al espacio del viewBox.
        const xInSvg = ((event.clientX - rect.left) / rect.width) * 800;
        const yInSvg = ((event.clientY - rect.top) / rect.height) * 800;
        const dx = xInSvg - centerX;
        const dy = yInSvg - centerY;
        return (dx * dx + dy * dy) <= interactiveRadius * interactiveRadius;
      };

      svg.addEventListener('wheel', (event) => {
        if (!isPointerInsideCircle(event)) return;

        const delta = normalizeWheelDelta(event);
        if (!Number.isFinite(delta) || Math.abs(delta) < 0.01) return;

        event.preventDefault();
        state.motionEase = wheelEase;
        state.targetAngle += delta * 0.06;
        state.trackReferenceSelection = true;

        queueRender();
      }, { passive: false });

      // Ángulo inicial de la rueda:
      // - Desktop: 0° (los puntos quedan donde el SVG los dibuja).
      // - Mobile: rotación leve horaria para que "flujo de aire" quede
      //   exactamente en el sur (centro del eje X, abajo del todo).
      //   flujo_aire está en (510, 590); con centro (400, 400) eso da
      //   un baseAngle de ~60° desde el este. Para llevarlo a 90° (sur)
      //   hace falta rotar +30°.
      const initialAngle = isMobileViewport() ? 30 : 0;
      state.currentAngle = initialAngle;
      state.targetAngle = initialAngle;
      applyTransforms(initialAngle);
    },
  },

  sustPilaresDetail: {
    init() {
      const section = document.querySelector('.sust-pilares');
      const detail = section?.querySelector('.sust-pilares__detail');
      const detailStack = detail?.querySelector('.sust-pilares__detail-stack');
      const detailMedia = detail?.querySelector('.sust-pilares__detail-media');
      const detailIcon = detail?.querySelector('.sust-pilares__detail-icon');
      const detailLabel = detail?.querySelector('.sust-pilares__detail-label');
      const detailTitle = detail?.querySelector('.sust-pilares__detail-title');
      const detailText = detail?.querySelector('.sust-pilares__detail-text');
      const labelItems = section
        ? Array.from(section.querySelectorAll('.sust-pilares__orbit-label-item[data-pilar]'))
        : [];
      const orbitApi = Timbo.sustPilaresOrbit.api;
      const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

      if (!section || !detail || !detailStack || !detailTitle || !detailText || !labelItems.length) return;

      // El aside está siempre abierto: marcamos el estado una sola vez en el init.
      section.classList.add('is-detail-open');

      const getPilares = () => {
        const lang = Timbo.state.lang || 'es';
        return SITE_DATA.sustainability?.[lang]?.pillars?.items
          || SITE_DATA.sustainability?.es?.pillars?.items
          || {};
      };

      let activeKey = '';
      let swapToken = 0;

      const cancelDetailAnimations = () => {
        detailStack.getAnimations().forEach((animation) => animation.cancel());
      };

      const setDetailContent = (pilar) => {
        if (detailMedia) {
          detailMedia.dataset.pilar = pilar ? activeKey : '';
        }

        if (detailIcon) {
          if (pilar?.icon) {
            detailIcon.src = pilar.icon;
            detailIcon.alt = Timbo.state.lang === 'en'
              ? `Icon of ${pilar.title}`
              : `Icono de ${pilar.title}`;
            detailIcon.hidden = false;
          } else {
            detailIcon.removeAttribute('src');
            detailIcon.alt = '';
            detailIcon.hidden = true;
          }
        }

        if (detailLabel) {
          if (pilar?.labelSvg) {
            detailLabel.src = pilar.labelSvg;
            detailLabel.alt = '';
            detailLabel.hidden = false;
            detailTitle.classList.add('visually-hidden');
          } else {
            detailLabel.removeAttribute('src');
            detailLabel.alt = '';
            detailLabel.hidden = true;
            detailTitle.classList.remove('visually-hidden');
          }
        }

        detailTitle.textContent = pilar ? pilar.title : '';
        detailText.textContent = pilar ? pilar.description : '';
      };

      const refreshInteractiveText = () => {
        const pilares = getPilares();

        labelItems.forEach((item) => {
          const pilar = pilares[item.dataset.pilar];
          if (!pilar) return;
          item.setAttribute('aria-label', pilar.title);
        });

        if (!activeKey || !pilares[activeKey]) return;
        setDetailContent(pilares[activeKey]);
      };

      this.refresh = refreshInteractiveText;

      const animateDetailSwap = async (pilar, token) => {
        const exitAnimation = detailStack.animate([
          {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1)',
            filter: 'blur(0px)',
          },
          {
            opacity: 0,
            transform: 'translate3d(0, 3px, 0) scale(0.998)',
            filter: 'blur(4px)',
          },
        ], {
          duration: 150,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'forwards',
        });

        try {
          await exitAnimation.finished;
        } catch (_) {
          return;
        }

        if (token !== swapToken) return;

        setDetailContent(pilar);
        cancelDetailAnimations();

        const enterAnimation = detailStack.animate([
          {
            opacity: 0,
            transform: 'translate3d(0, 2px, 0) scale(0.999)',
            filter: 'blur(5px)',
          },
          {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1)',
            filter: 'blur(0px)',
          },
        ], {
          duration: 260,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        });

        enterAnimation.finished
          .catch(() => {})
          .finally(() => {
            if (token !== swapToken) return;
            cancelDetailAnimations();
          });
      };

      const setActive = (key = '') => {
        const pilares = getPilares();

        // El aside está siempre abierto: ignoramos llamadas sin key
        // (que antes cerraban el detalle).
        if (!key || !pilares[key]) return;

        swapToken += 1;
        const token = swapToken;
        const previousKey = activeKey;
        const pilar = pilares[key];
        activeKey = key;

        labelItems.forEach((item) => {
          const isActive = item.dataset.pilar === activeKey;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });

        cancelDetailAnimations();

        // previousKey vacío = primera invocación → no animamos el swap.
        const shouldAnimateSwap = Boolean(
          pilar
          && previousKey
          && previousKey !== activeKey
          && !reduceMotionQuery?.matches
        );

        if (shouldAnimateSwap) {
          animateDetailSwap(pilar, token);
          return;
        }

        setDetailContent(pilar);
      };

      const openPilar = (key) => {
        const pilares = getPilares();
        if (!pilares[key]) return;

        setActive(key);
        orbitApi?.focusKey(key);
      };

      labelItems.forEach((item) => {
        const key = item.dataset.pilar;
        const pilares = getPilares();
        const pilar = pilares[key];
        if (!pilar) return;

        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-controls', 'sust-pilares-detail');
        item.setAttribute('aria-expanded', 'false');
        item.setAttribute('aria-label', pilar.title);

        item.addEventListener('click', () => {
          if (activeKey === key) return;
          openPilar(key);
        });

        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (activeKey === key) return;
            openPilar(key);
          }
        });
      });

      orbitApi?.setReferenceChangeCallback((key) => {
        const pilares = getPilares();
        if (!key || !pilares[key]) return;
        setActive(key);
      });

      // Pilar inicial: en desktop arranca con el que queda a la derecha (luz);
      // en mobile arranca con el que queda al sur (flujo_aire), respetando la
      // rotación inicial de 30° que aplica sustPilaresOrbit.
      const isMobileViewport = window.matchMedia?.('(max-width: 1023.98px)').matches;
      const initialKey = isMobileViewport ? 'flujo_aire' : 'luz';
      openPilar(initialKey);
      refreshInteractiveText();
    },
  },

  /* ============================================================
     HERO INTRO (animación al cargar)
     ============================================================ */
  heroIntro: {
    init() {
      const heroContent = document.querySelector('#hero .hero__content');
      const heroBg = document.querySelector('#hero .hero__bg');
      const video = heroBg?.querySelector('video');
      if (!heroContent) return;

      if (!video) {
        heroContent.classList.add('is-visible');
        return;
      }

      // El <source> del HTML no tiene src: se elige acá según viewport
      // (mobile → versión liviana 1080p, desktop → 4K). Así el browser
      // nunca descarga el 4K en un celular.
      const source = video.querySelector('source');
      if (source && !source.getAttribute('src')) {
        const isMobile = window.matchMedia('(max-width: 1023.98px)').matches;
        const src = isMobile
          ? source.getAttribute('data-src-mobile')
          : source.getAttribute('data-src-desktop');
        if (src) {
          source.src = src;
          video.load();
        }
      }

      // Sin animación de entrada del video: mostrar y reproducir directo.
      video.classList.add('is-armed', 'is-loaded');
      if (heroBg) heroBg.classList.add('hero__bg--video-loaded');
      video.play().catch(() => {});
      heroContent.classList.add('is-visible');
    },
  },

  projectHeroIntro: {
    init() {
      if (!document.body.classList.contains('page--haras-light')) return;
      const heroContent = document.querySelector('#hero .project-hero__content');
      if (!heroContent) return;

      heroContent.classList.add('is-visible');
    },
  },

  /* ============================================================
     HERO PARALLAX
     Tagline y logo bajan con el scroll a distintos ratios.
     Ambos se frenan cuando el logo alcanza MAX_LOGO_Y (px).
     Además, el tagline se escala de 1 a TAGLINE_MIN_SCALE durante los
     primeros TAGLINE_SCALE_DISTANCE px de scroll.
     ============================================================ */
  heroParallax: {
    TAGLINE_RATE: 0.4,
    LOGO_RATE: 0.25,
    MAX_LOGO_Y: 150,
    TAGLINE_SCALE_DISTANCE: 150,   // px de scroll durante los que escala
    TAGLINE_MIN_SCALE: 0.9,        // escala final del tagline
    TAGLINE_OPACITY_DISTANCE: 50,    // fase 1: px de scroll durante los que baja la opacidad (1 → TAGLINE_MIN_OPACITY)
    TAGLINE_MIN_OPACITY: 0.9,        // opacidad al final de la fase 1
    TAGLINE_OPACITY_DISTANCE_2: 100, // fase 2: px adicionales durante los que sigue bajando
    TAGLINE_MIN_OPACITY_2: 0.6,      // opacidad al final de la fase 2 (luego queda fija)
    TAGLINE_MASK_SCROLL: 60,         // scrollY en el que el tagline "toca" la franja invisible
    TAGLINE_MASK_FADE: 12,           // px de fade suave en el borde de la franja
    TAGLINE_RATE_POST_MASK: 0.5,     // rate de descenso del tagline una vez que toca la máscara
    LOGO_SCALE_START: 0,             // scrollY al que arranca el crecimiento del logo
    LOGO_SCALE_DISTANCE: 250,        // px de scroll durante los que crece
    LOGO_MAX_SCALE: 1.12,            // escala final del logo (12% más grande)
    LOGO_MASK_FADE: 4,               // px de fade suave en el borde de la franja del logo
    LOGO_MASK_Y_OFFSET: 64,          // desplaza la franja invisible más abajo para retrasar el recorte
    LOGO_SLOW_RATE: 0.2,             // rate durante la transición lenta antes del cambio 1:1
    LOGO_RESUME_SCROLL: 788,         // scrollY a partir del cual el logo baja 1:1
    LOGO_RESUME_RATE: 1.0,           // rate de descenso 1:1 desde LOGO_RESUME_SCROLL
    LOGO_OPACITY_START: 700,         // fase 1: scrollY al que empieza el fade de opacidad del logo
    LOGO_OPACITY_MID: 780,           // fase 1: scrollY al que el logo alcanza LOGO_MID_OPACITY
    LOGO_OPACITY_END: 930,           // fase 2: scrollY al que termina el fade (opacidad 0)
    LOGO_MID_OPACITY: 0.6,           // opacidad intermedia (al final de la fase 1)
    LOGO_MIN_OPACITY: 0,             // opacidad final del logo
    LERP_EASE: 0.12,                 // suavizado del translateY (0-1). Más bajo = más flojo. Típico 0.08-0.18
    LERP_EPSILON: 0.05,              // diferencia mínima (px) para seguir animando. Evita loop infinito
    taglineEl: null,
    logoEl: null,
    taglineYSmooth: 0,               // translateY del tagline suavizado (persigue al target cada frame)
    logoYSmooth: 0,                  // translateY del logo suavizado
    rafId: null,                     // id del requestAnimationFrame activo (null = loop dormido)

    init() {
      this.taglineEl = document.querySelector('.hero__tagline');
      this.logoEl = document.querySelector('.hero__logo');
      if (!this.taglineEl && !this.logoEl) return;
      this.update();
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    },

    onScroll() {
      // Si el loop ya está corriendo, no arranco otro: el loop se entera del nuevo scrollY solo.
      if (this.rafId != null) return;
      this.rafId = requestAnimationFrame(() => this.tick());
    },

    tick() {
      this.update();
      // Decidimos si seguir animando: comparamos los valores suavizados con los targets actuales.
      const scrolled = Math.max(0, window.scrollY);
      const scrollCap = this.MAX_LOGO_Y / this.LOGO_RATE;
      const scrolledEffective = Math.min(scrolled, scrollCap);
      const taglineYAtMask = this.TAGLINE_MASK_SCROLL * this.TAGLINE_RATE;
      const taglineTarget = scrolledEffective <= this.TAGLINE_MASK_SCROLL
        ? scrolledEffective * this.TAGLINE_RATE
        : taglineYAtMask + (scrolledEffective - this.TAGLINE_MASK_SCROLL) * this.TAGLINE_RATE_POST_MASK;
      const logoTarget = this.getLogoY(scrolled);
      const stillMoving =
        Math.abs(taglineTarget - this.taglineYSmooth) > this.LERP_EPSILON ||
        Math.abs(logoTarget - this.logoYSmooth) > this.LERP_EPSILON;
      if (stillMoving) {
        this.rafId = requestAnimationFrame(() => this.tick());
      } else {
        // Snap final para que no quede una fracción de px residual.
        this.taglineYSmooth = taglineTarget;
        this.logoYSmooth = logoTarget;
        this.rafId = null;
      }
    },

    getLogoY(scrolled) {
      const scrollCap = this.MAX_LOGO_Y / this.LOGO_RATE;

      if (scrolled <= scrollCap) {
        return scrolled * this.LOGO_RATE;
      }

      if (scrolled <= this.LOGO_RESUME_SCROLL) {
        return this.MAX_LOGO_Y + (scrolled - scrollCap) * this.LOGO_SLOW_RATE;
      }

      const slowScrollSpan = Math.max(0, this.LOGO_RESUME_SCROLL - scrollCap);
      const logoYAtResume = this.MAX_LOGO_Y + slowScrollSpan * this.LOGO_SLOW_RATE;
      return logoYAtResume + (scrolled - this.LOGO_RESUME_SCROLL) * this.LOGO_RESUME_RATE;
    },

    update() {
      const scrolled = Math.max(0, window.scrollY);
      // Scroll al que el logo alcanza su tope de fase 1. En ese momento el tagline
      // también queda congelado.
      const scrollCap = this.MAX_LOGO_Y / this.LOGO_RATE;
      const scrolledEffective = Math.min(scrolled, scrollCap);
      // Tagline: baja a TAGLINE_RATE hasta que toca la máscara (scrollY = TAGLINE_MASK_SCROLL);
      // a partir de ahí baja a TAGLINE_RATE_POST_MASK.
      const taglineYAtMask = this.TAGLINE_MASK_SCROLL * this.TAGLINE_RATE;
      let taglineYTarget;
      if (scrolledEffective <= this.TAGLINE_MASK_SCROLL) {
        taglineYTarget = scrolledEffective * this.TAGLINE_RATE;
      } else {
        taglineYTarget = taglineYAtMask + (scrolledEffective - this.TAGLINE_MASK_SCROLL) * this.TAGLINE_RATE_POST_MASK;
      }
      // Logo en tres fases:
      //   Fase 1 (0 -> scrollCap): desciende a LOGO_RATE hasta MAX_LOGO_Y.
      //   Fase 2 (scrollCap -> LOGO_RESUME_SCROLL): transición lenta a LOGO_SLOW_RATE.
      //   Fase 3 (LOGO_RESUME_SCROLL -> ...): desciende 1:1 a LOGO_RESUME_RATE.
      const logoYTarget = this.getLogoY(scrolled);

      // Lerp: los Y "suavizados" persiguen a sus targets cada frame.
      // El resto (scale, opacity, máscaras) se calcula con scroll directo para no desfasarse.
      this.taglineYSmooth += (taglineYTarget - this.taglineYSmooth) * this.LERP_EASE;
      this.logoYSmooth += (logoYTarget - this.logoYSmooth) * this.LERP_EASE;
      const taglineY = this.taglineYSmooth;
      const logoY = this.logoYSmooth;

      // Escala del tagline: 1 → TAGLINE_MIN_SCALE a lo largo de TAGLINE_SCALE_DISTANCE px
      const scaleProgress = Math.min(1, scrolled / this.TAGLINE_SCALE_DISTANCE);
      const taglineScale = 1 - (1 - this.TAGLINE_MIN_SCALE) * scaleProgress;

      // Opacidad del tagline en dos fases:
      //   Fase 1: de 0 a TAGLINE_OPACITY_DISTANCE px → opacidad 1 → TAGLINE_MIN_OPACITY
      //   Fase 2: de TAGLINE_OPACITY_DISTANCE a +TAGLINE_OPACITY_DISTANCE_2 px → TAGLINE_MIN_OPACITY → TAGLINE_MIN_OPACITY_2
      //   Después: se queda fija en TAGLINE_MIN_OPACITY_2.
      let taglineOpacity;
      if (scrolled <= this.TAGLINE_OPACITY_DISTANCE) {
        const p1 = scrolled / this.TAGLINE_OPACITY_DISTANCE;
        taglineOpacity = 1 - (1 - this.TAGLINE_MIN_OPACITY) * p1;
      } else {
        const p2 = Math.min(1, (scrolled - this.TAGLINE_OPACITY_DISTANCE) / this.TAGLINE_OPACITY_DISTANCE_2);
        taglineOpacity = this.TAGLINE_MIN_OPACITY - (this.TAGLINE_MIN_OPACITY - this.TAGLINE_MIN_OPACITY_2) * p2;
      }

      if (this.taglineEl) {
        this.taglineEl.style.transform = `translateY(${taglineY}px) scale(${taglineScale})`;
        this.taglineEl.style.opacity = String(taglineOpacity);

        // Máscara: fija a la altura que el tagline tiene a scrollY = TAGLINE_MASK_SCROLL.
        const overshoot = Math.max(0, taglineY - taglineYAtMask);
        if (overshoot > 0) {
          const taglineHeight = this.taglineEl.offsetHeight || 1;
          const visibleBottom = Math.max(0, taglineHeight - overshoot);
          const fadeStart = Math.max(0, visibleBottom - this.TAGLINE_MASK_FADE);
          const maskValue = `linear-gradient(to bottom, #000 0px, #000 ${fadeStart}px, rgba(0,0,0,0) ${visibleBottom}px, rgba(0,0,0,0) 100%)`;
          this.taglineEl.style.webkitMaskImage = maskValue;
          this.taglineEl.style.maskImage = maskValue;
        } else {
          this.taglineEl.style.webkitMaskImage = '';
          this.taglineEl.style.maskImage = '';
        }
      }

      this.applyLogoMotion(this.logoEl, scrolled, logoY);
    },

    applyLogoMotion(logoEl, scrolled, logoYOverride = null) {
      if (!logoEl) return;

      const logoY = logoYOverride == null
        ? this.getLogoY(scrolled)
        : logoYOverride;

      // Escala del logo: 1 → LOGO_MAX_SCALE a lo largo de LOGO_SCALE_DISTANCE px, empezando en LOGO_SCALE_START.
      const logoScaleScroll = Math.max(0, scrolled - this.LOGO_SCALE_START);
      const logoScaleProgress = Math.min(1, logoScaleScroll / this.LOGO_SCALE_DISTANCE);
      const logoScale = 1 + (this.LOGO_MAX_SCALE - 1) * logoScaleProgress;

      // Opacidad del logo en dos fases:
      //   Fase 1: LOGO_OPACITY_START → LOGO_OPACITY_MID  → 1 → LOGO_MID_OPACITY
      //   Fase 2: LOGO_OPACITY_MID   → LOGO_OPACITY_END  → LOGO_MID_OPACITY → LOGO_MIN_OPACITY
      let logoOpacity;
      if (scrolled <= this.LOGO_OPACITY_START) {
        logoOpacity = 1;
      } else if (scrolled <= this.LOGO_OPACITY_MID) {
        const span1 = Math.max(1, this.LOGO_OPACITY_MID - this.LOGO_OPACITY_START);
        const p1 = (scrolled - this.LOGO_OPACITY_START) / span1;
        logoOpacity = 1 - (1 - this.LOGO_MID_OPACITY) * p1;
      } else {
        const span2 = Math.max(1, this.LOGO_OPACITY_END - this.LOGO_OPACITY_MID);
        const p2 = Math.min(1, (scrolled - this.LOGO_OPACITY_MID) / span2);
        logoOpacity = this.LOGO_MID_OPACITY - (this.LOGO_MID_OPACITY - this.LOGO_MIN_OPACITY) * p2;
      }

      logoEl.style.transformOrigin = 'top center';
      logoEl.style.transform = `translateY(${logoY}px) scale(${logoScale})`;
      logoEl.style.opacity = String(logoOpacity);

      // Máscara del logo: se ubica a la altura máxima que alcanza la base del logo,
      // con un offset extra hacia abajo para retrasar cuándo empieza a ocultarse.
      const logoNaturalHeight = logoEl.offsetHeight || 1;
      const maskLine = this.MAX_LOGO_Y + this.LOGO_MASK_Y_OFFSET + logoNaturalHeight * this.LOGO_MAX_SCALE;
      const currentBase = logoY + logoNaturalHeight * logoScale;
      const overshoot = Math.max(0, currentBase - maskLine);
      if (overshoot > 0) {
        const scaledHeight = logoNaturalHeight * logoScale;
        const visibleBottomScaled = Math.max(0, scaledHeight - overshoot);
        const visibleBottom = visibleBottomScaled / logoScale;
        const fadeStart = Math.max(0, visibleBottom - this.LOGO_MASK_FADE / logoScale);
        const maskValue = `linear-gradient(to bottom, #000 0px, #000 ${fadeStart}px, rgba(0,0,0,0) ${visibleBottom}px, rgba(0,0,0,0) 100%)`;
        logoEl.style.webkitMaskImage = maskValue;
        logoEl.style.maskImage = maskValue;
      } else {
        logoEl.style.webkitMaskImage = '';
        logoEl.style.maskImage = '';
      }
    },
  },

  sustHeroIntro: {
    init() {
      const heroSection = document.querySelector('.sust-hero');
      const heroContent = heroSection?.querySelector('.sust-hero__content');
      const heroImage = heroSection?.querySelector('.sust-hero__media img');
      if (!heroSection || !heroContent) return;

      let scrollFadeActivated = false;
      let scrollFadeFallbackId = null;

      const activateScrollFade = () => {
        if (scrollFadeActivated) return;
        scrollFadeActivated = true;
        if (scrollFadeFallbackId) window.clearTimeout(scrollFadeFallbackId);
        heroSection.classList.add('is-scroll-fade-active');
      };

      const reveal = () => {
        window.requestAnimationFrame(() => {
          heroSection.classList.add('is-visible');
          heroContent.classList.add('is-visible');
          Timbo.sustHeroParallax.init();

          if (!heroImage) {
            activateScrollFade();
            return;
          }

          const onImageRevealEnd = (event) => {
            if (event.propertyName !== 'opacity') return;
            heroImage.removeEventListener('transitionend', onImageRevealEnd);
            activateScrollFade();
          };

          heroImage.addEventListener('transitionend', onImageRevealEnd);

          scrollFadeFallbackId = window.setTimeout(activateScrollFade, 2000);
        });
      };

      if (!heroImage || heroImage.complete) {
        reveal();
        return;
      }

      heroImage.addEventListener('load', reveal, { once: true });
      heroImage.addEventListener('error', reveal, { once: true });
    },
  },

  /* ============================================================
     SUST HERO PARALLAX
     Replica el comportamiento de entrada y scroll del hero principal
     sobre el titulo y logo del hero de sustentabilidad.
     ============================================================ */
  sustHeroParallax: {
    TITLE_RATE: 0.4,
    TITLE_SCALE_DISTANCE: 150,
    TITLE_MIN_SCALE: 0.9,
    TITLE_OPACITY_DISTANCE: 50,
    TITLE_MIN_OPACITY: 0.9,
    TITLE_OPACITY_DISTANCE_2: 100,
    TITLE_MIN_OPACITY_2: 0.6,
    TITLE_MASK_SCROLL: 60,
    TITLE_MASK_FADE: 12,
    TITLE_RATE_POST_MASK: 0.5,
    titleEl: null,
    logoEl: null,
    ticking: false,
    initialized: false,

    init() {
      if (this.initialized) return;

      // Solo aplica a la vieja hero full-screen (con .sust-hero__logo).
      // La nueva hero (ex-overview) no usa este parallax.
      const legacyHero = document.querySelector('.sust-hero__logo');
      if (!legacyHero) return;

      this.titleEl = document.querySelector('.sust-hero__title');
      this.logoEl = document.querySelector('.sust-hero__logo');
      if (!this.titleEl && !this.logoEl) return;

      this.initialized = true;
      this.update();
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    },

    onScroll() {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
    },

    update() {
      const scrolled = Math.max(0, window.scrollY);
      const scrollCap = Timbo.heroParallax.MAX_LOGO_Y / Timbo.heroParallax.LOGO_RATE;
      const scrolledEffective = Math.min(scrolled, scrollCap);
      const titleYAtMask = this.TITLE_MASK_SCROLL * this.TITLE_RATE;
      let titleY;

      if (scrolledEffective <= this.TITLE_MASK_SCROLL) {
        titleY = scrolledEffective * this.TITLE_RATE;
      } else {
        titleY = titleYAtMask + (scrolledEffective - this.TITLE_MASK_SCROLL) * this.TITLE_RATE_POST_MASK;
      }

      const scaleProgress = Math.min(1, scrolled / this.TITLE_SCALE_DISTANCE);
      const titleScale = 1 - (1 - this.TITLE_MIN_SCALE) * scaleProgress;

      let titleOpacity;
      if (scrolled <= this.TITLE_OPACITY_DISTANCE) {
        const p1 = scrolled / this.TITLE_OPACITY_DISTANCE;
        titleOpacity = 1 - (1 - this.TITLE_MIN_OPACITY) * p1;
      } else {
        const p2 = Math.min(1, (scrolled - this.TITLE_OPACITY_DISTANCE) / this.TITLE_OPACITY_DISTANCE_2);
        titleOpacity = this.TITLE_MIN_OPACITY - (this.TITLE_MIN_OPACITY - this.TITLE_MIN_OPACITY_2) * p2;
      }

      if (this.titleEl) {
        this.titleEl.style.transform = `translateY(${titleY}px) scale(${titleScale})`;
        this.titleEl.style.opacity = String(titleOpacity);

        const overshoot = Math.max(0, titleY - titleYAtMask);
        if (overshoot > 0) {
          const titleHeight = this.titleEl.offsetHeight || 1;
          const visibleBottom = Math.max(0, titleHeight - overshoot);
          const fadeStart = Math.max(0, visibleBottom - this.TITLE_MASK_FADE);
          const maskValue = `linear-gradient(to bottom, #000 0px, #000 ${fadeStart}px, rgba(0,0,0,0) ${visibleBottom}px, rgba(0,0,0,0) 100%)`;
          this.titleEl.style.webkitMaskImage = maskValue;
          this.titleEl.style.maskImage = maskValue;
        } else {
          this.titleEl.style.webkitMaskImage = '';
          this.titleEl.style.maskImage = '';
        }
      }

      Timbo.heroParallax.applyLogoMotion(this.logoEl, scrolled);
    },
  },

  /* ============================================================
     HERO MEDIA SCROLL FADE
     Empieza a bajar opacidad del fondo del hero luego de cierto scroll.
     ============================================================ */
  heroVideoScrollFade: {
    START_SCROLL_PX: 200,
    FADE_DISTANCE_PX: 520,
    MIN_OPACITY: 0,

    init() {
      const video = document.querySelector('#hero .hero__bg video');
      const sustImage = document.querySelector('.sust-hero .sust-hero__media img');
      if (!video && !sustImage) return;

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      const update = () => {
        const fadeProgressRaw = clamp(
          (window.scrollY - this.START_SCROLL_PX) / this.FADE_DISTANCE_PX,
          0,
          1,
        );
        const fadeProgress = Math.pow(fadeProgressRaw, 1.2);
        const opacity = 1 - (1 - this.MIN_OPACITY) * fadeProgress;
        const opacityValue = opacity.toFixed(3);

        if (video) {
          video.style.setProperty('--hero-video-scroll-opacity', opacityValue);
        }

        if (sustImage) {
          sustImage.style.setProperty('--sust-hero-scroll-opacity', opacityValue);
        }
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  },

  harasHeroTitleScroll: {
    TITLE_RATE: 0.9,
    TITLE_SCALE_DISTANCE: 150,
    TITLE_MIN_SCALE: 0.9,
    TITLE_MIN_OPACITY: 0.7,
    TITLE_OPACITY_DISTANCE: 150,
    TITLE_MASK_SCROLL: 60,
    TITLE_MASK_FADE: 12,
    TITLE_RATE_POST_MASK: 0.9,
    TITLE_SCROLL_CAP: 600,
    SMOOTHING: 0.12, // 0 = sin suavizado, 1 = sigue el scroll instantáneo. Más bajo = más fluido.
    titleEl: null,
    ticking: false,
    rafId: null,
    currentScroll: 0,
    targetScroll: 0,

    update() {
      if (!this.titleEl) return;
      const scrolled = Math.max(0, this.currentScroll);
      const scrolledEffective = Math.min(scrolled, this.TITLE_SCROLL_CAP);
      const titleYAtMask = this.TITLE_MASK_SCROLL * this.TITLE_RATE;
      let titleY;

      if (scrolledEffective <= this.TITLE_MASK_SCROLL) {
        titleY = scrolledEffective * this.TITLE_RATE;
      } else {
        titleY = titleYAtMask + (scrolledEffective - this.TITLE_MASK_SCROLL) * this.TITLE_RATE_POST_MASK;
      }

      const scaleProgress = Math.min(1, scrolled / this.TITLE_SCALE_DISTANCE);
      const titleScale = 1 - (1 - this.TITLE_MIN_SCALE) * scaleProgress;
      const opacityProgress = Math.min(1, scrolled / this.TITLE_OPACITY_DISTANCE);
      const titleOpacity = 1 - (1 - this.TITLE_MIN_OPACITY) * opacityProgress;

      this.titleEl.style.transform = `translateY(${titleY.toFixed(1)}px) scale(${titleScale.toFixed(3)})`;
      this.titleEl.style.opacity = String(titleOpacity.toFixed(3));

      const overshoot = Math.max(0, titleY - titleYAtMask);
      if (overshoot > 0) {
        const titleHeight = this.titleEl.offsetHeight || 1;
        const visibleBottom = Math.max(0, titleHeight - overshoot);
        const fadeStart = Math.max(0, visibleBottom - this.TITLE_MASK_FADE);
        const maskValue = `linear-gradient(to bottom, #000 0px, #000 ${fadeStart}px, rgba(0,0,0,0) ${visibleBottom}px, rgba(0,0,0,0) 100%)`;
        this.titleEl.style.webkitMaskImage = maskValue;
        this.titleEl.style.maskImage = maskValue;
      } else {
        this.titleEl.style.webkitMaskImage = '';
        this.titleEl.style.maskImage = '';
      }
    },

    tick() {
      // Lerp: el scroll que "ve" el título se acerca al scroll real de a poquito,
      // así no hay saltos bruscos cuando empieza/termina el scroll.
      const diff = this.targetScroll - this.currentScroll;
      if (Math.abs(diff) < 0.05) {
        this.currentScroll = this.targetScroll;
        this.update();
        this.rafId = null;
        return;
      }
      this.currentScroll += diff * this.SMOOTHING;
      this.update();
      this.rafId = window.requestAnimationFrame(() => this.tick());
    },

    requestUpdate() {
      this.targetScroll = Math.max(0, window.scrollY);
      if (this.rafId === null) {
        this.rafId = window.requestAnimationFrame(() => this.tick());
      }
    },

    init() {
      if (!document.body.classList.contains('page--haras-light')) return;
      this.titleEl = document.querySelector('.project-hero__title');
      if (!this.titleEl) return;

      this.targetScroll = Math.max(0, window.scrollY);
      this.currentScroll = this.targetScroll;
      this.update();
      window.addEventListener('scroll', () => this.requestUpdate(), { passive: true });
      window.addEventListener('resize', () => this.requestUpdate());
    },
  },


  /* ============================================================
     NATURE DIALOGUE IMAGE FADE (scroll-linked)
     La imagen va de opacity 0 (contenedor negro visible) a 1 según scrollY,
     usando como referencia la posición del elemento en viewport.
     Mismo patrón que heroVideoScrollFade pero invertido.
     ============================================================ */
  natureDialogueImageFade: {
    // Cuando el top del elemento todavía está esta distancia debajo del fold,
    // arranca el fade (opacity 0).
    START_OFFSET_PX: 0,
    // Distancia de scroll sobre la que se completa el fade hasta opacity 1.
    FADE_DISTANCE_PX: 520,

    init() {
      const container = document.querySelector('.nature-dialogue__image');
      if (!container) return;

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      const update = () => {
        const rect = container.getBoundingClientRect();
        // Empieza cuando el top del elemento entra al viewport (rect.top === window.innerHeight → progress 0)
        // y termina cuando ya scrolleó FADE_DISTANCE_PX adicionales.
        const start = window.innerHeight + this.START_OFFSET_PX;
        const traveled = start - rect.top;
        const progressRaw = clamp(traveled / this.FADE_DISTANCE_PX, 0, 1);
        // Misma curva suave que heroVideoScrollFade.
        const opacity = Math.pow(progressRaw, 1.2);
        container.style.setProperty('--nature-dialogue-image-opacity', opacity.toFixed(3));
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  },

  aboutFinalZoom: {
    sectionEl: null,
    mediaEl: null,
    ticking: false,

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },

    update() {
      if (!this.sectionEl || !this.mediaEl) return;

      const rect = this.sectionEl.getBoundingClientRect();
      const start = window.innerHeight;
      const distance = Math.max(window.innerHeight + this.sectionEl.offsetHeight, 1);
      const progress = this.clamp((start - rect.top) / distance, 0, 1);

      this.mediaEl.style.setProperty('--about-final-zoom-progress', progress);
    },

    requestUpdate() {
      if (this.ticking) return;

      this.ticking = true;
      window.requestAnimationFrame(() => {
        this.ticking = false;
        this.update();
      });
    },

    init() {
      this.sectionEl = document.querySelector('.about-final');
      this.mediaEl = document.querySelector('.about-final__media');
      if (!this.sectionEl || !this.mediaEl) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      this.update();
      window.addEventListener('scroll', () => this.requestUpdate(), { passive: true });
      window.addEventListener('resize', () => this.requestUpdate());
    },
  },

  projectFinalLogoScroll: {
    sectionEl: null,
    maskEl: null,
    logoEl: null,
    ticking: false,
    rafId: 0,
    hasTriggered: false,
    isAnimating: false,
    MASK_FADE_PX: 12,
    TRIGGER_FACTOR: 0.92,
    ANIMATION_DURATION: 2800,

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },

    easeOutQuart(value) {
      return 1 - Math.pow(1 - value, 4);
    },

    getTravel() {
      return this.maskEl ? this.maskEl.offsetHeight + 16 : 16;
    },

    applyState(progress) {
      if (!this.maskEl || !this.logoEl) return;

      const clamped = this.clamp(progress, 0, 1);
      const eased = this.easeOutQuart(clamped);
      const travel = this.getTravel();
      const translateY = (eased - 1) * travel;
      const isSettled = clamped >= 1;
      const fade = isSettled ? 0 : this.MASK_FADE_PX;

      this.logoEl.style.setProperty('--project-final-logo-translate', `${translateY.toFixed(2)}px`);
      this.maskEl.style.setProperty('--project-final-logo-mask-fade-current', `${fade.toFixed(2)}px`);
      this.maskEl.classList.toggle('is-settled', isSettled);
    },

    syncInitialState() {
      if (this.hasTriggered) return;
      this.maskEl.classList.remove('is-settled');
      this.applyState(0);
    },

    triggerAnimation() {
      if (this.hasTriggered || this.isAnimating || !this.maskEl || !this.logoEl) return;

      this.hasTriggered = true;
      this.isAnimating = true;
      this.maskEl.classList.remove('is-settled');

      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = this.clamp(elapsed / this.ANIMATION_DURATION, 0, 1);

        this.applyState(progress);

        if (progress < 1) {
          this.rafId = window.requestAnimationFrame(tick);
          return;
        }

        this.isAnimating = false;
        this.rafId = 0;
      };

      this.rafId = window.requestAnimationFrame(tick);
    },

    update() {
      if (!this.sectionEl || !this.maskEl || !this.logoEl || this.hasTriggered) return;

      const maskRect = this.maskEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const triggerLine = viewportHeight * this.TRIGGER_FACTOR;

      if (maskRect.top <= triggerLine) {
        this.triggerAnimation();
      }
    },

    requestUpdate() {
      if (this.ticking || this.hasTriggered) return;

      this.ticking = true;
      window.requestAnimationFrame(() => {
        this.ticking = false;
        this.update();
      });
    },

    init() {
      this.sectionEl = document.querySelector('.project-final');
      this.maskEl = document.querySelector('.project-final__logo-mask');
      this.logoEl = document.querySelector('.project-final__logo');
      if (!this.sectionEl || !this.maskEl || !this.logoEl) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.logoEl.style.setProperty('--project-final-logo-translate', '0px');
        this.maskEl.style.setProperty('--project-final-logo-mask-fade-current', '0px');
        this.maskEl.classList.add('is-settled');
        return;
      }

      this.syncInitialState();
      this.update();

      if (!this.logoEl.complete) {
        this.logoEl.addEventListener('load', () => {
          this.syncInitialState();
          this.requestUpdate();
        }, { once: true });
      }

      window.addEventListener('resize', () => {
        this.syncInitialState();
        this.requestUpdate();
      });
      window.addEventListener('scroll', () => this.requestUpdate(), { passive: true });
      window.addEventListener('load', () => {
        this.syncInitialState();
        this.requestUpdate();
      }, { once: true });
    },
  },

  /* ============================================================
     PHILOSOPHY STATEMENT REVEAL (scroll-linked)
     Cuando el borde superior del .philosophy__statement cruza
     la mitad del viewport, las 4 líneas suben desde abajo de
     sus máscaras (overflow:hidden) y se hacen visibles.
     Si el usuario scrollea para arriba, vuelven a esconderse.
     ============================================================ */
  philosophyStatementReveal: {
    init() {
      const statement = document.querySelector('.philosophy__statement');
      if (!statement) return;

      const isMobile = window.matchMedia('(max-width: 1023.98px)');

      const update = () => {
        const rect = statement.getBoundingClientRect();
        // Mobile: trigger más bajo (aparece antes, sin scrollear tanto).
        // Desktop: se mantiene la mitad del viewport.
        const divisor = isMobile.matches ? 1.15 : 2;
        const trigger = window.innerHeight / divisor;

        if (rect.top <= trigger) {
          statement.classList.add('is-revealed');
        } else {
          statement.classList.remove('is-revealed');
        }
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  },

  philosophySignalOpacityReveal: {
    items: [],
    ticking: false,
    // Grilla actual: 4 columnas × 2 filas (8 iconos).
    // Fila 1 (índices 0–3) sube de opacidad primero; fila 2 (índices 4–7) después.
    ROW_RANGES: [
      { start: 1350, end: 1650 },
      { start: 1550, end: 1850 },
    ],

    clamp(value, min = 0, max = 1) {
      return Math.min(Math.max(value, min), max);
    },

    init() {
      this.items = Array.from(document.querySelectorAll('.philosophy__signal')).map((item, index) => {
        // 4 por fila: los primeros 4 son fila 0, los siguientes 4 son fila 1.
        const rowIndex = index <= 3 ? 0 : 1;

        return {
          el: item,
          range: this.ROW_RANGES[rowIndex],
        };
      });

      if (!this.items.length) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.items.forEach(({ el }) => {
          el.style.setProperty('--philosophy-signal-opacity', '1');
        });
        return;
      }

      this.update();
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      window.addEventListener('resize', () => this.onScroll(), { passive: true });
    },

    onScroll() {
      if (this.ticking) return;
      this.ticking = true;

      window.requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
    },

    update() {
      const currentScrollY = window.scrollY || 0;

      this.items.forEach(({ el, range }) => {
        const fadeDistance = Math.max(range.end - range.start, 1);
        const progress = this.clamp((currentScrollY - range.start) / fadeDistance);

        el.style.setProperty('--philosophy-signal-opacity', progress.toFixed(3));
      });
    },
  },

  sustClimateTitleReveal: {
    // Multiplicador del viewport para el trigger del reveal.
    // Valor entre 0 y 1: mas alto = el titulo se revela antes (menos scroll).
    TRIGGER_RATIO: 0.85,

    init() {
      const title = document.querySelector('.sust-climate__title');
      if (!title) return;

      const update = () => {
        const rect = title.getBoundingClientRect();
        const trigger = window.innerHeight * this.TRIGGER_RATIO;

        if (rect.top <= trigger) {
          title.classList.add('is-revealed');
        } else {
          title.classList.remove('is-revealed');
        }
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  },

  projectOverviewTitleReveal: {
    init() {
      const title = document.querySelector('.project-overview__title');
      if (!title) return;
      const mobileQuery = window.matchMedia('(max-width: 1023.98px)');

      const rebuildLines = () => {
        const desktopSource =
          title.dataset.lineRevealSourceDesktop ||
          Timbo.extractLineRevealSource(title);
        const mobileSource = title.dataset.lineRevealSourceMobile;
        const source = mobileQuery.matches && mobileSource ? mobileSource : desktopSource;

        title.dataset.lineRevealSource = source;
        Timbo.splitTextIntoVisualLines(title, {
          lineClass: 'project-overview__title-line',
          innerClass: 'project-overview__title-line-inner',
        });
      };

      const update = () => {
        const rect = title.getBoundingClientRect();
        const trigger = window.innerHeight / 2;

        if (rect.top <= trigger) {
          title.classList.add('is-revealed');
        } else {
          title.classList.remove('is-revealed');
        }
      };

      let resizeRaf = 0;
      const refresh = () => {
        rebuildLines();
        update();
      };

      const onResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(refresh);
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('load', refresh, { once: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refresh).catch(() => {});
      }

      refresh();
    },
  },

  projectHighlightTitleReveal: {
    // Multiplicador del viewport para el trigger del reveal.
    // Valor entre 0 y 1: mas bajo = el texto tiene que entrar mas
    // adentro del viewport para revelarse (hay que scrollear mas).
    TRIGGER_RATIO: 0.6,

    init() {
      const targets = [
        {
          selector: '.project-highlight__title',
          lineClass: 'project-highlight__title-line',
          innerClass: 'project-highlight__title-line-inner',
        },
        {
          selector: '.about-us__highlight',
          lineClass: 'about-us__highlight-line',
          innerClass: 'about-us__highlight-line-inner',
        },
        {
          selector: '.project-refuge__super-phrase',
          lineClass: 'project-refuge__super-phrase-line',
          innerClass: 'project-refuge__super-phrase-line-inner',
        },
        {
          selector: '.project-frame__super-phrase',
          lineClass: 'project-frame__super-phrase-line',
          innerClass: 'project-frame__super-phrase-line-inner',
        },
        {
          selector: '.project-phrase__super-phrase',
          lineClass: 'project-phrase__super-phrase-line',
          innerClass: 'project-phrase__super-phrase-line-inner',
        },
      ]
        .flatMap((config) =>
          Array.from(document.querySelectorAll(config.selector)).map((element) => ({
            ...config,
            element,
          }))
        )
        .filter(Boolean);

      if (!targets.length) return;

      const mobileQuery = window.matchMedia('(max-width: 1023.98px)');

      const rebuildLines = () => {
        targets.forEach(({ element, lineClass, innerClass }) => {
          Timbo.splitTextIntoVisualLines(element, {
            lineClass,
            innerClass,
          });
        });
      };

      const getTriggerRatio = (element) => {
        const customTriggerRatio = Number.parseFloat(element.dataset.revealTriggerRatio || '');
        const customMobileTriggerRatio = Number.parseFloat(element.dataset.revealTriggerRatioMobile || '');

        if (mobileQuery.matches && Number.isFinite(customMobileTriggerRatio)) {
          return customMobileTriggerRatio;
        }

        if (Number.isFinite(customTriggerRatio)) {
          return customTriggerRatio;
        }

        return this.TRIGGER_RATIO;
      };

      const update = () => {
        targets.forEach(({ element }) => {
          const triggerRatio = getTriggerRatio(element);
          const trigger = window.innerHeight * triggerRatio;
          const rect = element.getBoundingClientRect();

          if (rect.top <= trigger) {
            element.classList.add('is-revealed');
          } else {
            element.classList.remove('is-revealed');
          }
        });
      };

      let resizeRaf = 0;
      const refresh = () => {
        rebuildLines();
        update();
      };

      const onResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(refresh);
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('load', refresh, { once: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refresh).catch(() => {});
      }

      refresh();
    },
  },

  introClaimReveal: {
    init() {
      const claim = document.querySelector('.intro__claim');
      if (!claim) return;

      const update = () => {
        const rect = claim.getBoundingClientRect();
        const trigger = window.innerHeight / 2;

        if (rect.top <= trigger) {
          claim.classList.add('is-revealed');
        } else {
          claim.classList.remove('is-revealed');
        }
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  },

  sustProcessTitleReveal: {
    // Multiplicador del viewport para el trigger del reveal.
    // Valor entre 0 y 1: mas alto = el titulo se revela antes (menos scroll).
    TRIGGER_RATIO: 0.85,

    init() {
      const triggerRatio = this.TRIGGER_RATIO;
      const targets = [
        {
          selector: '.sust-process__title',
          lineClass: 'sust-process__title-line',
          innerClass: 'sust-process__title-line-inner',
        },
        {
          selector: '.sust-breathe__title',
          lineClass: 'sust-breathe__title-line',
          innerClass: 'sust-breathe__title-line-inner',
        },
      ];

      const titleEntries = targets.flatMap(({ selector, lineClass, innerClass }) =>
        Array.from(document.querySelectorAll(selector)).map((el) => ({ el, lineClass, innerClass }))
      );

      if (!titleEntries.length) return;

      const titles = titleEntries.map((entry) => entry.el);

      const rebuildLines = () => {
        titleEntries.forEach(({ el, lineClass, innerClass }) => {
          Timbo.splitTextIntoVisualLines(el, { lineClass, innerClass });
        });
      };

      const update = () => {
        const trigger = window.innerHeight * triggerRatio;

        titles.forEach((title) => {
          const rect = title.getBoundingClientRect();

          if (rect.top <= trigger) {
            title.classList.add('is-revealed');
          } else {
            title.classList.remove('is-revealed');
          }
        });
      };

      let resizeRaf = 0;
      const refresh = () => {
        rebuildLines();
        update();
      };

      const onResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(refresh);
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('load', refresh, { once: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refresh).catch(() => {});
      }

      refresh();
    },
  },

  projectPhraseTextReveal: {
    // Multiplicador del viewport para el trigger del reveal.
    // Valor entre 0 y 1: mas bajo = el texto tiene que entrar mas
    // adentro del viewport para revelarse (hay que scrollear mas).
    TRIGGER_RATIO: 0.6,

    init() {
      const text = document.querySelector('.project-phrase__text');
      if (!text) return;

      // Opt-out por página: si el <section class="project-phrase"> contenedor
      // lleva data-phrase-reveal="off", esa página usa estandar-a (anim-fade-up)
      // y no debe envolverse en máscaras ni recibir .is-revealed.
      const section = text.closest('.project-phrase');
      if (section && section.dataset.phraseReveal === 'off') return;

      const rebuildLines = () => {
        Timbo.splitTextIntoVisualLines(text, {
          lineClass: 'project-phrase__text-line',
          innerClass: 'project-phrase__text-line-inner',
        });
      };

      const update = () => {
        const rect = text.getBoundingClientRect();
        const trigger = window.innerHeight * this.TRIGGER_RATIO;

        if (rect.top <= trigger) {
          text.classList.add('is-revealed');
        } else {
          text.classList.remove('is-revealed');
        }
      };

      let resizeRaf = 0;
      const refresh = () => {
        rebuildLines();
        update();
      };

      const onResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(refresh);
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('load', refresh, { once: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refresh).catch(() => {});
      }

      refresh();
    },
  },

  /* ============================================================
     PROJECT PHRASE PAN
     Dispara, una sola vez al entrar al viewport, las animaciones
     de las imagenes en .project-phrase:
       - .project-phrase__image--pan  -> pan horizontal (foto B)
       - .project-phrase__image--zoom -> zoom-in sutil  (foto A)
     Los keyframes viven en CSS. Aca solo agregamos la clase
     .is-panning cuando la figura cruza el threshold.
     ============================================================ */
  projectPhrasePan: {
    THRESHOLD: 0.35,

    init() {
      const targets = document.querySelectorAll(
        '.project-phrase__image--pan, .project-phrase__image--zoom'
      );
      if (!targets.length) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        targets.forEach((el) => el.classList.add('is-panning'));
        return;
      }

      if (!('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-panning'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-panning');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: this.THRESHOLD });

      targets.forEach((el) => observer.observe(el));
    },
  },

  /* ============================================================
     PHILOSOPHY BACKGROUND REVEAL (scroll-linked)
     Fondo de .philosophy: 0 -> 1 cuando la sección alcanza 60% visible.
     ============================================================ */
  philosophyBackgroundReveal: {
    init() {
      const section = document.querySelector('.philosophy');
      if (!section) return;

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        section.style.setProperty('--philosophy-bg-progress', 1);
        return;
      }

      const update = () => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const targetVisiblePx = rect.height * 0.6;
        const visibleFromEntry = vh - rect.top;
        const progress = clamp(visibleFromEntry / targetVisiblePx, 0, 1);
        section.style.setProperty('--philosophy-bg-progress', progress.toFixed(3));
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  },

  /* ============================================================
     VALUES BREAKDOWN — Carousel interactivo + paneles de detalle
     ============================================================ */
  valuesBreakdown: {
    INTERVAL_MS: 8000,
    activeIndex: 0,
    intervalId: null,
    isPaused: false,
    typingTimeouts: [],

    init() {
      const carousel = document.querySelector('.values-carousel');
      if (!carousel) return;

      // Renderizar paneles de breakdown
      this.renderBreakdown();

      // Marcar el primer ítem como activo
      this.setActive(0);

      // Click en cualquier value-item (original o clon)
      carousel.addEventListener('click', (e) => {
        const item = e.target.closest('[data-value-index]');
        if (!item) return;
        const index = Number(item.dataset.valueIndex);
        this.pauseAuto();
        this.setActive(index);
      });

      // Iniciar rotación automática
      this.startAuto();

      // IntersectionObserver: reanudar cuando el carousel sale del viewport
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && this.isPaused) {
            this.resumeAuto();
          }
        });
      }, { threshold: 0 });
      observer.observe(carousel);
    },

    renderBreakdown() {
      const container = document.getElementById('values-breakdown');
      if (!container) return;

      const data = SITE_DATA.valuesBreakdown.en;
      if (!data) return;

      container.innerHTML = data.map((item, i) => `
        <div class="breakdown-panel" data-breakdown-index="${i}">
          <div class="breakdown-panel__text">
            <h3 class="breakdown-panel__title">${item.title}</h3>
            <p class="breakdown-panel__body">${item.body}</p>
          </div>
          <div class="breakdown-panel__metrics">
            ${item.metrics.map(m => `
              <div class="breakdown-metric">
                <span class="breakdown-metric__value">${m.value}</span>
                <span class="breakdown-metric__label">${m.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    },

    setActive(index) {
      // Actualizar ítems del carousel
      const allItems = document.querySelectorAll('.value-item[data-value-index]');
      allItems.forEach(item => {
        item.classList.toggle('value-item--active', Number(item.dataset.valueIndex) === index);
      });

      this.clearTypingTimeouts();

      // Desactivar todos los paneles
      const panels = document.querySelectorAll('.breakdown-panel');
      panels.forEach(panel => {
        panel.classList.remove('is-active', 'breakdown-panel--typing');
      });

      // Activar el panel target con efecto de decodificación aleatoria
      const targetPanel = document.querySelector(`.breakdown-panel[data-breakdown-index="${index}"]`);
      if (targetPanel) {
        targetPanel.classList.add('is-active');
        this.playDecodeAnimation(targetPanel);
      }

      this.activeIndex = index;
    },

    clearTypingTimeouts() {
      this.typingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      this.typingTimeouts = [];
    },

    queueTypingStep(callback, delayMs) {
      const timeoutId = setTimeout(callback, delayMs);
      this.typingTimeouts.push(timeoutId);
    },

    shuffleArray(values) {
      const shuffled = [...values];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        const tmp = shuffled[i];
        shuffled[i] = shuffled[randomIndex];
        shuffled[randomIndex] = tmp;
      }
      return shuffled;
    },

    decodeElementText(panel, element, options = {}) {
      if (!element) return 0;

      const fullText = element.dataset.fullText || element.textContent || '';
      element.dataset.fullText = fullText;
      const realChars = Array.from(fullText);
      const maskedChars = realChars.map((char) => (/\s/.test(char) ? char : 'x'));
      element.textContent = maskedChars.join('');

      const revealableIndices = [];
      realChars.forEach((char, index) => {
        if (/\s/.test(char)) return;
        revealableIndices.push(index);
      });

      const startAt = options.startAt ?? 0;
      const totalDuration = options.totalDuration ?? 800;
      const minStep = options.minStep ?? 3;
      const maxStep = options.maxStep ?? 24;
      if (revealableIndices.length === 0) return startAt;

      const revealOrder = this.shuffleArray(revealableIndices);
      const stepMs = Math.max(
        minStep,
        Math.min(maxStep, Math.round(totalDuration / Math.max(revealOrder.length, 1))),
      );

      revealOrder.forEach((charIndex, i) => {
        this.queueTypingStep(() => {
          if (!panel.classList.contains('is-active')) return;
          maskedChars[charIndex] = realChars[charIndex];
          element.textContent = maskedChars.join('');
        }, startAt + i * stepMs);
      });

      return startAt + revealOrder.length * stepMs;
    },

    playDecodeAnimation(panel) {
      const titleEl = panel.querySelector('.breakdown-panel__title');
      const bodyEl = panel.querySelector('.breakdown-panel__body');
      const metricValueEls = panel.querySelectorAll('.breakdown-metric__value');
      const metricLabelEls = panel.querySelectorAll('.breakdown-metric__label');
      const fast = (ms) => Math.max(1, Math.round(ms * 0.5));

      panel.classList.add('breakdown-panel--typing');

      let animationEnd = 0;

      animationEnd = Math.max(animationEnd, this.decodeElementText(panel, titleEl, {
        startAt: fast(30),
        totalDuration: fast(380),
        minStep: fast(10),
        maxStep: fast(24),
      }));

      animationEnd = Math.max(animationEnd, this.decodeElementText(panel, bodyEl, {
        startAt: fast(180),
        totalDuration: fast(1600),
        minStep: fast(2),
        maxStep: fast(7),
      }));

      metricValueEls.forEach((valueEl, idx) => {
        animationEnd = Math.max(animationEnd, this.decodeElementText(panel, valueEl, {
          startAt: fast(460 + idx * 120),
          totalDuration: fast(240),
          minStep: fast(8),
          maxStep: fast(18),
        }));
      });

      metricLabelEls.forEach((labelEl, idx) => {
        animationEnd = Math.max(animationEnd, this.decodeElementText(panel, labelEl, {
          startAt: fast(540 + idx * 120),
          totalDuration: fast(340),
          minStep: fast(4),
          maxStep: fast(12),
        }));
      });

      this.queueTypingStep(() => {
        if (!panel.classList.contains('is-active')) return;
        panel.classList.remove('breakdown-panel--typing');
      }, animationEnd + fast(140));
    },

    startAuto() {
      this.isPaused = false;
      this.intervalId = setInterval(() => {
        const next = (this.activeIndex + 1) % 8;
        this.setActive(next);
      }, this.INTERVAL_MS);
    },

    pauseAuto() {
      clearInterval(this.intervalId);
      this.isPaused = true;
    },

    resumeAuto() {
      if (!this.isPaused) return;
      this.startAuto();
    },
  },


  /* ============================================================
     PROJECT MAP — Mapa animado con MapLibre GL JS
     ============================================================ */
  projectMap: {
    MAPLIBRE_CSS: 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
    MAPLIBRE_JS: 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
    STYLE_URL: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',

    MAP_CONFIGS: {
      'exuma-lodge': {
        stages: [
          { center: [-74.5, 22.5], zoom: 4, hold: 800 },
          { center: [-75.8, 23.5], zoom: 7.5, speed: 1.4 },
          { center: [-75.8041, 23.4866], zoom: 13, speed: 1.0 },
        ],
        marker: [-75.8041, 23.4866],
        label: { name: 'Exuma Lodge', detail: 'Bahamas' },
        waterColor: 'gray200',
      },
      'praderas-cabin': {
        stages: [
          { center: [-65, -43], zoom: 3, hold: 800 },
          { center: [-71, -41.5], zoom: 6.5, speed: 1.4 },
          { center: [-71.5378, -41.7780], zoom: 11, speed: 1.0 },
        ],
        marker: [-71.5378, -41.7780],
        label: { name: 'Praderas Cabin', detail: 'Río Negro, Argentina' },
        hideContours: true,
      },
      'cherokee-ave': {
        stages: [
          { center: [-80, 28], zoom: 2.5, hold: 800 },
          { center: [-80.2, 25.9], zoom: 8, speed: 1.4 },
          { center: [-80.1291, 25.8264], zoom: 13, speed: 1.0 },
        ],
        marker: [-80.1291, 25.8264],
        label: { name: 'Cherokee Ave', detail: 'Miami Beach, Florida' },
        minRoads: true,
        waterColor: 'gray200',
      },
      'club-de-mar': {
        stages: [
          { center: [-56, -36], zoom: 3, hold: 800 },
          { center: [-54.8, -34.9], zoom: 7, speed: 1.4 },
          { center: [-54.6407, -34.8377], zoom: 11, speed: 1.0 },
        ],
        marker: [-54.6407, -34.8377],
        label: { name: 'Club de Mar', detail: 'José Ignacio,<br>Uruguay' },
        waterColor: 'gray200',
      },
      'chacras-de-murray': {
        stages: [
          { center: [-64, -38], zoom: 3, hold: 800 },
          { center: [-59.5, -34.5], zoom: 7, speed: 1.4 },
          { center: [-58.9405, -34.5101], zoom: 11, speed: 1.0 },
        ],
        marker: [-58.9405, -34.5101],
        label: { name: 'Chacras de Murray', detail: 'Buenos Aires, Argentina' },
        labelBelow: true,
        hideUrbanDetail: true,
      },
      'haras-san-pablo': {
        stages: [
          { center: [-64, -38], zoom: 3, hold: 800 },
          { center: [-59.5, -34.5], zoom: 7, speed: 1.4 },
          { center: [-59.0392, -34.6065], zoom: 11, speed: 1.0 },
        ],
        marker: [-59.0392, -34.6065],
        label: { name: 'Haras San Pablo', detail: 'Buenos Aires, Argentina' },
        labelBelow: true,
        hideUrbanDetail: true,
      },
      'cardano': {
        stages: [
          { center: [-64, -38], zoom: 3, hold: 800 },
          { center: [-59.5, -34.5], zoom: 7, speed: 1.4 },
          { center: [-58.9263, -34.5128], zoom: 11, speed: 1.0 },
        ],
        marker: [-58.9263, -34.5128],
        label: { name: 'Cardano', detail: 'Buenos Aires, Argentina' },
        labelBelow: true,
        hideUrbanDetail: true,
      },
      'tobar-lodge': {
        stages: [
          { center: [-64, -38], zoom: 3, hold: 800 },
          { center: [-65.5, -27], zoom: 6.5, speed: 1.4 },
          { center: [-65.1022, -27.5117], zoom: 11, speed: 1.0 },
        ],
        marker: [-65.1022, -27.5117],
        label: { name: 'Tobar Lodge', detail: 'Tucumán, Argentina' },
      },
      'cabana-suinda': {
        stages: [
          { center: [-60, -35], zoom: 3, hold: 800 },
          { center: [-58.5, -28], zoom: 6.5, speed: 1.3 },
          { center: [-58.1671, -27.2805], zoom: 11, speed: 1.0 },
        ],
        polygonAfterStage: 1,
        marker: [-58.1671, -27.2805],
        label: { name: 'Cabaña Suindá', detail: 'Corrientes, Argentina' },
        labelBelow: true,
        polygon: [
          [-58.2431, -27.262], [-58.4134, -27.2867], [-58.4892, -27.2733],
          [-58.538, -27.2955], [-58.599, -27.2998], [-58.6734, -27.3537],
          [-58.7727, -27.3765], [-58.8121, -27.4364], [-58.8774, -27.4909],
          [-58.8853, -27.5345], [-58.8712, -27.5818], [-58.8827, -27.6094],
          [-58.8192, -27.682], [-58.8118, -27.7421], [-58.8214, -27.8554],
          [-58.8425, -27.9028], [-58.8305, -27.9568], [-58.8619, -28.0519],
          [-58.945, -28.1336], [-59.062, -28.128], [-59.1073, -28.2218],
          [-59.1035, -28.3289], [-59.0695, -28.3921], [-59.089, -28.4339],
          [-59.0561, -28.5062], [-59.0843, -28.5393], [-59.1058, -28.6145],
          [-59.079, -28.6692], [-59.1449, -28.7768], [-59.1419, -28.8122],
          [-59.1809, -28.9452], [-59.2095, -28.9692], [-59.1998, -29.0315],
          [-59.2568, -29.0893], [-59.354, -29.1224], [-59.3995, -29.2175],
          [-59.5008, -29.2436], [-59.5176, -29.3404], [-59.6042, -29.3938],
          [-59.5838, -29.456], [-59.6307, -29.5396], [-59.596, -29.583],
          [-59.632, -29.6642], [-59.6142, -29.7376], [-59.6639, -29.834],
          [-59.6093, -29.8945], [-59.5664, -30.0078], [-59.6122, -30.1058],
          [-59.671, -30.3318], [-59.6337, -30.3616], [-59.6124, -30.424],
          [-59.5885, -30.4364], [-59.5573, -30.3325], [-59.4897, -30.3444],
          [-59.4236, -30.3154], [-59.3478, -30.3244], [-59.3232, -30.3544],
          [-59.2986, -30.3467], [-59.288, -30.362], [-59.2735, -30.3524],
          [-59.2294, -30.3642], [-59.1921, -30.3295], [-59.1367, -30.3118],
          [-59.1364, -30.2863], [-59.0755, -30.2572], [-59.0642, -30.2308],
          [-58.965, -30.2184], [-58.9122, -30.2482], [-58.8787, -30.2467],
          [-58.8035, -30.2108], [-58.7483, -30.214], [-58.6816, -30.1636],
          [-58.63, -30.1768], [-58.5766, -30.1593], [-58.5537, -30.1853],
          [-58.4966, -30.2074], [-58.4693, -30.2027], [-58.3651, -30.2663],
          [-58.3421, -30.272], [-58.2848, -30.2446], [-58.2055, -30.289],
          [-58.1449, -30.4087], [-58.0725, -30.4253], [-58.0774, -30.4659],
          [-58.0578, -30.4937], [-58.0691, -30.5452], [-58.0373, -30.5676],
          [-58.0334, -30.5979], [-57.9802, -30.6294], [-57.9752, -30.6472],
          [-57.8946, -30.6695], [-57.8547, -30.6946], [-57.8439, -30.7218],
          [-57.8092, -30.7297], [-57.8093, -30.6946], [-57.8426, -30.6611],
          [-57.8464, -30.6208], [-57.8873, -30.5876], [-57.8895, -30.5104],
          [-57.6429, -30.3418], [-57.6152, -30.2558], [-57.6533, -30.1987],
          [-57.6449, -30.1815], [-57.5841, -30.1772], [-57.4805, -30.1231],
          [-57.414, -30.0368], [-57.3371, -29.9928], [-57.3284, -29.8824],
          [-57.294, -29.831], [-57.2269, -29.7789], [-57.1209, -29.7649],
          [-57.0017, -29.6534], [-56.9698, -29.6415], [-56.9699, -29.6039],
          [-56.9517, -29.5812], [-56.8989, -29.5318], [-56.8191, -29.4882],
          [-56.7774, -29.4353], [-56.7662, -29.3777], [-56.7016, -29.3591],
          [-56.6481, -29.2585], [-56.6438, -29.1961], [-56.6054, -29.1624],
          [-56.5914, -29.1242], [-56.4195, -29.079], [-56.3988, -29.0259],
          [-56.4155, -29.0007], [-56.4099, -28.9777], [-56.302, -28.9011],
          [-56.2944, -28.7977], [-56.2591, -28.7783], [-56.1856, -28.77],
          [-56.1186, -28.6817], [-56.0076, -28.6049], [-56.0023, -28.5785],
          [-56.0257, -28.5361], [-56.0087, -28.506], [-55.8824, -28.4777],
          [-55.903, -28.408], [-55.8783, -28.3612], [-55.7574, -28.3686],
          [-55.7322, -28.3843], [-55.7175, -28.4222], [-55.6963, -28.4232],
          [-55.6699, -28.3308], [-55.7727, -28.2739], [-55.7825, -28.2539],
          [-55.6322, -28.1767], [-55.6202, -28.1375], [-55.7126, -28.0883],
          [-55.7164, -28.0613], [-55.7584, -28.0606], [-55.7495, -28.0271],
          [-55.8242, -27.949], [-55.8135, -27.921], [-55.8315, -27.9044],
          [-55.8271, -27.8552], [-55.8465, -27.8329], [-55.824, -27.7932],
          [-55.9818, -27.5389], [-56.0267, -27.5072], [-56.0546, -27.4514],
          [-56.0548, -27.4195], [-56.037, -27.4156], [-56.0298, -27.3881],
          [-56.0389, -27.3478], [-56.0245, -27.3375], [-56.0492, -27.3079],
          [-56.1515, -27.3286], [-56.2362, -27.4012], [-56.2838, -27.4082],
          [-56.2937, -27.4941], [-56.3389, -27.5245], [-56.3648, -27.5811],
          [-56.3863, -27.5942], [-56.4121, -27.5992], [-56.4629, -27.5696],
          [-56.5304, -27.4495], [-56.6012, -27.421], [-56.6495, -27.4607],
          [-56.7203, -27.4663], [-56.7001, -27.5271], [-56.6771, -27.5486],
          [-56.686, -27.5769], [-56.7433, -27.605], [-56.7937, -27.5869],
          [-56.8451, -27.6064], [-56.9375, -27.5622], [-56.9656, -27.502],
          [-56.9879, -27.4894], [-57.2318, -27.4664], [-57.3274, -27.4145],
          [-57.5067, -27.4411], [-57.6609, -27.361], [-57.6945, -27.327],
          [-57.8145, -27.3342], [-57.8774, -27.2784], [-57.9145, -27.2653],
          [-58.0596, -27.2623], [-58.1913, -27.2808], [-58.2431, -27.262],
        ],
      },
    },

    config: null,
    map: null,
    container: null,
    marker: null,
    mapTheme: '',
    sequencePlayed: false,

    init() {
      this.container = document.querySelector('[data-map-sequence]');
      if (!this.container) return;
      this.mapTheme = this.container.dataset.mapTheme || '';

      // Read project slug from the page
      const section = document.querySelector('[data-project-slug]');
      const slug = section ? section.dataset.projectSlug : null;
      this.config = slug ? this.MAP_CONFIGS[slug] : null;
      if (!this.config) return;

      // Lazy-load MapLibre when container is ~2 viewports away
      const loadObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadObserver.disconnect();
          this.loadMapLibre();
        }
      }, { rootMargin: '0px 0px 200% 0px' });

      loadObserver.observe(this.container);
    },

    loadMapLibre() {
      // Inject CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = this.MAPLIBRE_CSS;
      document.head.appendChild(link);

      // Inject JS
      const script = document.createElement('script');
      script.src = this.MAPLIBRE_JS;
      script.onload = () => this.onLibraryLoaded();
      script.onerror = () => {}; // Fail silently — dark gradient remains
      document.head.appendChild(script);
    },

    onLibraryLoaded() {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const stages = this.config.stages;
      const startStage = reducedMotion ? stages[stages.length - 1] : stages[0];

      this.map = new maplibregl.Map({
        container: 'project-map-canvas',
        style: this.STYLE_URL,
        center: startStage.center,
        zoom: startStage.zoom,
        interactive: false,
        attributionControl: false,
      });

      this.map.on('load', () => {
        this.applyMapTheme();

        if (reducedMotion) {
          const offsetCenter = this.getOffsetCenter();
          this.map.jumpTo({ center: offsetCenter });
          this.showIslandHighlight();
          this.showMarker();
          this.enableInteraction();
          return;
        }

        // Animation trigger: fire when 30% visible
        const animObserver = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && !this.sequencePlayed) {
            this.sequencePlayed = true;
            animObserver.disconnect();
            this.runSequence();
          }
        }, { threshold: 0.3 });

        animObserver.observe(this.container);
      });
    },

    getCssColor(variableName, fallback) {
      const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
      return value || fallback;
    },

    hexToRgba(hex, alpha) {
      if (!hex || hex[0] !== '#') return hex;
      let normalized = hex.slice(1);
      if (normalized.length === 3) {
        normalized = normalized.split('').map((char) => char + char).join('');
      }
      if (normalized.length !== 6) return hex;

      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    getMapPalette() {
      return {
        gray100: this.getCssColor('--color-gray-100', '#F6F6F6'),
        gray200: this.getCssColor('--color-gray-200', '#DADADA'),
        gray300: this.getCssColor('--color-gray-300', '#9D9D9C'),
        gray400: this.getCssColor('--color-gray-400', '#575756'),
        gray500: this.getCssColor('--color-gray-500', '#3C3C3B'),
        black: this.getCssColor('--color-black', '#1D1D1B'),
      };
    },

    setLayerPaint(layerId, property, value) {
      try {
        this.map.setPaintProperty(layerId, property, value);
      } catch (_) {}
    },

    applyMapTheme() {
      if (this.mapTheme !== 'grayscale' && this.mapTheme !== 'grayscale-light') return;

      const palette = this.getMapPalette();
      const isLight = this.mapTheme === 'grayscale-light';

      // En la variante "light", el territorio se aclara un escalón
      // respecto al theme oscuro original, pero sin pasarse a tonos casi
      // blancos. Suficiente para que el texto negro contraste sin perder
      // la lectura del mapa cuando está alejado.
      const waterOverride = this.config.waterColor ? palette[this.config.waterColor] : null;
      const colors = isLight ? {
        background: palette.gray300,   // territorio: un escalón más claro que gray400
        water: waterOverride || palette.gray100, // agua más clara que la tierra para diferenciarlas
        building: palette.gray400,     // edificios un escalón más oscuros que el fondo
        landuse: palette.gray300,
        land: palette.gray400,         // tierra: un escalón más claro que gray500
        outline: palette.gray500,      // contornos oscuros para que se lean
        line: palette.gray500,         // líneas genéricas oscuras
        road: palette.gray500,         // calles bien marcadas
        boundary: palette.black,       // bordes administrativos / costas: lo más oscuro
        symbolText: palette.black,
        symbolHalo: palette.gray200,
        iconColor: palette.gray500,
        iconHalo: palette.gray200,
        circleFill: palette.gray500,
        circleStroke: palette.gray200,
        extrusion: palette.gray400,
      } : {
        background: palette.gray500,
        water: palette.gray200,
        building: palette.gray400,
        landuse: palette.gray500,
        land: palette.black,
        outline: palette.gray300,
        line: palette.gray300,
        road: palette.gray200,
        boundary: palette.gray300,
        symbolText: palette.black,
        symbolHalo: palette.gray100,
        iconColor: palette.gray200,
        iconHalo: palette.gray500,
        circleFill: palette.gray200,
        circleStroke: palette.gray500,
        extrusion: palette.gray400,
      };

      const layers = this.map.getStyle()?.layers || [];

      layers.forEach((layer) => {
        const id = (layer.id || '').toLowerCase();

        if (layer.type === 'background') {
          this.setLayerPaint(layer.id, 'background-color', colors.background);
          return;
        }

        if (layer.type === 'fill') {
          let fillColor = colors.background;

          if (id.includes('water') || id.includes('ocean') || id.includes('sea') || id.includes('lake') || id.includes('river')) {
            fillColor = colors.water;
          } else if (id.includes('building')) {
            fillColor = colors.building;
          } else if (id.includes('park') || id.includes('landuse') || id.includes('landcover') || id.includes('wood')) {
            fillColor = colors.landuse;
          } else if (id.includes('land')) {
            fillColor = colors.land;
          }

          this.setLayerPaint(layer.id, 'fill-color', fillColor);
          this.setLayerPaint(layer.id, 'fill-outline-color', colors.outline);
          return;
        }

        if (layer.type === 'line') {
          let lineColor = colors.line;

          if (id.includes('road') || id.includes('street') || id.includes('motorway') || id.includes('highway') || id.includes('bridge') || id.includes('tunnel')) {
            lineColor = colors.road;
          } else if (id.includes('waterway')) {
            lineColor = colors.line;
          } else if (id.includes('boundary') || id.includes('admin') || id.includes('border') || id.includes('coast')) {
            lineColor = colors.boundary;
          }

          this.setLayerPaint(layer.id, 'line-color', lineColor);

          // En el modo light, las líneas oscuras pueden quedar muy gruesas
          // durante el zoom intermedio (sobre todo las capas casing/outline
          // que el style original engrosa para verse sobre fondo oscuro).
          // Las acotamos a un grosor máximo discreto.
          if (isLight) {
            this.setLayerPaint(layer.id, 'line-width', [
              'interpolate', ['linear'], ['zoom'],
              0, 0.4,
              10, 0.6,
              14, 1.0,
              18, 1.4,
            ]);
          }
          return;
        }

        if (layer.type === 'symbol') {
          this.setLayerPaint(layer.id, 'text-color', colors.symbolText);
          this.setLayerPaint(layer.id, 'text-halo-color', colors.symbolHalo);
          this.setLayerPaint(layer.id, 'icon-color', colors.iconColor);
          this.setLayerPaint(layer.id, 'icon-halo-color', colors.iconHalo);
          return;
        }

        if (layer.type === 'circle') {
          this.setLayerPaint(layer.id, 'circle-color', colors.circleFill);
          this.setLayerPaint(layer.id, 'circle-stroke-color', colors.circleStroke);
          return;
        }

        if (layer.type === 'fill-extrusion') {
          this.setLayerPaint(layer.id, 'fill-extrusion-color', colors.extrusion);
        }
      });

      // hideUrbanDetail: suprimir rellenos de zonas residenciales/uso de suelo y edificios
      if (this.config.hideUrbanDetail) {
        const toHide = ['landuse_residential', 'landuse', 'building', 'building-top'];
        toHide.forEach((id) => {
          try { this.map.setLayoutProperty(id, 'visibility', 'none'); } catch (_) {}
        });
      }

      // hideContours: suprimir curvas de nivel, hillshade y rutas menores en zonas montañosas
      if (this.config.hideContours) {
        const layers = this.map.getStyle()?.layers || [];
        layers.forEach((layer) => {
          const id = (layer.id || '').toLowerCase();
          const isNoisy = id.includes('contour') || id.includes('hillshade') ||
            id.includes('road_minor') || id.includes('road-minor') ||
            id.includes('road_track') || id.includes('track') ||
            id.includes('path') || id.includes('footway') ||
            id.includes('service') || id.includes('tunnel');
          if (isNoisy) {
            try { this.map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (_) {}
          }
        });
      }

      // minRoads: suprimir calles, avenidas y edificios para mapas con demasiada trama urbana
      if (this.config.minRoads) {
        const layers = this.map.getStyle()?.layers || [];
        layers.forEach((layer) => {
          const id = (layer.id || '').toLowerCase();
          if (layer.type === 'line') {
            const isRoad = id.includes('road') || id.includes('street') || id.includes('motorway') ||
              id.includes('highway') || id.includes('bridge') || id.includes('tunnel') ||
              id.includes('path') || id.includes('rail') || id.includes('transit');
            if (isRoad) {
              try { this.map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (_) {}
            }
          }
          if (layer.type === 'fill') {
            const isBuilding = id.includes('building');
            if (isBuilding) {
              try { this.map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (_) {}
            }
          }
          if (layer.type === 'fill-extrusion') {
            try { this.map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (_) {}
          }
          if (layer.type === 'symbol') {
            const isLabel = id.includes('road') || id.includes('street') || id.includes('transit') ||
              id.includes('highway') || id.includes('motorway') || id.includes('building');
            if (isLabel) {
              try { this.map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (_) {}
            }
          }
        });
      }
    },

    // Compute a center that places MARKER_COORDS at ~25% from the left edge
    // (no offset for labelBelow configs — label goes below, not to the right)
    getOffsetCenter() {
      if (this.config.labelBelow) return this.config.marker;
      const bounds = this.map.getBounds();
      const lngSpan = bounds.getEast() - bounds.getWest();
      return [this.config.marker[0] + lngSpan * 0.25, this.config.marker[1]];
    },

    runSequence() {
      const stages = this.config.stages;
      const polygonAfter = this.config.polygonAfterStage;
      let current = 0;

      const next = () => {
        current++;

        // Show polygon after configured stage (mid-sequence)
        if (polygonAfter != null && current === polygonAfter) {
          this.showIslandHighlight();
        }

        if (current >= stages.length) {
          // All flyTo stages done — offset pan, then marker
          const offsetCenter = this.getOffsetCenter();
          this.map.panTo(offsetCenter, { duration: 600 });
          this.map.once('moveend', () => {
            // Show polygon at end if no mid-sequence trigger
            if (polygonAfter == null) this.showIslandHighlight();
            this.showMarker();
            this.enableInteraction();
          });
          return;
        }

        const stage = stages[current];
        this.map.flyTo({
          center: stage.center,
          zoom: stage.zoom,
          speed: stage.speed,
          essential: true,
        });
        this.map.once('moveend', next);
      };

      // Stage 0: hold, then advance
      setTimeout(next, stages[0].hold);
    },

    showMarker() {
      if (this.marker) this.marker.remove();

      const el = document.createElement('div');
      el.className = 'project-map-marker' + (this.config.labelBelow ? ' project-map-marker--label-below' : '');
      const { name, detail } = this.config.label;
      el.innerHTML = '<div class="project-map-marker__dot"></div><div class="project-map-marker__ring"></div>' +
        '<div class="project-map-marker__label">' +
          '<span class="project-map-marker__name">' + name + '</span>' +
          '<span class="project-map-marker__detail">' + (detail || '') + '</span>' +
        '</div>';

      this.marker = new maplibregl.Marker({ element: el })
        .setLngLat(this.config.marker)
        .addTo(this.map);

      // Trigger enter animation
      requestAnimationFrame(() => {
        el.classList.add('project-map-marker--entering');
      });
    },

    showIslandHighlight() {
      // Skip if no polygon defined for this project
      if (!this.config.polygon) return;
      // Avoid duplicating if already added
      if (this.map.getSource('island-highlight')) return;

      this.map.addSource('island-highlight', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [this.config.polygon],
          },
        },
      });

      // Fill — semitransparent
      let fillColor;
      let lineColor;
      if (this.mapTheme === 'grayscale-light') {
        // Mapa con fondo claro: usar tonos oscuros para que el polígono se vea
        fillColor = this.hexToRgba(this.getCssColor('--color-black', '#1D1D1B'), 0.10);
        lineColor = this.hexToRgba(this.getCssColor('--color-black', '#1D1D1B'), 0.55);
      } else if (this.mapTheme === 'grayscale') {
        fillColor = this.hexToRgba(this.getCssColor('--color-gray-100', '#F6F6F6'), 0.12);
        lineColor = this.hexToRgba(this.getCssColor('--color-gray-200', '#DADADA'), 0.58);
      } else {
        fillColor = 'rgba(255, 255, 255, 0.08)';
        lineColor = 'rgba(255, 255, 255, 0.35)';
      }

      this.map.addLayer({
        id: 'island-highlight-fill',
        type: 'fill',
        source: 'island-highlight',
        paint: {
          'fill-color': fillColor,
          'fill-opacity': 0,
        },
      });

      // Outline
      this.map.addLayer({
        id: 'island-highlight-outline',
        type: 'line',
        source: 'island-highlight',
        paint: {
          'line-color': lineColor,
          'line-width': 1.5,
          'line-opacity': 0,
        },
      });

      // Fade in
      let start = null;
      const duration = 800;
      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        this.map.setPaintProperty('island-highlight-fill', 'fill-opacity', progress);
        this.map.setPaintProperty('island-highlight-outline', 'line-opacity', progress);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    },

    removeIslandHighlight() {
      if (this.map.getLayer('island-highlight-fill')) this.map.removeLayer('island-highlight-fill');
      if (this.map.getLayer('island-highlight-outline')) this.map.removeLayer('island-highlight-outline');
      if (this.map.getSource('island-highlight')) this.map.removeSource('island-highlight');
    },

    enableInteraction() {
      this.map.scrollZoom.enable();
      this.map.dragPan.enable();
      this.map.dragRotate.enable();
      this.map.touchZoomRotate.enable();
      this.map.doubleClickZoom.enable();
      this.map.keyboard.enable();
      this.addZoomControls();
    },

    addZoomControls() {
      // Evitar duplicación si la animación se re-ejecuta
      if (this.container.querySelector('.project-map__zoom')) return;

      const wrap = document.createElement('div');
      wrap.className = 'project-map__zoom';

      const btnIn = document.createElement('button');
      btnIn.type = 'button';
      btnIn.className = 'project-map__zoom-btn';
      btnIn.setAttribute('aria-label', 'Acercar');
      btnIn.textContent = '+';
      btnIn.addEventListener('click', () => this.map.zoomIn());

      const btnOut = document.createElement('button');
      btnOut.type = 'button';
      btnOut.className = 'project-map__zoom-btn';
      btnOut.setAttribute('aria-label', 'Alejar');
      btnOut.textContent = '−';
      btnOut.addEventListener('click', () => this.map.zoomOut());

      wrap.appendChild(btnIn);
      wrap.appendChild(btnOut);
      this.container.appendChild(wrap);
    },

    disableInteraction() {
      this.map.scrollZoom.disable();
      this.map.dragPan.disable();
      this.map.dragRotate.disable();
      this.map.touchZoomRotate.disable();
      this.map.doubleClickZoom.disable();
      this.map.keyboard.disable();
    },
  },

  sustScrollHero: {
    init() {
      const imageEl = document.getElementById('sustHeroImage');
      if (!imageEl) return;

      const SCROLL_HEIGHT = 1500;

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
      }

      function onScroll() {
        const progress = clamp(window.scrollY / SCROLL_HEIGHT, 0, 1);

        // clip-path: de inset(25% 25% 25% 25% round var(--border-radius))
        // a inset(0% 0% 0% 0% round var(--border-radius))
        const inset = lerp(25, 0, progress);
        imageEl.style.clipPath =
          `inset(${inset}% ${inset}% ${inset}% ${inset}% round var(--border-radius))`;

        // background-size: 170% → 100%
        const size = lerp(170, 100, progress);
        imageEl.style.backgroundSize = size + '%';
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll(); // estado inicial
    },
  },

  /* ============================================================
     CONTACT FORM — Envío vía Netlify Function
     ============================================================ */
  contactForm: {
    init() {
      const form = document.getElementById('contactForm');
      if (!form) return;

      const feedback = document.getElementById('formFeedback');
      const submitBtn = form.querySelector('.contact-form__submit');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpiar feedback previo
        feedback.textContent = '';
        feedback.className = 'contact-form__feedback';

        // Recoger datos
        const data = {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          subject: form.subject.value.trim(),
          message: form.message.value.trim(),
        };

        // Validación simple en cliente
        if (!data.name || !data.email || !data.message) {
          feedback.textContent = 'Por favor completá nombre, email y mensaje.';
          feedback.classList.add('contact-form__feedback--error');
          return;
        }

        // Deshabilitar botón
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando…';

        try {
          const res = await fetch('/.netlify/functions/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          const result = await res.json();

          if (res.ok) {
            feedback.textContent = 'Mensaje enviado. Gracias por escribirnos.';
            feedback.classList.add('contact-form__feedback--success');
            form.reset();
          } else {
            feedback.textContent = result.error || 'Hubo un problema al enviar el mensaje.';
            feedback.classList.add('contact-form__feedback--error');
          }
        } catch {
          feedback.textContent = 'Error de conexión. Intentá de nuevo más tarde.';
          feedback.classList.add('contact-form__feedback--error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar mensaje';
        }
      });
    },
  },

  /* ============================================================
     CONTACT PHONE ACTIONS
     En la página de contacto, cada teléfono abre una elección:
     llamar o continuar por WhatsApp.
     ============================================================ */
  contactCopyEmail: {
    init() {
      const buttons = document.querySelectorAll('[data-copy-email]');
      if (!buttons.length) return;

      // Crear el toast una sola vez y anexarlo al body
      const toast = document.createElement('div');
      toast.className = 'contact-copy-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);

      let hideTimer = null;

      const showToast = (text) => {
        toast.textContent = text;
        toast.classList.add('is-visible');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => toast.classList.remove('is-visible'), 2000);
      };

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const email = btn.dataset.copyEmail;
          if (!email) return;

          navigator.clipboard.writeText(email).then(() => {
            const lang = Timbo.state.lang || 'es';
            const msg = Timbo.i18n.resolve('contact.emailCopied', lang) || (lang === 'en' ? 'Email copied' : 'Correo copiado');
            showToast(msg);
          }).catch(() => {
            // Fallback para navegadores sin soporte de Clipboard API
            const lang = Timbo.state.lang || 'es';
            const msg = Timbo.i18n.resolve('contact.emailCopied', lang) || (lang === 'en' ? 'Email copied' : 'Correo copiado');
            showToast(msg);
          });
        });
      });
    },
  },

  contactPhoneActions: {
    init() {
      const items = Array.from(document.querySelectorAll('[data-contact-phone]'))
        .map((option) => {
          const trigger = option.querySelector('[data-contact-phone-trigger]');
          const panel = option.querySelector('[data-contact-phone-actions]');
          if (!trigger || !panel) return null;
          return {
            option,
            trigger,
            panel,
            row: option.closest('.contact-image__item'),
          };
        })
        .filter(Boolean);

      if (!items.length) return;

      let activeItem = null;

      const closeItem = (item, { restoreFocus = false } = {}) => {
        if (!item) return;
        item.option.classList.remove('is-open');
        item.row?.classList.remove('contact-image__item--phone-menu-open');
        item.trigger.setAttribute('aria-expanded', 'false');
        item.panel.hidden = true;

        if (restoreFocus) {
          item.trigger.focus();
        }

        if (activeItem === item) {
          activeItem = null;
        }
      };

      const openItem = (item) => {
        if (activeItem && activeItem !== item) {
          closeItem(activeItem);
        }

        item.option.classList.add('is-open');
        item.row?.classList.add('contact-image__item--phone-menu-open');
        item.trigger.setAttribute('aria-expanded', 'true');
        item.panel.hidden = false;
        activeItem = item;
      };

      items.forEach((item) => {
        item.trigger.addEventListener('click', () => {
          const isOpen = item.trigger.getAttribute('aria-expanded') === 'true';

          if (isOpen) {
            closeItem(item);
            return;
          }

          openItem(item);
        });

        item.panel.addEventListener('click', (event) => {
          if (!event.target.closest('a')) return;
          closeItem(item);
        });
      });

      document.addEventListener('click', (event) => {
        if (!activeItem) return;
        if (activeItem.option.contains(event.target)) return;
        closeItem(activeItem);
      });

      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !activeItem) return;
        closeItem(activeItem, { restoreFocus: true });
      });
    },
  },

  /* ============================================================
     KEYBOARD NAV
     Navegación por teclado con flechas arriba/abajo entre "stops"
     (anclas) definidos por página. Cada stop es un selector CSS;
     al presionar ↓ saltamos al siguiente stop, con ↑ al anterior.
     - Se ignora si el foco está sobre un input / textarea / select
       o elemento contentEditable.
     - Restamos NAV_OFFSET al top para que no quede tapado por el nav.
     - Respeta prefers-reduced-motion (sin smooth).
     ============================================================ */
  keyboardNav: {
    NAV_OFFSET: 60, // altura del nav fixed
    EPSILON: 4,     // tolerancia px al comparar posición actual vs stops

    // Stops por página. Cada entrada matchea si TODOS los selectores
    // del "match" existen en el DOM; usamos los primeros que coincidan.
    PAGES: [
      {
        name: 'home',
        match: ['.hero', '.intro', '.nature-dialogue', '.philosophy'],
        stops: [
          '#hero',
          '.intro__body',
          '#nature-dialogue',
          '#philosophy',
        ],
      },
      {
        name: 'sustentabilidad',
        match: ['.sust-hero'],
        stops: [
          '#sust-hero',
          '#sust-process',
          '#sust-pilares',
          '#sust-climate',
          '#sust-breathe',
          '#sust-strategies',
        ],
      },
      {
        name: 'sobre-nosotros',
        match: ['.about-hero'],
        stops: [
          '.about-hero',
          '.about-founders',
          '.about-approach',
          '.about-final',
        ],
      },
      {
        name: 'contacto',
        match: ['.contact-image'],
        stops: [
          '.contact-image',
        ],
      },
    ],

    stopEls: [],
    reducedMotion: false,

    init() {
      // Detectar página activa y armar lista de elementos de stops.
      const page = this.PAGES.find((p) =>
        p.match.every((sel) => document.querySelector(sel))
      );
      if (!page) return;

      this.stopEls = page.stops
        .map((sel) => document.querySelector(sel))
        .filter(Boolean);

      // Si hay menos de 2 stops, no tiene sentido navegar.
      if (this.stopEls.length < 2) return;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      window.addEventListener('keydown', (e) => this.onKeydown(e));
    },

    isTypingTarget(el) {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (el.isContentEditable) return true;
      return false;
    },

    onKeydown(e) {
      // Solo ↓ / ↑
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      // Ignorar si el foco está en un campo de texto.
      if (this.isTypingTarget(document.activeElement)) return;
      // Ignorar si hay teclas modificadoras (para no pisar shortcuts del SO).
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      e.preventDefault();

      const direction = e.key === 'ArrowDown' ? 1 : -1;
      const currentY = window.scrollY;

      // Calcular top relativo a la página para cada stop, ordenado.
      const targets = this.stopEls
        .map((el) => Math.max(0, el.getBoundingClientRect().top + window.scrollY - this.NAV_OFFSET))
        .sort((a, b) => a - b);

      let next;
      if (direction === 1) {
        next = targets.find((y) => y > currentY + this.EPSILON);
      } else {
        // El último menor al actual
        for (let i = targets.length - 1; i >= 0; i--) {
          if (targets[i] < currentY - this.EPSILON) { next = targets[i]; break; }
        }
      }

      if (next === undefined) return;

      window.scrollTo({
        top: next,
        behavior: this.reducedMotion ? 'auto' : 'smooth',
      });
    },
  },


  /* ============================================================
     DISEÑO SONORO
     Carga y reproducción de efectos de sonido de UI.
     Uso: Timbo.sound.play('hover')
     ============================================================ */
  sound: {
    enabled: true,
    volume: 0.4,
    sources: {
      hover: 'assets/audio/snap-timbo.mp3',
    },
    buffers: {}, // { id: HTMLAudioElement }

    init() {
      // Respeta la preferencia de reducir movimiento → también silencia
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.enabled = false;
        return;
      }

      // Ajustar ruta si estamos dentro de /proyectos/
      const depth = window.location.pathname.includes('/proyectos/') ? '../' : '';

      Object.entries(this.sources).forEach(([id, path]) => {
        const audio = new Audio(depth + path);
        audio.preload = 'auto';
        audio.volume = this.volume;
        this.buffers[id] = audio;
      });
    },

    play(id) {
      if (!this.enabled) return;
      const audio = this.buffers[id];
      if (!audio) return;
      // Clonamos el nodo para poder superponer reproducciones si el usuario
      // recorre la lista rápido, sin cortar el sonido anterior.
      const instance = audio.cloneNode();
      instance.volume = this.volume;
      // play() devuelve una Promise que puede rechazar si el navegador bloquea
      // autoplay (ej: antes de la primera interacción). Lo ignoramos en silencio.
      const p = instance.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    },
  },

  /* ============================================================
     SUST-HERO DRAWING REVEAL
     Carga el SVG inline, le aplica una máscara con degradado lineal
     deformado por feTurbulence (efecto "tinta esparciéndose"), y
     anima la posición del degradado para revelar el dibujo.
     El seed de la turbulencia es random en cada carga, así la
     mancha de revelado es distinta cada vez.
     ============================================================ */
  sustHeroDrawingReveal: {
    SVG_NS: 'http://www.w3.org/2000/svg',

    init() {
      // Puede haber más de un host (ej. patrón BILINGÜE-TEMPORAL con un SVG
      // por idioma). Procesamos todos los que matcheen — cada uno corre su
      // propia carga + animación independiente, con IDs únicos.
      const hosts = document.querySelectorAll('.sust-hero__visual-img[data-svg-src]');
      hosts.forEach((host) => this.processHost(host));
    },

    async processHost(host) {
      const src = host.dataset.svgSrc;
      if (!src) return;

      // Si algo falla más adelante, al menos mostramos el SVG como <img>
      // para que el hero nunca quede en blanco.
      const fallback = () => {
        host.innerHTML = `<img src="${src}" alt="" style="display:block;width:100%;height:auto;">`;
        host.classList.add('is-ready');
        host.style.setProperty('--reveal-progress', '1');
      };

      // Fetch del SVG e inyección inline
      let markup;
      try {
        const response = await fetch(src);
        if (!response.ok) {
          console.warn('[sustHeroDrawingReveal] fetch falló:', response.status, src);
          fallback();
          return;
        }
        markup = await response.text();
      } catch (err) {
        console.warn('[sustHeroDrawingReveal] error en fetch:', err);
        fallback();
        return;
      }

      host.innerHTML = markup;
      const svg = host.querySelector('svg');
      if (!svg) {
        console.warn('[sustHeroDrawingReveal] no se encontró <svg> en el markup');
        fallback();
        return;
      }

      // ID únicos por si en algún momento hay más de una instancia
      const uid = `sustHeroReveal-${Math.random().toString(36).slice(2, 8)}`;
      const maskId = `${uid}-mask`;
      const filterId = `${uid}-filter`;
      const gradientId = `${uid}-gradient`;
      const seed = Math.floor(Math.random() * 1000);

      // Asegurar <defs>
      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS(this.SVG_NS, 'defs');
        svg.insertBefore(defs, svg.firstChild);
      }

      // Filter: turbulencia + displacement (deforma la máscara).
      // IMPORTANTE: creamos cada elemento con createElementNS, no innerHTML.
      // innerHTML parsea en namespace HTML y los filtros SVG no andan así.
      const filter = document.createElementNS(this.SVG_NS, 'filter');
      filter.setAttribute('id', filterId);
      filter.setAttribute('x', '-20%');
      filter.setAttribute('y', '-20%');
      filter.setAttribute('width', '140%');
      filter.setAttribute('height', '140%');

      const turbulence = document.createElementNS(this.SVG_NS, 'feTurbulence');
      turbulence.setAttribute('type', 'fractalNoise');
      turbulence.setAttribute('baseFrequency', '0.018 0.025');
      turbulence.setAttribute('numOctaves', '2');
      turbulence.setAttribute('seed', String(seed));
      turbulence.setAttribute('result', 'noise');
      filter.appendChild(turbulence);

      const displacement = document.createElementNS(this.SVG_NS, 'feDisplacementMap');
      displacement.setAttribute('in', 'SourceGraphic');
      displacement.setAttribute('in2', 'noise');
      displacement.setAttribute('scale', '60');
      displacement.setAttribute('xChannelSelector', 'R');
      displacement.setAttribute('yChannelSelector', 'G');
      filter.appendChild(displacement);

      defs.appendChild(filter);

      // Gradient para la máscara: zona blanca = visible, zona negra = oculta.
      // 4 stops: las dos del medio se mueven juntas y forman un borde "duro"
      // que recorre el ancho de la imagen al cambiar --reveal-progress.
      const gradient = document.createElementNS(this.SVG_NS, 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');

      const makeStop = (offset, color) => {
        const stop = document.createElementNS(this.SVG_NS, 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', color);
        return stop;
      };
      gradient.appendChild(makeStop('0%', 'white'));
      gradient.appendChild(makeStop('0%', 'white'));
      gradient.appendChild(makeStop('0%', 'black'));
      gradient.appendChild(makeStop('100%', 'black'));

      defs.appendChild(gradient);

      // Mask: rect que ocupa todo el viewBox, lleno con el gradient,
      // y deformado por el filter para tener bordes orgánicos.
      const viewBox = (svg.getAttribute('viewBox') || '0 0 431.21 501.06').split(/\s+/).map(Number);
      const [vbX, vbY, vbW, vbH] = viewBox;

      const mask = document.createElementNS(this.SVG_NS, 'mask');
      mask.setAttribute('id', maskId);
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      mask.setAttribute('x', String(vbX));
      mask.setAttribute('y', String(vbY));
      mask.setAttribute('width', String(vbW));
      mask.setAttribute('height', String(vbH));

      // El rect que va a contener el gradient deformado.
      // Lo hacemos más grande que el viewBox (y desplazado) para que el
      // displacement no muestre los bordes vacíos del filtro.
      const maskRect = document.createElementNS(this.SVG_NS, 'rect');
      maskRect.setAttribute('x', String(vbX - vbW * 0.5));
      maskRect.setAttribute('y', String(vbY - vbH * 0.5));
      maskRect.setAttribute('width', String(vbW * 2));
      maskRect.setAttribute('height', String(vbH * 2));
      maskRect.setAttribute('fill', `url(#${gradientId})`);
      maskRect.setAttribute('filter', `url(#${filterId})`);
      mask.appendChild(maskRect);
      defs.appendChild(mask);

      // Mover todo el contenido visible del svg dentro de un <g> con la máscara.
      const wrapper = document.createElementNS(this.SVG_NS, 'g');
      wrapper.setAttribute('mask', `url(#${maskId})`);

      const childrenToWrap = Array.from(svg.children).filter((node) => node !== defs);
      childrenToWrap.forEach((child) => wrapper.appendChild(child));
      svg.appendChild(wrapper);

      // Función que setea la posición del borde de la máscara según un
      // progreso 0..1. progress=0 -> dibujo totalmente oculto.
      // progress=1 -> dibujo totalmente visible.
      const stops = gradient.querySelectorAll('stop');
      const setProgress = (progress) => {
        const p = Math.max(0, Math.min(1, progress));
        // Mapeo: en p=0 el borde está en -0.1 (fuera, izquierda).
        // En p=1 el borde está en 1.1 (fuera, derecha).
        const center = -0.1 + p * 1.2;
        const softEdge = 0.18; // ancho del degradado suave
        const left = Math.max(0, Math.min(1, center - softEdge / 2));
        const right = Math.max(0, Math.min(1, center + softEdge / 2));
        stops[0].setAttribute('offset', `${(left * 100).toFixed(2)}%`);
        stops[1].setAttribute('offset', `${(left * 100).toFixed(2)}%`);
        stops[2].setAttribute('offset', `${(right * 100).toFixed(2)}%`);
        stops[3].setAttribute('offset', `${(right * 100).toFixed(2)}%`);
      };

      // Easing: ease-out (arranca rápido, termina lento)
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);

      // Estado inicial: oculto. Recién acá hacemos visible el host
      // (estaba visibility:hidden para evitar el flash del SVG sin máscara)
      setProgress(0);
      host.classList.add('is-ready');

      const DURATION = 2400; // ms

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        setProgress(1);
        return;
      }

      // Animación manejada enteramente en JS: más predecible que depender
      // de @keyframes + getComputedStyle de una custom property.
      const runAnimation = () => {
        const startTime = performance.now();
        const tick = (now) => {
          const elapsed = now - startTime;
          const t = Math.min(1, elapsed / DURATION);
          setProgress(easeOut(t));
          if (t < 1) {
            window.requestAnimationFrame(tick);
          }
        };
        window.requestAnimationFrame(tick);
      };

      // Disparador: IntersectionObserver — cuando el dibujo entra al viewport
      // arrancamos la animación.
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runAnimation();
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.25 });

      observer.observe(host);
    },
  },

  /* ============================================================
     LANG TOGGLE
     Inyecta el widget ES / EN en el hero / primera sección de cada página.
     Busca la primera sección que matchee el selector (en orden de especificidad):
       .hero, .sust-hero, .project-hero, .about-hero, .contact-image,
       .services-directory, .projects-gallery
     El color (dark/light) se infiere del data-nav-theme de la sección (default: light).

     Todas las páginas (home, proyectos, etc.) usan el mismo
     posicionamiento absolute dentro del hero, igual que sustentabilidad.
     ============================================================ */
  langToggle: {
    init() {
      const hero = document.querySelector(
        '.hero, .sust-hero, .project-hero, .about-hero, .contact-image, .services-directory, .projects-gallery'
      );
      if (!hero) return;

      // Asegurarse de que el hero tenga position relativa para que el absolute funcione
      const heroPosition = window.getComputedStyle(hero).position;
      if (heroPosition === 'static') {
        hero.style.position = 'relative';
      }

      const theme = hero.dataset.navTheme === 'dark' ? 'dark' : 'light';

      // Todas las páginas usan el mismo posicionamiento que sustentabilidad:
      // toggle absolute dentro del hero (anclado abajo-derecha, se va al scrollear).
      const toggle = document.createElement('div');
      toggle.className = `lang-toggle lang-toggle--${theme}`;
      toggle.innerHTML = `
        <button class="lang-option" data-lang="es" aria-label="Español">ES</button>
        <span class="lang-toggle__sep" aria-hidden="true">/</span>
        <button class="lang-option" data-lang="en" aria-label="English">EN</button>
      `;

      toggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-option');
        if (!btn) return;
        Timbo.i18n.set(btn.dataset.lang);
      });

      hero.appendChild(toggle);

      // Mobile: ocultar el toggle apenas el usuario hace scroll
      const SCROLL_HIDE_THRESHOLD = 15; // px
      const updateMobileVisibility = () => {
        if (window.innerWidth >= 1024) return;
        toggle.classList.toggle('lang-toggle--hidden-mobile', window.scrollY > SCROLL_HIDE_THRESHOLD);
      };
      window.addEventListener('scroll', updateMobileVisibility, { passive: true });
      updateMobileVisibility();
    },
  },

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */
  init() {
    // 1. Renderizar componentes compartidos
    this.footer.render();
    this.langToggle.init();
    this.floatingLogo.init();
    this.navLinkUnderline.init();
    this.introLinkOval.init();
    this.sound.init();

    // 2. Nav: fondo al scrollear + cambio de color por sección
    this.navScroll.init();
    this.navMobile.init();
    this.refugePhotoSlide.init();
    this.refugePhotoA.init();
    this.navHide.init();
    this.navTheme.init();
    this.navIntro.init();
    this.scrollReveal.init();
    this.projectFinalLogoScroll.init();
    this.introClaimReveal.init();
    this.philosophyStatementReveal.init();
    this.philosophySignalOpacityReveal.init();
    this.sustProcessTitleReveal.init();
    this.sustClimateTitleReveal.init();
    this.projectOverviewTitleReveal.init();
    this.projectHighlightTitleReveal.init();
    this.projectPhraseTextReveal.init();
    this.projectPhrasePan.init();
    this.sustBreatheTextReveal.init();
    this.sustStrategiesOrbit.init();
    this.sustStrategiesDetail.init();
    this.sustPilaresOrbit.init();
    this.sustPilaresDetail.init();
    this.heroIntro.init();
    this.heroParallax.init();
    this.sustHeroIntro.init();
    this.sustHeroDrawingReveal.init();
    this.heroVideoScrollFade.init();
    this.projectHeroIntro.init();
    this.harasHeroTitleScroll.init();
    this.natureDialogueImageFade.init();
    this.aboutFinalZoom.init();
    this.projectMap.init();
    this.projectOverviewSlider.init();
    this.projectRefugeSlider.init();
    this.projectFrameSlider.init();
    this.projectPhraseSlider.init();
    this.projectPaletteSlider.init();
    this.projectHighlightSlider.init();
    this.projectFactsParallax.init();
    this.projectFrameCopyParallax.init();
    this.projectPaletteTextParallax.init();
    this.projectPaletteTextReveal.init();
    this.natureDialogueTextReveal.init();
    this.projectPhraseTextParallax.init();
    this.contactForm.init();
    this.contactCopyEmail.init();
    this.contactPhoneActions.init();
    this.keyboardNav.init();
    // Hover-blur de la galería desactivado a pedido del cliente.
    // El módulo queda disponible por si se reactiva: this.projectsGalleryHoverBlur.init();
    this.galleryCoverCycle.init();
    this.galleryCoverCyclePairs.init();

    // 3. Detectar idioma y aplicar
    const lang = this.i18n.detect();
    this.i18n.set(lang);

    // 4. Transición entre Home y Projects
    this.pageTransition.init();

  },

  initAutoGallery(root, dots, activate) {
    if (!root || dots.length < 2) return;

    // El atributo data-gallery-autoplay actúa como switch: si no existe, no arranca.
    // El valor numérico ya no se usa — el timing está estandarizado (ver abajo).
    const hasAutoplay = root.dataset.galleryAutoplay !== undefined;
    if (!hasAutoplay) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const FIRST_DELAY_MS  = 2000; // primer cambio 2s después de entrar al viewport
    const INTERVAL_MS     = 5000; // ciclo estándar a partir del segundo cambio

    let stopped = false;

    const advance = () => {
      if (stopped) return;
      const currentIndex = Array.from(dots).findIndex((dot) => dot.classList.contains('is-active'));
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % dots.length : 0;
      activate(nextIndex);
    };

    // Si el usuario toca un dot, detiene la automatización para siempre
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        stopped = true;
        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      }, { once: true });
    });

    let started = false;
    let intervalId = null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !started) {
          started = true;
          observer.disconnect();

          // Primer cambio a los 2s
          window.setTimeout(() => {
            advance();
            // Ciclo regular — guardamos el ID para poder cancelarlo si hiciera falta
            intervalId = window.setInterval(advance, INTERVAL_MS);
          }, FIRST_DELAY_MS);
        }
      });
    }, { threshold: 0.25 });

    observer.observe(root);
  },

  projectOverviewSlider: {
    init() {
      const media = document.querySelector('.project-overview__media');
      if (!media) return;

      const dots = media.querySelectorAll('.project-overview__dot[data-project-overview-slide]');
      const imgs = media.querySelectorAll('.project-overview__img');
      if (!dots.length || !imgs.length) return;

      const setSlide = (idx) => {
        dots.forEach((d) => d.classList.remove('is-active'));
        imgs.forEach((i) => i.classList.remove('is-active'));
        if (dots[idx]) dots[idx].classList.add('is-active');
        if (imgs[idx]) imgs[idx].classList.add('is-active');
      };

      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          const idx = Number(dot.dataset.projectOverviewSlide);
          setSlide(idx);
        });
      });

      Timbo.initAutoGallery(media, dots, setSlide);
    },
  },

  projectRefugeSlider: {
    init() {
      const sections = document.querySelectorAll('.project-refuge--gallery, .project-refuge--gallery-mobile-only');
      if (!sections.length) return;

      sections.forEach((section) => {
        const root = section.querySelector('.project-refuge__gallery-mobile') || section.querySelector('.project-refuge__gallery');
        const dots = section.querySelectorAll('.project-refuge__dot[data-project-refuge-slide]');
        const imgs = section.querySelectorAll('.project-refuge__img');
        if (!dots.length || !imgs.length) return;

        const setSlide = (idx) => {
          dots.forEach(d => d.classList.remove('is-active'));
          imgs.forEach(i => i.classList.remove('is-active'));
          if (dots[idx]) dots[idx].classList.add('is-active');
          if (imgs[idx]) imgs[idx].classList.add('is-active');
        };

        dots.forEach(dot => {
          dot.addEventListener('click', () => {
            setSlide(Number(dot.dataset.projectRefugeSlide));
          });
        });

        Timbo.initAutoGallery(root, dots, setSlide);
      });
    },
  },

  projectFrameSlider: {
    init() {
      const sections = document.querySelectorAll('.project-frame--gallery');
      if (!sections.length) return;

      sections.forEach((section) => {
        const media = section.querySelector('.project-frame__media');
        const dots = section.querySelectorAll('.project-frame__dot[data-project-frame-slide]');
        const imgs = section.querySelectorAll('.project-frame__img');
        if (!media || !dots.length || !imgs.length) return;

        const setSlide = (idx) => {
          dots.forEach((d) => d.classList.remove('is-active'));
          imgs.forEach((i) => i.classList.remove('is-active'));
          if (dots[idx]) dots[idx].classList.add('is-active');
          if (imgs[idx]) imgs[idx].classList.add('is-active');
        };

        dots.forEach(dot => {
          dot.addEventListener('click', () => {
            const idx = Number(dot.dataset.projectFrameSlide);
            setSlide(idx);
          });
        });

        Timbo.initAutoGallery(media, dots, setSlide);
      });
    },
  },

  projectPhraseSlider: {
    init() {
      const sections = document.querySelectorAll('.project-phrase--gallery, .project-phrase--gallery-mobile-only');
      if (!sections.length) return;

      sections.forEach((section) => {
        const root = section.querySelector('.project-phrase__gallery-mobile') || section.querySelector('.project-phrase__images');
        const dots = section.querySelectorAll('.project-phrase__dot[data-project-phrase-slide]');
        const imgs = section.querySelectorAll('.project-phrase__img');
        if (!dots.length || !imgs.length) return;

        const setSlide = (idx) => {
          dots.forEach(d => d.classList.remove('is-active'));
          imgs.forEach(i => i.classList.remove('is-active'));
          if (dots[idx]) dots[idx].classList.add('is-active');
          if (imgs[idx]) imgs[idx].classList.add('is-active');
        };

        dots.forEach(dot => {
          dot.addEventListener('click', () => {
            setSlide(Number(dot.dataset.projectPhraseSlide));
          });
        });

        Timbo.initAutoGallery(root, dots, setSlide);
      });
    },
  },

  projectPaletteSlider: {
    init() {
      const sections = document.querySelectorAll('.project-palette--gallery, .project-palette--gallery-mobile-only');
      if (!sections.length) return;

      sections.forEach((section) => {
        const root = section.querySelector('.project-palette__gallery-mobile') || section.querySelector('.project-palette__images');
        const dots = section.querySelectorAll('.project-palette__dot[data-project-palette-slide]');
        const imgs = section.querySelectorAll('.project-palette__img');
        if (!dots.length || !imgs.length) return;

        const setSlide = (idx) => {
          dots.forEach(d => d.classList.remove('is-active'));
          imgs.forEach(i => i.classList.remove('is-active'));
          if (dots[idx]) dots[idx].classList.add('is-active');
          if (imgs[idx]) imgs[idx].classList.add('is-active');
        };

        dots.forEach(dot => {
          dot.addEventListener('click', () => {
            setSlide(Number(dot.dataset.projectPaletteSlide));
          });
        });

        Timbo.initAutoGallery(root, dots, setSlide);
      });
    },
  },

  projectHighlightSlider: {
    init() {
      const sections = document.querySelectorAll('.project-highlight--gallery');
      if (!sections.length) return;

      sections.forEach((section) => {
        const root = section.querySelector('.project-highlight__media');
        const dots = section.querySelectorAll('.project-highlight__dot[data-project-highlight-slide]');
        const imgs = section.querySelectorAll('.project-highlight__img');
        if (!dots.length || !imgs.length) return;

        const setSlide = (idx) => {
          dots.forEach(d => d.classList.remove('is-active'));
          imgs.forEach(i => i.classList.remove('is-active'));
          if (dots[idx]) dots[idx].classList.add('is-active');
          if (imgs[idx]) imgs[idx].classList.add('is-active');
        };

        dots.forEach(dot => {
          dot.addEventListener('click', () => {
            setSlide(Number(dot.dataset.projectHighlightSlide));
          });
        });

        Timbo.initAutoGallery(root, dots, setSlide);
      });
    },
  },


  /* ============================================================
     PROJECTS GALLERY HOVER BLUR
     ------------------------------------------------------------
     Activa el blur del resto de proyectos solo después de que
     transcurra exactamente el mismo tiempo que tarda en aparecer
     la hover-card. Lo manejamos por JS para evitar estados
     "pegados" al entrar/salir rápido entre items.
     ============================================================ */
  projectsGalleryHoverBlur: {
    gallery: null,
    items: [],
    activeItem: null,
    activationTimer: 0,

    parseTimeToMs(value) {
      const raw = String(value || '').trim();
      if (!raw) return 0;

      if (raw.endsWith('ms')) {
        const parsedMs = parseFloat(raw);
        return Number.isFinite(parsedMs) ? parsedMs : 0;
      }

      if (raw.endsWith('s')) {
        const parsedSeconds = parseFloat(raw);
        return Number.isFinite(parsedSeconds) ? parsedSeconds * 1000 : 0;
      }

      const parsedNumber = parseFloat(raw);
      return Number.isFinite(parsedNumber) ? parsedNumber : 0;
    },

    resolveActivationDelay() {
      if (!this.gallery) return 0;

      // Delay propio del blur, independiente del de la hover-card.
      // Si existe --gallery-blur-activation-delay lo usa; sino, 500ms.
      const styles = getComputedStyle(this.gallery);
      const customDelay = this.parseTimeToMs(
        styles.getPropertyValue('--gallery-blur-activation-delay')
      );

      return customDelay > 0 ? customDelay : 800;
    },

    clearActivationTimer() {
      if (!this.activationTimer) return;
      window.clearTimeout(this.activationTimer);
      this.activationTimer = 0;
    },

    setActiveItem(item) {
      if (this.activeItem === item) return;

      if (this.activeItem) {
        this.activeItem.classList.remove('is-blur-target');
      }

      this.activeItem = item;

      if (this.activeItem) {
        this.activeItem.classList.add('is-blur-target');
      }
    },

    activateBlur() {
      if (!this.gallery || !this.activeItem) return;
      this.gallery.classList.add('is-blur-active');
    },

    clearBlur() {
      this.clearActivationTimer();

      if (this.gallery) {
        this.gallery.classList.remove('is-blur-active');
      }

      this.setActiveItem(null);
    },

    scheduleActivation(item) {
      if (!item) {
        this.clearBlur();
        return;
      }

      this.clearActivationTimer();
      this.setActiveItem(item);

      const delay = this.resolveActivationDelay();

      this.activationTimer = window.setTimeout(() => {
        this.activationTimer = 0;

        if (this.activeItem !== item) return;

        // Verificamos hover sobre la zona visual (imagen), no sobre el item entero.
        // Esto evita activar el blur si el cursor está solo sobre el caption
        // o sobre la hover-card lateral.
        const visual = item.querySelector('.projects-gallery__visual');
        const target = visual || item;
        if (!target.matches(':hover')) return;

        this.activateBlur();
      }, delay);
    },

    // Devuelve el item de la galería al que pertenece un nodo,
    // SOLO si el nodo está dentro de la zona visual (imagen) de ese item.
    // Si el nodo está sobre el caption o sobre el hover-card, devuelve null.
    resolveItemFromVisual(node) {
      if (!(node instanceof Element)) return null;
      if (!this.gallery || !this.gallery.contains(node)) return null;

      const visual = node.closest('.projects-gallery__visual');
      if (!visual) return null;

      // El hover-card vive dentro del visual pero NO debe activar el blur.
      if (node.closest('.projects-gallery__hover-card')) return null;

      return visual.closest('.projects-gallery__item');
    },

    init() {
      this.gallery = document.querySelector('.projects-gallery');
      if (!this.gallery) return;

      this.items = Array.from(this.gallery.querySelectorAll('.projects-gallery__item'));
      if (!this.items.length) return;

      // Delegación a nivel de galería con pointer events.
      // Más confiable que mouseenter/mouseleave por item (evita bugs de
      // relatedTarget cuando el cursor se mueve rápido entre items o
      // sale por el espacio entre filas).
      this.gallery.addEventListener('pointerover', (event) => {
        // Ignoramos eventos no-mouse (touch, pen): el blur es un efecto desktop.
        if (event.pointerType && event.pointerType !== 'mouse') return;

        const item = this.resolveItemFromVisual(event.target);

        if (!item) {
          // El cursor entró a una zona de la galería que NO es portada
          // (caption, hover-card, gap entre filas, márgenes). Limpiamos
          // el blur — si el usuario dejó la imagen, el efecto se apaga.
          this.clearBlur();
          return;
        }

        if (this.activeItem === item) return;

        if (this.gallery.classList.contains('is-blur-active')) {
          // Si el blur ya está activo, el cambio de item es instantáneo.
          this.clearActivationTimer();
          this.setActiveItem(item);
          return;
        }

        this.scheduleActivation(item);
      });

      // pointerleave NO burbujea — se dispara solo cuando el cursor
      // sale del contenedor de la galería entera. Es nuestro reset.
      this.gallery.addEventListener('pointerleave', () => {
        this.clearBlur();
      });

      // Red de seguridad: si el cursor sale del documento o cambia de
      // pestaña, limpiamos sí o sí.
      document.addEventListener('pointerleave', () => {
        this.clearBlur();
      });

      window.addEventListener('blur', () => {
        this.clearBlur();
      });

      // Si la pestaña se oculta (Cmd+Tab, minimizar), también limpiamos.
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.clearBlur();
      });
    },
  },

  /* ============================================================
     GALLERY SCROLL DRIFT
     ------------------------------------------------------------
     Mueve horizontalmente items de la galería de proyectos a
     medida que salen por arriba del viewport, ligado al progreso
     del scroll. La idea es darles un movimiento "de despedida"
     cuando ya no son el elemento visual principal.

     Cómo se activa:
     - Cualquier .projects-gallery__item con data-scroll-drift="N"
       (N en px, positivo = derecha, negativo = izquierda).
     - Solo desktop (>= 769px) y solo si el usuario no pidió
       prefers-reduced-motion: reduce.
     - Solo se aplica DESPUÉS de que el item ya haya entrado
       (clase is-visible). Mientras la animación de entrada está
       corriendo, no tocamos el transform del item.

     Rango del progreso:
     - 0 cuando el borde inferior del item cruza el 50% del
       viewport (todavía es protagonista).
     - 1 cuando el borde inferior del item cruza el 0% del
       viewport (ya salió por arriba).

     Easing: ease-out cúbico sobre el progreso, para que el
     desplazamiento arranque suave y se acelere hacia el final
     (justo cuando el item se está despidiendo).
     ============================================================ */
  galleryScrollDrift: {

    // 0–1. Más bajo = más inercia (más "flotante").
    // Más alto = más pegado al scroll. 1 = comportamiento original.
    SMOOTHING: 0.12,
    // Umbral (en px o %) para considerar que current alcanzó target
    // y se puede frenar el RAF cuando ya no hay items activos.
    SETTLE_EPSILON: 0.05,

    items: [],
    masks: [],
    activeItems: new Set(),
    activeMasks: new Set(),
    rafId: null,
    enabled: false,
    mediaQuery: null,
    motionQuery: null,

    init() {
      // --- DRIFT: cualquier elemento con data-scroll-drift ---
      const driftEls = document.querySelectorAll('.projects-gallery [data-scroll-drift]');
      this.items = Array.from(driftEls).map(el => {
        const gate = el.classList.contains('projects-gallery__item')
          ? el
          : el.closest('.projects-gallery__item');
        const pairItem = el.closest('.projects-gallery__item--pair');
        const isPairSquare = pairItem && el.classList.contains('projects-gallery__media--square');
        const pairSquares = isPairSquare
          ? Array.from(pairItem.querySelectorAll('.projects-gallery__media--square'))
          : [];
        const squareIndex = isPairSquare ? pairSquares.indexOf(el) : -1;
        const caption = pairItem ? pairItem.querySelector('.projects-gallery__caption') : null;
        const name = caption ? caption.querySelector('.projects-gallery__name') : null;
        const location = caption ? caption.querySelector('.projects-gallery__location') : null;
        const category = caption ? caption.querySelector('.projects-gallery__category') : null;
        const phase = el.getAttribute('data-scroll-drift-phase') === 'enter' ? 'enter' : 'exit';

        return {
          el,
          gate: gate || el,
          amount: parseFloat(el.getAttribute('data-scroll-drift')) || 0,
          phase,
          useTranslateProperty: phase === 'enter' && el.classList.contains('projects-gallery__item'),
          captionLeft: squareIndex === 0 ? [name, location].filter(Boolean) : [],
          captionRight: squareIndex === pairSquares.length - 1 ? [category].filter(Boolean) : [],
          waitsForEntryTransition: phase !== 'enter' && el.classList.contains('projects-gallery__item') && el.classList.contains('anim-fade-up'),
          entryTransitionDone: phase === 'enter' || !el.classList.contains('projects-gallery__item') || !el.classList.contains('anim-fade-up'),
          entryTransitionListenerAttached: false,
          primed: false,
          currentX: 0,
          targetX: 0,
        };
      });

      // --- MÁSCARA: cualquier elemento con data-scroll-mask ---
      // El valor es el porcentaje del ancho a recortar desde la izquierda
      // al final del barrido (ej. data-scroll-mask="15" → 15%).
      // Los textos de la columna izquierda del caption (name + location)
      // se trasladan en sintonía con el borde izquierdo de la máscara.
      // El category (columna derecha) se queda fijo, así nunca sobrepasa
      // el borde derecho de la imagen.
      const maskEls = document.querySelectorAll('.projects-gallery [data-scroll-mask]');
      this.masks = Array.from(maskEls).map(el => {
        const item = el.closest('.projects-gallery__item');
        const caption = item ? item.querySelector('.projects-gallery__caption') : null;
        const name = caption ? caption.querySelector('.projects-gallery__name') : null;
        const location = caption ? caption.querySelector('.projects-gallery__location') : null;

        return {
          el,
          gate: item || el,
          captionLeft: [name, location].filter(Boolean),
          percent: parseFloat(el.getAttribute('data-scroll-mask')) || 0,
          primed: false,
          currentCut: 0,
          targetCut: 0,
        };
      });

      if (!this.items.length && !this.masks.length) return;

      this.mediaQuery = window.matchMedia('(min-width: 769px)');
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      // Re-evaluar si cambia el viewport o la preferencia de motion
      this.mediaQuery.addEventListener('change', () => this.evaluateEnabled());
      this.motionQuery.addEventListener('change', () => this.evaluateEnabled());

      this.evaluateEnabled();
    },

    /**
     * Decide si el módulo debe estar activo según viewport + motion.
     */
    evaluateEnabled() {
      const shouldBeEnabled = this.mediaQuery.matches && !this.motionQuery.matches;

      if (shouldBeEnabled && !this.enabled) {
        this.enable();
      } else if (!shouldBeEnabled && this.enabled) {
        this.disable();
      }
    },

    enable() {
      this.enabled = true;

      // Promovemos a capa de composición a los elementos con drift.
      this.items.forEach(({ el, captionLeft, captionRight }) => {
        el.style.willChange = 'transform';
        captionLeft.forEach(node => { node.style.willChange = 'transform'; });
        captionRight.forEach(node => { node.style.willChange = 'transform'; });
      });
      // Y a los elementos con máscara y a los textos del caption izquierdo.
      this.masks.forEach(({ el, captionLeft }) => {
        el.style.willChange = 'clip-path';
        captionLeft.forEach(node => { node.style.willChange = 'transform'; });
      });

      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (this.items.find(d => d.el === entry.target)) this.activeItems.add(entry.target);
            if (this.masks.find(d => d.el === entry.target)) this.activeMasks.add(entry.target);
          } else {
            this.activeItems.delete(entry.target);
            this.activeMasks.delete(entry.target);
            this.resetItemAtBoundary(entry.target);
          }
        });
        this.maybeStartLoop();
      }, {
        rootMargin: '50% 0px 50% 0px',
        threshold: 0,
      });

      this.items.forEach(({ el }) => this.observer.observe(el));
      this.masks.forEach(({ el }) => this.observer.observe(el));

      this.maybeStartLoop();
    },

    disable() {
      this.enabled = false;
      if (this.observer) this.observer.disconnect();
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.activeItems.clear();
      this.activeMasks.clear();

      this.items.forEach((data) => {
        this.clearDrift(data);
        data.el.style.willChange = '';
        data.el.style.transition = '';
        data.captionLeft.forEach(node => {
          node.style.willChange = '';
        });
        data.captionRight.forEach(node => {
          node.style.willChange = '';
        });
        data.primed = false;
        data.currentX = 0;
        data.targetX = 0;
      });
      this.masks.forEach((data) => {
        data.el.style.clipPath = '';
        data.el.style.willChange = '';
        data.el.style.transition = '';
        data.captionLeft.forEach(node => {
          node.style.transform = '';
          node.style.willChange = '';
          node.style.transition = '';
          node.style.animation = '';
          node.style.opacity = '';
          node.style.clipPath = '';
        });
        data.primed = false;
      });
    },

    /**
     * Loop continuo mientras haya items o máscaras activos.
     */
    maybeStartLoop() {
      if (this.rafId) return;
      if (this.activeItems.size === 0 && this.activeMasks.size === 0) return;

      const tick = () => {
        this.update();
        const hasActive = this.activeItems.size > 0 || this.activeMasks.size > 0;
        // Mantenemos el loop vivo mientras haya items activos O
        // mientras algún current todavía no haya alcanzado su target
        // (la "cola" de inercia después de frenar el scroll).
        if ((hasActive || this.hasUnsettled()) && this.enabled) {
          this.rafId = requestAnimationFrame(tick);
        } else {
          this.rafId = null;
        }
      };
      this.rafId = requestAnimationFrame(tick);
    },

    /**
     * ¿Hay algún current que todavía no haya asentado en su target?
     * Sirve para que el RAF no se apague antes de que termine la
     * inercia residual cuando el item sale del rango observable.
     */
    hasUnsettled() {
      const eps = this.SETTLE_EPSILON;
      for (const d of this.items) {
        if (Math.abs(d.targetX - d.currentX) > eps) return true;
      }
      for (const d of this.masks) {
        if (Math.abs(d.targetCut - d.currentCut) > eps) return true;
      }
      return false;
    },

    getDriftProgress(data, rect, vh) {
      if (data.phase === 'enter') {
        const start = vh * 1;
        const end = vh * 0.45;
        let p = (start - rect.top) / (start - end);
        p = Math.max(0, Math.min(1, p));
        return p;
      }

      const start = vh * 0.4;
      const end = vh * 0.1;
      let p = (start - rect.bottom) / (start - end);
      p = Math.max(0, Math.min(1, p));
      return p;
    },

    applyDrift(data, x) {
      const formattedX = x.toFixed(2);
      const t = `translate3d(${formattedX}px, 0, 0)`;

      if (data.useTranslateProperty) {
        data.el.style.translate = `${formattedX}px 0`;
      } else {
        data.el.style.transform = t;
      }

      data.captionLeft.forEach(node => { node.style.transform = t; });
      data.captionRight.forEach(node => { node.style.transform = t; });
    },

    clearDrift(data) {
      if (data.useTranslateProperty) {
        data.el.style.translate = '';
      } else {
        data.el.style.transform = '';
      }

      data.captionLeft.forEach(node => { node.style.transform = ''; });
      data.captionRight.forEach(node => { node.style.transform = ''; });
    },

    update() {
      const vh = window.innerHeight;

      // ===== DRIFT =====
      this.items.forEach((data) => {
        const { el, gate, amount, captionLeft, captionRight } = data;
        if (!this.activeItems.has(el)) return;
        if (!gate.classList.contains('is-visible')) return;

        if (!data.primed) {
          if (data.waitsForEntryTransition && !data.entryTransitionDone) {
            if (!data.entryTransitionListenerAttached) {
              data.entryTransitionListenerAttached = true;
              const onEntryTransitionEnd = (ev) => {
                if (ev.propertyName !== 'transform') return;
                data.entryTransitionDone = true;
                el.removeEventListener('transitionend', onEntryTransitionEnd);
              };
              el.addEventListener('transitionend', onEntryTransitionEnd);
            }
            return;
          }

          el.style.transition = 'none';

          // Si este target arrastra captionLeft o captionRight (caso
          // par-de-imágenes), esperamos a que termine la animation
          // projects-caption-drop antes de tomar control de los spans,
          // así no pisamos la animación de entrada.
          const captionNodes = [...captionLeft, ...captionRight];
          if (captionNodes.length) {
            if (!data.captionDropDone) {
              if (!data.captionDropListenerAttached) {
                data.captionDropListenerAttached = true;
                const firstNode = captionNodes[0];
                const onEnd = (ev) => {
                  if (ev.animationName !== 'projects-caption-drop') return;
                  data.captionDropDone = true;
                  firstNode.removeEventListener('animationend', onEnd);
                };
                firstNode.addEventListener('animationend', onEnd);
              }
              return;
            }
            // Una vez que la animation terminó, liberamos los spans
            // (matamos animation, replicamos opacity y clip-path
            // del último keyframe como inline styles).
            captionNodes.forEach(node => {
              node.style.transition = 'none';
              node.style.animation = 'none';
              node.style.opacity = '1';
              node.style.clipPath = 'inset(0 0 0 0)';
            });
          }

          void el.offsetHeight;
          // Inicializamos current = target para que al primar no haya
          // un "viaje" desde 0 hasta el valor real (sería visible si el
          // item ya entró al rango con scroll avanzado).
          {
            const rect0 = el.getBoundingClientRect();
            const p0 = this.getDriftProgress(data, rect0, vh);
            data.targetX = amount * p0;
            data.currentX = data.targetX;
          }
          data.primed = true;
          return;
        }

        const rect = el.getBoundingClientRect();
        const p = this.getDriftProgress(data, rect, vh);

        // Target: lo que el scroll "pide" en este frame.
        data.targetX = amount * p;
        // Current: persigue al target con lerp → sensación de inercia.
        data.currentX += (data.targetX - data.currentX) * this.SMOOTHING;

        this.applyDrift(data, data.currentX);
      });

      // ===== MÁSCARA =====
      // Sub-ventana de scroll consecutiva al drift (que arranca al 40% del vh).
      // Para evitar que el progreso arranque > 0 en la carga inicial
      // (problema que ocurre cuando el bottom del item ya está dentro
      // de un rango fijo de viewport), el "start" del progreso se
      // calcula a partir del bottom REAL del item al momento del priming.
      // Así, sin importar el tamaño de viewport, en la carga el progreso
      // siempre es 0.
      this.masks.forEach((data) => {
        const { el, gate, captionLeft, percent } = data;
        if (!this.activeMasks.has(el)) return;
        if (!gate.classList.contains('is-visible')) return;

        if (!data.primed) {
          el.style.transition = 'none';

          // Esperamos a que termine la animation projects-caption-drop
          // (la que hace el "descenso bajo máscara invisible" del name).
          // Recién cuando termina, la matamos y replicamos su estado
          // final como inline styles, así nuestro transform puede operar
          // sin pisar la animación de entrada.
          // Si captionDropDone ya está marcado, primamos enseguida.
          if (!data.captionDropDone) {
            // Suscribirse una sola vez al animationend del primer span
            if (!data.captionDropListenerAttached && captionLeft.length) {
              data.captionDropListenerAttached = true;
              const firstNode = captionLeft[0];
              const onEnd = (ev) => {
                if (ev.animationName !== 'projects-caption-drop') return;
                data.captionDropDone = true;
                firstNode.removeEventListener('animationend', onEnd);
              };
              firstNode.addEventListener('animationend', onEnd);
            }
            // Todavía no podemos primar: no tocar el span, dejar que la
            // animation corra normal.
            return;
          }

          captionLeft.forEach(node => {
            node.style.transition = 'none';
            node.style.animation = 'none';
            node.style.opacity = '1';
            node.style.clipPath = 'inset(0 0 0 0)';
          });
          data.initialBottom = el.getBoundingClientRect().bottom;
          void el.offsetHeight;
          // Inicializamos current = target (igual que en drift) para
          // evitar saltos al primar con scroll ya avanzado.
          {
            const start0 = data.initialBottom;
            const end0 = vh * 0.1;
            const denom0 = start0 - end0;
            const bottom0 = el.getBoundingClientRect().bottom;
            let p0 = denom0 > 0 ? (start0 - bottom0) / denom0 : 0;
            p0 = Math.max(0, Math.min(1, p0));
            data.targetCut = percent * p0;
            data.currentCut = data.targetCut;
          }
          data.primed = true;
          return;
        }

        const rect = el.getBoundingClientRect();
        const bottom = rect.bottom;

        // Rango: arranca en el bottom inicial (progreso = 0) y termina
        // aproximadamente donde termina el drift (10% del viewport).
        // Esto hace que el barrido se reparta sobre todo el recorrido
        // del item por la pantalla, sintiéndose lento y suave, mientras
        // el drift hace lo suyo en su propio sub-rango (40% → 10%).
        const start = data.initialBottom;
        const end = vh * 0.1;
        // Si el item arrancó debajo del end (caso poco probable pero
        // posible en viewports muy chicos), evitamos división rara.
        const denom = start - end;
        let p = denom > 0 ? (start - bottom) / denom : 0;
        p = Math.max(0, Math.min(1, p));

        // % recortado desde la izquierda (0 → percent).
        // El "round" preserva el border-radius del wrapper para que
        // el borde izquierdo recortado mantenga las esquinas redondeadas
        // originales de la imagen.
        // Aplicamos lerp para que el barrido tenga la misma inercia
        // que el drift y se mantenga sincronizado.
        data.targetCut = percent * p;
        data.currentCut += (data.targetCut - data.currentCut) * this.SMOOTHING;
        const cut = data.currentCut;
        const radius = getComputedStyle(el).borderRadius || '0';
        el.style.clipPath = `inset(0 0 0 ${cut.toFixed(3)}% round ${radius})`;

        // Solo los textos de la columna izquierda del caption (name + location)
        // se trasladan. Category, al estar en la columna derecha del grid,
        // se queda fijo y nunca sobrepasa el borde de la imagen.
        if (captionLeft.length) {
          const px = rect.width * (cut / 100);
          const t = `translate3d(${px.toFixed(2)}px, 0, 0)`;
          captionLeft.forEach(node => { node.style.transform = t; });

        }
      });
    },

    /**
     * Cuando un item sale del rango observable, lo dejamos en una
     * posición consistente: si salió por arriba, en el drift máximo;
     * si salió por abajo (todavía no entró), en 0.
     */
    resetItemAtBoundary(el) {
      const rect = el.getBoundingClientRect();

      // Drift
      const driftData = this.items.find(i => i.el === el);
      if (driftData) {
        if (rect.bottom <= 0) {
          this.applyDrift(driftData, driftData.amount);
          // Sincronizar lerp para que al re-entrar no haya salto.
          driftData.currentX = driftData.amount;
          driftData.targetX = driftData.amount;
        } else if (rect.top >= window.innerHeight) {
          this.clearDrift(driftData);
          driftData.currentX = 0;
          driftData.targetX = 0;
        }
      }

      // Máscara
      const maskData = this.masks.find(m => m.el === el);
      if (maskData) {
        if (rect.bottom <= 0) {
          // Salió por arriba: máscara en su valor final
          const radius = getComputedStyle(el).borderRadius || '0';
          el.style.clipPath = `inset(0 0 0 ${maskData.percent}% round ${radius})`;
          if (maskData.captionLeft.length) {
            const px = rect.width * (maskData.percent / 100);
            const t = `translate3d(${px.toFixed(2)}px, 0, 0)`;
            maskData.captionLeft.forEach(node => { node.style.transform = t; });
          }
          maskData.currentCut = maskData.percent;
          maskData.targetCut = maskData.percent;
        } else if (rect.top >= window.innerHeight) {
          // Está abajo: máscara inicial
          el.style.clipPath = '';
          maskData.captionLeft.forEach(node => { node.style.transform = ''; });
          maskData.currentCut = 0;
          maskData.targetCut = 0;
        }
      }
    },
  },

  /* ============================================================
     PROJECT FACTS PARALLAX
     Movimiento parallax sutil del bloque .project-overview__facts:
     baja a un rate mucho menor que el scroll para dar profundidad.
     ============================================================ */
  projectFactsParallax: {
    RATE: 0.15,           // 15% de la velocidad del scroll
    MAX_OFFSET: 200,      // px máximos que puede desplazarse
    el: null,
    section: null,
    ticking: false,
    mobileQuery: null,

    init() {
      this.el = document.querySelector('.project-overview__facts');
      if (!this.el) return;
      this.section = this.el.closest('.project-overview') || this.el.parentElement;
      this.mobileQuery = window.matchMedia('(max-width: 1023.98px)');

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;

      this.update();
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      window.addEventListener('resize', () => this.onScroll(), { passive: true });
    },

    onScroll() {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
    },

    update() {
      if (!this.el || !this.section) return;
      if (this.mobileQuery && this.mobileQuery.matches) {
        this.el.style.transform = '';
        return;
      }

      const rect = this.section.getBoundingClientRect();
      // Empieza el efecto cuando la sección entra en viewport
      const entered = window.innerHeight - rect.top;
      if (entered <= 0) {
        this.el.style.transform = 'translate3d(0, 0, 0)';
        return;
      }
      const offset = Math.min(entered * this.RATE, this.MAX_OFFSET);
      this.el.style.transform = `translate3d(0, ${offset}px, 0)`;
    },
  },

  /* ============================================================
     PROJECT FRAME COPY PARALLAX
     Misma idea que projectFactsParallax pero más sutil:
     menor rate y menor desplazamiento maximo. Aplica al bloque
     completo de copy (todos los textos).
     ============================================================ */
  projectFrameCopyParallax: {
    RATE: 0.09,           // sutil pero un poco mas notorio
    MAX_OFFSET: 130,      // tope un poco mas alto
    START_OFFSET: 80,     // adelanta el inicio del movimiento ~80px
    el: null,
    section: null,
    ticking: false,
    mobileQuery: null,

    init() {
      this.el = document.querySelector('.project-frame__copy');
      if (!this.el) return;
      this.section = this.el.closest('.project-frame') || this.el.parentElement;
      this.mobileQuery = window.matchMedia('(max-width: 1023.98px)');

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;

      this.update();
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      window.addEventListener('resize', () => this.onScroll(), { passive: true });
    },

    onScroll() {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
    },

    update() {
      if (!this.el || !this.section) return;
      if (this.mobileQuery && this.mobileQuery.matches) {
        this.el.style.transform = '';
        return;
      }

      const rect = this.section.getBoundingClientRect();
      const entered = window.innerHeight - rect.top;
      if (entered <= 0) {
        this.el.style.transform = `translate3d(0, ${-this.START_OFFSET}px, 0)`;
        return;
      }
      const offset = Math.min(entered * this.RATE, this.MAX_OFFSET) - this.START_OFFSET;
      this.el.style.transform = `translate3d(0, ${offset}px, 0)`;
    },
  },

  /* ============================================================
     PROJECT PALETTE TEXT REVEAL
     Equivalente a projectPhraseTextReveal pero para .project-palette__text.
     Envuelve cada línea visual del texto en .project-palette__text-line +
     .project-palette__text-line-inner, y togglea .is-revealed cuando el
     elemento cruza el TRIGGER_RATIO del viewport. Es estandar-b.
     Opt-out por página: <section class="project-palette" data-palette-reveal="off">.
     ============================================================ */
  projectPaletteTextReveal: {
    TRIGGER_RATIO: 0.85,
    MOBILE_TRIGGER_RATIO: 0.85,

    init() {
      const text = document.querySelector('.project-palette__text');
      if (!text) return;

      const section = text.closest('.project-palette');
      if (section && section.dataset.paletteReveal === 'off') return;

      const rebuildLines = () => {
        Timbo.splitTextIntoVisualLines(text, {
          lineClass: 'project-palette__text-line',
          innerClass: 'project-palette__text-line-inner',
        });
      };

      const update = () => {
        const rect = text.getBoundingClientRect();
        const isMobile = window.matchMedia('(max-width: 1023.98px)').matches;
        const ratio = isMobile ? this.MOBILE_TRIGGER_RATIO : this.TRIGGER_RATIO;
        const trigger = window.innerHeight * ratio;

        if (rect.top <= trigger) {
          text.classList.add('is-revealed');
        } else {
          text.classList.remove('is-revealed');
        }
      };

      let resizeRaf = 0;
      const refresh = () => {
        rebuildLines();
        update();
      };

      const onResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(refresh);
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('load', refresh, { once: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refresh).catch(() => {});
      }

      refresh();
    },
  },

  /* ============================================================
     PROJECT PALETTE TEXT PARALLAX
     Mismo efecto que projectFrameCopyParallax. Aplica un translateY
     al wrapper .project-palette__text.
     ============================================================ */
  projectPaletteTextParallax: {
    RATE: 0.09,
    MAX_OFFSET: 130,
    START_OFFSET: 80,
    items: [],
    ticking: false,
    mobileQuery: null,

    init() {
      // DESACTIVADO: el parallax-en-Y de los .project-palette__text se anuló
      // (desktop y mobile). Limpiamos cualquier transform residual por si
      // alguna ejecución previa lo dejó seteado, y no registramos listeners.
      document.querySelectorAll('.project-palette__text').forEach(el => {
        el.style.transform = '';
      });
      return;
    },

    onScroll() {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
    },

    update() {
      this.items.forEach(({ el, section }) => {
        if (!el || !section) return;
        if (this.mobileQuery && this.mobileQuery.matches) {
          el.style.transform = '';
          return;
        }
        const rect = section.getBoundingClientRect();
        const entered = window.innerHeight - rect.top;
        if (entered <= 0) {
          el.style.transform = `translate3d(0, ${-this.START_OFFSET}px, 0)`;
          return;
        }
        const offset = Math.min(entered * this.RATE, this.MAX_OFFSET) - this.START_OFFSET;
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    },
  },

  /* ============================================================
     NATURE DIALOGUE TEXT REVEAL
     Clon de projectPaletteTextReveal para .nature-dialogue__text (home).
     Envuelve cada línea visual del texto en .nature-dialogue__text-line +
     .nature-dialogue__text-line-inner, y togglea .is-revealed cuando la
     sección .nature-dialogue está visible al VISIBLE_RATIO (90% por
     default — falta entrar sólo el 10% inferior). Es estandar-b.
     ============================================================ */
  natureDialogueTextReveal: {
    /* Ratio de recorrido vertical del borde inferior del viewport sobre
       la altura total de la section. 0.9 = el bottom del viewport ya
       recorrió el 90% de la section (le falta el último 10% para salir). */
    PROGRESS_RATIO: 0.9,

    init() {
      const text = document.querySelector('.nature-dialogue__text');
      if (!text) return;

      const section = text.closest('.nature-dialogue');
      if (!section) return;

      const rebuildLines = () => {
        Timbo.splitTextIntoVisualLines(text, {
          lineClass: 'nature-dialogue__text-line',
          innerClass: 'nature-dialogue__text-line-inner',
        });
      };

      const update = () => {
        const rect = section.getBoundingClientRect();
        const sectionHeight = rect.height;
        if (sectionHeight <= 0) return;
        /* Distancia desde el top de la section al bottom del viewport.
           Va de 0 (bottom del viewport tocando el top de la section)
           a sectionHeight (bottom del viewport tocando el bottom de la
           section). */
        const progress = (window.innerHeight - rect.top) / sectionHeight;

        if (progress >= this.PROGRESS_RATIO) {
          text.classList.add('is-revealed');
        } else {
          text.classList.remove('is-revealed');
        }
      };

      let resizeRaf = 0;
      const refresh = () => {
        rebuildLines();
        update();
      };

      const onResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(refresh);
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('load', refresh, { once: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refresh).catch(() => {});
      }

      refresh();
    },
  },

  /* ============================================================
     PROJECT PHRASE TEXT PARALLAX
     Clon de projectPaletteTextParallax para .project-phrase__text
     ============================================================ */
  projectPhraseTextParallax: {
    RATE: 0.09,
    MAX_OFFSET: 130,
    START_OFFSET: 80,
    items: [],
    ticking: false,
    mobileQuery: null,

    init() {
      // DESACTIVADO: el parallax-en-Y de los .project-phrase__text se anuló
      // (desktop y mobile). Limpiamos cualquier transform residual por si
      // alguna ejecución previa lo dejó seteado, y no registramos listeners.
      document.querySelectorAll('.project-phrase__text').forEach(el => {
        el.style.transform = '';
      });
      return;
    },

    onScroll() {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
    },

    update() {
      this.items.forEach(({ el, section }) => {
        if (!el || !section) return;
        if (this.mobileQuery && this.mobileQuery.matches) {
          el.style.transform = '';
          return;
        }
        const rect = section.getBoundingClientRect();
        const entered = window.innerHeight - rect.top;
        if (entered <= 0) {
          el.style.transform = `translate3d(0, ${-this.START_OFFSET}px, 0)`;
          return;
        }
        const offset = Math.min(entered * this.RATE, this.MAX_OFFSET) - this.START_OFFSET;
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    },
  },


  /* ============================================================
     GALLERY COVER CYCLE
     ------------------------------------------------------------
     Para cada item con [data-cover-cycle], al hacer hover esperamos
     el mismo delay que la hover-card (--gallery-hover-card-delay,
     1000ms) y a partir de ahí avanzamos cada 1000ms entre las
     portadas: 01 → 02 → 03 → 04 → 01 → 02 ... La primera transición
     coincide con la aparición de la hover-card.

     Al salir del hover, limpiamos timers y volvemos a la portada base.
     ============================================================ */
  galleryCoverCycle: {
    items: [],
    intervalMs: 1500,
    initialDelayMs: 2000,

    parseTimeToMs(value) {
      const raw = String(value || '').trim();
      if (!raw) return 0;
      if (raw.endsWith('ms')) {
        const v = parseFloat(raw);
        return Number.isFinite(v) ? v : 0;
      }
      if (raw.endsWith('s')) {
        const v = parseFloat(raw);
        return Number.isFinite(v) ? v * 1000 : 0;
      }
      const v = parseFloat(raw);
      return Number.isFinite(v) ? v : 0;
    },

    resolveDelay() {
      // Leemos el mismo --gallery-hover-card-delay para mantenerlos sincronizados.
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const fromVar = this.parseTimeToMs(styles.getPropertyValue('--gallery-hover-card-delay'));
      return fromVar > 0 ? fromVar : 1000;
    },

    setActiveCover(entry, index) {
      entry.covers.forEach((img, i) => {
        img.classList.toggle('is-active', i === index);
      });
      entry.currentIndex = index;
    },

    startCycle(entry) {
      this.stopCycle(entry);

      // Primera transición: a los initialDelayMs cambiamos a la portada 02 (índice 1).
      entry.startTimer = window.setTimeout(() => {
        entry.startTimer = 0;
        const next = (entry.currentIndex + 1) % entry.covers.length;
        this.setActiveCover(entry, next);

        // Después, cada intervalMs avanzamos una más.
        entry.intervalTimer = window.setInterval(() => {
          const n = (entry.currentIndex + 1) % entry.covers.length;
          this.setActiveCover(entry, n);
        }, this.intervalMs);
      }, this.initialDelayMs);
    },

    stopCycle(entry) {
      if (entry.startTimer) {
        window.clearTimeout(entry.startTimer);
        entry.startTimer = 0;
      }
      if (entry.intervalTimer) {
        window.clearInterval(entry.intervalTimer);
        entry.intervalTimer = 0;
      }
    },

    resetToBase(entry) {
      this.stopCycle(entry);
      this.setActiveCover(entry, 0);
    },

    init() {
      // Cada elemento [data-cover-cycle] es el que cicla (por convención,
      // un .projects-gallery__media que contiene un .projects-gallery__cover-stack).
      // El trigger del hover es el propio elemento, salvo que defina
      // data-cover-cycle-trigger="<selector>" que apunte a un ancestro
      // común (útil cuando el ciclo arranca al pasar por OTRA zona, por
      // ejemplo el par A+B de Praderas Cabin).
      const targets = Array.from(document.querySelectorAll('[data-cover-cycle]'))
        .filter((target) => !target.closest('[data-cover-cycle-pair]'));
      if (!targets.length) return;

      // Nota: initialDelayMs e intervalMs viven como propiedades del módulo
      // (2000ms y 1500ms) y son independientes de --gallery-hover-card-delay.

      this.items = targets.map((target) => {
        const covers = Array.from(target.querySelectorAll('.projects-gallery__cover'));
        if (covers.length < 2) return null;

        // Resolvemos el trigger: si data-cover-cycle-trigger apunta a un
        // selector, buscamos el ancestro más cercano que matchee. Si no,
        // el trigger es el propio target.
        let trigger = target;
        const triggerSelector = target.getAttribute('data-cover-cycle-trigger');
        if (triggerSelector) {
          const ancestor = target.closest(triggerSelector);
          if (ancestor) trigger = ancestor;
        }

        const entry = {
          target,
          trigger,
          covers,
          currentIndex: 0,
          startTimer: 0,
          intervalTimer: 0,
        };

        // Aseguramos estado inicial coherente.
        this.setActiveCover(entry, 0);

        trigger.addEventListener('mouseenter', () => this.startCycle(entry));
        trigger.addEventListener('mouseleave', () => this.resetToBase(entry));

        // Soporte teclado: el ítem-padre <a> recibe focus en navegación
        // por teclado. Si encontramos un <a> ancestro, le colgamos focus/blur.
        const focusable = target.closest('a, button, [tabindex]');
        if (focusable) {
          focusable.addEventListener('focus', () => this.startCycle(entry));
          focusable.addEventListener('blur', () => this.resetToBase(entry));
        }

        return entry;
      }).filter(Boolean);
    },
  },

  /* ============================================================
     GALLERY COVER CYCLE PAIRS
     ------------------------------------------------------------
     Variante para pares de imágenes como Tobar Lodge:
     - si hovereamos la imagen A, el primer cambio ocurre en B
     - si hovereamos la imagen B, el primer cambio ocurre en A
     - durante ese hover, solo cicla la imagen opuesta
     ============================================================ */
  galleryCoverCyclePairs: {
    items: [],

    setActiveCover(entry, index) {
      Timbo.galleryCoverCycle.setActiveCover(entry, index);
    },

    advanceEntry(entry) {
      const next = (entry.currentIndex + 1) % entry.covers.length;
      this.setActiveCover(entry, next);
    },

    stopPair(pair) {
      if (pair.timerId) {
        window.clearTimeout(pair.timerId);
        pair.timerId = 0;
      }
      if (pair.intervalTimer) {
        window.clearInterval(pair.intervalTimer);
        pair.intervalTimer = 0;
      }
    },

    resetPair(pair) {
      this.stopPair(pair);
      pair.activeEntryIndex = null;
      pair.entries.forEach((entry) => this.setActiveCover(entry, 0));
    },

    startPair(pair, activeEntryIndex) {
      this.stopPair(pair);
      pair.activeEntryIndex = activeEntryIndex;

      pair.timerId = window.setTimeout(() => {
        pair.timerId = 0;
        const activeEntry = pair.entries[pair.activeEntryIndex];
        if (!activeEntry) return;

        this.advanceEntry(activeEntry);

        pair.intervalTimer = window.setInterval(() => {
          const currentEntry = pair.entries[pair.activeEntryIndex];
          if (!currentEntry) return;
          this.advanceEntry(currentEntry);
        }, Timbo.galleryCoverCycle.intervalMs);
      }, Timbo.galleryCoverCycle.initialDelayMs);
    },

    init() {
      const pairs = Array.from(document.querySelectorAll('[data-cover-cycle-pair]'));
      if (!pairs.length) return;

      this.items = pairs.map((pairTarget) => {
        const mediaTargets = Array.from(pairTarget.querySelectorAll('.projects-gallery__media[data-cover-cycle]'));
        if (mediaTargets.length < 2) return null;

        const entries = mediaTargets.map((target) => {
          const covers = Array.from(target.querySelectorAll('.projects-gallery__cover'));
          if (covers.length < 2) return null;

          const entry = {
            target,
            covers,
            currentIndex: 0,
          };

          this.setActiveCover(entry, 0);
          return entry;
        }).filter(Boolean);

        if (entries.length < 2) return null;

        const pair = {
          target: pairTarget,
          entries,
          activeEntryIndex: null,
          timerId: 0,
          intervalTimer: 0,
        };

        // Zoom manejado enteramente por JS para poder capturar el valor
        // exacto al salir y hacer zoom-out con transition sin salto.
        // Cada stack tiene: rafId (zoom-in loop), currentScale, zoomOutTimer.
        const stacks = pair.entries.map((e) =>
          e.target.querySelector('.projects-gallery__cover-stack')
        );

        const ZOOM_DURATION = 2000;   // ms para ir de 1 → 1.21
        const ZOOM_TARGET   = 1.21;
        const ZOOM_BASE     = 1;

        function startZoom(stack) {
          if (!stack) return;
          if (stack._zoomRafId) cancelAnimationFrame(stack._zoomRafId);
          if (stack._zoomOutTimer) clearTimeout(stack._zoomOutTimer);
          const startTime = performance.now();
          const startScale = stack._currentScale ?? ZOOM_BASE;
          // Proporción del recorrido ya recorrida (para arrancar desde donde estaba).
          const elapsed0 = ((startScale - ZOOM_BASE) / (ZOOM_TARGET - ZOOM_BASE)) * ZOOM_DURATION;

          function tick(now) {
            const t = Math.min((now - startTime + elapsed0) / ZOOM_DURATION, 1);
            const s = ZOOM_BASE + (ZOOM_TARGET - ZOOM_BASE) * t;
            stack._currentScale = s;
            stack.style.scale = s;
            if (t < 1) stack._zoomRafId = requestAnimationFrame(tick);
          }
          stack._zoomRafId = requestAnimationFrame(tick);
        }

        function stopZoom(stack) {
          if (!stack) return;
          if (stack._zoomRafId) {
            cancelAnimationFrame(stack._zoomRafId);
            stack._zoomRafId = null;
          }
          // Zoom-out: fijar el scale actual inline, agregar transition, ir a 1.
          const s = stack._currentScale ?? ZOOM_BASE;
          stack.style.transition = 'scale 1000ms cubic-bezier(0.22, 0.61, 0.36, 1), translate 1000ms cubic-bezier(0.22, 0.61, 0.36, 1)';
          stack.style.scale = s;
          void stack.offsetWidth; // reflow
          stack.style.scale = ZOOM_BASE;
          // Limpiar el inline de transition una vez que termina el zoom-out.
          stack._zoomOutTimer = setTimeout(() => {
            stack.style.transition = '';
            stack.style.scale = '';
            stack._currentScale = ZOOM_BASE;
          }, 1100);
        }

        entries.forEach((entry, index) => {
          entry.target.addEventListener('mouseenter', () => {
            const oppositeIndex = (index + 1) % pair.entries.length;
            this.startPair(pair, oppositeIndex);

            // Zoom-in en ambos stacks; translate solo en el hovereado.
            stacks.forEach((stack, i) => {
              if (!stack) return;
              startZoom(stack);
              if (i === index) {
                stack.classList.add('is-hovered-direct');
              }
            });
          });
        });

        pairTarget.addEventListener('mouseleave', () => {
          this.resetPair(pair);
          stacks.forEach((stack) => {
            if (!stack) return;
            stack.classList.remove('is-hovered-direct', 'is-partner-hovered');
            stopZoom(stack);
          });
        });

        const focusable = pairTarget.matches('a, button, [tabindex]')
          ? pairTarget
          : pairTarget.querySelector('a, button, [tabindex]');

        if (focusable) {
          focusable.addEventListener('focus', () => this.startPair(pair, 1 % pair.entries.length));
          focusable.addEventListener('blur', () => this.resetPair(pair));
        }

        return pair;
      }).filter(Boolean);
    },
  },

};


/* ---- Arrancar cuando el DOM esté listo ---- */
document.addEventListener('DOMContentLoaded', () => {
  Timbo.init();
});
