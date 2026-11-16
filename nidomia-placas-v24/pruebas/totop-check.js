// «Volver arriba» no debe tapar el botón de compra; el botón de compra debe tener un nombre accesible que contenga su texto visible.
const { chromium, devices } = require('playwright');
const res = []; const ok = (n, c, x = '') => { res.push(c); console.log((c ? 'OK   ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch();
  for (const [label, ctxOpts] of [['celular', { ...devices['iPhone 13'], locale: 'es-AR' }], ['escritorio', { viewport: { width: 1280, height: 860 }, locale: 'es-AR' }]]) {
    const p = await (await b.newContext(ctxOpts)).newPage();
    await p.goto('http://localhost:8111/products/mandolina-supremecut', { waitUntil: 'load' }); await p.waitForTimeout(1200);
    const st = () => p.evaluate(() => { const t = document.querySelector('[data-nd-totop]'); const c = document.querySelector('[data-nd-cta]'); const tb = t.getBoundingClientRect(); const cb = c.getBoundingClientRect();
      const cs = getComputedStyle(t); const visible = cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.5;
      const overlap = visible && !(tb.right <= cb.left || tb.left >= cb.right || tb.bottom <= cb.top || tb.top >= cb.bottom);
      return { visible, overlap, ctaIn: document.body.classList.contains('nd-cta-in'), on: t.classList.contains('is-on') }; });
    // con el botón de compra a la vista, abajo de la pantalla (donde tapaba el precio)
    await p.evaluate(() => { const c = document.querySelector('[data-nd-cta]'); const r = c.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY - (innerHeight - 100), behavior: 'instant' }); }); await p.waitForTimeout(700);
    let s = await st(); ok(label + ': con el botón de compra a la vista, «volver arriba» no lo tapa', !s.overlap, JSON.stringify(s));
    // lejos del botón de compra (más abajo en la ficha): aparece
    await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.55, behavior: 'instant' })); await p.waitForTimeout(700);
    s = await st(); ok(label + ': más abajo, «volver arriba» aparece', s.visible && s.on && !s.ctaIn, JSON.stringify(s));
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(400);
    // nombre accesible
    const nm = await p.evaluate(() => { const c = document.querySelector('[data-nd-cta]'); return { aria: c.getAttribute('aria-label'), vis: c.innerText.replace(/\s+/g, ' ').trim() }; });
    ok(label + ': nombre accesible del botón empieza con lo que se ve', nm.aria.replace(/\s+/g, ' ').startsWith(nm.vis.replace(/\s*·\s*/, ' ')), JSON.stringify(nm));
    await p.close();
  }
  console.log(res.filter(Boolean).length + '/' + res.length + ' correctas'); await b.close(); process.exit(res.every(Boolean) ? 0 : 1);
})();
