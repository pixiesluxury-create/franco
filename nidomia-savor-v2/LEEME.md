# Nidomía · tema v2.1 (borrador para revisar)

Copia del tema que ya tenían, con el home, las cinco fichas y el carrito rediseñados.
El tema original no se tocó: esto es una copia aparte.

## Qué hay en esta carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `Nidomia-Savor-Shopify-v2-borrador.zip` | El tema completo, listo para subir a Shopify (≈ 20 MB). |
| `vista-previa/movil/` y `vista-previa/escritorio/` | Capturas del home, las cinco fichas y el carrito (lateral y página). `primer-vistazo-*` es la primera pantalla de cada ficha en un celular de 664 px de alto. `10-` y `11-` muestran el borrador cuando los productos todavía no están en Shopify. |
| `cambios/` | Solo los archivos nuevos o modificados, para leer el código sin descomprimir. |
| `pruebas/` | Los scripts con los que se probó (servidor de prueba, recorridos de compra, accesibilidad). |

## Cómo dejarlo en borrador

1. Shopify Admin → **Tienda online → Temas → Agregar tema → Subir archivo ZIP**.
2. Elegí `Nidomia-Savor-Shopify-v2-borrador.zip`. Un tema subido **queda sin publicar**: el tema que está en vivo no cambia.
3. En el menú `⋯` del tema nuevo, **Vista previa** (o **Personalizar**) para revisarlo con tus productos reales.
4. Cuando lo apruebes: **Publicar**.

No pude subirlo yo: no tengo acceso a tu Shopify. Todo lo de abajo se probó con productos de prueba (ver «Qué no pude verificar»).

## Novedades de esta versión (v2.1)

### 1. Las tarjetas ya no vuelven al home
**Qué pasaba:** si Shopify no devolvía el producto (borrador, sin publicar, sin el canal «Tienda online» o con otra dirección), la tarjeta apuntaba al home. La versión anterior del tema abría una vista previa en ese caso; la v2 no.

**Cómo funciona ahora**, en este orden:
1. Usa el producto que elijas en **Configuración del tema → Catálogo Nidomía**.
2. Si no hay, lo busca por su dirección habitual (`/products/mandolina-supremecut`, etc.).
3. Si no, lo busca por su **ID** entre los productos publicados (sirve si cambiaste la dirección).
4. Si Shopify igual no lo devuelve, la tarjeta abre `/products/<dirección habitual>` y el tema muestra una **ficha de vista previa**, con un aviso claro: importes de ejemplo y la compra no llega al checkout (el carrito de vista previa vive en el navegador y nunca toca Shopify).

La vista previa solo existe en **borrador y editor**. En la tienda publicada nunca se muestran importes de ejemplo: si un producto no existe, aparece una página «No encontramos esa página» con el estilo de la tienda. Cuando los productos estén publicados en Shopify, las mismas direcciones pasan solas a mostrar el producto real.

### 2. Más vida en el home
- **Barras de anuncios:** la barra superior ahora anuncia cuotas, envío, pago seguro y packs (solo lo que está activado), con íconos y brillo animado, y se pausa con el botón. Hay además una **cinta en movimiento** a mitad de página («3 cuotas sin interés · Menos tareas · Envío gratis a todo el país · Más tiempo para vos») y una **barra de progreso** de lectura bajo el header.
- **3 cuotas sin interés y envío gratis, en más lugares:** debajo del botón del hero (chips animados), en una cinta de cuatro beneficios de colores, sobre la foto de cada tarjeta, en las demostraciones, en las ofertas, en la caja de precio de cada ficha (píldoras con ícono; el camión se mueve), junto al botón de compra, en la barra inferior del celular, en el carrito, en el cierre y en el pie. Todo respeta los ajustes de cuotas y envío.
- **Gatillos mentales:** problema cotidiano en cada tarjeta («¿Escurrís el trapo con las manos?»), demostración visual con color propio por producto, comparación de valor («cada una te sale $X»), ahorro concreto con cuenta animada, prueba social, reducción de dudas, y escasez solo con inventario real («Últimas unidades»).
- **Color y movimiento:** cada producto tiene su tono (celeste, menta, lila, durazno), degradés, destellos, el botón del hero con pulso, borde animado en el pack de mayor ahorro y un cierre con degradé de marca. Con «reducir movimiento» todo queda quieto y legible.

## Qué cambió desde el tema original (v2)

**Color y jerarquía.** Blanco para el contenido, azul marino para títulos y precios, celeste suave para agrupar, azul intenso solo para «Agregar al carrito» y la selección de pack, coral solo para descuentos y ahorro (en esta versión se suma color decorativo, sin tocar esos roles).

**Home como recorrido de compra** (cada sección responde una pregunta): hero aprobado con un único botón → «¿Qué querés resolver hoy?» (cinco soluciones, grilla de 2 columnas sin deslizar al costado) → «Una solución para cada día» (antes y después arrastrable, un producto cada 3 s, con pausa y avance) → «Llevá más y pagá menos» (packs con ahorro en pesos; el de mayor ahorro primero) → «Comprá con tranquilidad» → cierre.

**Fichas.** Orden de la columna de compra: disponibilidad → nombre y valoración → precio, cuotas y envío → tres beneficios → elección del pack → botón → opiniones breves y medios de pago. Después: «Cómo lo consigue» (cada explicación sincronizada con su demostración), demostración con comparador y video, la duda principal, opiniones, detalles y preguntas. Barra inferior en celular cuando el botón principal sale de pantalla.

## Datos reales y datos de ejemplo

