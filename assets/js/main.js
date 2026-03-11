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
      Timbo.introPhraseUnderline.init();
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
     NAV THEME — Intersection Observer
     Home: dark solo mientras el hero ocupa la franja superior.
     Fuera del hero: light fijo (negro).
     ============================================================ */
  navTheme: {

    init() {
      const nav = document.querySelector('.main-nav');
      const hero = document.getElementById('hero');
      if (!nav || !hero) return;

      const applyTheme = (isDark) => {
        nav.classList.remove('main-nav--dark', 'main-nav--light');
        nav.classList.add(isDark ? 'main-nav--dark' : 'main-nav--light');
      };

      const updateThemeFromHero = () => {
        const heroRect = hero.getBoundingClientRect();
        const heroIsBehindNav = heroRect.top <= 0 && heroRect.bottom > 0;
        applyTheme(heroIsBehindNav);
      };

      updateThemeFromHero();

      const observer = new IntersectionObserver(() => {
        updateThemeFromHero();
      }, {
        threshold: [0, 0.01, 1],
      });

      observer.observe(hero);
      window.addEventListener('scroll', updateThemeFromHero, { passive: true });
      window.addEventListener('resize', updateThemeFromHero);
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
     INTRO PHRASE UNDERLINE (subrayado manuscrito en frase clave)
     ============================================================ */
  introPhraseUnderline: {
    UNDERLINE_PATH: 'M2 8 C20 8, 35 4, 60 6 C85 8, 100 3, 130 5 C160 7, 175 4, 200 6 C225 8, 245 3, 270 5 C295 7, 305 5, 318 6',
    PHRASE_BY_LANG: {
      es: 'asegurando una baja demanda energética y una alta calidad ambiental',
      en: 'ensuring low energy demand and high environmental quality',
    },

    buildUnderlineSvg() {
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.classList.add('hand-underline-text__svg');
      svg.setAttribute('viewBox', '0 0 320 12');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', this.UNDERLINE_PATH);
      svg.appendChild(path);
      return svg;
    },

    wrapPhrase() {
      const textEl = document.querySelector('.intro__text span[data-i18n="home.introText"]');
      if (!textEl) return null;

      const fullText = textEl.textContent;
      if (!fullText) return null;

      const phrase = this.PHRASE_BY_LANG[Timbo.state.lang];
      if (!phrase) return null;

      const index = fullText.toLowerCase().indexOf(phrase.toLowerCase());
      if (index < 0) return null;

      const before = fullText.slice(0, index);
      const match = fullText.slice(index, index + phrase.length);
      const after = fullText.slice(index + phrase.length);

      const phraseEl = document.createElement('span');
      phraseEl.className = 'hand-underline-text';

      const labelEl = document.createElement('span');
      labelEl.className = 'hand-underline-text__label';
      labelEl.textContent = match;

      phraseEl.append(labelEl, this.buildUnderlineSvg());

      textEl.textContent = '';
      textEl.append(document.createTextNode(before), phraseEl, document.createTextNode(after));

      return phraseEl;
    },

    getTransitionTotalMs(el) {
      const style = window.getComputedStyle(el);
      const durations = style.transitionDuration.split(',').map((value) => this.parseTime(value));
      const delays = style.transitionDelay.split(',').map((value) => this.parseTime(value));
      const length = Math.max(durations.length, delays.length);

      let total = 0;
      for (let i = 0; i < length; i += 1) {
        const duration = durations[i] ?? durations[durations.length - 1] ?? 0;
        const delay = delays[i] ?? delays[delays.length - 1] ?? 0;
        total = Math.max(total, duration + delay);
      }

      return total;
    },

    parseTime(value) {
      const trimmed = value.trim();
      if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed);
      if (trimmed.endsWith('s')) return Number.parseFloat(trimmed) * 1000;
      return 0;
    },

    clearPending(paragraph) {
      if (paragraph._introUnderlineObserver) {
        paragraph._introUnderlineObserver.disconnect();
        paragraph._introUnderlineObserver = null;
      }
      if (paragraph._introUnderlineTimer) {
        clearTimeout(paragraph._introUnderlineTimer);
        paragraph._introUnderlineTimer = null;
      }
    },

    scheduleDraw(paragraph, phraseEl) {
      if (!paragraph || !phraseEl) return;

      this.clearPending(paragraph);
      phraseEl.classList.remove('hand-underline-text--draw');

      const runDraw = () => {
        const waitMs = this.getTransitionTotalMs(paragraph) + 50;
        paragraph._introUnderlineTimer = setTimeout(() => {
          phraseEl.classList.add('hand-underline-text--draw');
        }, waitMs);
      };

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        phraseEl.classList.add('hand-underline-text--draw');
        return;
      }

      if (paragraph.classList.contains('is-visible')) {
        runDraw();
        return;
      }

      const observer = new MutationObserver(() => {
        if (!paragraph.classList.contains('is-visible')) return;
        observer.disconnect();
        paragraph._introUnderlineObserver = null;
        runDraw();
      });

      paragraph._introUnderlineObserver = observer;
      observer.observe(paragraph, { attributes: true, attributeFilter: ['class'] });
    },

    init() {
      const paragraph = document.querySelector('.intro__text.anim-fade-up');
      if (!paragraph) return;

      const phraseEl = this.wrapPhrase();
      if (!phraseEl) return;

      this.scheduleDraw(paragraph, phraseEl);
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
     FOOTER
     ============================================================ */
  footer: {

    render() {
      const footer = document.getElementById('main-footer');
      if (!footer) return;

      const isDarkPage = document.body.classList.contains('page--dark');
      const logoSrc = isDarkPage
        ? 'assets/images/logo/timbo-blanco.svg'
        : 'assets/images/logo/Timbó_02-27.svg';

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
    render() {
      const list = document.getElementById('projects-list');
      if (!list) return; // No estamos en la página de proyectos

      const lang = Timbo.state.lang;
      const data = SITE_DATA.projects[lang];
      if (!data || !data.items || data.items.length === 0) return;

      list.innerHTML = data.items.map((project, i) => `
        <li class="projects__item" data-project-index="${i}">
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

      // Preview hover interactivo
      const previewImg = document.getElementById('projects-preview-img');
      const previewMeta = document.getElementById('projects-preview-meta');
      if (!previewImg || !previewMeta) return;

      list.addEventListener('mouseenter', (e) => {
        const item = e.target.closest('.projects__item');
        if (!item) return;
        const index = Number(item.dataset.projectIndex);
        const project = data.items[index];
        if (!project) return;

        if (project.image) {
          previewImg.src = project.image;
          previewImg.alt = project.name;
          previewImg.classList.add('is-visible');
        } else {
          previewImg.classList.remove('is-visible');
        }

        previewMeta.innerHTML = `
          <div class="projects__preview-meta-category">${project.category || ''}</div>
          <div class="projects__preview-meta-location">${project.location}</div>
        `;
      }, true);

      list.addEventListener('mouseleave', () => {
        previewImg.classList.remove('is-visible');
        previewMeta.innerHTML = '';
      });

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
      }, { passive: false });
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

      const coverImg = document.getElementById('project-cover');
      if (coverImg && project.cover) {
        coverImg.src = project.cover;
        coverImg.alt = `${project.name} — ${project.location}`;
      }

      const backLink = document.getElementById('project-back-link');
      if (backLink) {
        backLink.href = `proyectos.html?lang=${lang}`;
      }

      document.title = `Timbó — ${project.name}`;
    },
  },


  /* ============================================================
     LOGO FIJO (esquina inferior izquierda)
     ============================================================ */
  floatingLogo: {
    HERO_RELEASE_OFFSET_PX: 140, // Mayor valor = el logo sale antes desde debajo del hero
    logoEl: null,
    heroSectionEl: null,
    featuredImageEl: null,
    valuesBreakdownEl: null,

    render() {
      const existingLogo = document.querySelector('.floating-logo');
      if (existingLogo) {
        this.logoEl = existingLogo;
        return existingLogo;
      }

      const logo = document.createElement('a');
      logo.href = 'index.html';
      logo.className = 'floating-logo';
      logo.setAttribute('aria-label', 'Ir al inicio');
      logo.innerHTML = `
        <span class="floating-logo__stack" aria-hidden="true">
          <img src="assets/images/logo/timbo-negro.svg" alt="Timbó" class="floating-logo__img floating-logo__img--black">
          <img src="assets/images/logo/timbo-gris.svg" alt="Timbó" class="floating-logo__img floating-logo__img--gray">
          <img src="assets/images/logo/timbo-blanco.svg" alt="Timbó" class="floating-logo__img floating-logo__img--white">
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

    updateFeaturedImageBlend() {
      if (!this.logoEl) return;
      if (!this.featuredImageEl) {
        this.logoEl.classList.remove('floating-logo--on-featured-blend');
        this.logoEl.style.setProperty('--featured-overlap-top', '100%');
        this.logoEl.style.setProperty('--featured-overlap-bottom', '0px');
        this.logoEl.style.setProperty('--featured-overlap-left', '0px');
        this.logoEl.style.setProperty('--featured-overlap-right', '0px');
        return;
      }

      const logoRect = this.logoEl.getBoundingClientRect();
      const featuredRect = this.featuredImageEl.getBoundingClientRect();
      const overlapTop = Math.max(logoRect.top, featuredRect.top);
      const overlapBottom = Math.min(logoRect.bottom, featuredRect.bottom);
      const overlapLeft = Math.max(logoRect.left, featuredRect.left);
      const overlapRight = Math.min(logoRect.right, featuredRect.right);
      const hasOverlap = overlapBottom > overlapTop && overlapRight > overlapLeft;

      if (!hasOverlap) {
        this.logoEl.classList.remove('floating-logo--on-featured-blend');
        this.logoEl.style.setProperty('--featured-overlap-top', `${logoRect.height}px`);
        this.logoEl.style.setProperty('--featured-overlap-bottom', '0px');
        this.logoEl.style.setProperty('--featured-overlap-left', '0px');
        this.logoEl.style.setProperty('--featured-overlap-right', `${logoRect.width}px`);
        return;
      }

      const topInset = Math.max(0, overlapTop - logoRect.top);
      const bottomInset = Math.max(0, logoRect.bottom - overlapBottom);
      const leftInset = Math.max(0, overlapLeft - logoRect.left);
      const rightInset = Math.max(0, logoRect.right - overlapRight);

      this.logoEl.style.setProperty('--featured-overlap-top', `${topInset}px`);
      this.logoEl.style.setProperty('--featured-overlap-bottom', `${bottomInset}px`);
      this.logoEl.style.setProperty('--featured-overlap-left', `${leftInset}px`);
      this.logoEl.style.setProperty('--featured-overlap-right', `${rightInset}px`);
      this.logoEl.classList.add('floating-logo--on-featured-blend');
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

    init() {
      const logo = this.render();
      if (!logo) return;
      this.heroSectionEl = document.getElementById('hero');
      this.featuredImageEl = document.querySelector('.featured-project__image');
      this.valuesBreakdownEl = document.getElementById('values-breakdown');

      logo.classList.add('floating-logo--visible');
      const updateLogoState = () => {
        this.updateHeroLayer();
        this.updateFeaturedImageBlend();
        this.updateValuesBreakdownBlend();
      };

      updateLogoState();
      window.addEventListener('scroll', updateLogoState, { passive: true });
      window.addEventListener('resize', updateLogoState);
    },
  },

  /* ============================================================
     CTA FIJO (View Projects)
     Visible solo mientras featured-project está en viewport.
     ============================================================ */
  featuredProjectCta: {
    ctaEl: null,
    sectionEl: null,
    imageEl: null,

    updateState() {
      if (!this.ctaEl || !this.sectionEl || !this.imageEl) return;

      const cta = this.ctaEl;
      const sectionRect = this.sectionEl.getBoundingClientRect();
      const imageRect = this.imageEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const sectionInViewport = sectionRect.top < viewportHeight && sectionRect.bottom > 0;
      cta.classList.toggle('btn--overlay--visible', sectionInViewport);

      if (!sectionInViewport) {
        cta.classList.add('btn--overlay--fixed');
        cta.classList.remove('btn--overlay--anchored');
        return;
      }

      // Cambia a modo anclado cuando el borde inferior de la imagen
      // alcanza (o pasa) el borde inferior del viewport.
      const reachedImageBottom = imageRect.bottom <= viewportHeight + 0.5;

      cta.classList.toggle('btn--overlay--anchored', reachedImageBottom);
      cta.classList.toggle('btn--overlay--fixed', !reachedImageBottom);
    },

    init() {
      const cta = document.querySelector('.btn--overlay');
      const section = document.getElementById('featured-project');
      const image = document.querySelector('.featured-project__image');
      if (!cta || !section || !image) return;

      this.ctaEl = cta;
      this.sectionEl = section;
      this.imageEl = image;

      this.updateState();
      window.addEventListener('scroll', () => this.updateState(), { passive: true });
      window.addEventListener('resize', () => this.updateState());
    },
  },

  /* ============================================================
     SCROLL REVEAL (genérico)
     Observa .anim-fade-up y activa .is-visible al entrar al viewport.
     ============================================================ */
  scrollReveal: {
    init() {
      const animatedElements = document.querySelectorAll('.anim-fade-up, .anim-wind-in, .anim-fade-in');
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

  /* ============================================================
     HERO INTRO (animación al cargar)
     ============================================================ */
  heroIntro: {
    init() {
      const heroContent = document.querySelector('#hero .hero__content');
      if (!heroContent) return;

      setTimeout(() => {
        heroContent.classList.add('is-visible');
      }, 100);
    },
  },


  /* ============================================================
     IMAGE EXPAND (scroll-linked)
     ============================================================ */
  imageExpand: {
    init() {
      const el = document.querySelector('.featured-project__image');
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

  /* ============================================================
     OVERLAY TEXT REVEAL (scroll-linked)
     Aparece 100px antes y desciende hasta su posición final
     con fade-in simultáneo.
     ============================================================ */
  overlayTextReveal: {
    init() {
      const text = document.querySelector('.featured-project__overlay-text');
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
     HERO SWITCHER
     Panel para cambiar la portada del hero (herramienta de test)
     ============================================================ */
  heroSwitcher: {
    MEDIA: [
      { type: 'video', src: 'assets/images/hero/hero-video_001-web.mp4', poster: 'assets/images/hero/hero_004.jpg', label: 'Video' },
      { type: 'image', src: 'assets/images/hero/hero_001.jpeg', label: 'Hero 1' },
      { type: 'image', src: 'assets/images/hero/hero_002.jpeg', label: 'Hero 2' },
      { type: 'image', src: 'assets/images/hero/hero_003.jpg', label: 'Hero 3' },
      { type: 'image', src: 'assets/images/hero/hero_004.jpg', label: 'Hero 4' },
      { type: 'image', src: 'assets/images/hero/alternate-hero-photos/DSC03407.jpg', label: 'Alt 1' },
      { type: 'image', src: 'assets/images/hero/alternate-hero-photos/DSC03425.jpg', label: 'Alt 2' },
      { type: 'image', src: 'assets/images/hero/alternate-hero-photos/DSC03800.jpg', label: 'Alt 3' },
      { type: 'image', src: 'assets/images/hero/alternate-hero-photos/DSC03843.jpg', label: 'Alt 4' },
      { type: 'image', src: 'assets/images/hero/alternate-hero-photos/DJI_20240528173308_0154_D-Mejorado-NR.jpg', label: 'Drone 1' },
      { type: 'image', src: 'assets/images/hero/alternate-hero-photos/DJI_20240528172828_0147_D-Mejorado-NR.jpg', label: 'Drone 2' },
    ],

    activeIndex: 0,

    init() {
      const switcher = document.getElementById('hero-switcher');
      if (!switcher) return;

      const toggle = switcher.querySelector('.hero-switcher__toggle');
      const panel = switcher.querySelector('.hero-switcher__panel');

      // Build panel content
      panel.innerHTML = `
        <p class="hero-switcher__label">Portada</p>
        <div class="hero-switcher__grid"></div>
      `;

      const grid = panel.querySelector('.hero-switcher__grid');

      this.MEDIA.forEach((item, i) => {
        const btn = document.createElement('button');
        btn.className = 'hero-switcher__option' + (i === this.activeIndex ? ' hero-switcher__option--active' : '');
        btn.setAttribute('aria-label', item.label);
        btn.dataset.index = i;

        const thumbSrc = item.type === 'video' ? item.poster : item.src;
        btn.innerHTML = `<img src="${thumbSrc}" alt="${item.label}" loading="lazy">`;

        if (item.type === 'video') {
          btn.innerHTML += `
            <span class="hero-switcher__play-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </span>
          `;
        }

        btn.addEventListener('click', () => this.select(i));
        grid.appendChild(btn);
      });

      // Toggle open/close
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        switcher.classList.toggle('hero-switcher--open');
      });

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
          switcher.classList.remove('hero-switcher--open');
        }
      });
    },

    select(index) {
      if (index === this.activeIndex) return;

      const item = this.MEDIA[index];
      const heroBg = document.querySelector('.hero__bg');
      if (!heroBg || !item) return;

      // Update hero background content
      if (item.type === 'video') {
        heroBg.innerHTML = `
          <video autoplay muted loop playsinline preload="metadata" poster="${item.poster}">
            <source src="${item.src}" type="video/mp4">
          </video>
          <img src="${item.poster}" alt="Vista aérea de costa y naturaleza" loading="eager">
        `;
      } else {
        heroBg.innerHTML = `
          <img src="${item.src}" alt="${item.label}" loading="eager">
        `;
      }

      // Update active state in grid
      this.activeIndex = index;
      const options = document.querySelectorAll('.hero-switcher__option');
      options.forEach((opt, i) => {
        opt.classList.toggle('hero-switcher__option--active', i === index);
      });
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
    replayBtn: null,
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

      this.replayBtn = this.container.querySelector('[data-map-replay]');

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
          this.showReplayButton();
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
            this.showReplayButton();
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

    showReplayButton() {
      if (!this.replayBtn) return;
      this.replayBtn.classList.add('is-visible');
      this.replayBtn.addEventListener('click', () => this.replay(), { once: false });
    },

    hideReplayButton() {
      if (!this.replayBtn) return;
      this.replayBtn.classList.remove('is-visible');
    },

    replay() {
      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }
      this.removeIslandHighlight();
      this.disableInteraction();
      this.hideReplayButton();

      const stage1 = this.config.stages[0];
      this.map.flyTo({
        center: stage1.center,
        zoom: stage1.zoom,
        speed: 1.2,
        essential: true,
      });

      this.map.once('moveend', () => {
        this.runSequence();
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

    // 2. Nav: fondo al scrollear + cambio de color por sección
    this.navScroll.init();
    this.navTheme.init();
    this.navIntro.init();
    this.featuredProjectCta.init();
    this.scrollReveal.init();
    this.heroIntro.init();
    this.imageExpand.init();
    this.overlayTextReveal.init();
    this.philosophyStatementReveal.init();
    this.heroSwitcher.init();
    this.valuesBreakdown.init();
    this.projectMap.init();

    // 3. Detectar idioma y aplicar
    const lang = this.i18n.detect();
    this.i18n.set(lang);
  },

};


/* ---- Arrancar cuando el DOM esté listo ---- */
document.addEventListener('DOMContentLoaded', () => {
  Timbo.init();
});
