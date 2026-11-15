/* ==========================================================================
   Nidomía · comportamiento de la tienda (sin dependencias)
   - El contenido y los precios llegan renderizados por Shopify (Liquid): el JS solo mejora.
   - Cada módulo corre dentro de safe(): si uno falla, el resto sigue funcionando.
   - Respeta prefers-reduced-motion: sin desplazamientos ni automatismos.
   - El carrito usa la API real de Shopify (/cart/add.js, /cart/change.js, /cart.js).
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var cfg = {};
  try { cfg = JSON.parse(doc.querySelector('[data-nd-config]').textContent) || {}; } catch (e) { cfg = {}; }
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var rootUrl = cfg.root || '/';

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.error('[nidomia] ' + name, e); } }
  function raf(fn) { var t = false; return function () { if (t) return; t = true; requestAnimationFrame(function () { t = false; fn(); }); }; }
  function canAutoplay() { return !reduced.matches && !saveData; }

  /* ---------- dinero: mismo formato que usa Shopify en la tienda ---------- */
  var MONEY = {
    amount: [',', '.', 2], amount_no_decimals: [',', '.', 0],
    amount_with_comma_separator: ['.', ',', 2], amount_no_decimals_with_comma_separator: ['.', ',', 0],
    amount_with_apostrophe_separator: ["'", '.', 2], amount_no_decimals_with_space_separator: [' ', '.', 0],
    amount_with_space_separator: [' ', ',', 2], amount_with_period_and_space_separator: [' ', '.', 2]
  };
  function money(cents) {
    var f = cfg.money || '$ {{amount_no_decimals_with_comma_separator}}';
    return f.replace(/\{\{\s*(\w+)\s*\}\}/, function (m, t) {
      var spec = MONEY[t] || MONEY.amount_no_decimals_with_comma_separator;
      var dec = spec[2];
      if (dec === 2 && cents % 100 === 0) dec = 0; // como money_without_trailing_zeros
      var n = (Math.round(cents) / 100).toFixed(dec).split('.');
      n[0] = n[0].replace(/\B(?=(\d{3})+(?!\d))/g, spec[0]);
      return n.join(spec[1]);
    });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- aparición al scrollear (contenido visible si algo falla) ---------- */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!els.length || reduced.matches || !('IntersectionObserver' in window)) return;
    root.classList.add('nd-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in'); else io.observe(el);
    });
    setTimeout(function () { els.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight * 1.1) el.classList.add('is-in'); }); }, 4000);
    setTimeout(function () { els.forEach(function (el) { el.classList.add('is-in'); }); }, 9000);
  }

  /* ---------- franja de cuotas y envío ---------- */
  function initPerks() {
    var bar = $('[data-nd-perks]'); var btn = bar && $('[data-nd-perks-toggle]', bar);
    if (!bar || !btn) return;
    btn.addEventListener('click', function () {
      var paused = bar.getAttribute('data-paused') !== 'true';
      bar.setAttribute('data-paused', paused ? 'true' : 'false');
      root.setAttribute('data-nd-paused', paused ? 'true' : 'false');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.setAttribute('aria-label', paused ? 'Reanudar anuncios' : 'Pausar anuncios');
    });
  }

  /* ---------- barra de progreso de lectura ---------- */
  function initProgress() {
    var bar = $('[data-nd-progress]'); if (!bar) return;
    var upd = raf(function () {
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)).toFixed(4) : 0);
    });
    window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  }

  /* ---------- ahorro que se cuenta al aparecer (el texto final ya está en el HTML) ---------- */
  function initCountUp() {
    var els = $$('[data-nd-count]');
    if (!els.length || reduced.matches || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target; var to = Number(el.getAttribute('data-nd-count')) * 100; var final = el.getAttribute('data-nd-money') || el.textContent;
        if (!to) return; var t0 = performance.now(); var dur = 1100;
        (function step(t) { var k = Math.min(1, (t - t0) / dur); var v = to * (1 - Math.pow(1 - k, 3)); el.textContent = k < 1 ? money(Math.round(v / 100) * 100) : final; if (k < 1) requestAnimationFrame(step); })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- diálogos (menú, opinión) ---------- */
  function initDialogs() {
    $$('[data-nd-menu-open]').forEach(function (b) { b.addEventListener('click', function () { var d = $('#nd-menu'); if (d && d.showModal) d.showModal(); }); });
    $$('[data-nd-opinar]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = $('#nd-opinar'); if (!d || !d.showModal) return;
        var i = $('[name="contact[Producto]"]', d); if (i) i.value = b.getAttribute('data-nd-opinar') || '';
        d.showModal();
      });
    });
    $$('dialog.nd-sheet').forEach(function (d) {
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
      $$('[data-nd-close]', d).forEach(function (b) { b.addEventListener('click', function () { d.close(); }); });
    });
    // los links del menú cierran la hoja antes de navegar a un ancla de la misma página
    $$('#nd-menu a').forEach(function (a) { a.addEventListener('click', function () { var d = $('#nd-menu'); if (d) d.close(); }); });
  }

  /* ---------- comparador arrastrable ---------- */
  function initCompare(box) {
    var frame = $('.nd-compare-frame', box); var range = $('.nd-compare-range', box);
    var la = ($('.nd-compare-label-a', box) || {}).textContent || '';
    var dragging = false; var anim = null;
    function set(p) {
      p = Math.max(0, Math.min(100, p));
      box.style.setProperty('--split', p + '%');
      range.value = Math.round(p);
      range.setAttribute('aria-valuetext', Math.round(p) + '% de la vista de «' + la + '»');
      $$('[data-nd-cmp]', box).forEach(function (b) { b.setAttribute('aria-pressed', String((Number(b.getAttribute('data-nd-cmp')) === 100) === (p >= 50))); });
    }
    function fromEvent(e) { var r = frame.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; }
    function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } }
    function interacted() { box.dispatchEvent(new CustomEvent('nd:interact', { bubbles: true })); }
    frame.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stopAnim(); dragging = true; frame.classList.add('is-drag'); frame.classList.remove('is-hint');
      try { frame.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ }
      set(fromEvent(e)); interacted();
    });
    frame.addEventListener('pointermove', function (e) { if (dragging) set(fromEvent(e)); });
    function end() { dragging = false; frame.classList.remove('is-drag'); }
    frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end); frame.addEventListener('lostpointercapture', end);
    range.addEventListener('input', function () { stopAnim(); set(Number(range.value)); interacted(); });
    $$('[data-nd-cmp]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var to = Number(b.getAttribute('data-nd-cmp')); var from = parseFloat(getComputedStyle(box).getPropertyValue('--split')) || 50;
        stopAnim(); interacted();
        if (reduced.matches) { set(to); return; }
        var t0 = performance.now(); var dur = 420;
        (function step(t) { var k = Math.min(1, (t - t0) / dur); var e = 1 - Math.pow(1 - k, 3); set(from + (to - from) * e); if (k < 1) anim = requestAnimationFrame(step); else anim = null; })(t0);
      });
    });
    set(parseFloat(box.style.getPropertyValue('--split')) || 50);
    // pista visual: una sola vez, cuando se ve por primera vez
    if (!reduced.matches && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { frame.classList.add('is-hint'); io.disconnect(); } }, { threshold: 0.6 });
      io.observe(frame);
    }
  }

  /* ---------- videos propios (fragmentos base64 → Blob) ---------- */
  function b64ToBytes(s) { var bin = atob(s); var n = bin.length; var out = new Uint8Array(n); for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i); return out; }
  function initClip(el) {
    var v = $('video', el); var btn = $('[data-nd-clip-btn]', el);
    var chunks = (v.getAttribute('data-chunks') || '').split(',').filter(Boolean);
    var loading = null; var ready = false;
    function load() {
      if (ready) return Promise.resolve();
      if (loading) return loading;
      el.classList.add('is-loading');
      loading = Promise.all(chunks.map(function (u) {
        return fetch(u).then(function (r) { if (!r.ok) throw new Error('video ' + r.status); return r.json(); }).then(b64ToBytes);
      })).then(function (parts) {
        v.src = URL.createObjectURL(new Blob(parts, { type: 'video/mp4' }));
        ready = true; el.classList.remove('is-loading');
      }).catch(function (err) { loading = null; el.classList.remove('is-loading'); throw err; });
      return loading;
    }
    function play() { return load().then(function () { return v.play(); }).catch(function () { /* el usuario puede volver a tocar */ }); }
    function pause() { v.pause(); }
    v.addEventListener('playing', function () { el.classList.add('is-playing'); });
    v.addEventListener('pause', function () { el.classList.remove('is-playing'); });
    btn.addEventListener('click', function () { if (el.classList.contains('is-playing')) pause(); else play(); });
    el.ndPlay = play; el.ndPause = pause;
    el.ndRestart = function () { try { v.currentTime = 0; } catch (e) { /* aún sin cargar */ } return play(); };
  }

  /* ---------- referencias de YouTube: se incrustan recién al tocar ---------- */
  function initYt(el) {
    var btn = $('[data-nd-yt-btn]', el);
    btn.addEventListener('click', function () {
      var p = ['autoplay=1', 'playsinline=1', 'rel=0'];
      if (el.dataset.start) p.push('start=' + el.dataset.start);
      if (el.dataset.end) p.push('end=' + el.dataset.end);
      var f = doc.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + el.dataset.id + '?' + p.join('&');
      f.title = btn.getAttribute('aria-label') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
      el.appendChild(f); btn.remove();
      $$('img,.nd-yt-cap', el).forEach(function (n) { n.style.display = 'none'; });
      el.classList.add('is-on'); el.style.setProperty('--ar', '16 / 9');
    });
  }

  /* ---------- carrusel «Una solución para cada día» (cada 3 s, con pausa y avance) ---------- */
  function initScenes(sec) {
    var slides = $$('[data-nd-slide]', sec); var tabs = $$('[data-nd-tab]', sec);
    var bPrev = $('[data-nd-prev]', sec); var bNext = $('[data-nd-next]', sec); var bTog = $('[data-nd-toggle]', sec);
    var interval = Number(sec.getAttribute('data-interval')) || 3000;
    var idx = 0; var running = canAutoplay(); var inView = false; var hovering = false; var timer = null; var started = 0; var remaining = interval;
    sec.style.setProperty('--interval', interval + 'ms');
    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { var on = n === idx; s.classList.toggle('is-active', on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); if (!on) s.setAttribute('inert', ''); else s.removeAttribute('inert'); });
      tabs.forEach(function (t, n) { var on = n === idx; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      var dk = $('[data-nd-deck]', sec); if (dk) dk.style.setProperty('--tint', slides[idx].getAttribute('data-tint') || '');
      remaining = interval; schedule();
    }
    function clear() { if (timer) { clearTimeout(timer); timer = null; } }
    function active() { return running && inView && !hovering && !doc.hidden; }
    function schedule() {
      clear();
      sec.setAttribute('data-running', running ? 'true' : 'false');
      sec.setAttribute('data-held', active() ? 'false' : 'true');
      if (!active()) return;
      started = performance.now();
      timer = setTimeout(function () { show(idx + 1); }, remaining);
    }
    function hold() { if (timer) { remaining = Math.max(300, remaining - (performance.now() - started)); } clear(); sec.setAttribute('data-held', 'true'); }
    function release() { schedule(); }
    function setRunning(on) {
      running = on; remaining = interval;
      bTog.setAttribute('aria-pressed', String(!running));
      bTog.setAttribute('aria-label', running ? 'Pausar el cambio automático' : 'Reanudar el cambio automático');
      schedule();
    }
    bPrev.addEventListener('click', function () { show(idx - 1); });
    bNext.addEventListener('click', function () { show(idx + 1); });
    bTog.addEventListener('click', function () { setRunning(!running); });
    tabs.forEach(function (t, n) {
      t.addEventListener('click', function () { show(n); });
      t.addEventListener('keydown', function (e) {
        var k = e.key; var to = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') to = n + 1; else if (k === 'ArrowLeft' || k === 'ArrowUp') to = n - 1; else if (k === 'Home') to = 0; else if (k === 'End') to = tabs.length - 1;
        if (to !== null) { e.preventDefault(); show(to); tabs[idx].focus(); }
      });
    });
    // si la persona arrastra la comparación o enfoca un control, se frena el cambio automático
    sec.addEventListener('nd:interact', function () { if (running) setRunning(false); });
    sec.addEventListener('focusin', function (e) { if (e.target.closest('.nd-deck') && running) setRunning(false); });
    var deck = $('[data-nd-deck]', sec);
    deck.addEventListener('mouseenter', function () { hovering = true; hold(); });
    deck.addEventListener('mouseleave', function () { hovering = false; release(); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) hold(); else release(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) release(); else hold(); }, { threshold: 0.35 }).observe(sec);
    } else { inView = true; }
    bTog.setAttribute('aria-pressed', String(!running));
    bTog.setAttribute('aria-label', running ? 'Pausar el cambio automático' : 'Reanudar el cambio automático');
    if (reduced.addEventListener) reduced.addEventListener('change', function () { if (reduced.matches && running) setRunning(false); });
    show(0);
  }

  /* ---------- galería de la ficha ---------- */
  function initGallery(g) {
    var track = $('[data-nd-track]', g); var slides = $$('.nd-gallery-slide', g);
    var dots = $$('.nd-gallery-dots i', g); var thumbs = $$('.nd-gallery-thumbs button', g); var count = $('[data-nd-count]', g);
    function current() { return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth))); }
    var update = raf(function () {
      var i = current();
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === i); });
      thumbs.forEach(function (t, n) { if (n === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
      if (count) count.textContent = (i + 1) + ' / ' + slides.length;
    });
    track.addEventListener('scroll', update, { passive: true });
    thumbs.forEach(function (t, n) { t.addEventListener('click', function () { track.scrollTo({ left: n * track.clientWidth, behavior: reduced.matches ? 'auto' : 'smooth' }); }); });
  }

  /* ---------- compra: pack, precio, cuotas y ahorro sincronizados ---------- */
  function initBuy(pdp) {
    var buy = $('[data-nd-buy]', pdp); var form = $('[data-nd-form]', pdp); if (!buy || !form) return;
    var inputs = $$('.nd-pack-input', form); var box = $('[data-nd-pricebox]', buy);
    var cta = $('[data-nd-cta]', form); var msg = $('[data-nd-msg]', form);
    var bar = $('[data-nd-sticky]', pdp); var barAdd = bar && $('[data-nd-sticky-add]', bar);
    function cur() { for (var i = 0; i < inputs.length; i++) if (inputs[i].checked) return inputs[i]; return inputs[0]; }
    function txt(sel, v, ctx) { var n = $(sel, ctx || buy); if (n) n.textContent = v; }
    function render(animate) {
      var i = cur(); var d = i.dataset; var hasSave = d.hasSave === '1';
      inputs.forEach(function (n) { var l = n.closest('.nd-pack'); if (l) l.classList.toggle('is-selected', n === i); });
      txt('[data-o="price"]', d.price);
      var was = $('[data-o="was"]', buy), sv = $('[data-o="save"]', buy);
      if (was) { was.hidden = !hasSave; txt('[data-o="was-v"]', d.ref); }
      if (sv) { sv.hidden = !hasSave; txt('[data-o="save-v"]', d.save); txt('[data-o="pct"]', d.pct + '% menos'); }
      var c = $('[data-o="cuotas"]', buy); if (c && cfg.cuotas) c.textContent = cfg.cuotas + ' cuotas de ' + d.cuota;
      txt('[data-o="live"]', d.name + ': ' + d.price + (hasSave ? ', ahorrás ' + d.save : '') + (cfg.cuotas ? ', ' + cfg.cuotas + ' cuotas de ' + d.cuota : ''));
      if (bar) {
        txt('[data-nd-sticky-price]', d.price, bar); txt('[data-nd-sticky-pack]', d.name, bar);
        var sw = $('[data-nd-sticky-was]', bar); if (sw) { sw.hidden = !hasSave; sw.textContent = d.ref; }
      }
      if (cta) cta.setAttribute('aria-label', 'Agregar al carrito: ' + d.name + ', ' + d.price);
      if (animate && box && !reduced.matches) { box.classList.remove('is-bump'); void box.offsetWidth; box.classList.add('is-bump'); }
    }
    inputs.forEach(function (n) { n.addEventListener('change', function () { render(true); }); });
    var m = /[?&]pack=(\d+)/.exec(location.search);
    if (m) { inputs.forEach(function (n) { if (n.dataset.units === m[1] && !n.disabled) n.checked = true; }); }
    render(false);

    function setBusy(on) {
      [cta, barAdd].forEach(function (b) { if (!b) return; b.classList.toggle('is-loading', on); b.disabled = on || b.hasAttribute('data-soldout'); });
    }
    function add() {
      var i = cur(); if (!i || i.disabled) return;
      if (msg) msg.hidden = true;
      setBusy(true);
      addToCart(i.value).then(function () { /* el carrito ya se abrió */ }).catch(function (err) {
        if (msg) { msg.textContent = err.message || 'No pudimos agregarlo al carrito. Probá de nuevo.'; msg.hidden = false; }
      }).then(function () { setBusy(false); });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); add(); });
    if (cta && cta.disabled) cta.setAttribute('data-soldout', '');
    if (barAdd) { if (barAdd.disabled) barAdd.setAttribute('data-soldout', ''); barAdd.addEventListener('click', add); }
  }

  /* ---------- barra inferior móvil ---------- */
  function initSticky(pdp) {
    var bar = $('[data-nd-sticky]', pdp); var cta = $('[data-nd-cta]', pdp); if (!bar || !cta || !('IntersectionObserver' in window)) return;
    var mq = window.matchMedia('(max-width: 899px)'); var ctaVisible = true;
    function update() {
      var show = mq.matches && !ctaVisible && window.scrollY > 120;
      bar.classList.toggle('is-on', show); bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (show) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
    }
    new IntersectionObserver(function (en) { ctaVisible = en[0].isIntersecting; update(); }, { threshold: 0 }).observe(cta);
    window.addEventListener('scroll', raf(update), { passive: true });
    if (mq.addEventListener) mq.addEventListener('change', update);
    update();
  }

  /* ---------- «Cómo lo consigue»: cada explicación con su demostración ---------- */
  function initHow(sec) {
    var steps = $$('[data-nd-step]', sec); var medias = $$('[data-nd-media]', sec); if (!steps.length) return;
    var desk = window.matchMedia('(min-width: 900px)'); var cur = -1;
    function clipsIn(m) { return $$('.nd-clip', m); }
    function playMedia(m, on) {
      // en el carrusel de cortes solo corre el panel visible
      clipsIn(m).forEach(function (c) {
        var pane = c.closest('.nd-switch-pane'); var paneOn = !pane || pane.classList.contains('is-active');
        if (on && paneOn && canAutoplay() && (c.hasAttribute('data-autoplay') || pane)) c.ndRestart(); else if (c.ndPause) c.ndPause();
      });
    }
    function activate(i) {
      if (i === cur) return; cur = i;
      steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
      medias.forEach(function (m, n) { var on = n === i; m.classList.toggle('is-active', on); if (desk.matches) { if (on) playMedia(m, true); else playMedia(m, false); } });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) activate(Number(e.target.getAttribute('data-nd-step'))); }); }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
      // en celular cada demostración está junto a su texto: corre cuando se ve
      var io2 = new IntersectionObserver(function (en) { en.forEach(function (e) { if (!desk.matches) playMedia(e.target, e.isIntersecting && e.intersectionRatio > 0.5); }); }, { threshold: [0, 0.55] });
      medias.forEach(function (m) { io2.observe(m); });
    }
  }

  /* ---------- selector de piezas / cortes (cada opción con su propio video) ---------- */
  function initSwitch(sw) {
    var panes = $$('.nd-switch-pane', sw); var chips = $$('[data-pane-target]', sw);
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        var t = ch.getAttribute('data-pane-target');
        chips.forEach(function (c) { c.setAttribute('aria-selected', String(c === ch)); });
        panes.forEach(function (p) {
          var on = p.getAttribute('data-pane') === t; p.classList.toggle('is-active', on);
          $$('.nd-clip', p).forEach(function (c) { if (on) c.ndRestart(); else c.ndPause(); });
        });
      });
    });
  }

  /* ---------- opiniones breves rotativas ---------- */
  function initRot(rot) {
    var stage = $('[data-nd-rot-stage]', rot); var items = $$('.nd-rev', stage); var dotsBox = $('[data-nd-rot-dots]', rot);
    if (!items.length) return;
    var i = 0; var timer = null; var auto = !reduced.matches && items.length > 1; var paused = false;
    items.forEach(function (it, n) {
      var b = doc.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Opinión ' + (n + 1) + ' de ' + items.length);
      b.addEventListener('click', function () { auto = false; stop(); show(n); stage.setAttribute('aria-live', 'polite'); });
      dotsBox.appendChild(b);
    });
    function show(n) {
      i = (n + items.length) % items.length;
      items.forEach(function (it, k) { it.classList.toggle('is-on', k === i); if (k === i) it.removeAttribute('aria-hidden'); else it.setAttribute('aria-hidden', 'true'); });
      $$('button', dotsBox).forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (auto && !paused) timer = setInterval(function () { show(i + 1); }, 6500); }
    rot.addEventListener('pointerenter', function () { paused = true; stop(); });
    rot.addEventListener('pointerleave', function () { paused = false; start(); });
    rot.addEventListener('focusin', function () { paused = true; stop(); });
    rot.addEventListener('focusout', function () { paused = false; start(); });
    stage.setAttribute('aria-live', auto ? 'off' : 'polite');
    show(0); start();
  }

  function initRevMore() {
    var grid = $('[data-nd-revgrid]'); var btn = $('[data-nd-revmore]'); if (!grid || !btn) return;
    if ($$('.nd-rev', grid).length <= 4) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      var open = grid.classList.toggle('is-collapsed') === false;
      btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Ver menos opiniones' : 'Ver todas las opiniones';
    });
  }

  /* ---------- carrito real de Shopify ---------- */
  var cartDialog = null; var cartState = null;
  var vmap = {};
  Object.keys(cfg.products || {}).forEach(function (k) {
    var p = cfg.products[k]; if (!p) return;
    Object.keys(p.variants || {}).forEach(function (id) { vmap[id] = { key: k, units: p.variants[id].units, name: p.variants[id].name, price: p.variants[id].price, single: p.price, product: p }; });
  });
  function api(path, body) {
    return fetch(rootUrl + path, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.description || j.message || 'No pudimos actualizar el carrito.'); throw e; } return j; }); });
  }
  function getCart() { return api('cart.js'); }

  /* Vista previa: si un producto todavía no existe en Shopify (solo en borrador) su carrito vive en el navegador
     y NUNCA llega al checkout. Con productos reales no se usa. */
  var PKEY = 'nd-preview-cart';
  var NAMES = { mandolina: 'Mandolina SupremeCut', mopa: 'Mopa plana con escurridor', tender: 'Tender retráctil de pared', lapiz: 'Lápiz 3D + pizarra LED', arrancador: 'Arrancador e inflador Oryx' };
  function isPv(id) { return String(id).indexOf('preview-') === 0; }
  function pvRead() { try { var a = JSON.parse(sessionStorage.getItem(PKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function pvWrite(a) { try { sessionStorage.setItem(PKEY, JSON.stringify(a)); } catch (e) { /* sin almacenamiento */ } }
  function pvItems() {
    return pvRead().map(function (l) {
      var v = vmap[l.id]; if (!v) return null;
      var total = v.price * l.qty;
      return { preview: true, variant_id: l.id, key: 'pv:' + l.id, quantity: l.qty, product_title: NAMES[v.key] || v.key, title: NAMES[v.key] || v.key, url: v.product.url, final_line_price: total, original_line_price: total, variant_title: v.name, image: '', featured_image: null };
    }).filter(Boolean);
  }
  function getCartView() {
    return getCart().then(function (c) {
      var pv = pvItems(); var total = c.total_price; var count = c.item_count;
      pv.forEach(function (i) { total += i.final_line_price; count += i.quantity; });
      return { items: c.items.concat(pv), total_price: total, item_count: count, preview: pv.length > 0, real_count: c.items.length };
    });
  }
  function setCount(cart, bump) {
    $$('[data-nd-cart-count]').forEach(function (n) {
      n.textContent = cart.item_count; n.hidden = !cart.item_count;
      if (bump && !reduced.matches) { n.classList.remove('is-bump'); void n.offsetWidth; n.classList.add('is-bump'); }
    });
    $$('[data-nd-cart-open]').forEach(function (a) { a.setAttribute('aria-label', 'Abrir carrito, ' + cart.item_count + (cart.item_count === 1 ? ' unidad' : ' unidades')); });
  }
  function lineSaving(it) {
    var v = vmap[String(it.variant_id)]; var ref = it.original_line_price || it.final_line_price;
    if (v && v.single) ref = Math.max(ref, v.single * v.units * it.quantity);
    return Math.max(0, ref - it.final_line_price);
  }
  function lineHtml(it, idx, isNew) {
    var v = vmap[String(it.variant_id)]; var save = lineSaving(it); var ref = it.final_line_price + save;
    var thumb = v && cfg.thumbs && cfg.thumbs[v.key] ? cfg.thumbs[v.key] : (it.featured_image && it.featured_image.url) || it.image || '';
    var pack = v && v.name ? v.name : (it.variant_title && it.variant_title !== 'Default Title' ? it.variant_title : '');
    var t = esc(it.product_title || it.title);
    return '<li class="nd-line' + (isNew ? ' is-new' : '') + '" data-line="' + idx + '">' +
      '<a class="nd-line-img" href="' + esc(it.url) + '" tabindex="-1" aria-hidden="true">' + (thumb ? '<img src="' + esc(thumb) + '" alt="" width="76" height="76" loading="lazy">' : '') + '</a>' +
      '<div class="nd-line-info"><a class="nd-line-title" href="' + esc(it.url) + '">' + t + '</a>' +
      (pack ? '<p class="nd-line-pack">' + esc(pack) + (isNew ? ' <span class="nd-tag nd-tag-sky">Agregado</span>' : '') + '</p>' : '') +
      '<div class="nd-qty" role="group" aria-label="Cantidad de ' + t + '">' +
      '<button type="button" data-nd-qty="' + (it.quantity - 1) + '" data-line="' + idx + '" aria-label="Quitar una unidad de ' + t + '">' + minus() + '</button>' +
      '<output aria-live="polite">' + it.quantity + '</output>' +
      '<button type="button" data-nd-qty="' + (it.quantity + 1) + '" data-line="' + idx + '" aria-label="Agregar una unidad de ' + t + '">' + plus() + '</button></div>' +
      '<button type="button" class="nd-line-remove" data-nd-qty="0" data-line="' + idx + '">Quitar</button></div>' +
      '<div class="nd-line-price"><b>' + money(it.final_line_price) + '</b>' +
      (save > 0 ? '<s><span class="nd-sr">Por separado </span>' + money(ref) + '</s><em>Ahorrás ' + money(save) + '</em>' : '') + '</div></li>';
  }
  function minus() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>'; }
  function plus() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>'; }
  function emptyHtml() {
    return '<div class="nd-empty"><span class="nd-fact-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg></span>' +
      '<p>Tu carrito está vacío</p><a class="nd-btn nd-btn-quiet" href="' + esc(rootUrl) + '#soluciones" data-nd-keep>Ver las soluciones</a></div>';
  }
  function summaryHtml(cart, inDrawer) {
    var save = 0; cart.items.forEach(function (it) { save += lineSaving(it); });
    var c = cfg.cuotas ? Math.round(cart.total_price / cfg.cuotas) : 0;
    return '<p class="nd-total-row"><span>Total</span><b>' + money(cart.total_price) + '</b></p>' +
      (save > 0 ? '<p class="nd-sum-save"><span>Ahorrás en tu compra</span><b>' + money(save) + '</b></p>' : '') +
      (c ? '<p class="nd-sum-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>' + cfg.cuotas + ' cuotas de ' + money(c) + ' sin interés con tarjeta de crédito</p>' : '') +
      (cfg.envio ? '<p class="nd-sum-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>' + esc(cfg.envio) + '</p>' : '') +
      (cart.preview ? '<p class="nd-preview-note"><span><b>Vista previa.</b> Estos productos aún no están en Shopify: el pedido no llega al checkout. Se habilita cuando los publiques.</span></p><span class="nd-btn nd-btn-primary nd-btn-lg nd-btn-block" role="button" aria-disabled="true" tabindex="-1">Finalizar compra</span>' :
        '<a class="nd-btn nd-btn-primary nd-btn-lg nd-btn-block" href="' + esc(rootUrl) + 'checkout" data-nd-checkout>Finalizar compra</a>') +
      (inDrawer ? '<button type="button" class="nd-link" data-nd-close>Seguir comprando</button>' : '<a class="nd-link" href="' + esc(rootUrl) + '#soluciones">Seguir comprando</a>');
  }
  function renderDrawer(cart, newVariant) {
    var body = $('[data-nd-cart-body]', cartDialog); var foot = $('[data-nd-cart-foot]', cartDialog);
    if (!cart.items.length) { body.innerHTML = emptyHtml(); foot.innerHTML = ''; foot.hidden = true; return; }
    foot.hidden = false;
    var added = newVariant ? String(newVariant) : null;
    body.innerHTML = '<ul class="nd-lines">' + cart.items.map(function (it, n) { return lineHtml(it, n + 1, added && String(it.variant_id) === added); }).join('') + '</ul>';
    foot.innerHTML = summaryHtml(cart, true);
    var nw = $('.is-new', body); if (nw && nw.scrollIntoView) nw.scrollIntoView({ block: 'nearest' });
  }
  function renderPage(cart) {
    var box = $('[data-nd-cart-page]'); if (!box) return;
    if (!cart.items.length) { box.innerHTML = emptyHtml(); return; }
    box.innerHTML = '<div class="nd-cart-layout"><ul class="nd-lines">' + cart.items.map(function (it, n) { return lineHtml(it, n + 1, false); }).join('') + '</ul><aside class="nd-cart-summary" aria-label="Resumen de compra">' + summaryHtml(cart, false) + '</aside></div>';
  }
  function openCart(cart, newVariant) {
    if (!cartDialog || !cartDialog.showModal) { location.href = rootUrl + 'cart'; return; }
    cartState = cart; renderDrawer(cart, newVariant);
    if (!cartDialog.open) {
      cartDialog.showModal(); doc.body.classList.add('nd-lock');
      requestAnimationFrame(function () { requestAnimationFrame(function () { cartDialog.classList.add('is-in'); }); });
    }
  }
  function closeCart() {
    if (!cartDialog || !cartDialog.open) return;
    cartDialog.classList.remove('is-in');
    setTimeout(function () { if (cartDialog.open) cartDialog.close(); doc.body.classList.remove('nd-lock'); }, reduced.matches ? 0 : 340);
  }
  function addToCart(variantId) {
    if (isPv(variantId)) {
      var a = pvRead(); var f = a.filter(function (l) { return l.id === variantId; })[0];
      if (f) f.qty = Math.min(99, f.qty + 1); else a.push({ id: variantId, qty: 1 });
      pvWrite(a);
      return getCartView().then(function (cart) { setCount(cart, true); openCart(cart, variantId); return cart; });
    }
    return api('cart/add.js', { items: [{ id: Number(variantId), quantity: 1 }] }).then(getCartView).then(function (cart) {
      setCount(cart, true); openCart(cart, variantId); return cart;
    });
  }
  function changeLine(line, qty) {
    line = Number(line); qty = Number(qty);
    var done = function (cart) {
      cartState = cart; setCount(cart, false);
      if ($('[data-nd-cart-page]')) renderPage(cart);
      if (cartDialog && cartDialog.open) renderDrawer(cart);
    };
    var realCount = cartState ? cartState.real_count : 0;
    if (line > realCount) { // línea de vista previa
      var a = pvRead(); var i = line - realCount - 1;
      if (a[i]) { if (qty <= 0) a.splice(i, 1); else a[i].qty = Math.min(99, qty); pvWrite(a); }
      return getCartView().then(done);
    }
    return api('cart/change.js', { line: line, quantity: qty }).then(getCartView).then(done);
  }
  function initCart() {
    cartDialog = $('[data-nd-cart-drawer]');
    var onCartPage = cfg.page === 'cart';
    if (cartDialog) {
      cartDialog.addEventListener('click', function (e) { if (e.target === cartDialog) closeCart(); });
      cartDialog.addEventListener('cancel', function (e) { e.preventDefault(); closeCart(); });
      cartDialog.addEventListener('close', function () { doc.body.classList.remove('nd-lock'); cartDialog.classList.remove('is-in'); });
    }
    function delegate(e) {
      var q = e.target.closest('[data-nd-qty]');
      if (q) { e.preventDefault(); q.disabled = true; changeLine(q.getAttribute('data-line'), q.getAttribute('data-nd-qty')).catch(function () { q.disabled = false; }); return; }
      if (e.target.closest('[data-nd-close]') && cartDialog && cartDialog.contains(e.target)) { closeCart(); return; }
      if (e.target.closest('[data-nd-keep]') && cartDialog && cartDialog.open) closeCart();
    }
    if (cartDialog) cartDialog.addEventListener('click', delegate);
    var pageBox = $('[data-nd-cart-page]'); if (pageBox) pageBox.addEventListener('click', delegate);
    $$('[data-nd-cart-open]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (onCartPage || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        getCartView().then(function (c) { setCount(c, false); openCart(c); }).catch(function () { location.href = a.href; });
      });
    });
    getCartView().then(function (c) { cartState = c; setCount(c, false); if (pageBox) renderPage(c); }).catch(function () { /* el contador queda con el valor del servidor */ });
    window.addEventListener('pageshow', function (e) { if (e.persisted) getCartView().then(function (c) { cartState = c; setCount(c, false); if (pageBox) renderPage(c); }).catch(function () {}); });
  }

  /* ---------- arranque ---------- */
  function boot() {
    safe(initReveal, 'reveal');
    safe(initPerks, 'perks');
    safe(initProgress, 'progress');
    safe(initCountUp, 'countup');
    safe(initDialogs, 'dialogs');
    safe(initCart, 'cart');
    $$('[data-nd-compare]').forEach(function (b) { safe(function () { initCompare(b); }, 'compare'); });
    $$('[data-nd-clip]').forEach(function (b) { safe(function () { initClip(b); }, 'clip'); });
    $$('[data-nd-yt]').forEach(function (b) { safe(function () { initYt(b); }, 'yt'); });
    $$('[data-nd-switch]').forEach(function (b) { safe(function () { initSwitch(b); }, 'switch'); });
    $$('[data-nd-scenes]').forEach(function (b) { safe(function () { initScenes(b); }, 'scenes'); });
    $$('[data-nd-pdp]').forEach(function (p) {
      safe(function () { initGallery($('[data-nd-gallery]', p)); }, 'gallery');
      safe(function () { initBuy(p); }, 'buy');
      safe(function () { initSticky(p); }, 'sticky');
      safe(function () { initHow($('[data-nd-how]', p)); }, 'how');
      $$('[data-nd-rot]', p).forEach(function (r) { safe(function () { initRot(r); }, 'rot'); });
    });
    safe(initRevMore, 'revmore');
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
