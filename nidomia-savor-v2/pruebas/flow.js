// Recorrido completo en celular: home → ficha → pack → carrito → checkout, con verificación de importes.
// node flow.js <baseUrl> <outDir> [--product=/products/mandolina-supremecut] [--pack=2] [--reduced]
const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
const [base, outDir] = process.argv.slice(2);
const o = Object.fromEntries(process.argv.slice(4).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v === undefined ? true : v]; }));
fs.mkdirSync(outDir, { recursive: true });
const results = [];
const ok = (name, cond, extra = '') => { results.push([cond ? 'OK  ' : 'FAIL', name, extra]); console.log((cond ? 'OK   ' : 'FAIL ') + name + (extra ? '  → ' + extra : '')); };
const norm = s => String(s).replace(/\s+/g, ' ').trim();

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: o.reduced ? 'reduce' : 'no-preference', locale: 'es-AR' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = async n => page.screenshot({ path: path.join(outDir, n + '.png') });
  await page.request.get(base + '/cart/clear.js');

  /* ---------- HOME ---------- */
  await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(1200);
  const vw = await page.evaluate(() => window.innerWidth);
  ok('home: sin desplazamiento horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'scrollWidth=' + await page.evaluate(() => document.documentElement.scrollWidth));
  ok('home: el hero usa la imagen móvil', await page.evaluate(() => (document.querySelector('.nd-hero img').currentSrc || '').includes('movil')));
  const heroBtns = await page.$$eval('.nd-hero .nd-btn', els => els.map(e => e.textContent.trim()));
  ok('home: un único botón principal en el hero «Encontrá tu solución»', heroBtns.length === 1 && /Encontrá tu solución/.test(heroBtns[0]), JSON.stringify(heroBtns));
  const perksAnim = await page.evaluate(() => getComputedStyle(document.querySelector('.nd-perks-track')).animationName);
  ok('franja de cuotas y envío animada', o.reduced ? perksAnim === 'none' : perksAnim === 'nd-marquee', perksAnim);
  if (!o.reduced) {
    await page.tap('[data-nd-perks-toggle]');
    ok('franja: el botón la pausa', (await page.getAttribute('[data-nd-perks]', 'data-paused')) === 'true');
    await page.tap('[data-nd-perks-toggle]');
  }
  await shot('01-home-top');

  await page.tap('.nd-hero .nd-btn'); await page.waitForTimeout(900);
  const top = await page.evaluate(() => document.querySelector('#soluciones').getBoundingClientRect().top);
  ok('hero: el botón lleva a los productos (#soluciones)', top < 140 && top > -40, 'top=' + Math.round(top));
  const cards = await page.$$eval('.nd-cards .nd-card', els => els.map(e => ({ t: e.querySelector('.nd-card-title').textContent.trim(), p: e.querySelector('.nd-card-price b').textContent.trim(), l: e.querySelector('.nd-card-line').textContent.trim(), img: !!e.querySelector('img') })));
  ok('home: 5 tarjetas con imagen, beneficio y precio', cards.length === 5 && cards.every(c => c.img && c.l && /\$/.test(c.p)), cards.map(c => c.p).join(' | '));
  await shot('02-soluciones');

  /* ---------- DEMOSTRACIÓN: 3 s, pausa, avance, arrastre ---------- */
  await page.evaluate(() => document.querySelector('#como-funciona').scrollIntoView({ block: 'center' })); await page.waitForTimeout(500);
  const active = () => page.evaluate(() => [...document.querySelectorAll('[data-nd-slide]')].findIndex(s => s.classList.contains('is-active')));
  const a0 = await active();
  if (!o.reduced) {
    await page.waitForTimeout(3500);
    const a1 = await active();
    ok('demo: cambia de producto solo cada ~3 s', a1 === (a0 + 1) % 5, `${a0}→${a1}`);
    await page.tap('[data-nd-toggle]');
    const p0 = await active(); await page.waitForTimeout(3600);
    ok('demo: el botón pausa frena el cambio', (await active()) === p0 && (await page.getAttribute('[data-nd-toggle]', 'aria-pressed')) === 'true');
  } else {
    await page.waitForTimeout(3500);
    ok('demo: con movimiento reducido NO cambia sola', (await active()) === a0);
  }
  const b0 = await active(); await page.tap('[data-nd-next]'); await page.waitForTimeout(500);
  ok('demo: «siguiente» avanza', (await active()) === (b0 + 1) % 5);
  await page.tap('[data-nd-prev]'); await page.waitForTimeout(500);
  ok('demo: «anterior» retrocede', (await active()) === b0);
  // arrastre táctil real sobre el antes/después de la mandolina
  await page.tap('[data-nd-tab="0"]'); await page.waitForTimeout(700);
  const frame = await page.$('#demo-0 .nd-compare-frame'); await frame.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); const bb = await frame.boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const y = bb.y + bb.height / 2; const x0 = bb.x + bb.width * 0.5; const x1 = bb.x + bb.width * 0.82;
  const sp = async () => parseFloat(await page.evaluate(() => getComputedStyle(document.querySelector('#demo-0 .nd-compare')).getPropertyValue('--split')));
  const before = await sp();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / 8, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(250);
  const after = await sp();
  ok('demo: el antes/después se arrastra con el dedo', after > before + 20, `${before}% → ${after}%`);
  await shot('03-demo');
  const goto = await page.$eval('#demo-0 .nd-slide-go', a => a.getAttribute('href'));
  ok('demo: debajo hay acceso a la ficha de la mandolina', /mandolina/.test(goto), goto);

  /* ---------- OFERTAS ---------- */
  await page.evaluate(() => document.querySelector('#packs').scrollIntoView({ block: 'start' })); await page.waitForTimeout(700);
  const offers = await page.$$eval('.nd-offer', els => els.map(e => ({ best: e.classList.contains('is-best'), t: e.querySelector('.nd-offer-title').textContent.replace(/\s+/g, ' ').trim(), price: e.querySelector('.nd-offer-price b').textContent.trim(), save: e.querySelector('.nd-offer-save b').textContent.trim() })));
  ok('ofertas: una sola marcada «Mayor ahorro» y es la primera', offers.filter(x => x.best).length === 1 && offers[0].best, JSON.stringify(offers[0]));
  ok('ofertas: muestran precio y ahorro en pesos', offers.every(x => /\$/.test(x.price) && /Ahorrás \$/.test(x.save)));
  ok('home: no hay «Más vendido» sin datos que lo respalden', (await page.$$('.nd-tag-sky')).length === 0);
  await shot('04-ofertas');

  /* ---------- FICHA ---------- */
  const pdpUrl = o.product || '/products/mandolina-supremecut';
  await page.goto(base + '/', { waitUntil: 'load' });
  const href = pdpUrl; await page.evaluate(h => { const a = document.querySelector('.nd-card[href="' + h + '"]'); a.scrollIntoView({ block: 'center' }); }, href); await page.waitForTimeout(500);
  await page.tap('.nd-card[href="' + href + '"]'); await page.waitForURL('**' + href + '*'); await page.waitForTimeout(1200);
  ok('ficha: se llega tocando la tarjeta del home', page.url().includes(href));
  ok('ficha: sin desplazamiento horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  // orden de la columna de compra
  const order = await page.evaluate(() => {
    const sel = ['.nd-avail', '.nd-title', '.nd-rating', '.nd-pricebox', '.nd-b3', '.nd-packs', '[data-nd-cta]', '.nd-rot', '.nd-pay'];
    return sel.map(s => { const e = document.querySelector('.nd-buy ' + s); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : null; });
  });
  ok('ficha: orden disponibilidad → nombre → valoración → precio → beneficios → packs → botón → opiniones → pagos', order.every(v => v !== null) && order.every((v, i) => i === 0 || v > order[i - 1]), order.join(' < '));
  const firstView = await page.evaluate(() => { const r = n => document.querySelector(n).getBoundingClientRect(); return { title: r('.nd-title').bottom, price: r('.nd-price').bottom, cuotas: (document.querySelector('.nd-cuotas') ? r('.nd-cuotas').bottom : 0), h: innerHeight }; });
  ok('ficha: en el primer vistazo se ve nombre, precio y cuotas', firstView.title < firstView.h && firstView.price < firstView.h && firstView.cuotas <= firstView.h + 4, JSON.stringify(firstView));
  const sizes = await page.evaluate(() => { const fs = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize); return { price: fs('.nd-price'), cuotas: fs('.nd-cuotas'), save: document.querySelector('.nd-save') ? fs('.nd-save') : 0 }; });
  ok('ficha: el precio final pesa más que la cuota', sizes.price >= sizes.cuotas * 2, JSON.stringify(sizes));
  const sameRow = await page.evaluate(() => { const p = document.querySelector('.nd-price').getBoundingClientRect(); const s = document.querySelector('.nd-save'); if (!s || s.hidden) return null; const q = s.getBoundingClientRect(); return Math.abs((p.bottom) - (q.bottom)) < 60 && q.top < p.bottom + 40; });
  await shot('05-ficha-top');

  // cambio de pack: precio, cuotas y ahorro juntos
  const packs = await page.$$eval('.nd-pack-input', els => els.map(e => ({ id: e.value, ...e.dataset })));
  const want = packs.find(p => p.units === String(o.pack || 2)) || packs[1];
  await page.evaluate(() => document.querySelector('#elegir-pack').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
  await page.tap(`label[for="nd-pack-${want.id}"]`); await page.waitForTimeout(500);
  const shown = await page.evaluate(() => ({ price: document.querySelector('[data-o="price"]').textContent, cuotas: (document.querySelector('[data-o="cuotas"]') || {}).textContent, save: (document.querySelector('[data-o="save-v"]') || {}).textContent, saveVisible: !document.querySelector('[data-o="save"]').hidden, bar: document.querySelector('[data-nd-sticky-price]').textContent, pack: document.querySelector('[data-nd-sticky-pack]').textContent }));
  ok('pack: el precio cambia al elegido', norm(shown.price) === norm(want.price), norm(shown.price) + ' = ' + want.price);
  ok('pack: las cuotas cambian junto con el precio', norm(shown.cuotas || '').includes(norm(want.cuota)), shown.cuotas);
  ok('pack: el ahorro se lee en pesos y cambia', want.hasSave !== '1' || (shown.saveVisible && norm(shown.save) === norm(want.save)), shown.save);
  ok('pack: la barra inferior toma el mismo precio y pack', norm(shown.bar) === norm(want.price) && norm(shown.pack) === norm(want.name), shown.bar + ' · ' + shown.pack);
  const ring = await page.evaluate(id => getComputedStyle(document.querySelector('label[for="nd-pack-' + id + '"] .nd-pack-ring')).borderColor, want.id);
  ok('pack: el borde de selección se pinta en azul', /27, 69, 209|rgb\(27, 69, 209\)/.test(ring), ring);
  await shot('06-pack');

  // la barra inferior aparece cuando el botón principal sale de pantalla
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
  ok('barra inferior: oculta mientras arriba', !(await page.evaluate(() => document.querySelector('[data-nd-sticky]').classList.contains('is-on'))));
  await page.evaluate(() => { const c = document.querySelector('[data-nd-cta]'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY + 700); }); await page.waitForTimeout(600);
  ok('barra inferior: aparece cuando el botón principal sale de pantalla', await page.evaluate(() => document.querySelector('[data-nd-sticky]').classList.contains('is-on')));
  await shot('07-barra-inferior');
  // nada tapa el botón principal ni el precio cuando están a la vista
  await page.evaluate(() => document.querySelector('[data-nd-cta]').scrollIntoView({ block: 'center' })); await page.waitForTimeout(700);
  ok('barra inferior: se oculta cuando el botón principal está a la vista', !(await page.evaluate(() => document.querySelector('[data-nd-sticky]').classList.contains('is-on'))));
  const hit = await page.evaluate(() => { const c = document.querySelector('[data-nd-cta]').getBoundingClientRect(); const e = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2); return !!(e && e.closest('[data-nd-cta]')); });
  ok('el botón «Agregar al carrito» recibe el toque (nada lo intercepta)', hit);
  await page.evaluate(() => document.querySelector('.nd-price').scrollIntoView({ block: 'center' })); await page.waitForTimeout(500);
  const hitPrice = await page.evaluate(() => { const c = document.querySelector('.nd-price').getBoundingClientRect(); const e = document.elementFromPoint(c.left + 10, c.top + c.height / 2); return !!(e && e.closest('.nd-price')); });
  ok('el precio no queda tapado por ningún elemento', hitPrice);

  /* ---------- AGREGAR + CARRITO + CHECKOUT ---------- */
  await page.evaluate(() => document.querySelector('[data-nd-cta]').scrollIntoView({ block: 'center' })); await page.waitForTimeout(500);
  await page.tap('[data-nd-cta]'); await page.waitForSelector('dialog.nd-drawer[open]'); await page.waitForTimeout(900);
  const drawer = await page.evaluate(() => ({ lines: [...document.querySelectorAll('.nd-drawer .nd-line')].map(l => ({ t: l.querySelector('.nd-line-title').textContent.trim(), pack: (l.querySelector('.nd-line-pack') || {}).textContent, price: l.querySelector('.nd-line-price b').textContent.trim(), isNew: l.classList.contains('is-new') })), total: document.querySelector('.nd-drawer .nd-total-row b').textContent.trim(), count: document.querySelector('[data-nd-cart-count]').textContent.trim(), save: (document.querySelector('.nd-drawer .nd-sum-save b') || {}).textContent }));
  ok('carrito: se abre mostrando el producto elegido', drawer.lines.length === 1 && drawer.lines[0].isNew && /Agregado/.test(drawer.lines[0].pack), JSON.stringify(drawer.lines[0]));
  ok('carrito: el pack y el importe coinciden con lo anunciado en la ficha', norm(drawer.lines[0].price) === norm(want.price) && norm(drawer.total) === norm(want.price), drawer.lines[0].price + ' / total ' + drawer.total);
  ok('carrito: el contador del header se actualiza', drawer.count === '1');
  await shot('08-carrito');
  const cartJson = await page.evaluate(() => fetch('/cart.js').then(r => r.json()));
  ok('carrito: la variante agregada es la del pack elegido (carrito real de Shopify)', cartJson.items.length === 1 && String(cartJson.items[0].variant_id) === want.id && cartJson.items[0].quantity === 1, 'variant ' + cartJson.items[0].variant_id);
  // + / -
  await page.tap('.nd-drawer [data-nd-qty]:nth-of-type(2)').catch(() => {});
  await page.waitForTimeout(500);
  const qty2 = await page.evaluate(() => document.querySelector('.nd-drawer .nd-qty output').textContent.trim());
  ok('carrito: el botón + suma una unidad', qty2 === '2', qty2);
  await page.tap('.nd-drawer .nd-qty button:first-of-type'); await page.waitForTimeout(500);
  ok('carrito: el botón − resta una unidad', (await page.evaluate(() => document.querySelector('.nd-drawer .nd-qty output').textContent.trim())) === '1');
  // checkout
  const totalBefore = norm(await page.textContent('.nd-drawer .nd-total-row b'));
  await Promise.all([page.waitForURL('**/checkout*'), page.tap('[data-nd-checkout]')]);
  await page.waitForTimeout(400);
  const checkoutTotal = norm(await page.textContent('#total'));
  const num = t => t.replace(/[^\d,]/g, '').replace(/,\d\d$/, '');
  ok('checkout: llega con el mismo importe anunciado', num(checkoutTotal) === num(totalBefore) && num(checkoutTotal) === num(want.price), checkoutTotal + ' vs ' + totalBefore + ' vs ' + want.price);
  await shot('09-checkout');

  /* ---------- /cart ---------- */
  await page.goto(base + '/cart', { waitUntil: 'load' }); await page.waitForTimeout(900);
  ok('página /cart: lista el producto con el mismo importe', norm(await page.textContent('.nd-cart-page .nd-total-row b')) === norm(want.price));
  await shot('10-cart-page');

  console.log('\nErrores de consola:', errors.length ? [...new Set(errors)].join(' | ') : 'ninguno');
  const fails = results.filter(r => r[0] === 'FAIL');
  console.log(`\n${results.length - fails.length}/${results.length} comprobaciones correctas`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
