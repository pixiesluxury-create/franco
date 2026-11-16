// Vistas previas de las secciones nuevas de cada ficha (celular y escritorio), sin barras flotantes. Datos de prueba del arnés.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const HIDE = '.nd-skip,.nd-header,.nd-sticky,.nd-top-btn,.nd-perks,[data-nd-perks]{visibility:hidden!important}';
const prods = [['mandolina', 'mandolina-supremecut'], ['mopa', 'mopa-plana-con-escurridor'], ['tender', 'tender-retractil-de-pared'], ['lapiz', 'lapiz-3d-y-pizarra-led'], ['arrancador', 'arrancador-e-inflador-oryx']];
(async () => {
  const b = await chromium.launch();
  for (const [mode, ctxOpts] of [['movil', { ...devices['iPhone 13'], locale: 'es-AR' }], ['escritorio', { viewport: { width: 1280, height: 900 }, locale: 'es-AR' }]]) {
    const ctx = await b.newContext(ctxOpts); const p = await ctx.newPage();
    for (const [key, slug] of prods) {
      await p.goto(base + '/products/' + slug, { waitUntil: 'load' }); await p.waitForTimeout(1000);
      await p.addStyleTag({ content: HIDE });
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += 450) { await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(140); }
      await p.waitForTimeout(800);
      const secs = await p.$$('.nd-sx'); let i = 0;
      for (const s of secs) { await s.scrollIntoViewIfNeeded(); await p.waitForTimeout(1700); await s.screenshot({ path: out + '/' + mode + '-' + key + '-' + (++i) + '.png' }); }
    }
    await ctx.close();
  }
  console.log('listo'); await b.close();
})();
