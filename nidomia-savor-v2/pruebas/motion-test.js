// Prueba de las interacciones 3D: inclinación, magnetismo, volver arriba, vuelo al carrito, confeti y movimiento reducido.
const { chromium } = require('playwright'); const fs = require('fs');
const base = process.argv[2], out = process.argv[3]; fs.mkdirSync(out, { recursive: true });
const res = []; const ok = (n, c, x = '') => { res.push(c); console.log((c ? 'OK   ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-AR' }); const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.request.get(base + '/cart/clear.js');
  await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(1500);
  ok('hero: 5 esferas 3D y resplandor', (await page.$$('.nd-hero-actions .nd-sphere')).length === 5 && !!(await page.$('.nd-hero-actions[data-glow]')));
  // inclinación 3D
  await page.evaluate(() => document.querySelector('#soluciones').scrollIntoView({ block: 'start' })); await page.waitForTimeout(1500);
  const card = await page.$('.nd-card'); const bb = await card.boundingBox();
  await page.mouse.move(bb.x + bb.width * 0.85, bb.y + bb.height * 0.2, { steps: 6 }); await page.waitForTimeout(350);
  const t = await card.evaluate(e => ({ rx: e.style.getPropertyValue('--rx'), ry: e.style.getPropertyValue('--ry'), tf: getComputedStyle(e).transform, tilting: e.classList.contains('is-tilting') }));
  ok('tarjeta: se inclina en 3D hacia el puntero', t.tilting && parseFloat(t.rx) !== 0 && parseFloat(t.ry) > 0 && t.tf !== 'none', JSON.stringify({ rx: t.rx, ry: t.ry }));
  await page.screenshot({ path: out + '/tilt.png' });
  await page.mouse.move(5, 5, { steps: 4 }); await page.waitForTimeout(900);
  ok('tarjeta: vuelve a su lugar al salir', (await card.evaluate(e => e.style.getPropertyValue('--rx'))) === '');
  // botón magnético
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(400);
  const cta = await page.$('.nd-btn-cta'); await cta.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); const cb = await cta.boundingBox();
  await page.mouse.move(cb.x + cb.width + 20, cb.y + cb.height / 2, { steps: 5 }); await page.waitForTimeout(400);
  const mg = await cta.evaluate(e => e.style.getPropertyValue('--mx2')); ok('botón del hero: magnético cerca del puntero', parseFloat(mg) > 0, mg);
  await page.mouse.move(5, 5, { steps: 3 });
  // volver arriba
  ok('volver arriba: oculto arriba de todo', !(await page.evaluate(() => document.querySelector('[data-nd-totop]').classList.contains('is-on'))));
  await page.evaluate(() => window.scrollTo({ top: 2500, behavior: 'instant' })); await page.waitForTimeout(500);
  ok('volver arriba: aparece al bajar', await page.evaluate(() => document.querySelector('[data-nd-totop]').classList.contains('is-on')));
  const pr = await page.evaluate(() => document.querySelector('[data-nd-totop]').style.getPropertyValue('--p')); ok('volver arriba: el anillo marca el avance', parseFloat(pr) > 0.1, pr);
  await page.click('[data-nd-totop]'); await page.waitForFunction(() => window.scrollY < 5, null, { timeout: 5000 }).catch(() => {});
  ok('volver arriba: sube al inicio', (await page.evaluate(() => window.scrollY)) < 5);
  ok('cinta inversa de productos y ola del cierre', !!(await page.$('.nd-band-soft .nd-pill-prod')) && !!(await page.$('.nd-closing .nd-wave')));
  await page.evaluate(() => document.querySelector('.nd-closing').scrollIntoView({ block: 'center' })); await page.waitForTimeout(1500); await page.screenshot({ path: out + '/cierre.png' });
  // ficha: color, confeti y vuelo
  await page.goto(base + '/products/mandolina-supremecut', { waitUntil: 'load' }); await page.waitForTimeout(1200);
  ok('ficha: color propio del producto (lima de la mandolina)', await page.evaluate(() => getComputedStyle(document.querySelector('.nd-pdp')).getPropertyValue('--acc').trim() === '#b6e04a'));
  await page.evaluate(() => document.querySelector('#elegir-pack').scrollIntoView({ block: 'center' })); await page.waitForTimeout(500);
  await (await page.$('label.is-best')).click(); await page.waitForTimeout(250);
  const conf1 = (await page.$$('.nd-confetti')).length; ok('pack de mayor ahorro: ráfaga de confeti al elegirlo', conf1 > 10, conf1 + ' piezas');
  await page.waitForTimeout(1600);
  await page.click('[data-nd-cta]'); await page.waitForTimeout(260);
  ok('agregar: la foto vuela hacia el carrito', !!(await page.$('.nd-fly')));
  await page.screenshot({ path: out + '/vuelo.png' });
  await page.waitForSelector('dialog.nd-drawer[open]', { timeout: 5000 }); await page.waitForTimeout(900);
  ok('agregar: el carrito se abre con el producto elegido', (await page.$$('.nd-drawer .nd-line.is-new')).length === 1);
  ok('agregar: el ícono del carrito rebota', await page.evaluate(() => document.querySelector('.nd-cart-btn').classList.contains('is-bounce')));
  ok('agregar: el elemento volador se limpia solo', !(await page.$('.nd-fly')));
  await page.request.get(base + '/cart/clear.js');
  console.log('errores:', errs.length ? errs.join(' | ') : 'ninguno');
  await ctx.close();
  // movimiento reducido: nada de esto se activa
  const rctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-AR', reducedMotion: 'reduce' }); const rp = await rctx.newPage();
  const rerr = []; rp.on('pageerror', e => rerr.push(e.message));
  await rp.goto(base + '/products/mandolina-supremecut', { waitUntil: 'load' }); await rp.waitForTimeout(1000);
  await rp.evaluate(() => document.querySelector('#elegir-pack').scrollIntoView({ block: 'center' })); await rp.waitForTimeout(400);
  await (await rp.$('label.is-best')).click(); await rp.waitForTimeout(200);
  ok('reducido: sin confeti', (await rp.$$('.nd-confetti')).length === 0);
  await rp.click('[data-nd-cta]'); await rp.waitForTimeout(250);
  ok('reducido: sin vuelo, el carrito abre enseguida', !(await rp.$('.nd-fly')) && !!(await rp.$('dialog.nd-drawer[open]')));
  await rp.request.get(base + '/cart/clear.js');
  await rp.goto(base + '/', { waitUntil: 'load' }); await rp.waitForTimeout(800);
  const card2 = await rp.$('.nd-card'); await card2.scrollIntoViewIfNeeded(); const bb2 = await card2.boundingBox();
  await rp.mouse.move(bb2.x + bb2.width * 0.8, bb2.y + 10, { steps: 4 }); await rp.waitForTimeout(300);
  ok('reducido: las tarjetas no se inclinan', (await card2.evaluate(e => e.style.getPropertyValue('--rx'))) === '');
  ok('reducido: contenido visible sin esperar animaciones', await rp.evaluate(() => [...document.querySelectorAll('[data-reveal]')].every(e => getComputedStyle(e).opacity === '1')));
  console.log('errores (reducido):', rerr.length ? rerr.join(' | ') : 'ninguno');
  console.log(res.filter(Boolean).length + '/' + res.length + ' correctas'); await b.close(); process.exit(res.every(Boolean) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
