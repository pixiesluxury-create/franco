const { chromium, devices } = require('playwright');
const axePath = require.resolve('axe-core');
(async () => {
  const base = process.argv[2]; const paths = process.argv.slice(3);
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'es-AR' });
  for (const p of paths) {
    const page = await ctx.newPage(); await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    // mostrar todo (revelar) para auditar el contenido real
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-in')));
    await page.waitForTimeout(400);
    await page.addScriptTag({ path: axePath });
    const res = await page.evaluate(async () => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] }));
    console.log('\n=== ' + p + ' — violaciones:', res.violations.length);
    res.violations.forEach(v => { console.log(`[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`); v.nodes.slice(0, 3).forEach(n => console.log('    ', n.target.join(' '), '|', (n.failureSummary || '').split('\n')[1] || '')); });
    const small = await page.evaluate(() => {
      const out = {}; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; const t = n.textContent.trim(); if (!t) continue; const e = n.parentElement; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || e.closest('.nd-sr,[hidden],script,style,noscript,svg')) continue; const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue; const fs = parseFloat(cs.fontSize); if (fs < 13) { const k = fs + 'px'; (out[k] = out[k] || []).push(t.slice(0, 40)); } }
      return out; });
    console.log('Textos < 13 px:', JSON.stringify(Object.fromEntries(Object.entries(small).map(([k, v]) => [k, v.length + ' ej: ' + [...new Set(v)].slice(0, 4).join(' | ')]))));
    await page.close();
  }
  await b.close();
})();
