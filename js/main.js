(() => {
  const root = document.documentElement;

  // If the GSAP CDN fails, show all content without animations.
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.replace('js', 'no-js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => gsap.utils.toArray(sel, ctx);

  $('#year').textContent = new Date().getFullYear();

  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  $$('a[href^="#"]:not(.skip-link)').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else if (target === 0) window.scrollTo({ top: 0 });
      else target.scrollIntoView();
    });
  });

  const nav = $('#nav');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', self.direction === 1 && y > window.innerHeight * 0.6);
    },
  });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  ScrollTrigger.create({
    trigger: '.hero',
    start: 'bottom 40%',
    endTrigger: '.cta',
    end: 'top bottom',
    toggleClass: { targets: '.wa-float', className: 'is-visible' },
  });

  const heroSplit = SplitText.create('.hero__line', { type: 'lines', mask: 'lines' });
  gsap.set(['.hero__title', '.hero__eyebrow', '.hero__bottom'], { visibility: 'visible' });

  if (!reduce) {
    gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.4 } })
      .fromTo('.hero__media',
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .fromTo('.hero__media img', { scale: 1.4 }, { scale: 1.1, duration: 2.2 }, '<')
      .from('.nav > *', { y: -30, autoAlpha: 0, stagger: 0.08, duration: 1 }, '<0.4')
      .from(heroSplit.lines, { yPercent: 110, stagger: 0.12 }, '-=1.4')
      .fromTo('.hero__line--flex',
        { '--wdth': 62, '--wght': 900 },
        { '--wdth': 125, '--wght': 300, duration: 1.8, ease: 'expo.inOut' }, '-=1.2')
      .from('.hero__eyebrow', { autoAlpha: 0, y: 20, duration: 1 }, '-=1.6')
      .from('.hero__bottom > *', { autoAlpha: 0, y: 30, stagger: 0.1, duration: 1 }, '-=1.3');

    gsap.to('.hero__media img', {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__content', {
      yPercent: -12,
      autoAlpha: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true },
    });
  }

  if (!reduce) {
    const track = $('.marquee__track');
    const group = $('.marquee__group', track);
    const setX = gsap.quickSetter(track, 'x', 'px');
    let groupWidth = group.offsetWidth;
    let x = 0;
    let dir = -1;
    let boost = 0;

    ScrollTrigger.addEventListener('refresh', () => { groupWidth = group.offsetWidth; });
    ScrollTrigger.create({
      onUpdate(self) {
        dir = self.direction === 1 ? -1 : 1;
        boost = Math.max(boost, Math.min(Math.abs(self.getVelocity()) / 250, 10));
      },
    });
    gsap.ticker.add((time, delta) => {
      boost *= 0.94;
      x = gsap.utils.wrap(-groupWidth, 0, x + dir * (1 + boost) * delta * 0.08);
      setX(x);
    });
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const method = $('.method');
    const pillars = $$('.pillar');
    method.classList.add('is-pinned');
    gsap.set(pillars.slice(1), { autoAlpha: 0, yPercent: 25 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.method__pin',
        start: 'top top',
        end: `+=${pillars.length * 90}%`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });
    tl.to('.method__progress i', { scaleX: 1, ease: 'none', duration: pillars.length }, 0);
    pillars.forEach((pillar, i) => {
      if (i === 0) return;
      const at = i - 0.3;
      tl.to(pillars[i - 1], { autoAlpha: 0, yPercent: -25, duration: 0.5, ease: 'power2.in' }, at)
        .to(pillar, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: 'power2.out' }, at + 0.35)
        .fromTo($('.pillar__num', pillar),
          { '--wdth': 125, '--wght': 200 },
          { '--wdth': 62, '--wght': 900, duration: 0.6, ease: 'power3.out' }, at + 0.35);
    });

    return () => method.classList.remove('is-pinned');
  });

  $$('.stretch').forEach((title) => {
    const finalWdth = parseFloat(getComputedStyle(title).getPropertyValue('--wdth')) || 100;
    const from = reduce ? { autoAlpha: 0 } : { '--wdth': 62, '--wght': 900, y: 40, autoAlpha: 0 };
    gsap.fromTo(title, from,
      {
        ...(reduce ? {} : { '--wdth': finalWdth, '--wght': 850 }),
        y: 0,
        autoAlpha: 1,
        duration: reduce ? 0.6 : 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: title, start: 'top 85%', once: true },
      });
  });

  $$('.method__head .section-title').forEach((title) => {
    if (reduce) return;
    SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 110,
        stagger: 0.1,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: title, start: 'top 85%', once: true },
      }),
    });
  });

  if (!reduce) {
    gsap.fromTo('.cta__title',
      { '--wdth': 62, '--wght': 900 },
      {
        '--wdth': 78,
        '--wght': 700,
        ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true },
      });
  }

  const lead = $('.scrub-words');
  if (!reduce) {
    const words = SplitText.create(lead, { type: 'words' }).words;
    gsap.fromTo(words, { opacity: 0.15 }, {
      opacity: 1,
      stagger: 0.05,
      ease: 'none',
      // Ends once the paragraph is fully on screen, so it's never grey while being read.
      scrollTrigger: { trigger: lead, start: 'top 90%', end: 'bottom 80%', scrub: true },
    });
  }

  $$('.reveal-img').forEach((fig) => {
    const img = $('img', fig);
    if (reduce) return;
    gsap.fromTo(fig,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.6,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: fig, start: 'top 80%', once: true },
      });
    gsap.fromTo(img, { yPercent: -10 }, {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  const batchReveal = (selector, from = {}) => {
    const els = $$(selector);
    if (!els.length) return;
    gsap.set(els, { autoAlpha: 0, y: reduce ? 0 : 50, ...(reduce ? {} : from) });
    ScrollTrigger.batch(els, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: reduce ? 0.6 : 1.1,
        ease: 'expo.out',
        stagger: 0.08,
      }),
    });
  };

  batchReveal('.section .eyebrow, .method .eyebrow, .cta .eyebrow');
  batchReveal('.fade-up, .cta__title, .cta__sub, .cta .btn');
  batchReveal('.forwho__list li', { x: -60, y: 0 });
  batchReveal('.tcard');
  batchReveal('.insta__grid a', { y: 80 });
  mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
    batchReveal('.pillar');
  });

  if (!reduce) {
    gsap.from('.forwho__mark', {
      scale: 0,
      rotate: 90,
      stagger: 0.1,
      duration: 0.8,
      ease: 'back.out(2)',
      scrollTrigger: { trigger: '.forwho__list', start: 'top 80%', once: true },
    });
  }

  const slider = $('.slider');
  const sTrack = $('.slider__track', slider);
  const cards = $$('.tcard', sTrack);
  const prevBtn = $('[data-slider="prev"]');
  const nextBtn = $('[data-slider="next"]');

  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
  const minX = () => {
    const visible = slider.clientWidth - parseFloat(getComputedStyle(slider).paddingLeft);
    return Math.min(0, visible - sTrack.offsetWidth);
  };
  const snapX = (v) => gsap.utils.clamp(minX(), 0, Math.round(v / step()) * step());
  const updateButtons = () => {
    const x = gsap.getProperty(sTrack, 'x');
    prevBtn.disabled = x >= -1;
    nextBtn.disabled = x <= minX() + 1;
  };

  const drag = Draggable.create(sTrack, {
    type: 'x',
    bounds: { minX: minX(), maxX: 0 },
    inertia: !reduce,
    edgeResistance: 0.85,
    snap: { x: snapX },
    onDrag: updateButtons,
    onThrowUpdate: updateButtons,
    onDragEnd() { if (reduce) gsap.set(sTrack, { x: snapX(this.x) }); updateButtons(); },
  })[0];

  const go = (dir) => {
    const target = snapX(gsap.getProperty(sTrack, 'x') - dir * step());
    gsap.to(sTrack, {
      x: target,
      duration: reduce ? 0 : 0.9,
      ease: 'expo.out',
      onUpdate: () => { drag.update(); updateButtons(); },
    });
  };
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  ScrollTrigger.addEventListener('refresh', () => {
    drag.applyBounds({ minX: minX(), maxX: 0 });
    gsap.set(sTrack, { x: snapX(gsap.getProperty(sTrack, 'x')) });
    drag.update();
    updateButtons();
  });
  updateButtons();

  $$('.faq__q').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      gsap.killTweensOf(panel);
      if (!open) {
        panel.hidden = false;
        gsap.fromTo(panel, { height: 0 }, {
          height: 'auto',
          duration: reduce ? 0 : 0.6,
          ease: 'expo.out',
          onComplete: () => ScrollTrigger.refresh(),
        });
      } else {
        gsap.to(panel, {
          height: 0,
          duration: reduce ? 0 : 0.45,
          ease: 'expo.inOut',
          onComplete: () => {
            panel.hidden = true;
            gsap.set(panel, { clearProps: 'height' });
            ScrollTrigger.refresh();
          },
        });
      }
    });
  });

  if (finePointer && !reduce) {
    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  // Web fonts change text widths; recompute trigger positions once loaded.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
