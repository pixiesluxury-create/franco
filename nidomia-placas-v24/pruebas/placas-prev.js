// Vistas previas del arranque de la ficha (tema «Placas cuadradas» v2.4). Datos de PRUEBA del arnés, no de la tienda.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const [base, out] = [process.argv[2], process.argv[3]]; fs.mkdirSync(out, { recursive: true });
const shot = async (p, name, sel, off, wait = 1500) => {
  await p.evaluate(([s, o]) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY - o, behavior: 'instant' }); }, [sel, off]);
  await p.waitForTimeout(wait); await p.screenshot({ path: out + '/' + name });
};
(async () => {
  const b = await chromium.launch();
  const m = await (await b.newContext({ ...devices['iPhone 13'], locale: 'es-AR', deviceScaleFactor: 2 })).newPage();
  await m.goto(base + '/products/mandolina-supremecut', { waitUntil: 'load' }); await m.waitForTimeout(1500);
  await shot(m, 'm1-arranque.png', '.nd-avail', 110);
  await shot(m, 'm2-resenas-bajo-el-boton.png', '[data-nd-cta]', 250);
  await m.goto(base + '/products/mopa-plana-con-escurridor', { waitUntil: 'load' }); await m.waitForTimeout(1500);
  await shot(m, 'm3-ultimas-unidades.png', '.nd-stock-strip', 200);
  const d = await (await b.newContext({ viewport: { width: 1280, height: 860 }, locale: 'es-AR', deviceScaleFactor: 1.5 })).newPage();
  await d.goto(base + '/products/mandolina-supremecut', { waitUntil: 'load' }); await d.waitForTimeout(1800);
  await d.screenshot({ path: out + '/d1-arranque.png' });
  await shot(d, 'd2-resenas-bajo-el-boton.png', '[data-nd-cta]', 380);
  await b.close();
})();
