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

      // Re-renderizar componentes dinámicos que dependen del idioma
      Timbo.projectPage.render();
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
     * Resuelve una clave tipo "home.heroTagline" buscando en SITE_DATA.
     */
    resolve(key, lang) {
      const parts = key.split('.');
      if (parts.length < 2) return undefined;

      const section = parts[0];
      const field = parts[1];

      if (SITE_DATA[section] && SITE_DATA[section][lang]) {
        return SITE_DATA[section][lang][field];
      }
      return undefined;
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
    SCROLL_THRESHOLD: 900,  // ← Cambiá este número para ajustar cuándo aparece el fondo
    ABOUT_SCROLL_THRESHOLD: 300,
    SUST_SCROLL_THRESHOLD: 80,  // sustentabilidad: que aparezca casi de inmediato

    init() {
      const nav = document.querySelector('.main-nav');
      if (!nav) return;

      const isAboutPage = document.body.classList.contains('page--about-light')
        && Boolean(document.querySelector('.about-hero'));
      const isSustPage = Boolean(document.querySelector('.sust-hero'));
      let threshold = this.SCROLL_THRESHOLD;
      if (isAboutPage) threshold = this.ABOUT_SCROLL_THRESHOLD;
      else if (isSustPage) threshold = this.SUST_SCROLL_THRESHOLD;

      window.addEventListener('scroll', () => {
        if (window.scrollY >= threshold) {
          nav.classList.add('main-nav--scrolled');
        } else {
          nav.classList.remove('main-nav--scrolled');
        }
      }, { passive: true });
    },
  },


  /* ============================================================
     NAV HIDE ON SCROLL (directional)
     - Al scrollear hacia abajo pasado HIDE_AFTER_PX, esconde el nav.
     - Al scrollear hacia arriba más de UP_THRESHOLD_PX, lo muestra.
     - En el tope absoluto (scrollY === 0) siempre visible.
     ============================================================ */
  navHide: {
    HIDE_AFTER_PX: 600,    // desde qué scroll puede empezar a esconderse
    UP_THRESHOLD_PX: 8,    // cuánto hay que subir para re-mostrarlo

    init() {
      const nav = document.querySelector('.main-nav');
      if (!nav) return;

      let lastY = window.scrollY;
      let accumulatedUp = 0;
      let ticking = false;

      const update = () => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        // En el tope: siempre visible y se resetea el acumulador.
        if (currentY <= 0) {
          nav.classList.remove('main-nav--hidden');
          accumulatedUp = 0;
        } else if (delta > 0) {
          // Scroll hacia abajo: esconder una vez pasado el umbral mínimo.
          accumulatedUp = 0;
          if (currentY > this.HIDE_AFTER_PX) {
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
     PROJECT PAGE (detalle)
     Renderiza contenido de cada página de proyecto por slug
     ============================================================ */
  projectPage: {
    render() {
      const page = document.querySelector('[data-project-slug]');
      if (!page) return;

      const slug = page.getAttribute('data-project-slug');
      if (!slug) return;

      const lang = Timbo.state.lang;
      const pageData = SITE_DATA.projectPages?.[lang];
      const project = pageData?.projects?.[slug];
      if (!pageData || !project) return;

      const setText = (id, value) => {
        if (value === undefined || value === null) return;
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
      };

      setText('project-title', project.name);
      setText('project-location', project.location);
      setText('project-meta-location', project.location);
      setText('project-summary', project.summary);
      setText('project-type', project.type);
      setText('project-status', project.status);
      setText('project-description-1', project.description1);
      setText('project-description-2', project.description2);

      setText('project-meta-location-label', pageData.locationLabel);
      setText('project-meta-type-label', pageData.typeLabel);
      setText('project-meta-status-label', pageData.statusLabel);
      setText('project-back-link', pageData.backToProjects);

      const depth = window.location.pathname.includes('/proyectos/') ? '../' : '';



      const backLink = document.getElementById('project-back-link');
      if (backLink) {
        backLink.href = `${depth}proyectos.html?lang=${lang}`;
      }

      document.title = `Timbó — ${project.name}`;

      // Hero cover entry animation
      const coverImg = document.getElementById('project-cover');
      if (coverImg) {
        const reveal = () => coverImg.classList.add('is-loaded');
        if (coverImg.complete) {
          requestAnimationFrame(reveal);
        } else {
          coverImg.addEventListener('load', reveal, { once: true });
        }
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
          <img src="${depth}assets/images/logo/timbo-gris.svg" alt="Timbó" class="floating-logo__img floating-logo__img--gray">
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
     Observa .anim-fade-up y activa .is-visible al entrar al viewport.
     ============================================================ */
  scrollReveal: {
    init() {
      const animatedElements = document.querySelectorAll('.anim-fade-up, .anim-wind-in, .anim-fade-in, .anim-zoom-in, .anim-title-drop, .intro__photo--slide-x');
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
      if (!this.titleEl) return;
      const clampedProgress = this.clamp(progress);
      const translateY = this.TITLE_START_Y + ((this.FINAL_OFFSET_Y - this.TITLE_START_Y) * clampedProgress);
      this.titleEl.style.opacity = clampedProgress.toFixed(3);
      this.titleEl.style.transform = `translateY(${translateY.toFixed(1)}px)`;
    },

    applyText(progress) {
      if (!this.textEl) return;
      const clampedProgress = this.clamp(progress);
      const translateY = this.TEXT_START_Y + ((this.FINAL_OFFSET_Y - this.TEXT_START_Y) * clampedProgress);
      const revealEdge = (1 - clampedProgress) * 100;
      const fadeStart = Math.max(0, revealEdge - this.TEXT_MASK_FADE_PCT);
      const maskImage = clampedProgress <= 0
        ? 'linear-gradient(to bottom, transparent 0%, transparent 100%)'
        : `linear-gradient(to bottom, transparent 0%, transparent ${fadeStart.toFixed(3)}%, rgba(0, 0, 0, 1) ${revealEdge.toFixed(3)}%, rgba(0, 0, 0, 1) 100%)`;
      this.textEl.style.opacity = clampedProgress.toFixed(3);
      this.textEl.style.transform = `translateY(${translateY.toFixed(1)}px)`;
      this.textEl.style.maskImage = maskImage;
      this.textEl.style.webkitMaskImage = maskImage;
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
      this.sectionEl = document.getElementById('sust-breathe');
      this.titleEl = this.sectionEl?.querySelector('.sust-breathe__title');
      this.textEl = this.sectionEl?.querySelector('.sust-breathe__text');
      if (!this.sectionEl || !this.titleEl || !this.textEl) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.applyTitle(1);
        this.applyText(1);
        return;
      }

      this.update();
      window.addEventListener('scroll', () => this.requestUpdate(), { passive: true });
      window.addEventListener('resize', () => this.requestUpdate());
    },
  },

  sustStrategiesOrbit: {
    api: null,

    init() {
      const module = this;
      module.api = {
        focusKey() {},
        setDetailOpen() {},
        clearReferenceSelection() {},
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
        detailOpen: false,
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
        if (!state.detailOpen || !state.trackReferenceSelection || typeof state.onReferenceChange !== 'function') return;

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

      module.api = {
        focusKey(key) {
          const orbit = labelOrbitMap.get(key);
          if (!orbit) return;

          const baseTargetAngle = -(orbit.baseAngle * 180) / Math.PI;
          const shortestDelta = normalizeAngleDeg(baseTargetAngle - state.currentAngle);

          state.detailOpen = true;
          state.trackReferenceSelection = false;
          state.lastReferenceKey = key;
          state.motionEase = autoFocusEase;
          state.targetAngle = state.currentAngle + shortestDelta;
          queueRender();
        },

        setDetailOpen(isOpen) {
          state.detailOpen = isOpen;

          if (!isOpen) {
            state.trackReferenceSelection = false;
            state.lastReferenceKey = '';
          }
        },

        clearReferenceSelection() {
          state.trackReferenceSelection = false;
          state.lastReferenceKey = '';
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

        if (state.detailOpen) {
          state.trackReferenceSelection = true;
        }

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
      const closeButton = detail?.querySelector('.sust-strategies__detail-close');
      const detailIcon = detail?.querySelector('.sust-strategies__detail-icon');
      const detailTitle = detail?.querySelector('.sust-strategies__detail-title');
      const detailText = detail?.querySelector('.sust-strategies__detail-text');
      const labelItems = section
        ? Array.from(section.querySelectorAll('.sust-strategies__orbit-label-item[data-strategy]'))
        : [];
      const orbitApi = Timbo.sustStrategiesOrbit.api;
      const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

      if (!section || !detail || !detailStack || !closeButton || !detailIcon || !detailTitle || !detailText || !labelItems.length) return;

      const strategies = {
        ventilacion: {
          title: 'VENTILACIÓN NATURAL Y NOCTURNA',
          description: 'Renueva el aire interior y libera el calor acumulado durante el día para refrescar los ambientes de forma pasiva, especialmente cuando baja la temperatura exterior.',
          icon: 'assets/images/sustainability/sust-strategy/iconos-negros/iconos-negros-mios_47.svg',
        },
        orientacion: {
          title: 'ORIENTACIÓN CORRECTA',
          description: 'Ubica cada ambiente según el recorrido solar y los vientos dominantes para captar energía útil, proteger las zonas sensibles y mejorar el confort durante todo el año.',
          icon: 'assets/images/sustainability/sust-strategy/iconos-negros/iconos-negros-mios_48.svg',
        },
        transmitancia: {
          title: 'TRANSMITANCIA TÉRMICA DE LA ENVOLVENTE',
          description: 'Controla cuánto calor entra o sale a través de muros, techos y aberturas, ajustando la envolvente para reducir pérdidas energéticas y estabilizar la temperatura interior.',
          icon: 'assets/images/sustainability/sust-strategy/iconos-negros/iconos-negros-mios_49.svg',
        },
        masa: {
          title: 'MASA TÉRMICA',
          description: 'Aprovecha materiales con inercia térmica para guardar calor o fresco y liberarlo de forma gradual, ayudando a suavizar los cambios bruscos entre día y noche.',
          icon: 'assets/images/sustainability/sust-strategy/iconos-negros/iconos-negros-mios_50.svg',
        },
        proporcion: {
          title: 'PROPORCIÓN VIDRIADA',
          description: 'Equilibra luz natural, vistas y desempeño térmico definiendo cuánto vidrio conviene usar en cada orientación, evitando excesos que comprometan el confort interior.',
          icon: 'assets/images/sustainability/sust-strategy/iconos-negros/iconos-negros-mios_51.svg',
        },
        albedo: {
          title: 'ALBEDO',
          description: 'Usa superficies más reflectantes para bajar la absorción térmica de cubiertas y envolventes, evitando sobrecalentamiento y mejorando el comportamiento del conjunto.',
          icon: 'assets/images/sustainability/sust-strategy/iconos-negros/iconos-negros-mios_52.svg',
        },
        proteccion: {
          title: 'PROTECCIÓN SOLAR',
          description: 'Filtra el sol directo con aleros, parasoles o vegetación para mejorar el confort, reducir el deslumbramiento y disminuir la necesidad de enfriamiento artificial.',
          icon: 'assets/images/sustainability/sust-strategy/iconos-negros/iconos-negros-mios_53.svg',
        },
        cubiertas: {
          title: 'CUBIERTAS VERDES',
          description: 'Suman aislación, retención de agua y una relación más amable entre edificio y paisaje, aportando además inercia térmica y una presencia más integrada al entorno.',
          icon: 'assets/images/sustainability/sust-strategy/iconos-negros/iconos-negros-mios_47.svg',
        },
      };

      let activeKey = '';
      let swapToken = 0;

      const cancelDetailAnimations = () => {
        detailStack.getAnimations().forEach((animation) => animation.cancel());
      };

      const setDetailContent = (strategy) => {
        if (strategy) {
          detailIcon.src = strategy.icon;
          detailIcon.alt = `Icono de ${strategy.title}`;
          detailIcon.hidden = false;
        } else {
          detailIcon.removeAttribute('src');
          detailIcon.alt = '';
          detailIcon.hidden = true;
        }

        detailTitle.textContent = strategy ? strategy.title : '';
        detailText.textContent = strategy ? strategy.description : '';
      };

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
        swapToken += 1;
        const token = swapToken;
        const previousKey = activeKey;
        const strategy = key ? strategies[key] : null;
        activeKey = strategy ? key : '';
        const wasDetailOpen = section.classList.contains('is-detail-open');

        section.classList.toggle('is-detail-open', Boolean(strategy));
        detail.setAttribute('aria-hidden', strategy ? 'false' : 'true');
        orbitApi?.setDetailOpen(Boolean(strategy));

        labelItems.forEach((item) => {
          const isActive = item.dataset.strategy === activeKey;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });

        cancelDetailAnimations();

        const shouldAnimateSwap = Boolean(
          strategy
          && wasDetailOpen
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
        if (!strategies[key]) return;

        setActive(key);
        orbitApi?.focusKey(key);
      };

      labelItems.forEach((item) => {
        const key = item.dataset.strategy;
        const strategy = strategies[key];
        if (!strategy) return;

        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-controls', 'sust-strategies-detail');
        item.setAttribute('aria-expanded', 'false');
        item.setAttribute('aria-label', strategy.title);

        item.addEventListener('click', () => {
          if (activeKey === key) {
            setActive('');
            orbitApi?.clearReferenceSelection();
            return;
          }

          openStrategy(key);
        });

        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();

            if (activeKey === key) {
              setActive('');
              orbitApi?.clearReferenceSelection();
              return;
            }

            openStrategy(key);
          }

          if (event.key === 'Escape' && activeKey) {
            event.preventDefault();
            setActive('');
            orbitApi?.clearReferenceSelection();
          }
        });
      });

      orbitApi?.setReferenceChangeCallback((key) => {
        if (!key || !strategies[key]) return;
        setActive(key);
      });

      closeButton.addEventListener('click', () => {
        setActive('');
        orbitApi?.clearReferenceSelection();
      });
    },
  },

  sustPilaresOrbit: {
    api: null,

    init() {
      const module = this;
      module.api = {
        focusKey() {},
        setDetailOpen() {},
        clearReferenceSelection() {},
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
        detailOpen: false,
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
        if (!state.detailOpen || !state.trackReferenceSelection || typeof state.onReferenceChange !== 'function') return;

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

      module.api = {
        focusKey(key) {
          const orbit = labelOrbitMap.get(key);
          if (!orbit) return;

          const baseTargetAngle = -(orbit.baseAngle * 180) / Math.PI;
          const shortestDelta = normalizeAngleDeg(baseTargetAngle - state.currentAngle);

          state.detailOpen = true;
          state.trackReferenceSelection = false;
          state.lastReferenceKey = key;
          state.motionEase = autoFocusEase;
          state.targetAngle = state.currentAngle + shortestDelta;
          queueRender();
        },

        setDetailOpen(isOpen) {
          state.detailOpen = isOpen;

          if (!isOpen) {
            state.trackReferenceSelection = false;
            state.lastReferenceKey = '';
          }
        },

        clearReferenceSelection() {
          state.trackReferenceSelection = false;
          state.lastReferenceKey = '';
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

        if (state.detailOpen) {
          state.trackReferenceSelection = true;
        }

        queueRender();
      }, { passive: false });

      applyTransforms(0);
    },
  },

  sustPilaresDetail: {
    init() {
      const section = document.querySelector('.sust-pilares');
      const detail = section?.querySelector('.sust-pilares__detail');
      const detailStack = detail?.querySelector('.sust-pilares__detail-stack');
      const closeButton = detail?.querySelector('.sust-pilares__detail-close');
      const detailTitle = detail?.querySelector('.sust-pilares__detail-title');
      const detailText = detail?.querySelector('.sust-pilares__detail-text');
      const labelItems = section
        ? Array.from(section.querySelectorAll('.sust-pilares__orbit-label-item[data-pilar]'))
        : [];
      const orbitApi = Timbo.sustPilaresOrbit.api;
      const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

      if (!section || !detail || !detailStack || !closeButton || !detailTitle || !detailText || !labelItems.length) return;

      const pilares = {
        temperatura: {
          title: 'TEMPERATURA',
          description: 'Variable clave del confort interior. Diseñamos para mantenerla estable a lo largo del año, evitando picos extremos y reduciendo la dependencia de sistemas mecánicos.',
        },
        radiacion: {
          title: 'RADIACIÓN',
          description: 'Estudiamos la radiación solar incidente en cada orientación para captarla cuando aporta calor útil y bloquearla cuando se vuelve carga térmica indeseada.',
        },
        luz: {
          title: 'LUZ',
          description: 'Maximizamos la luz natural y controlamos el deslumbramiento. La iluminación de calidad mejora el bienestar y reduce el consumo energético del edificio.',
        },
        flujo_aire: {
          title: 'FLUJO DE AIRE',
          description: 'Aprovechamos los vientos dominantes y las diferencias de presión para generar ventilación cruzada y nocturna que enfríe los ambientes de forma pasiva.',
        },
        calidad_aire: {
          title: 'CALIDAD DE AIRE',
          description: 'Garantizamos aire interior saludable a través de renovación constante, materiales no contaminantes y una ventilación pensada desde el inicio del proyecto.',
        },
        emisiones: {
          title: 'EMISIONES DE CARBONO',
          description: 'Cuantificamos el carbono incorporado en materiales y el operacional a lo largo de la vida útil, eligiendo soluciones que minimicen la huella del edificio.',
        },
      };

      let activeKey = '';
      let swapToken = 0;

      const cancelDetailAnimations = () => {
        detailStack.getAnimations().forEach((animation) => animation.cancel());
      };

      const setDetailContent = (pilar) => {
        detailTitle.textContent = pilar ? pilar.title : '';
        detailText.textContent = pilar ? pilar.description : '';
      };

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
        swapToken += 1;
        const token = swapToken;
        const previousKey = activeKey;
        const pilar = key ? pilares[key] : null;
        activeKey = pilar ? key : '';
        const wasDetailOpen = section.classList.contains('is-detail-open');

        section.classList.toggle('is-detail-open', Boolean(pilar));
        detail.setAttribute('aria-hidden', pilar ? 'false' : 'true');
        orbitApi?.setDetailOpen(Boolean(pilar));

        labelItems.forEach((item) => {
          const isActive = item.dataset.pilar === activeKey;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });

        cancelDetailAnimations();

        const shouldAnimateSwap = Boolean(
          pilar
          && wasDetailOpen
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
        if (!pilares[key]) return;

        setActive(key);
        orbitApi?.focusKey(key);
      };

      labelItems.forEach((item) => {
        const key = item.dataset.pilar;
        const pilar = pilares[key];
        if (!pilar) return;

        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-controls', 'sust-pilares-detail');
        item.setAttribute('aria-expanded', 'false');
        item.setAttribute('aria-label', pilar.title);

        item.addEventListener('click', () => {
          if (activeKey === key) {
            setActive('');
            orbitApi?.clearReferenceSelection();
            return;
          }

          openPilar(key);
        });

        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();

            if (activeKey === key) {
              setActive('');
              orbitApi?.clearReferenceSelection();
              return;
            }

            openPilar(key);
          }

          if (event.key === 'Escape' && activeKey) {
            event.preventDefault();
            setActive('');
            orbitApi?.clearReferenceSelection();
          }
        });
      });

      orbitApi?.setReferenceChangeCallback((key) => {
        if (!key || !pilares[key]) return;
        setActive(key);
      });

      closeButton.addEventListener('click', () => {
        setActive('');
        orbitApi?.clearReferenceSelection();
      });
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
    taglineEl: null,
    logoEl: null,
    ticking: false,

    init() {
      this.taglineEl = document.querySelector('.hero__tagline');
      this.logoEl = document.querySelector('.hero__logo');
      if (!this.taglineEl && !this.logoEl) return;
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
      let taglineY;
      if (scrolledEffective <= this.TAGLINE_MASK_SCROLL) {
        taglineY = scrolledEffective * this.TAGLINE_RATE;
      } else {
        taglineY = taglineYAtMask + (scrolledEffective - this.TAGLINE_MASK_SCROLL) * this.TAGLINE_RATE_POST_MASK;
      }
      // Logo en tres fases:
      //   Fase 1 (0 -> scrollCap): desciende a LOGO_RATE hasta MAX_LOGO_Y.
      //   Fase 2 (scrollCap -> LOGO_RESUME_SCROLL): transición lenta a LOGO_SLOW_RATE.
      //   Fase 3 (LOGO_RESUME_SCROLL -> ...): desciende 1:1 a LOGO_RESUME_RATE.
      const logoY = this.getLogoY(scrolled);

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
    titleEl: null,
    ticking: false,

    update() {
      if (!this.titleEl) return;
      const scrolled = Math.max(0, window.scrollY);
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

    requestUpdate() {
      if (this.ticking) return;
      this.ticking = true;
      window.requestAnimationFrame(() => {
        this.ticking = false;
        this.update();
      });
    },

    init() {
      if (!document.body.classList.contains('page--haras-light')) return;
      this.titleEl = document.querySelector('.project-hero__title');
      if (!this.titleEl) return;

      this.update();
      window.addEventListener('scroll', () => this.requestUpdate(), { passive: true });
      window.addEventListener('resize', () => this.requestUpdate());
    },
  },


  /* ============================================================
     IMAGE EXPAND (scroll-linked)
     ============================================================ */
  imageExpand: {
    init() {
      const el = document.querySelector('.nature-dialogue__image');
      if (!el) return;

      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const update = () => {
        const rect = el.getBoundingClientRect();
        const start = window.innerHeight; // element top enters viewport
        const end = start - el.offsetHeight * 1.2; // necesita más scroll para llegar al 100%
        const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
        el.style.setProperty('--expand-progress', progress);
      };

      window.addEventListener('scroll', update, { passive: true });
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

      const update = () => {
        const rect = statement.getBoundingClientRect();
        const trigger = window.innerHeight / 2;

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

  sustClimateTitleReveal: {
    init() {
      const title = document.querySelector('.sust-climate__title');
      if (!title) return;

      const update = () => {
        const rect = title.getBoundingClientRect();
        const trigger = window.innerHeight / 2;

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
          { center: [-76.5, 24.2], zoom: 7.5, speed: 1.4 },
          { center: [-76.44, 24.17], zoom: 12, speed: 1.0 },
        ],
        marker: [-76.44, 24.17],
        label: { name: 'Exuma Lodge', detail: 'Staniel Cay, Exumas — Bahamas' },
        polygon: [
          [-76.43952, 24.17401], [-76.43917, 24.17413], [-76.43758, 24.17173],
          [-76.43709, 24.16841], [-76.43679, 24.16843], [-76.43633, 24.16778],
          [-76.43648, 24.16748], [-76.43468, 24.16589], [-76.43443, 24.16513],
          [-76.43371, 24.16479], [-76.43254, 24.16478], [-76.43251, 24.16529],
          [-76.43462, 24.16682], [-76.43579, 24.16965], [-76.43561, 24.17027],
          [-76.43516, 24.17026], [-76.43634, 24.17104], [-76.4376, 24.17428],
          [-76.43817, 24.17945], [-76.43719, 24.18043], [-76.43829, 24.18074],
          [-76.43884, 24.18177], [-76.43938, 24.18179], [-76.44047, 24.18262],
          [-76.44125, 24.1837], [-76.44208, 24.18265], [-76.44235, 24.18151],
          [-76.44325, 24.18124], [-76.44302, 24.18031], [-76.44146, 24.17939],
          [-76.44134, 24.17874], [-76.44173, 24.17765], [-76.4426, 24.17656],
          [-76.44369, 24.17605], [-76.44525, 24.17359], [-76.44547, 24.1724],
          [-76.44471, 24.17191], [-76.44449, 24.17137], [-76.44504, 24.16905],
          [-76.44453, 24.16823], [-76.44375, 24.16861], [-76.44302, 24.16814],
          [-76.44255, 24.16835], [-76.44049, 24.16775], [-76.44224, 24.1678],
          [-76.44319, 24.16696], [-76.44248, 24.1664], [-76.44198, 24.16491],
          [-76.44209, 24.1639], [-76.44246, 24.16357], [-76.44211, 24.16292],
          [-76.44241, 24.1619], [-76.44228, 24.16089], [-76.44091, 24.16004],
          [-76.44092, 24.15958], [-76.4402, 24.15913], [-76.4402, 24.15881],
          [-76.43957, 24.1591], [-76.43874, 24.15894], [-76.4392, 24.15878],
          [-76.43922, 24.1583], [-76.44027, 24.1578], [-76.43811, 24.15763],
          [-76.43727, 24.15804], [-76.43712, 24.15771], [-76.43602, 24.15774],
          [-76.43562, 24.15812], [-76.43544, 24.15784], [-76.43526, 24.15806],
          [-76.43574, 24.1584], [-76.43662, 24.15827], [-76.43686, 24.15973],
          [-76.43748, 24.16014], [-76.43821, 24.16138], [-76.43786, 24.163],
          [-76.43685, 24.16441], [-76.43615, 24.16455], [-76.43617, 24.16413],
          [-76.43542, 24.16367], [-76.43494, 24.16391], [-76.4354, 24.16445],
          [-76.43533, 24.16512], [-76.43581, 24.16534], [-76.43582, 24.16592],
          [-76.43633, 24.16612], [-76.43635, 24.16683], [-76.43712, 24.16711],
          [-76.43758, 24.16864], [-76.43811, 24.16911], [-76.4384, 24.16901],
          [-76.43846, 24.16971], [-76.43882, 24.16965], [-76.43859, 24.17094],
          [-76.43889, 24.17257], [-76.43955, 24.17395], [-76.43971, 24.17247],
          [-76.44034, 24.1739], [-76.44102, 24.17363], [-76.44089, 24.1727],
          [-76.4414, 24.17268], [-76.44157, 24.17301], [-76.44109, 24.17334],
          [-76.44147, 24.1746], [-76.44061, 24.17585], [-76.43968, 24.17475],
          [-76.43952, 24.17401],
        ],
      },
      'cabana-suinda': {
        stages: [
          { center: [-58, -30], zoom: 2.8, hold: 800 },
          { center: [-60, -30], zoom: 5, speed: 1.2 },
          { center: [-58.5, -28.5], zoom: 7, speed: 1.2 },
          { center: [-58.1682, -27.2807], zoom: 14, speed: 1.0 },
        ],
        polygonAfterStage: 2,
        marker: [-58.1682, -27.2807],
        label: { name: 'Cabaña Suindá', detail: 'Corrientes, Argentina' },
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
    sequencePlayed: false,

    init() {
      this.container = document.querySelector('[data-map-sequence]');
      if (!this.container) return;

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

    // Compute a center that places MARKER_COORDS at ~25% from the left edge
    getOffsetCenter() {
      const bounds = this.map.getBounds();
      const lngSpan = bounds.getEast() - bounds.getWest();
      // Shift map center so marker sits at 25% from left (shift right by 25% of span)
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
      el.className = 'project-map-marker';
      const { name, detail } = this.config.label;
      el.innerHTML = '<div class="project-map-marker__dot"></div><div class="project-map-marker__ring"></div>' +
        '<div class="project-map-marker__label">' +
          '<span class="project-map-marker__name">' + name + '</span>' +
          '<span class="project-map-marker__detail">' + detail + '</span>' +
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
      this.map.addLayer({
        id: 'island-highlight-fill',
        type: 'fill',
        source: 'island-highlight',
        paint: {
          'fill-color': 'rgba(255, 255, 255, 0.08)',
          'fill-opacity': 0,
        },
      });

      // Outline
      this.map.addLayer({
        id: 'island-highlight-outline',
        type: 'line',
        source: 'island-highlight',
        paint: {
          'line-color': 'rgba(255, 255, 255, 0.35)',
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

    async init() {
      const host = document.querySelector('.sust-hero__visual-img[data-svg-src]');
      if (!host) return;

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
     INICIALIZACIÓN
     ============================================================ */
  init() {
    // 1. Renderizar componentes compartidos
    this.footer.render();
    this.floatingLogo.init();
    this.navLinkUnderline.init();
    this.introLinkOval.init();
    this.sound.init();

    // 2. Nav: fondo al scrollear + cambio de color por sección
    this.navScroll.init();
    this.navHide.init();
    this.navTheme.init();
    this.navIntro.init();
    this.scrollReveal.init();
    this.philosophyStatementReveal.init();
    this.sustClimateTitleReveal.init();
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
    this.imageExpand.init();
    this.aboutFinalZoom.init();
    this.projectMap.init();
    this.projectOverviewSlider.init();
    this.contactForm.init();
    this.keyboardNav.init();
    this.galleryScrollDrift.init();

    // 3. Detectar idioma y aplicar
    const lang = this.i18n.detect();
    this.i18n.set(lang);

    // 4. Transición entre Home y Projects
    this.pageTransition.init();

  },

  projectOverviewSlider: {
    init() {
      const dots = document.querySelectorAll('.project-overview__dot[data-project-overview-slide]');
      const imgs = document.querySelectorAll('.project-overview__img');
      if (!dots.length || !imgs.length) return;

      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          const idx = Number(dot.dataset.projectOverviewSlide);
          dots.forEach(d => d.classList.remove('is-active'));
          imgs.forEach(i => i.classList.remove('is-active'));
          dot.classList.add('is-active');
          if (imgs[idx]) imgs[idx].classList.add('is-active');
        });
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

        return {
          el,
          gate: gate || el,
          amount: parseFloat(el.getAttribute('data-scroll-drift')) || 0,
          captionLeft: squareIndex === 0 ? [name, location].filter(Boolean) : [],
          captionRight: squareIndex === pairSquares.length - 1 ? [category].filter(Boolean) : [],
          waitsForEntryTransition: el.classList.contains('projects-gallery__item') && el.classList.contains('anim-fade-up'),
          entryTransitionDone: !el.classList.contains('projects-gallery__item') || !el.classList.contains('anim-fade-up'),
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
        data.el.style.transform = '';
        data.el.style.willChange = '';
        data.el.style.transition = '';
        data.captionLeft.forEach(node => {
          node.style.transform = '';
          node.style.willChange = '';
        });
        data.captionRight.forEach(node => {
          node.style.transform = '';
          node.style.willChange = '';
        });
        data.primed = false;
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
            const start0 = vh * 0.4;
            const end0 = vh * 0.1;
            let p0 = (start0 - rect0.bottom) / (start0 - end0);
            p0 = Math.max(0, Math.min(1, p0));
            data.targetX = amount * p0;
            data.currentX = data.targetX;
          }
          data.primed = true;
          return;
        }

        const rect = el.getBoundingClientRect();
        const bottom = rect.bottom;

        // Drift: 0 cuando bottom cruza el 40% del vh, 1 al 10%.
        const start = vh * 0.4;
        const end = vh * 0.1;
        let p = (start - bottom) / (start - end);
        p = Math.max(0, Math.min(1, p));

        // Target: lo que el scroll "pide" en este frame.
        data.targetX = amount * p;
        // Current: persigue al target con lerp → sensación de inercia.
        data.currentX += (data.targetX - data.currentX) * this.SMOOTHING;

        const t = `translate3d(${data.currentX.toFixed(2)}px, 0, 0)`;
        el.style.transform = t;
        // Solo si este target tiene asignado captionLeft/Right (par
        // de imágenes), mover los spans correspondientes.
        captionLeft.forEach(node => { node.style.transform = t; });
        captionRight.forEach(node => { node.style.transform = t; });
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
          const t = `translate3d(${driftData.amount}px, 0, 0)`;
          el.style.transform = t;
          driftData.captionLeft.forEach(node => { node.style.transform = t; });
          driftData.captionRight.forEach(node => { node.style.transform = t; });
          // Sincronizar lerp para que al re-entrar no haya salto.
          driftData.currentX = driftData.amount;
          driftData.targetX = driftData.amount;
        } else if (rect.top >= window.innerHeight) {
          el.style.transform = '';
          driftData.captionLeft.forEach(node => { node.style.transform = ''; });
          driftData.captionRight.forEach(node => { node.style.transform = ''; });
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

};


/* ---- Arrancar cuando el DOM esté listo ---- */
document.addEventListener('DOMContentLoaded', () => {
  Timbo.init();
});
