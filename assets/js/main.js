// Grip Services UK — small site behaviours (no dependencies)

// Showreel: paste a YouTube or Vimeo embed URL here when the client sends it, e.g.
// 'https://www.youtube-nocookie.com/embed/VIDEO_ID?autoplay=1' or 'https://player.vimeo.com/video/VIDEO_ID?autoplay=1'
const SHOWREEL_URL = '';

(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header background once the page scrolls (pages with data-solid keep it on)
  if (header && !header.hasAttribute('data-solid')) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu
  if (toggle && nav) {
    const isOpen = () => document.body.classList.contains('nav-open');
    const setMenu = (open) => {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setMenu(!isOpen()));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (!isOpen()) return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); }
      // Keep keyboard focus inside the open menu (toggle + links)
      if (e.key === 'Tab') {
        const items = [toggle, ...nav.querySelectorAll('a')];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

    // Highlight the current section in the menu
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const setActive = (id) => links.forEach((a) => {
      const on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if ('IntersectionObserver' in window && sections.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach((s) => io.observe(s));
    }
  }

  // Fade / rise on scroll
  const targets = document.querySelectorAll(
    '.intro-lead, .intro-points, .section-head, .reel, .gallery figure, .card, .crest img, .crest p, .member, .contact-info, .form'
  );
  if ('IntersectionObserver' in window && !reduceMotion && targets.length) {
    const done = (el) => { el.classList.remove('reveal', 'is-in'); el.style.removeProperty('--d'); };
    const ro = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        const el = e.target;
        ro.unobserve(el);
        el.style.setProperty('--d', Math.min(i, 5) * 90 + 'ms'); // stagger items that arrive together
        el.classList.add('is-in');
        setTimeout(() => done(el), 1100 + Math.min(i, 5) * 90);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach((el) => {
      // Leave anything already on screen at load alone
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.classList.add('reveal');
      ro.observe(el);
    });
  }

  // Showreel
  const reel = document.querySelector('.reel');
  if (reel) {
    const play = reel.querySelector('.reel-play');
    if (!SHOWREEL_URL) {
      play.hidden = true;
    } else {
      reel.querySelector('.reel-soon').hidden = true;
      play.addEventListener('click', () => {
        const f = document.createElement('iframe');
        f.src = SHOWREEL_URL;
        f.title = 'Grip Services UK showreel';
        f.allow = 'autoplay; fullscreen; picture-in-picture';
        f.allowFullscreen = true;
        reel.appendChild(f);
        play.hidden = true;
      });
    }
  }

  // Lightbox for the gallery
  const box = document.querySelector('.lightbox');
  if (box) {
    const boxImg = box.querySelector('img');
    const boxCap = box.querySelector('figcaption');
    const closeBtn = box.querySelector('.lightbox-close');
    let lastFocus = null;
    const close = () => {
      box.hidden = true;
      boxImg.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    document.querySelectorAll('[data-lightbox]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        lastFocus = a;
        const cap = a.parentElement.querySelector('figcaption');
        boxImg.src = a.href;
        boxImg.alt = a.querySelector('img').alt;
        if (boxCap) boxCap.textContent = cap ? cap.textContent : '';
        box.hidden = false;
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
      });
    });
    box.addEventListener('click', (e) => { if (e.target !== boxImg && e.target !== boxCap) close(); });
    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); } // only one control in the dialog
    });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

// Equipment carousel: arrows only appear when the cards don't all fit
(() => {
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.cards');
    const nav = root.querySelector('.carousel-nav');
    const [prev, next] = nav.querySelectorAll('.carousel-btn');
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const overflow = max > 4;
      nav.hidden = !overflow;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= max - 4;
    };
    const step = () => {
      const card = track.querySelector('.card, .work-item:not([hidden])');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    };
    nav.querySelectorAll('.carousel-btn').forEach((b) => b.addEventListener('click', () => {
      // move 2 cards with a slower, eased slide (the browser's own smooth scroll is too quick)
      const max = track.scrollWidth - track.clientWidth;
      const from = track.scrollLeft;
      const to = Math.max(0, Math.min(max, from + Number(b.dataset.dir) * step() * 2));
      if (to === from) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { track.scrollLeft = to; return; }
      cancelAnimationFrame(track._anim);
      const dur = 900, t0 = performance.now();
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      track.style.scrollSnapType = 'none';
      track.style.scrollBehavior = 'auto';
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        track.scrollLeft = from + (to - from) * ease(p);
        if (p < 1) track._anim = requestAnimationFrame(tick);
        else { track.style.scrollSnapType = ''; track.style.scrollBehavior = ''; }
      };
      track._anim = requestAnimationFrame(tick);
    }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    update();
  });
})();

