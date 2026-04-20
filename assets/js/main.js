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
      Timbo.projectsList.render();
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

    init() {
      const nav = document.querySelector('.main-nav');
      if (!nav) return;

      const threshold = this.SCROLL_THRESHOLD;

      window.addEventListener('scroll', () => {
        if (window.scrollY > threshold) {
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
     PAGE TRANSITION (Home -> Projects)
     Salida suave desde Home y entrada elegante en Proyectos.
     ============================================================ */
  pageTransition: {
    STORAGE_KEY: 'timbo-page-transition',
    EXIT_CLASS: 'is-leaving-to-projects',
    ENTER_CLASS: 'is-entering-projects',
    ENTER_ACTIVE_CLASS: 'is-entering-projects-active',
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

    saveIntent() {
      try {
        const payload = {
          from: 'index.html',
          to: 'proyectos.html',
          at: Date.now(),
        };
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
      } catch (_err) {
        // Ignore sessionStorage failures and continue navigation
      }
    },

    consumeIntent() {
      let raw = null;
      try {
        raw = sessionStorage.getItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
      } catch (_err) {
        return null;
      }
      if (!raw) return null;

      let payload = null;
      try {
        payload = JSON.parse(raw);
      } catch (_err) {
        return null;
      }
      if (!payload || payload.to !== 'proyectos.html' || payload.from !== 'index.html') return null;
      if (typeof payload.at !== 'number') return null;
      if (Date.now() - payload.at > 6000) return null;
      return payload;
    },

    startExit(targetUrl) {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      this.saveIntent();
      document.documentElement.classList.add(this.EXIT_CLASS);

      window.setTimeout(() => {
        window.location.assign(targetUrl.href);
      }, this.EXIT_DURATION_MS);
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

          // Home → Projects (existing specific transition)
          if (currentPage === 'index.html' && targetPage === 'proyectos.html') {
            event.preventDefault();
            this.startExit(targetUrl);
            return;
          }

          // Project detail pages → any other page
          if (this.isProjectPage()) {
            event.preventDefault();
            this.startGenericExit(targetUrl);
            return;
          }
        });
      });
    },

    runEntry() {
      const intent = this.consumeIntent();
      if (!intent) return;
      if (!this.shouldAnimate()) return;
      if (this.getPageName(window.location.pathname) !== 'proyectos.html') return;

      const root = document.documentElement;
      root.classList.add(this.ENTER_CLASS);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.add(this.ENTER_ACTIVE_CLASS);
        });
      });

      window.setTimeout(() => {
        root.classList.remove(this.ENTER_CLASS, this.ENTER_ACTIVE_CLASS);
      }, 1100);
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
      this.runEntry();
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
     PROJECTS LIST (página Proyectos)
     Renderiza la lista de proyectos desde SITE_DATA.projects
     ============================================================ */
  projectsList: {
    eventsController: null,
    previewSwapTimer: null,
    PREVIEW_SWAP_DELAY_MS: 110,

    clearPreviewSwapTimer() {
      if (!this.previewSwapTimer) return;
      clearTimeout(this.previewSwapTimer);
      this.previewSwapTimer = null;
    },

    hidePreviewImage(previewImg) {
      if (!previewImg) return;
      this.clearPreviewSwapTimer();
      previewImg.classList.remove('is-swapping', 'is-visible');
    },

    setPreviewImage(previewImg, imageSrc, altText = '') {
      if (!previewImg || !imageSrc) {
        this.hidePreviewImage(previewImg);
        return;
      }

      const nextSrc = String(imageSrc);
      const currentSrc = previewImg.dataset.currentSrc || '';
      const isVisible = previewImg.classList.contains('is-visible');

      const commitSwap = () => {
        previewImg.src = nextSrc;
        previewImg.alt = altText;
        previewImg.dataset.currentSrc = nextSrc;
        previewImg.classList.add('is-visible');
        requestAnimationFrame(() => {
          previewImg.classList.remove('is-swapping');
        });
      };

      if (!isVisible || !currentSrc) {
        this.clearPreviewSwapTimer();
        previewImg.classList.remove('is-swapping');
        commitSwap();
        return;
      }

      if (currentSrc === nextSrc) {
        this.clearPreviewSwapTimer();
        previewImg.alt = altText || previewImg.alt;
        previewImg.classList.remove('is-swapping');
        previewImg.classList.add('is-visible');
        return;
      }

      this.clearPreviewSwapTimer();
      previewImg.classList.add('is-swapping');
      this.previewSwapTimer = window.setTimeout(() => {
        commitSwap();
        this.previewSwapTimer = null;
      }, this.PREVIEW_SWAP_DELAY_MS);
    },

    shouldSkipIntroAnimation() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;

      try {
        const rawIntent = sessionStorage.getItem('timbo-page-transition');
        if (!rawIntent) return false;
        const intent = JSON.parse(rawIntent);
        return intent?.from === 'index.html' && intent?.to === 'proyectos.html';
      } catch (_err) {
        return false;
      }
    },

    animateListEntry(list) {
      if (!list) return;

      list.classList.remove('projects__list--intro', 'projects__list--intro-ready');
      if (this.shouldSkipIntroAnimation()) return;

      list.classList.add('projects__list--intro');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          list.classList.add('projects__list--intro-ready');
        });
      });
    },

    render() {
      const list = document.getElementById('projects-list');
      if (!list) return; // No estamos en la página de proyectos

      const lang = Timbo.state.lang;
      const data = SITE_DATA.projects[lang];
      if (!data || !data.items || data.items.length === 0) return;

      list.innerHTML = data.items.map((project, i) => `
        <li class="projects__item" data-project-index="${i}" style="--project-item-index:${i};">
          <a class="projects__item-link" href="${project.page}?lang=${lang}">
            <div class="projects__item-info">
              <span class="projects__item-name">${project.name}</span>
              <div class="projects__item-bottom">
                <span class="projects__item-location">${project.location}</span>
                <span class="projects__item-cta">
                  ${data.viewProject}
                  <span class="projects__item-cta-arrow"></span>
                </span>
              </div>
            </div>
          </a>
        </li>
      `).join('');

      this.animateListEntry(list);

      // Preview hover interactivo
      const previewImg = document.getElementById('projects-preview-img');
      const previewMeta = document.getElementById('projects-preview-meta');
      if (!previewImg || !previewMeta) return;

      if (this.eventsController) this.eventsController.abort();
      const controller = new AbortController();
      this.eventsController = controller;

      list.addEventListener('mouseenter', (e) => {
        const item = e.target.closest('.projects__item');
        if (!item) return;
        const index = Number(item.dataset.projectIndex);
        const project = data.items[index];
        if (!project) return;

        if (project.image) {
          this.setPreviewImage(previewImg, project.image, project.name);
        } else {
          this.hidePreviewImage(previewImg);
        }

        previewMeta.innerHTML = `
          <div class="projects__preview-meta-category">${project.category || ''}</div>
          <div class="projects__preview-meta-location">${project.location}</div>
        `;
      }, { capture: true, signal: controller.signal });

      list.addEventListener('mouseleave', () => {
        this.hidePreviewImage(previewImg);
        previewMeta.innerHTML = '';
      }, { signal: controller.signal });

      // Scroll contenido: absorbe el scroll mientras la lista pueda scrollear,
      // lo deja pasar a la página cuando llega al límite.
      list.addEventListener('wheel', (e) => {
        const atTop = list.scrollTop <= 0;
        const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
        const scrollingDown = e.deltaY > 0;
        const scrollingUp = e.deltaY < 0;

        // Si hay recorrido en la dirección del scroll, absorber el evento
        if ((scrollingDown && !atBottom) || (scrollingUp && !atTop)) {
          e.preventDefault();
          list.scrollTop += e.deltaY;
        }
        // Si llegó al límite, no hacemos nada → el evento sube a la página
      }, { passive: false, signal: controller.signal });
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
    introDetailImageEl: null,
    valuesBreakdownEl: null,
    philosophyEl: null,
    philosophySignalsEl: null,
    sustBreatheEl: null,
    sustMetricsEl: null,

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

    updateIntroDetailImageBlend() {
      if (!this.logoEl) return;
      if (!this.introDetailImageEl) {
        this.logoEl.classList.remove('floating-logo--on-intro-detail');
        this.logoEl.style.setProperty('--intro-detail-overlap-top', '100%');
        this.logoEl.style.setProperty('--intro-detail-overlap-bottom', '0px');
        this.logoEl.style.setProperty('--intro-detail-overlap-left', '0px');
        this.logoEl.style.setProperty('--intro-detail-overlap-right', '0px');
        return;
      }

      const logoRect = this.logoEl.getBoundingClientRect();
      const imgRect = this.introDetailImageEl.getBoundingClientRect();
      const overlapTop = Math.max(logoRect.top, imgRect.top);
      const overlapBottom = Math.min(logoRect.bottom, imgRect.bottom);
      const overlapLeft = Math.max(logoRect.left, imgRect.left);
      const overlapRight = Math.min(logoRect.right, imgRect.right);
      const hasOverlap = overlapBottom > overlapTop && overlapRight > overlapLeft;

      if (!hasOverlap) {
        this.logoEl.classList.remove('floating-logo--on-intro-detail');
        this.logoEl.style.setProperty('--intro-detail-overlap-top', `${logoRect.height}px`);
        this.logoEl.style.setProperty('--intro-detail-overlap-bottom', '0px');
        this.logoEl.style.setProperty('--intro-detail-overlap-left', '0px');
        this.logoEl.style.setProperty('--intro-detail-overlap-right', `${logoRect.width}px`);
        return;
      }

      const topInset = Math.max(0, overlapTop - logoRect.top);
      const bottomInset = Math.max(0, logoRect.bottom - overlapBottom);
      const leftInset = Math.max(0, overlapLeft - logoRect.left);
      const rightInset = Math.max(0, logoRect.right - overlapRight);

      this.logoEl.style.setProperty('--intro-detail-overlap-top', `${topInset}px`);
      this.logoEl.style.setProperty('--intro-detail-overlap-bottom', `${bottomInset}px`);
      this.logoEl.style.setProperty('--intro-detail-overlap-left', `${leftInset}px`);
      this.logoEl.style.setProperty('--intro-detail-overlap-right', `${rightInset}px`);
      this.logoEl.classList.add('floating-logo--on-intro-detail');
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

    updatePhilosophySignalsBlend() {
      if (!this.logoEl) return;
      if (!this.philosophySignalsEl) {
        this.logoEl.classList.remove('floating-logo--behind-signals');
        return;
      }

      const logoRect = this.logoEl.getBoundingClientRect();
      const signalsRect = this.philosophySignalsEl.getBoundingClientRect();
      const overlapTop = Math.max(logoRect.top, signalsRect.top);
      const overlapBottom = Math.min(logoRect.bottom, signalsRect.bottom);
      const overlapLeft = Math.max(logoRect.left, signalsRect.left);
      const overlapRight = Math.min(logoRect.right, signalsRect.right);
      const hasOverlap = overlapBottom > overlapTop && overlapRight > overlapLeft;

      this.logoEl.classList.toggle('floating-logo--behind-signals', hasOverlap);
    },

    updateSustOverviewBlend() {
      if (!this.logoEl) return;
      if (!this.sustBreatheEl || !this.sustMetricsEl) {
        this.logoEl.classList.remove('floating-logo--on-sust-overview');
        this.logoEl.style.setProperty('--sust-overview-overlap-top', '100%');
        this.logoEl.style.setProperty('--sust-overview-overlap-bottom', '0px');
        return;
      }

      const logoRect = this.logoEl.getBoundingClientRect();
      const breatheRect = this.sustBreatheEl.getBoundingClientRect();
      const metricsRect = this.sustMetricsEl.getBoundingClientRect();
      const whiteZoneTop = breatheRect.top + (breatheRect.height / 2);
      const whiteZoneBottom = metricsRect.bottom;
      const overlapTop = Math.max(logoRect.top, whiteZoneTop);
      const overlapBottom = Math.min(logoRect.bottom, whiteZoneBottom);
      const hasOverlap = overlapBottom > overlapTop;

      if (!hasOverlap) {
        this.logoEl.classList.remove('floating-logo--on-sust-overview');
        this.logoEl.style.setProperty('--sust-overview-overlap-top', `${logoRect.height}px`);
        this.logoEl.style.setProperty('--sust-overview-overlap-bottom', '0px');
        return;
      }

      const topInset = Math.max(0, overlapTop - logoRect.top);
      const bottomInset = Math.max(0, logoRect.bottom - overlapBottom);

      this.logoEl.style.setProperty('--sust-overview-overlap-top', `${topInset}px`);
      this.logoEl.style.setProperty('--sust-overview-overlap-bottom', `${bottomInset}px`);
      this.logoEl.classList.add('floating-logo--on-sust-overview');
    },

    init() {
      const logo = this.render();
      if (!logo) return;
      this.heroSectionEl = document.getElementById('hero') || document.querySelector('.sust-hero');
      this.dialogueImageEl = document.querySelector('.nature-dialogue__image');
      this.introDetailImageEl = document.querySelector('.intro__detail-photo');
      this.valuesBreakdownEl = document.getElementById('values-breakdown');
      this.philosophyEl = document.getElementById('philosophy');
      this.philosophySignalsEl = document.querySelector('.philosophy__signals');
      this.sustBreatheEl = document.getElementById('sust-breathe');
      this.sustMetricsEl = document.getElementById('sust-metrics');

      logo.classList.add('floating-logo--visible');
      const updateLogoState = () => {
        this.updateHeroLayer();
        this.updateDialogueImageBlend();
        this.updateIntroDetailImageBlend();
        this.updateValuesBreakdownBlend();
        this.updatePhilosophyBlend();
        this.updatePhilosophySignalsBlend();
        this.updateSustOverviewBlend();
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
      const animatedElements = document.querySelectorAll('.anim-fade-up, .anim-wind-in, .anim-fade-in, .anim-zoom-in, .intro__photo--slide-x');
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

      animatedElements.forEach((el) => observer.observe(el));
    },
  },

  sustMetricsReveal: {
    init() {
      const section = document.querySelector('.sust-metrics');
      if (!section) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        section.classList.add('is-visible');
        return;
      }

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          section.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      }, {
        threshold: 0.35,
      });

      observer.observe(section);
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

      svg.addEventListener('wheel', (event) => {
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

  /* ============================================================
     HERO PARALLAX
     Tagline y logo bajan con el scroll a distintos ratios.
     Ambos se frenan cuando el logo alcanza MAX_LOGO_Y (px).
     Además, el tagline se escala de 1 a TAGLINE_MIN_SCALE durante los
     primeros TAGLINE_SCALE_DISTANCE px de scroll.
     ============================================================ */
  heroParallax: {
    TAGLINE_RATE: 0.4,
    LOGO_RATE: 0.5,
    MAX_LOGO_Y: 300,
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
    LOGO_RESUME_SCROLL: 750,         // scrollY al que el logo retoma el descenso (fase 2)
    LOGO_RESUME_RATE: 1.0,           // rate de descenso durante la fase 2 (post-pausa)
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
      // Fase 1 del logo: descenso normal hasta MAX_LOGO_Y.
      let logoY = scrolledEffective * this.LOGO_RATE;
      // Fase 2 (post-pausa): una vez que scrollY supera LOGO_RESUME_SCROLL,
      // el logo retoma el descenso a LOGO_RESUME_RATE sumando a MAX_LOGO_Y.
      if (scrolled > this.LOGO_RESUME_SCROLL) {
        logoY = this.MAX_LOGO_Y + (scrolled - this.LOGO_RESUME_SCROLL) * this.LOGO_RESUME_RATE;
      }

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

      if (this.logoEl) {
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

        this.logoEl.style.transformOrigin = 'top center';
        this.logoEl.style.transform = `translateY(${logoY}px) scale(${logoScale})`;
        this.logoEl.style.opacity = String(logoOpacity);

        // Máscara del logo: se ubica a la altura máxima que alcanza la BASE del logo.
        const logoNaturalHeight = this.logoEl.offsetHeight || 1;
        const maskLine = this.MAX_LOGO_Y + logoNaturalHeight * this.LOGO_MAX_SCALE;
        const currentBase = logoY + logoNaturalHeight * logoScale;
        const overshoot = Math.max(0, currentBase - maskLine);
        if (overshoot > 0) {
          const scaledHeight = logoNaturalHeight * logoScale;
          const visibleBottomScaled = Math.max(0, scaledHeight - overshoot);
          const visibleBottom = visibleBottomScaled / logoScale;
          const fadeStart = Math.max(0, visibleBottom - this.LOGO_MASK_FADE / logoScale);
          const maskValue = `linear-gradient(to bottom, #000 0px, #000 ${fadeStart}px, rgba(0,0,0,0) ${visibleBottom}px, rgba(0,0,0,0) 100%)`;
          this.logoEl.style.webkitMaskImage = maskValue;
          this.logoEl.style.maskImage = maskValue;
        } else {
          this.logoEl.style.webkitMaskImage = '';
          this.logoEl.style.maskImage = '';
        }
      }
    },
  },

  sustHeroIntro: {
    init() {
      const heroSection = document.querySelector('.sust-hero');
      const heroContent = heroSection?.querySelector('.sust-hero__content');
      const heroImage = heroSection?.querySelector('.sust-hero__media img');
      if (!heroSection || !heroContent) return;

      const reveal = () => {
        window.requestAnimationFrame(() => {
          heroSection.classList.add('is-visible');
          heroContent.classList.add('is-visible');
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
     HERO VIDEO SCROLL FADE
     Empieza a bajar opacidad del video luego de cierto scroll.
     ============================================================ */
  heroVideoScrollFade: {
    START_SCROLL_PX: 200,
    FADE_DISTANCE_PX: 520,
    MIN_OPACITY: 0,

    init() {
      const video = document.querySelector('#hero .hero__bg video');
      if (!video) return;

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      const update = () => {
        const fadeProgressRaw = clamp(
          (window.scrollY - this.START_SCROLL_PX) / this.FADE_DISTANCE_PX,
          0,
          1,
        );
        const fadeProgress = Math.pow(fadeProgressRaw, 1.2);
        const opacity = 1 - (1 - this.MIN_OPACITY) * fadeProgress;
        video.style.setProperty('--hero-video-scroll-opacity', opacity.toFixed(3));
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  },

  harasHeroTitleScroll: {
    titleEl: null,
    ticking: false,

    update() {
      if (!this.titleEl) return;
      const scrollY = Math.max(window.scrollY, 0);
      const firstPhase = Math.min(scrollY, 150);
      const secondPhase = Math.min(Math.max(scrollY - 150, 0), 150);
      const remainingPhase = Math.max(scrollY - 300, 0);
      const translateY = firstPhase + (secondPhase * 0.7) + (remainingPhase * 0.7);
      this.titleEl.style.transform = `translateY(${translateY.toFixed(1)}px)`;
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
        const end = start - el.offsetHeight * 0.4; // 40% scrolled
        const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
        el.style.setProperty('--expand-progress', progress);
      };

      window.addEventListener('scroll', update, { passive: true });
      update();
    },
  },

  introPhotosParallax: {
    init() {
      const photosEl = document.querySelector('.intro__photos');
      const narrowPhotoEl = photosEl?.querySelector('.intro__photo--narrow');
      if (!photosEl || !narrowPhotoEl) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        narrowPhotoEl.style.setProperty('--intro-narrow-progress', '1');
        return;
      }

      const update = () => {
        const rect = photosEl.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const start = viewportHeight * 0.96;
        const end = viewportHeight * 0.5;
        const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
        narrowPhotoEl.style.setProperty('--intro-narrow-progress', progress.toFixed(3));
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  },

  /* ============================================================
     OVERLAY TEXT REVEAL (scroll-linked)
     Aparece 100px antes y desciende hasta su posición final
     con fade-in simultáneo.
     ============================================================ */
  overlayTextReveal: {
    init() {
      const text = document.querySelector('.nature-dialogue__text');
      if (!text) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        text.style.setProperty('--overlay-text-progress', 1);
        return;
      }

      const TRAVEL = 400; // px de recorrido vertical

      const update = () => {
        const rect = text.getBoundingClientRect();
        const vh = window.innerHeight;
        // Empieza cuando el texto (en su posición final) está a TRAVEL px
        // por debajo del borde inferior del viewport
        const start = vh + TRAVEL;
        const end = vh * 0.65; // termina cuando llega a ~65% del viewport
        const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
        text.style.setProperty('--overlay-text-progress', progress);
      };

      window.addEventListener('scroll', update, { passive: true });
      update();
    },
  },

  /* ============================================================
     PHILOSOPHY STATEMENT REVEAL (scroll-linked)
     Aparece antes y desciende 150px hasta su posición final.
     ============================================================ */
  philosophyStatementReveal: {
    init() {
      const statement = document.querySelector('.philosophy__statement');
      if (!statement) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        statement.style.setProperty('--philosophy-statement-progress', 1);
        return;
      }

      const TRAVEL = 150; // px de recorrido vertical

      const update = () => {
        const rect = statement.getBoundingClientRect();
        const vh = window.innerHeight;

        // Empieza antes de entrar completamente al viewport.
        const start = vh + TRAVEL;
        // Termina cuando llega a su posición visual final.
        const end = vh * 0.64;
        const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
        statement.style.setProperty('--philosophy-statement-progress', progress);
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
     HERO BACKGROUND TOGGLE
     ============================================================ */
  heroBgToggle: {

    BACKGROUNDS: [
      { type: 'video', src: null },
      { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/foto-montañas-fondo.jpg' },
      { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DJI_0475 (1).jpg' },
      { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DJI_20240305170434_0265_D.jpg' },
      { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DSC01983.jpg' },
      { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DSC01984.jpg' },
      { type: 'photo', src: 'assets/images/hero/alternate-hero-photos/DSC02312.jpg' },
    ],

    currentIndex: 0,

    init() {
      const btn      = document.getElementById('heroBgToggle');
      const photoEl  = document.getElementById('heroBgPhoto');
      const heroEl   = document.getElementById('hero');
      const videoEl  = heroEl ? heroEl.querySelector('video') : null;

      if (!btn || !photoEl || !heroEl || !videoEl) return;

      btn.addEventListener('click', () => {
        this.currentIndex = (this.currentIndex + 1) % this.BACKGROUNDS.length;
        const bg = this.BACKGROUNDS[this.currentIndex];

        if (bg.type === 'video') {
          photoEl.style.backgroundImage = '';
          photoEl.classList.remove('is-active');
          videoEl.style.opacity = '';
        } else {
          photoEl.style.backgroundImage = `url('${bg.src}')`;
          photoEl.classList.add('is-active');
          videoEl.style.opacity = '0';
        }
      });

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            btn.classList.remove('is-hidden');
          } else {
            btn.classList.add('is-hidden');
          }
        });
      }, { threshold: 0.1 });

      observer.observe(heroEl);
    },
  },


  /* ============================================================
     PLANO 3D CONTROLS
     ============================================================ */
  plano3dControls: {
    init() {
      const frame = document.getElementById('plano3dFrame');
      if (!frame) return;

      const toggles = document.querySelectorAll('.sust-process__toggle');
      const speedBtns = document.getElementById('plano3dSpeedBtns');

      toggles.forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          btn.classList.toggle('is-active');
          frame.contentWindow.postMessage({ action }, '*');

          if (action === 'toggleSun') {
            speedBtns.classList.toggle('is-visible', btn.classList.contains('is-active'));
          }
        });
      });

      speedBtns.addEventListener('click', (e) => {
        const btn = e.target.closest('.sust-process__speed-btn');
        if (!btn) return;
        speedBtns.querySelectorAll('.sust-process__speed-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        frame.contentWindow.postMessage({ action: 'setSpeed', value: btn.dataset.spd }, '*');
      });

      window.addEventListener('message', (e) => {
        if (e.data && e.data.action === 'sunDeactivated') {
          const sunToggle = document.querySelector('.sust-process__toggle[data-action="toggleSun"]');
          if (sunToggle) sunToggle.classList.remove('is-active');
          speedBtns.classList.remove('is-visible');
        }
      });
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
     SUST-CLIMATE COMPASS
     Brújula scroll-driven basada en scrollY:
       - La brújula baja a un rate configurable (RATE) respecto al scroll.
         Arranca a bajar cuando el TOP de la sección toca el BOTTOM del viewport
         (elapsed = 0) y se detiene cuando la sección se termina.
       - La aguja gira TOTAL_DEGREES en todo el recorrido.
     ============================================================ */
  sustClimateCompass: {
    RATE: 0.6,              // 1 unidad de scroll → 0.6 unidades de descenso
    TOTAL_DEGREES: 360,
    sectionEl: null,
    stickyEl: null,
    needleEl: null,
    ticking: false,

    init() {
      this.sectionEl = document.getElementById('sust-climate');
      if (!this.sectionEl) return;
      this.stickyEl = this.sectionEl.querySelector('.sust-climate__compass-sticky');
      this.needleEl = this.sectionEl.querySelector('.sust-climate__compass-needle');
      if (!this.stickyEl || !this.needleEl) return;
      this.update();
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      window.addEventListener('resize', () => this.update(), { passive: true });
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
      const rect = this.sectionEl.getBoundingClientRect();
      const viewport = window.innerHeight;

      // elapsed: px scrolleados desde que la sección empezó a aparecer.
      // 0 cuando el top de la sección toca el bottom del viewport.
      const elapsed = Math.max(0, viewport - rect.top);

      // Máximo recorrido: hasta que la sección se acabe.
      // total = sectionHeight + viewport (cuando bottom sale por top del viewport).
      const total = rect.height + viewport;
      const elapsedClamped = Math.min(elapsed, total);

      // Descenso: rate 0.6 respecto al scroll acumulado dentro de la sección.
      const translateY = elapsedClamped * this.RATE;
      this.stickyEl.style.transform = `translateY(${translateY}px)`;

      // Rotación aguja: progreso 0→1 sobre total.
      const progress = total > 0 ? elapsedClamped / total : 0;
      const deg = progress * this.TOTAL_DEGREES;
      this.needleEl.style.transform = `rotate(${deg}deg)`;
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
          '.intro__detail',
          '#nature-dialogue',
          '#philosophy',
        ],
      },
      {
        name: 'sustentabilidad',
        match: ['.sust-hero'],
        stops: [
          '.sust-hero',
          '#sust-overview',
          '#sust-process',
          '#sust-climate',
          '#sust-breathe',
          '#sust-metrics',
          '#sust-strategies',
        ],
      },
      {
        name: 'proyectos',
        match: ['.projects-section'],
        stops: [
          '#projects-section',
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
     INICIALIZACIÓN
     ============================================================ */
  init() {
    // 1. Renderizar componentes compartidos
    this.footer.render();
    this.floatingLogo.init();
    this.navLinkUnderline.init();
    this.introLinkOval.init();

    // 2. Nav: fondo al scrollear + cambio de color por sección
    this.navScroll.init();
    this.navHide.init();
    this.navTheme.init();
    this.navIntro.init();
    this.scrollReveal.init();
    this.sustMetricsReveal.init();
    this.sustBreatheTextReveal.init();
    this.sustStrategiesOrbit.init();
    this.sustStrategiesDetail.init();
    this.sustClimateCompass.init();
    this.heroIntro.init();
    this.heroParallax.init();
    this.sustHeroIntro.init();
    this.heroVideoScrollFade.init();
    this.harasHeroTitleScroll.init();
    this.heroBgToggle.init();
    this.plano3dControls.init();
    this.imageExpand.init();
    this.introPhotosParallax.init();
    this.overlayTextReveal.init();
    this.projectMap.init();
    this.introDetailSlider.init();
    this.projectOverviewSlider.init();
    this.contactForm.init();
    this.keyboardNav.init();

    // 3. Detectar idioma y aplicar
    const lang = this.i18n.detect();
    this.i18n.set(lang);

    // 4. Transición entre Home y Projects
    this.pageTransition.init();

  },

  /* ---- Slider de fotos intro__detail ---- */
  introDetailSlider: {
    init() {
      const dots = document.querySelectorAll('.intro__detail-dot[data-slide]');
      const imgs = document.querySelectorAll('.intro__detail-img');
      if (!dots.length || !imgs.length) return;

      const slideCount = Math.min(dots.length, imgs.length);
      let activeIndex = Array.from(dots).findIndex(dot => dot.classList.contains('is-active'));
      if (activeIndex < 0) activeIndex = 0;

      const setActive = (index) => {
        const nextIndex = ((index % slideCount) + slideCount) % slideCount;
        activeIndex = nextIndex;
        dots.forEach((dot, idx) => {
          dot.classList.toggle('is-active', idx === nextIndex);
        });
        imgs.forEach((img, idx) => {
          img.classList.toggle('is-active', idx === nextIndex);
        });
      };

      let autoRotateId = null;
      const startAutoRotate = () => {
        if (slideCount < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        window.clearInterval(autoRotateId);
        autoRotateId = window.setInterval(() => {
          setActive(activeIndex + 1);
        }, 6000);
      };

      setActive(activeIndex);

      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          const idx = Number(dot.dataset.slide);
          if (!Number.isFinite(idx)) return;
          setActive(idx);
          startAutoRotate();
        });
      });

      startAutoRotate();
    },
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

};


/* ---- Arrancar cuando el DOM esté listo ---- */
document.addEventListener('DOMContentLoaded', () => {
  Timbo.init();
});
