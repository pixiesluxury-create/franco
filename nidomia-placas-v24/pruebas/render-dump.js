// Guarda el HTML normalizado de las fichas (productos reales de prueba, y vista previa sin productos) para comparar antes/después de un refactor.
const fs = require('fs'); const http = require('http');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const slugs = ['mandolina-supremecut', 'mopa-plana-con-escurridor', 'tender-retractil-de-pared', 'lapiz-3d-y-pizarra-led', 'arrancador-e-inflador-oryx'];
const get = (port, path) => new Promise((res, rej) => http.get({ host: 'localhost', port, path }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(b)); }).on('error', rej));
const norm = h => h.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
(async () => {
  let n = 0;
  for (const port of [8111, 8112, 8113]) {
    for (const s of slugs) { const h = await get(port, '/products/' + s); fs.writeFileSync(out + '/' + port + '-' + s + '.html', norm(h)); n++; }
  }
  console.log('guardadas', n, 'páginas en', out);
})();
