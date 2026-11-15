// Escenario "tienda publicada": opiniones REALES en metafield, etiquetas de ventas y stock comprobables.
const base = require('./fixtures.js');
const P = base.products;
P.tender.metafields = { nidomia: { opiniones: { value: [
  { alias: 'Rocío V.', rating: 5, texto: 'Lo puse en el balcón y ahora paso con la silla. Llegó bien embalado.', verificada: true },
  { alias: 'Marcos', rating: 4, texto: 'Anda muy bien, la pared tenía que ser firme para el enganche.', verificada: true },
  { alias: 'Dani', rating: 5, texto: 'Práctico para la ropa liviana.', verificada: false },
] } } };
P.mopa.tags = ['mas-vendido', 'stock-inicial-10', 'oferta-hasta-2099-12-31'];   // stock real = 4 → 60 % vendido
P.arrancador.tags = ['oferta-hasta-2020-01-01'];                                   // vencida: no debe mostrarse
P.lapiz.variants[0].available = false; P.lapiz.available = P.lapiz.variants.some(v => v.available);
module.exports = { ...base, products: P, settings: { nd_ejemplos: 'auto' } };
