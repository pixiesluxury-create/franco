// Valida el tema con el verificador oficial de Shopify (solo archivos propios de Nidomía).
const { check, toSourceCode } = require('@shopify/theme-check-node');
const path = require('path');
(async () => {
  const root = path.resolve(process.argv[2]);
  let docs;
  try {
    const { ThemeLiquidDocsManager } = require('@shopify/theme-check-docs-updater');
    docs = new ThemeLiquidDocsManager(() => {});
  } catch (e) { console.error('docs:', e.message); }
  const only = /(layout\/nidomia|sections\/nidomia-storefront|snippets\/nd-|templates\/(index|product|cart)\.json|config\/settings_schema)/;
  let offenses;
  try {
    offenses = await check(root, undefined, undefined);
  } catch (e) { console.error('check error:', e); process.exit(2); }
  const mine = offenses.filter(o => only.test(o.uri));
  const bySev = { 0: 'ERROR', 1: 'WARN', 2: 'INFO' };
  const rel = u => u.replace('file://' + root + '/', '');
  const counts = {};
  mine.forEach(o => { counts[bySev[o.severity]] = (counts[bySev[o.severity]] || 0) + 1; });
  console.log('Ofensas en archivos de Nidomía:', JSON.stringify(counts), '(total tema:', offenses.length + ')');
  mine.filter(o => o.severity <= 1).slice(0, 60).forEach(o => console.log(bySev[o.severity], o.check, rel(o.uri) + ':' + (o.start ? o.start.line + 1 : '?'), '-', o.message));
})();
