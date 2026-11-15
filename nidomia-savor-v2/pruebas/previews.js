// Genera la vista previa (borrador) del tema: home, cinco fichas y carrito, en celular y escritorio.
const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
const base = process.argv[2]; const out = process.argv[3];
fs.mkdirSync(path.join(out, 'movil'), { recursive: true }); fs.mkdirSync(path.join(out, 'escritorio'), { recursive: true });
const PAGES = [
  ['01-home', '/'], ['02-mandolina', '/products/mandolina-supremecut'], ['03-mopa', '/products/mopa-plana-con-escurridor'],
  ['04-tender', '/products/tender-retractil-de-pared'], ['05-lapiz', '/products/lapiz-3d-y-pizarra-led'], ['06-arrancador', '/products/arrancador-e-inflador-oryx'],
];
const STATIC = '.nd-header{position:static!important}.nd-sticky{display:none!important}*{scroll-behavior:auto!important}';
async function reveal(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(140); }
  await page.evaluate(() => { document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-in')); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.waitForTimeout(800);
}
(async () => {
  const b = await chromium.launch();
  const mob = await b.newContext({ ...devices['iPhone 13'], locale: 'es-AR', deviceScaleFactor: 2 });
  const mobFull = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'es-AR', deviceScaleFactor: 1 });
  const desk = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-AR', deviceScaleFactor: 1 });
  const first = await mob.newPage(); await first.request.get(base + '/cart/clear.js');

  // 1) primer vistazo de cada ficha en celular (pantalla real de 390×664, nítida)
  for (const [n, p] of PAGES.slice(1)) {
    const page = await mob.newPage(); await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, 'movil', `primer-vistazo-${n}.jpg`), type: 'jpeg', quality: 88 }); await page.close();
  }
  // 2) páginas completas
  for (const [n, p] of PAGES) {
    const page = await mobFull.newPage(); await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(1200);
    await page.addStyleTag({ content: STATIC }); await reveal(page);
    await page.screenshot({ path: path.join(out, 'movil', `${n}.jpg`), type: 'jpeg', quality: 82, fullPage: true }); await page.close();
    const d = await desk.newPage(); await d.goto(base + p, { waitUntil: 'load' }); await d.waitForTimeout(1200);
    await d.addStyleTag({ content: STATIC + '.nd-gallery,.nd-how-stage{position:static!important}' }); await reveal(d);
    await d.screenshot({ path: path.join(out, 'escritorio', `${n}.jpg`), type: 'jpeg', quality: 80, fullPage: true }); await d.close();
  }
  // 3) carrito con dos productos: lateral (celular y escritorio) y página
  await first.request.post(base + '/cart/add.js', { data: { items: [{ id: 51000000003, quantity: 1 }, { id: 51000000012, quantity: 1 }] } });
  const m = await mob.newPage(); await m.goto(base + '/', { waitUntil: 'load' }); await m.waitForTimeout(1000);
  await m.tap('[data-nd-cart-open]'); await m.waitForSelector('dialog.nd-drawer[open]'); await m.waitForTimeout(900);
  await m.screenshot({ path: path.join(out, 'movil', '07-carrito-lateral.jpg'), type: 'jpeg', quality: 88 });
  const dd = await desk.newPage(); await dd.goto(base + '/products/mandolina-supremecut', { waitUntil: 'load' }); await dd.waitForTimeout(800);
  await dd.click('[data-nd-cart-open]'); await dd.waitForSelector('dialog.nd-drawer[open]'); await dd.waitForTimeout(900);
  await dd.screenshot({ path: path.join(out, 'escritorio', '07-carrito-lateral.jpg'), type: 'jpeg', quality: 85 });
  const cp = await mobFull.newPage(); await cp.goto(base + '/cart', { waitUntil: 'load' }); await cp.waitForTimeout(1200);
  await cp.addStyleTag({ content: STATIC }); await cp.screenshot({ path: path.join(out, 'movil', '08-carrito-pagina.jpg'), type: 'jpeg', quality: 85, fullPage: true });
  await first.request.get(base + '/cart/clear.js');
  await b.close(); console.log('listo');
})();
