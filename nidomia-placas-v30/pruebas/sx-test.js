// Pruebas de las secciones de venta: contenido, contadores, tabla accesible, movimiento reducido, sin errores.
const { chromium, devices } = require('playwright');
const base = process.argv[2];
const res = []; const ok = (n, c, x = '') => { res.push(c); console.log((c ? 'OK   ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const prods = [['mandolina-supremecut', 3], ['mopa-plana-con-escurridor', 2], ['tender-retractil-de-pared', 2], ['lapiz-3d-y-pizarra-led', 2], ['arrancador-e-inflador-oryx', 1]];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'es-AR' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  for (const [slug, firstStat] of prods) {
    await p.goto(base + '/products/' + slug, { waitUntil: 'load' }); await p.waitForTimeout(900);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 450) { await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(140); }
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const secs = [...document.querySelectorAll('.nd-sx')];
      const h2 = secs.map(s => (s.querySelector('h2') || {}).textContent || '').filter(Boolean);
      const cards = document.querySelectorAll('.nd-sx-card').length;
      const stats = [...document.querySelectorAll('.nd-sx-num')].map(n => n.textContent.replace(/\s+/g, ' ').trim());
      const countEls = [...document.querySelectorAll('[data-sx-count]')].map(e => [e.getAttribute('data-sx-count'), e.textContent]);
      const tbl = document.querySelector('.nd-cmpx table');
      const heads = tbl ? [...tbl.querySelectorAll('thead th')].map(t => t.textContent.trim()) : [];
      const rows = tbl ? tbl.querySelectorAll('tbody tr').length : 0;
      const rowHeads = tbl ? tbl.querySelectorAll('tbody th[scope="row"]').length : 0;
      const marks = tbl ? tbl.querySelectorAll('.nd-sx-mark .nd-sr').length : 0;
      const tl = document.querySelectorAll('.nd-tl li').length;
      const allIn = secs.every(s => s.classList.contains('is-in'));
      const hs = document.documentElement.scrollWidth <= window.innerWidth + 1;
      const link = document.querySelector('.nd-sx-gift a[href="#comprar"]'); const tgt = document.getElementById('comprar');
      return { n: secs.length, h2, cards, stats, countEls, heads, rows, rowHeads, marks, tl, allIn, hs, gift: !!(link && tgt) };
    });
    ok(slug + ': 5 secciones nuevas, todas visibles', r.n === 5 && r.allIn, r.n + ' secciones');
    ok(slug + ': 4 beneficios y 4 pasos de compra', r.cards === 4 && r.tl === 4, r.cards + '/' + r.tl);
    ok(slug + ': contadores terminan en su valor final', r.countEls.every(([a, t]) => a === t), JSON.stringify(r.countEls));
    ok(slug + ': tabla accesible (encabezados, filas y textos para lector)', r.heads.length === 4 && r.rowHeads === r.rows && r.marks === r.rows * 3, r.heads.join(' | ') + ' · ' + r.rows + ' filas');
    ok(slug + ': botón «Ir a comprar» apunta a la compra', r.gift);
    ok(slug + ': sin desplazamiento horizontal', r.hs);
  }
  console.log('errores:', errs.length ? errs.join(' | ') : 'ninguno');
  await ctx.close();
  // movimiento reducido
  const rctx = await b.newContext({ ...devices['iPhone 13'], locale: 'es-AR', reducedMotion: 'reduce' }); const rp = await rctx.newPage();
  await rp.goto(base + '/products/mandolina-supremecut', { waitUntil: 'load' }); await rp.waitForTimeout(1000);
  const rr = await rp.evaluate(() => {
    const anims = document.getAnimations().filter(a => { const t = a.effect && a.effect.target; return t && t.closest && t.closest('.nd-sx'); }).length;
    const vis = [...document.querySelectorAll('.nd-sx [data-reveal], .nd-sx .nd-sx-ico-wrap, .nd-sx .nd-tl-ico')].every(e => getComputedStyle(e).opacity === '1');
    const marks = [...document.querySelectorAll('.nd-sx-mark svg path')].every(e => getComputedStyle(e).strokeDashoffset === '0px' || getComputedStyle(e).strokeDashoffset === '0');
    const counts = [...document.querySelectorAll('[data-sx-count]')].every(e => e.textContent === e.getAttribute('data-sx-count'));
    return { anims, vis, marks, counts };
  });
  ok('reducido: sin animaciones en las secciones nuevas', rr.anims === 0, String(rr.anims));
  ok('reducido: todo el contenido visible, tildes dibujados y números finales', rr.vis && rr.marks && rr.counts, JSON.stringify(rr));
  console.log(res.filter(Boolean).length + '/' + res.length + ' correctas'); await b.close(); process.exit(res.every(Boolean) ? 0 : 1);
})();