- **Precios, packs y ahorro**: salen de las variantes de Shopify. Los packs se reconocen por el nombre de la variante (`1 unidad`/`Individual`, `2 unidades`/`Dúo`/`Pack x2`, `3+1`/`4 unidades`).
- **Importes de ejemplo**: solo en la vista previa de un producto que Shopify no devuelve, y rotulados. Son los importes de respaldo que traía el tema original.
- **Ejemplos de opiniones** (10 por producto): solo en borrador y editor, rotulados. En el tema publicado no aparecen (Personalizar → Configuración del tema → *Nidomía · Compra y confianza* → «Ejemplos de opiniones»).
- **Opiniones reales**: cargalas en el metafield de producto `nidomia.opiniones` (tipo JSON). Las estrellas y el promedio se calculan de esa lista. Ejemplo:
  ```json
  [{"alias":"Rocío V.","rating":5,"texto":"Lo puse en el balcón y ahora paso con la silla.","verificada":true}]
  ```
  El botón «Escribir una opinión» usa el formulario de contacto de siempre: te llega por correo y vos decidís cuáles cargar.
- **«Más vendido»**: solo con la etiqueta `mas-vendido` en el producto. Usala únicamente si tus ventas lo respaldan.
- **«Últimas unidades»**: sale del inventario de Shopify (productos con stock controlado y sin venta sin stock). El umbral se cambia en Configuración del tema.
- **«% vendido»**: etiqueta `stock-inicial-NN` más el inventario actual.
- **Oferta con vencimiento**: etiqueta `oferta-hasta-AAAA-MM-DD`; se oculta sola al vencer, pero **el precio lo seguís cambiando vos en Shopify**.
- **Cuotas, envío y plazo**: Configuración del tema → *Nidomía · Compra y confianza*. El plazo de entrega solo se muestra si lo completás.

## Qué no pude verificar

- **Tu Shopify real.** No subí el tema ni lo probé con tus precios, stock, inventario ni checkout. Las pruebas usaron productos de prueba con los importes de respaldo del tema anterior ($54.990, $50.990, $59.990, $69.990, $149.990 y packs de 5, 15 y 25 %). El checkout fue simulado: confirmá en la vista previa que el importe del checkout coincide con el anunciado. Por construcción coincide, porque el botón agrega la misma variante cuyo precio se muestra.
- **Por qué tus productos no se resolvían.** No pude ver tu tienda, así que la causa más probable (productos en borrador o sin el canal «Tienda online») es una deducción. El tema ahora cubre todos los casos, pero si querés que las fichas muestren datos reales, publicá los productos en «Tienda online» o elegilos en Catálogo Nidomía.
- **Safari y Android reales.** Probé con Chromium emulando un iPhone 13 (390 × 664 de pantalla visible) y anchos de 320 a 1440 px.
- **Reproducción de los videos.** El navegador de prueba no reproduce H.264. Comprobé que los trozos se arman en un MP4 idéntico byte a byte al original.

Lo que sí se verificó sobre el código final: recorrido completo en celular (elegir producto → pack → agregar → carrito → checkout) con 39 de 39 comprobaciones en cada ficha probada y 37 de 37 con movimiento reducido; el escenario «productos sin resolver» con 13 de 13 (cada tarjeta y el menú abren su ficha, el carrito de vista previa no toca Shopify); la tienda publicada sin productos devuelve la 404 del tema; el verificador oficial de temas de Shopify sin errores (2 avisos de rendimiento sobre la precarga de fuentes); accesibilidad automática (axe) con 0 violaciones en home, fichas, carrito, cajón del carrito y menú; ningún desborde horizontal en 63 combinaciones de ancho y página.

## Para que decidas

- **El hero ya trae «3 cuotas sin interés» dentro de la imagen.** El interruptor de cuotas apaga el resto (franjas, chips, fichas, carrito) pero no esa imagen: si dejás de ofrecer cuotas, hay que cambiarla.
- **Saqué el enlace a Mercado Libre** de la ficha de la mopa, porque lleva al cliente fuera de la tienda.
- **Menú.** Quité los botones «Buscar» y «Mi lista» (estaban deshabilitados). Con cinco productos, las categorías del menú llevan directo a cada ficha.
- **Videos de referencia.** Los de YouTube siguen rotulados como referencia de terceros y se cargan recién al tocar.
- **Las fotos y videos que no se usan** en el diseño nuevo siguen en `assets/`: no se borró ninguno.

## Estructura técnica (por si la mantiene un desarrollador)

El tema anterior era una app React ya compilada; no estaba el código fuente, así que se reconstruyó la capa de tienda como Liquid de Shopify + CSS + JavaScript sin dependencias. Se conservó el layout `nidomia`, la sección `nidomia-storefront` y los templates (la `404` ahora también usa esa sección).

- `assets/nidomia.css` y `assets/nidomia.js`: estilos (roles de color documentados al inicio) y comportamiento.
- `sections/nidomia-storefront.liquid`: resuelve los productos y decide qué mostrar (home, ficha, vista previa, 404 o carrito).
- `snippets/nd-variants.liquid`: lista normalizada de variantes; es lo que hace que fichas, tarjetas y ofertas funcionen igual con un producto real o con la vista previa.
- `snippets/nd-home.liquid`, `nd-pdp.liquid` (ficha), `nd-pdp-<producto>.liquid` (texto y medios de cada producto), `nd-cart-drawer.liquid`, `nd-cart-page.liquid`.
- Los importes nunca están escritos a mano, salvo los de la vista previa (en `nd-variants.liquid`, rotulados).
