// SOLO PARA EL ARNÉS: datos de prueba para ver cómo se dibuja el bloque de opiniones y la barra de stock.
// No viaja en el tema. Los textos son de prueba, no son clientes.
const fx = require('./fixtures.js');
const OP = [
  ['Maru L.', 5, 'Llegó rápido y ya la usé tres veces. Para la tortilla de papas es una masa, corto todo en un ratito.', true],
  ['Andrés', 4, 'Buena en general. La cebolla entera no entra, hay que partirla antes, pero después baja parejo.', true],
  ['Euge', 5, 'La compré para las ensaladas de zanahoria. Rallo directo adentro del recipiente.', false],
  ['Lucio R.', 5, 'El peine es clave: la verdura se me trababa en la rejilla y con eso sale enseguida.', false],
  ['Fabián', 3, 'Está bien pero esperaba algo más grande. El corte es prolijo igual.', false],
];
fx.products.mandolina.metafields = { nidomia: { opiniones: { value: OP.map(([alias, rating, texto, verificada]) => ({ alias, rating, texto, verificada })) } } };
fx.products.mopa.tags = [...(fx.products.mopa.tags || []), 'stock-inicial-20'];
module.exports = fx;
