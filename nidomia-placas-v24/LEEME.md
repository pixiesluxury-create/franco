# Nidomía «Placas cuadradas» · v2.5 (borrador)

Es tu ZIP `Nidomia-Placas-Cuadradas` con un solo cambio: **cómo se vende el producto al inicio de la ficha**. Todo lo demás quedó igual.
Cambian 5 archivos de tu ZIP (`snippets/nd-pdp.liquid`, `snippets/nd-reviews.liquid`, `snippets/nd-rev-card.liquid`, `assets/nidomia.css`, `assets/nidomia.js`) y se suman 6 pequeños (`snippets/nd-promo.liquid` y `snippets/nd-pdp-avail`, `-rating`, `-deal`, `-stock`, `-trust`). Todos están en `cambios/`.

## Qué cambió (arriba de la ficha, usando la referencia que mandaste)

1. **«En stock, listo para despachar»** en verde, con punto que late y un brillo suave que recorre el texto. Si el inventario real es bajo pasa a naranja: «Listo para despachar · quedan N».
2. **Título mucho más grande y fuerte** (hasta 58 px en escritorio; en celular entra en la primera pantalla), con entrada animada.
3. **Insignia «✓ Envío gratis a todo el país»** en verde, con tilde, rebote al aparecer y brillo periódico.
4. **Estrellas más grandes** con el texto «4,9/5 · N reseñas». Los números salen de las reseñas cargadas (ver abajo). Dice «verificadas» solo si todas están marcadas como compra verificada.
5. **Caja de promoción** más destacada, con brillo. Dice **«Pagás 3 y llevás 4»** solo si ese pack existe y su precio es exactamente el de 3 unidades. Si no, muestra el ahorro real del mejor pack («Ahorrás hasta $ X llevando más»), y si tampoco hay pack, las cuotas. La segunda línea suma «cuotas sin interés de $ X + envío gratis» según los ajustes, y la cuota cambia cuando elegís otro pack.
6. **Barra de stock**: con inventario real bajo aparece «Últimas unidades», el **«% vendido»** (si cargaste la etiqueta `stock-inicial-NN`) y una barra rayada que se llena. Con stock normal queda la barra rayada con las unidades disponibles. Nada de esto se muestra si Shopify no lo respalda.
7. **Opiniones pegadas al botón «Agregar al carrito»**, como en la referencia: círculo con la inicial, nombre, «✓ COMPRA VERIFICADA» (solo si la reseña está marcada así), estrellas, texto y flechas para pasar de una a otra. «Pago seguro · Envío gratis · Cuotas» bajó un renglón, debajo de las opiniones.

Con «reducir movimiento» activado no hay ninguna animación nueva.

## Lo que NO hice, y por qué

No cargué las 10 reseñas que redacté como si fueran de clientes, ni puse «346 reseñas».
Esas reseñas las escribí yo y esa cifra no sale de reseñas reales: mostrarlas con estrellas y «compra verificada» sería publicidad engañosa para quien compra (en Argentina lo regula la ley de defensa del consumidor), y puede traerte problemas con las plataformas de anuncios si te revisan la tienda. No es algo que yo pueda dejar armado.

**Qué hice en cambio:** el espacio ya está listo y se llena solo con reseñas reales. Apenas cargues reseñas verdaderas aparecen debajo del botón, con las estrellas y el total calculados.

## Cómo cargar reseñas reales

**Opción A, a mano (sin apps).**
1. Shopify Admin → Configuración → Datos personalizados → Productos → Agregar definición. Espacio de nombres y clave: `nidomia.opiniones`. Tipo: **JSON**.
2. En cada producto, pegá la lista. Hay un molde en `plantilla-resenas-reales.json`. Ejemplo de una reseña:
   ```json
   {"alias": "Rocío V.", "rating": 5, "texto": "Lo puse en el balcón y ahora paso con la silla.", "verificada": true}
   ```
3. Marcá `"verificada": true` solo si confirmaste que esa persona compró. Los textos tienen que ser los que escribió el cliente (mensajes de WhatsApp, Instagram, Mercado Libre, mails), con su permiso.

**Opción B, con una app de reseñas** (Judge.me, Loox, etc.): si guarda `reviews.rating` y `reviews.rating_count` en el producto, el promedio y el total (por ejemplo 346) aparecen solos junto a las estrellas. Si esos 346 son reseñas reales de tu app, no tenés que hacer nada más.

Si me pasás reseñas reales (texto, nombre y nota), te las dejo cargadas en el formato correcto.

## De dónde sale cada dato

| Lo que se ve | Fuente |
|---|---|
| Precios, packs, ahorro, «Pagás 3 y llevás 4» | Variantes de Shopify |
| «Quedan N», «Últimas unidades» | Inventario de Shopify (umbral en Configuración del tema) |
| «% vendido» | Etiqueta `stock-inicial-NN` + inventario actual |
| Cuotas, envío | Configuración del tema → *Nidomía · Compra y confianza* |
| Estrellas, total de reseñas, tarjetas bajo el botón | Metafield `nidomia.opiniones` o los de tu app de reseñas |

## Pruebas

- Compra completa en celular (elegir producto → pack → carrito → checkout) en las cinco fichas: **36 de 39** comprobaciones, **igual que tu ZIP sin tocar**. Las 3 que no pasan ya fallaban antes y vienen de tu diseño (el orden de los bloques, el borde rosa de los packs en lugar de azul, y el precio oculto sobre los packs).
- Accesibilidad automática (axe): **0 violaciones** en home, las cinco fichas, carrito, cajón del carrito y menú. Tu ZIP original tenía 1 en cada ficha.
- Verificador oficial de temas de Shopify: sin errores y solo 2 avisos de precarga de fuentes. Tu ZIP original tenía además un aviso de complejidad en `nd-pdp.liquid`.
- Al ordenar `nd-pdp.liquid` en archivos más chicos, el HTML de 15 páginas (5 fichas con productos, 5 en vista previa sin productos y 5 de tienda publicada) quedó **idéntico** antes y después.
- Con «reducir movimiento»: sin animaciones, texto en verde sólido.
- Las capturas de `vista-previa/` usan datos de prueba del arnés local (importes y stock de ejemplo, y 5 textos de prueba en las opiniones del 02 y el 05). No son de tu tienda.

## Lo que no pude comprobar

Tu Shopify real (precios, inventario, checkout), Safari y Android reales. Lo hice con Chromium emulando un iPhone 13 y con anchos de 320 a 1440 px.

## Arreglado en esta versión (eran cosas que ya estaban en tu ZIP)

- **Botón de compra y lector de pantalla:** el nombre accesible ahora empieza con lo que se ve («Agregar al carrito $ 54.990, 1 mandolina»). Antes decía otra cosa.
- **«Volver arriba» sobre el precio:** mientras el botón de compra está a la vista, «volver arriba» se esconde. Aparece más abajo en la ficha.
- **Aviso de complejidad de `nd-pdp.liquid`:** resuelto al mover la lógica de arriba de la ficha a archivos aparte, sin cambiar lo que se ve.

Sigue igual a como lo dejaste: las 3 comprobaciones que ya fallaban en tu diseño (orden de bloques, borde rosa de los packs, precio oculto sobre los packs) y la tira de miniaturas, que se desliza de costado a propósito. La página no tiene desborde horizontal en ningún ancho probado.