// Carousel v2: place side arrows at image height, fade only when more to the right
(() => {
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.cards');
    const sync = () => {
      const media = track.querySelector('.card-media, .work-item:not([hidden]) .work-thumb');
      if (media) root.style.setProperty('--media-h', media.getBoundingClientRect().height + 'px');
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      root.style.setProperty('--fade-end', atEnd ? '0' : '1');
    };
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    window.addEventListener('load', sync);
    sync();
  });
})();

// Full-screen video viewer for video cards
(() => {
  const viewer = document.querySelector('.video-viewer');
  if (!viewer) return;
  const vid = viewer.querySelector('video');
  const closeBtn = viewer.querySelector('.lightbox-close');
  let last = null;
  const close = () => { vid.pause(); vid.removeAttribute('src'); vid.load(); viewer.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); };
  document.querySelectorAll('[data-video]').forEach((b) => b.addEventListener('click', () => {
    last = b; vid.src = b.dataset.video; viewer.hidden = false; document.body.style.overflow = 'hidden';
    vid.play().catch(() => {}); closeBtn.focus();
  }));
  closeBtn.addEventListener('click', close);
  viewer.addEventListener('click', (e) => { if (e.target === viewer) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !viewer.hidden) close(); });
})();

// YouTube work videos: open in the full-screen viewer (privacy-enhanced embed)
(() => {
  const viewer = document.querySelector('.video-viewer');
  if (!viewer) return;
  const vid = viewer.querySelector('video');
  const closeBtn = viewer.querySelector('.lightbox-close');
  let last = null;
  const close = () => {
    const f = viewer.querySelector('iframe');
    if (f) f.remove();
    vid.hidden = false;
    viewer.hidden = true;
    document.body.style.overflow = '';
    if (last) last.focus();
  };
  document.querySelectorAll('[data-yt]').forEach((b) => b.addEventListener('click', () => {
    last = b;
    vid.pause(); vid.hidden = true;
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.dataset.yt) + '?autoplay=1&rel=0';
    f.title = b.getAttribute('aria-label') || 'Video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    viewer.appendChild(f);
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }));
  closeBtn.addEventListener('click', () => { if (viewer.querySelector('iframe')) close(); });
  viewer.addEventListener('click', (e) => { if (e.target === viewer && viewer.querySelector('iframe')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && viewer.querySelector('iframe')) close(); });
})();

/* Showreel tabs */
(function () {
  var tabs = document.querySelector('.work-tabs'); if (!tabs) return;
  var items = [].slice.call(document.querySelectorAll('.work-grid-tabs .work-item'));
  var btns = [].slice.call(tabs.querySelectorAll('[data-filter]'));
  btns.forEach(function (b) {
    var f = b.dataset.filter;
    var n = items.filter(function (i) { return f === 'all' || i.dataset.cat === f; }).length;
    var nEl = b.querySelector('.n'); if (nEl) nEl.textContent = n;
    if (!n) b.hidden = true;
    b.addEventListener('click', function () {
      btns.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      items.forEach(function (i) { i.hidden = !(f === 'all' || i.dataset.cat === f); });
      var track = document.querySelector('.work-grid-tabs');
      if (track) { track.scrollLeft = 0; track.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('resize')); }
    });
  });
  if (btns.filter(function (b) { return !b.hidden; }).length < 3) tabs.hidden = true;
})();

/* Shoot dates: the end date can't be before the start date */
(function () {
  var from = document.getElementById('f-dates-from'), to = document.getElementById('f-dates-to');
  if (!from || !to) return;
  var today = new Date().toISOString().slice(0, 10);
  from.min = today; to.min = today;
  from.addEventListener('change', function () {
    to.min = from.value || today;
    if (to.value && from.value && to.value < from.value) to.value = from.value;
  });
})();

/* Enquiry form: send in the background (FormSubmit's AJAX endpoint) so visitors don't sit through
   FormSubmit's slow page. Thank-you page shows as soon as the send is confirmed, or after 2.5s
   while the request finishes in the background (keepalive). Without JS the normal POST still works. */
(function () {
  var form = document.querySelector('form[name="enquiry"]');
  if (!form || !window.fetch) return;
  var btn = form.querySelector('button[type="submit"]');
  var label = btn ? btn.innerHTML : '';
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.dataset.sending) return;
    form.dataset.sending = '1';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    var next = data._next || '/thank-you';
    var done = false;
    var go = function () { if (!done) { done = true; window.location.href = next; } };
    var fail = function () {
      if (done) return;
      done = true; delete form.dataset.sending;
      if (btn) { btn.disabled = false; btn.innerHTML = label; }
      form.submit(); // fall back to the normal (slower) way so the enquiry is never lost
    };
    fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (j) { (j && String(j.success) === 'false') ? fail() : go(); })
      .catch(fail);
    setTimeout(go, 2500);
  });
})();
