// DATOS DE PRUEBA para el arnés local. NO son los precios/stock reales de Shopify.
// Se basan en los importes de respaldo que traía el tema original, solo para poder verificar el diseño.
const A = n => '/assets/' + n;
const img = (n, alt) => ({ src: A(n), alt: alt || '', width: 1200, height: 1200 });

function product({ id, handle, title, vId, price, imgs, packs, stock, tags = [], meta = {}, compare }) {
  const variants = packs.map((pk, i) => {
    const p = typeof pk.price === 'number' ? pk.price : price * pk.units * (1 - (pk.off || 0));
    return {
      id: vId + i, title: pk.title, option1: pk.title, sku: handle.slice(0, 3).toUpperCase() + '-' + (i + 1),
      price: Math.round(p / 100) * 100, compare_at_price: pk.compare || null, available: pk.available !== false,
      inventory_management: stock == null ? null : 'shopify', inventory_policy: 'deny',
      inventory_quantity: stock == null ? 0 : stock, product: null,
    };
  });
  const prod = {
    id, handle, title, url: '/products/' + handle, vendor: 'Nidomía', type: 'Hogar', tags,
    images: imgs.map(n => img(n, title)), featured_image: img(imgs[0], title),
    variants, first_available_variant: variants.find(v => v.available) || variants[0],
    available: variants.some(v => v.available), description: '', options: ['Pack'],
    price: Math.min(...variants.map(v => v.price)), compare_at_price: null,
    metafields: meta,
  };
  variants.forEach(v => (v.product = prod));
  return prod;
}

const products = {
  mandolina: product({
    id: 15544503828580, handle: 'mandolina-supremecut', title: 'Mandolina SupremeCut', vId: 51000000001, price: 5499000,
    imgs: ['nd-images-mandolina-completa.webp', 'nd-images-mandolina-accesorios.webp'], stock: 12,
    packs: [{ title: '1 unidad', units: 1 }, { title: '2 unidades', units: 2, off: 0.15 }, { title: '3+1 de regalo', units: 4, price: 5499000 * 3 }],
  }),
  mopa: product({
    id: 15544510087268, handle: 'mopa-plana-con-escurridor', title: 'Mopa plana con escurridor', vId: 51000000011, price: 5099000,
    imgs: ['nd-nidomia-mopa-hero.webp'], stock: 4,
    packs: [{ title: '1 unidad', units: 1 }, { title: '2 unidades', units: 2, off: 0.05 }],
  }),
  tender: product({
    id: 15544516837476, handle: 'tender-retractil-de-pared', title: 'Tender retráctil de pared', vId: 51000000021, price: 5999000,
    imgs: ['nd-nidomia-tender-hero.webp'], stock: null,
    packs: [{ title: '1 unidad', units: 1 }, { title: '2 unidades', units: 2, off: 0.05 }],
  }),
  lapiz: product({
    id: 15544521228388, handle: 'lapiz-3d-y-pizarra-led', title: 'Lápiz 3D + pizarra LED', vId: 51000000031, price: 6999000,
    imgs: ['nd-nidomia-taller-hero.webp'], stock: null,
    packs: [{ title: '1 unidad', units: 1 }, { title: '2 unidades', units: 2, off: 0.05 }],
  }),
  arrancador: product({
    id: 15544526536804, handle: 'arrancador-e-inflador-oryx', title: 'Arrancador e inflador Oryx', vId: 51000000041, price: 14999000,
    imgs: ['nd-nidomia-auto-hero.webp'], stock: null,
    packs: [{ title: '1 unidad', units: 1 }, { title: '2 unidades', units: 2, off: 0.05 }],
  }),
};

module.exports = {
  products,
  shop: { name: 'Nidomía', description: 'Soluciones para el hogar', url: 'http://localhost', currency: 'ARS', money_format: '$ {{amount_no_decimals_with_comma_separator}}', shipping_policy: { url: '/policies/shipping-policy' }, refund_policy: { url: '/policies/refund-policy' }, privacy_policy: { url: '/policies/privacy-policy' }, email: '', policies: [] },
  settings: {},
};
