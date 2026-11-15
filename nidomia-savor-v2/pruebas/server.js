// Arnés local para renderizar un tema Shopify (Liquid) con datos de PRUEBA.
// No es Shopify: emula lo mínimo (objetos, filtros, tags, carrito) para poder verificar el tema.
// Uso: node server.js <themeDir> <port> [--role=unpublished|main] [--fixtures=fixtures.js]
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Liquid, Tag, Hash } = require('liquidjs');

const args = process.argv.slice(2);
const themeDir = path.resolve(args[0]);
const port = Number(args[1] || 8123);
const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const role = opt.role || 'unpublished';
const fx = require(path.resolve(opt.fixtures || path.join(__dirname, 'fixtures.js')));

const money = (cents, cur = true) => {
  const n = Math.round(Number(cents) || 0) / 100;
  const s = n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur ? '$ ' + s : s;
};

const engine = new Liquid({
  root: [path.join(themeDir, 'snippets'), path.join(themeDir, 'sections'), path.join(themeDir, 'layout')],
  extname: '.liquid',
  strictVariables: false,
  strictFilters: false,
  dynamicPartials: true,
  jsTruthy: false,
  ownPropertyOnly: false,
});

// ---- filtros Shopify ----
engine.registerFilter('asset_url', n => '/assets/' + n);
engine.registerFilter('image_url', (img, o) => (img && (img.src || img)) || '');
engine.registerFilter('img_url', (img) => (img && (img.src || img)) || '');
engine.registerFilter('money', c => money(c, true));
engine.registerFilter('money_without_trailing_zeros', c => {
  const n = Math.round(Number(c) || 0);
  // la tienda usa amount_no_decimals_with_comma_separator: redondea a pesos enteros
  return '$ ' + (n / 100).toLocaleString('es-AR', { maximumFractionDigits: 0 });
});
engine.registerFilter('money_with_currency', c => money(c, true) + ' ARS');
engine.registerFilter('money_without_currency', c => money(c, false));
engine.registerFilter('stylesheet_tag', u => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('script_tag', u => `<script src="${u}"></script>`);
engine.registerFilter('default_errors', () => '');
engine.registerFilter('t', k => String(k).split('.').pop());
engine.registerFilter('handleize', s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
engine.registerFilter('pluralize', (n, a, b) => (Number(n) === 1 ? a : b));
engine.registerFilter('link_to', (t, u) => `<a href="${u}">${t}</a>`);
engine.registerFilter('structured_data', x => JSON.stringify(x));
engine.registerFilter('within', (u) => u);
engine.registerFilter('file_url', n => '/files/' + n);
engine.registerFilter('format_address', () => '');
engine.registerFilter('date', (d, f) => {
  const dt = d === 'now' || d === 'today' ? new Date() : new Date(d);
  if (isNaN(dt)) return '';
  return String(f).replace('%Y', dt.getFullYear()).replace('%d', String(dt.getDate()).padStart(2, '0')).replace('%m', String(dt.getMonth() + 1).padStart(2, '0')).replace('%B', dt.toLocaleString('es-AR', { month: 'long' })).replace('%-d', dt.getDate()).replace('%H', String(dt.getHours()).padStart(2, '0')).replace('%M', String(dt.getMinutes()).padStart(2, '0')).replace('%s', Math.floor(dt.getTime() / 1000));
});

// ---- tags Shopify ----
for (const name of ['schema', 'doc', 'comment_unused']) {
  engine.registerTag(name, class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream.on('token', t => { if (t.name === 'end' + name) stream.stop(); }).on('end', () => { throw new Error(`tag ${name} not closed`); });
      stream.start();
    }
    render() { return ''; }
  });
}
for (const name of ['stylesheet', 'javascript']) {
  engine.registerTag(name, class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      const stream = this.liquid.parser.parseStream(remain);
      stream.on('token', t => { if (t.name === 'end' + name) stream.stop(); }).on('end', () => { throw new Error(`tag ${name} not closed`); });
      stream.start();
    }
    render() { return ''; }
  });
}
engine.registerTag('form', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    this.args = token.args;
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain);
    stream.on('template', t => this.tpls.push(t)).on('tag:endform', () => stream.stop()).on('end', () => { throw new Error('form not closed'); });
    stream.start();
  }
  *render(ctx, emitter) {
    const type = String(this.args).split(',')[0].replace(/['"]/g, '').trim();
    ctx.push({ form: { errors: null, posted_successfully: () => false, 'posted_successfully?': false } });
    emitter.write(`<form method="post" action="/${type}" data-shopify-form="${type}" accept-charset="UTF-8"><input type="hidden" name="form_type" value="${type}">`);
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    emitter.write('</form>');
    ctx.pop();
  }
});
engine.registerTag('section', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = String(token.args).replace(/['"]/g, '').trim(); }
  async render(ctx, emitter) {
    emitter.write(await renderSection(this.name, { type: this.name, settings: {}, blocks: [] }, ctx.getAll ? ctx.getAll() : {}));
  }
});

// ---- helpers de contexto ----
function buildGlobals(extra = {}) {
  const settingsData = JSON.parse(fs.readFileSync(path.join(themeDir, 'config/settings_data.json'), 'utf8'));
  const cur = settingsData.current || {};
  const settings = Object.assign({}, typeof cur === 'string' ? {} : cur, fx.settings || {});
  const products = fx.products;
  const all_products = Object.fromEntries(Object.values(products).map(p => [p.handle, p]));
  return {
    settings,
    all_products,
    collections: { all: { products: fx.collectionsAll !== undefined ? fx.collectionsAll : Object.values(fx.products) } },
    routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', cart_update_url: '/cart/update', cart_clear_url: '/cart/clear', search_url: '/search', account_url: '/account', account_login_url: '/account/login', collections_url: '/collections', all_products_collection_url: '/collections/all', predictive_search_url: '/search/suggest' },
    shop: fx.shop,
    theme: { role: role, name: 'Nidomía' },
    localization: { country: { iso_code: 'AR', name: 'Argentina', currency: { iso_code: 'ARS', symbol: '$' } }, language: { iso_code: 'es', name: 'Español' } },
    cart: cartObj(),
    canonical_url: 'http://localhost:' + port + (extra.path || '/'),
    page_title: extra.title || 'Nidomía',
    page_description: '',
    content_for_header: `<script>window.Shopify={theme:{role:${JSON.stringify(role)},name:'Nidomía'},shop:'nidomia.myshopify.com',routes:{root:'/'}};</script>`,
    request: { locale: { iso_code: 'es-AR' }, page_type: extra.page_type || 'index', design_mode: false, origin: 'http://localhost:' + port, path: extra.path || '/' },
    template: { name: extra.page_type || 'index', suffix: '' },
    product: extra.product,
    page_image: null,
    linklists: {},
    ...extra.more,
  };
}

// carrito en memoria (por servidor)
let cartLines = [];
function variantIndex() {
  const m = {};
  for (const p of Object.values(fx.products)) for (const v of p.variants) m[v.id] = { p, v };
  return m;
}
function cartObj() {
  const vi = variantIndex();
  const items = cartLines.map((l, i) => {
    const { p, v } = vi[l.id];
    return {
      key: l.id + ':k', id: Number(l.id), variant_id: Number(l.id), product_id: Number(p.id), quantity: l.quantity,
      title: p.title + ' - ' + v.title, product_title: p.title, variant_title: v.title, url: p.url, handle: p.handle,
      price: v.price, original_price: v.compare_at_price || v.price, final_price: v.price, line_price: v.price * l.quantity,
      original_line_price: (v.compare_at_price || v.price) * l.quantity, final_line_price: v.price * l.quantity,
      image: p.images[0] && p.images[0].src, featured_image: { url: p.images[0] && p.images[0].src, alt: p.title }, sku: v.sku || '',
      line_level_discount_allocations: [], discounts: [], properties: {}, options_with_values: [{ name: 'Pack', value: v.title }], variant_options: [v.title], gift_card: false, requires_shipping: true, product_type: 'Hogar',
    };
  });
  const total = items.reduce((s, i) => s + i.final_line_price, 0);
  return { token: 'test', note: '', attributes: {}, original_total_price: total, total_price: total, total_discount: 0, total_weight: 0, item_count: items.reduce((s, i) => s + i.quantity, 0), items, requires_shipping: true, currency: { iso_code: 'ARS' }, items_subtotal_price: total, cart_level_discount_applications: [] };
}
function readBody(req) { return new Promise(r => { let b = ''; req.on('data', c => (b += c)); req.on('end', () => r(b)); }); }

async function renderSection(type, section, globals) {
  const file = path.join(themeDir, 'sections', type + '.liquid');
  const tpl = fs.readFileSync(file, 'utf8');
  const html = await engine.parseAndRender(tpl, { ...globals, section: { id: section.id || type, settings: section.settings || {}, blocks: section.blocks || [] } }, { globals });
  return `<div id="shopify-section-${section.id || type}" class="shopify-section">${html}</div>`;
}

async function renderTemplate(tplName, extra) {
  const jsonFile = path.join(themeDir, 'templates', tplName + '.json');
  const g = buildGlobals(extra);
  const tpl = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  let layoutName = tpl.layout === undefined ? 'theme' : tpl.layout;
  let content = '';
  for (const id of tpl.order || Object.keys(tpl.sections)) {
    const s = tpl.sections[id];
    content += await renderSection(s.type, { id, settings: s.settings, blocks: [] }, g);
  }
  const layout = fs.readFileSync(path.join(themeDir, 'layout', layoutName + '.liquid'), 'utf8');
  return engine.parseAndRender(layout, { ...g, content_for_layout: content }, { globals: g });
}

const mime = { '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    if (p.startsWith('/assets/')) {
      const f = path.join(themeDir, 'assets', decodeURIComponent(p.slice(8)));
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
      res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      return fs.createReadStream(f).pipe(res);
    }
    if (p.startsWith('/cdn-fixtures/')) {
      const f = path.join(__dirname, p);
      if (fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'image/jpeg' }); return fs.createReadStream(f).pipe(res); }
    }
    // API carrito
    if (p === '/cart.js') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cartObj())); }
    if (p === '/cart/add.js' || p === '/cart/add') {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw); } catch { body = Object.fromEntries(new URLSearchParams(raw)); }
      const items = body.items || [{ id: body.id, quantity: body.quantity || 1 }];
      const vi = variantIndex();
      for (const it of items) {
        const id = String(it.id); if (!vi[id]) { res.writeHead(422, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ status: 422, message: 'Cannot find variant', description: 'No encontramos esa variante.' })); }
        const found = cartLines.find(l => l.id === id);
        if (found) found.quantity += Number(it.quantity || 1); else cartLines.push({ id, quantity: Number(it.quantity || 1) });
      }
      if (p === '/cart/add') { res.writeHead(302, { Location: '/cart' }); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ items: cartObj().items }));
    }
    if (p === '/cart/change.js') {
      const b = JSON.parse(await readBody(req));
      const idx = b.line ? b.line - 1 : cartLines.findIndex(l => l.id + ':k' === b.id || l.id === String(b.id));
      if (idx >= 0) { if (b.quantity <= 0) cartLines.splice(idx, 1); else cartLines[idx].quantity = b.quantity; }
      res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cartObj()));
    }
    if (p === '/cart/update.js') {
      const b = JSON.parse(await readBody(req));
      for (const [k, q] of Object.entries(b.updates || {})) {
        const id = k.replace(':k', '');
        const f = cartLines.find(l => l.id === id);
        if (f) f.quantity = q; else if (q > 0) cartLines.push({ id, quantity: q });
      }
      cartLines = cartLines.filter(l => l.quantity > 0);
      res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cartObj()));
    }
    if (p === '/cart/clear.js') { cartLines = []; res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cartObj())); }
    if (p === '/checkout' || p.startsWith('/checkouts')) {
      const c = cartObj();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!doctype html><title>Checkout (mock)</title><body data-mock-checkout><h1>Checkout simulado</h1><p id="total">${money(c.total_price)}</p><ul>${c.items.map(i => `<li>${i.quantity} × ${i.title} = ${money(i.final_line_price)}</li>`).join('')}</ul></body>`);
    }
    // páginas
    let html;
    if (p === '/') html = await renderTemplate('index', { page_type: 'index', path: '/' });
    else if (p.startsWith('/products/')) {
      const h = p.split('/')[2];
      const prod = Object.values(fx.products).find(x => x.handle === h);
      if (!prod) {
        const h404 = await renderTemplate('404', { page_type: '404', path: p, title: '404' });
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(h404);
      }
      html = await renderTemplate('product', { page_type: 'product', path: p, product: prod, title: prod.title });
    } else if (p === '/cart') html = await renderTemplate('cart', { page_type: 'cart', path: '/cart' });
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404 ' + p); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error de render: ' + e.message + '\n' + e.stack);
  }
}).listen(port, () => console.log(`harness ${themeDir} -> http://localhost:${port} (role=${role})`));
