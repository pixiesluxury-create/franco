# Nidomía · tema v2 (borrador para revisar)

Copia del tema que ya tenían, con el home, las cinco fichas y el carrito rediseñados.
El tema original no se tocó: esto es una copia aparte.

## Qué hay en esta carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `Nidomia-Savor-Shopify-v2-borrador.zip` | El tema completo, listo para subir a Shopify (19,9 MB). |
| `vista-previa/movil/` y `vista-previa/escritorio/` | Capturas del home, las cinco fichas y el carrito (lateral y página). Incluye `primer-vistazo-*` de cada ficha en un celular de 664 px de alto. |
| `cambios/` | Solo los archivos nuevos o modificados, para leer el código sin descomprimir. |
| `pruebas/` | Los scripts con los que se probó (servidor de prueba, recorrido de compra, accesibilidad). |

## Cómo dejarlo en borrador

1. Shopify Admin → **Tienda online → Temas → Agregar tema → Subir archivo ZIP**.
2. Elegí `Nidomia-Savor-Shopify-v2-borrador.zip`. Un tema subido **queda sin publicar**: el tema que está en vivo no cambia.
3. En el menú `⋯` del tema nuevo, **Vista previa** (o **Personalizar**) para revisarlo con tus productos reales.
4. Cuando lo apruebes: **Publicar**.

No pude subirlo yo: no tengo acceso a tu Shopify. Todo lo de abajo se probó con productos de prueba (ver «Qué no pude verificar»).

## Qué cambió

**Color y jerarquía.** Blanco para el contenido, azul marino para títulos y precios, celeste suave para agrupar (caja de precio, demostraciones), azul intenso solo para «Agregar al carrito» y la selección de pack, coral solo para descuentos y ahorro. Sin placas azules grandes ni botones secundarios que compitan: los accesos a otras fichas son enlaces, no botones.

**Home como recorrido de compra** (cada sección responde una pregunta):
1. Hero aprobado, con su imagen propia para celular y un único botón, «Encontrá tu solución», que baja a los productos.
2. «¿Qué querés resolver hoy?»: las cinco soluciones en grilla de 2 columnas (sin deslizar al costado), con imagen, beneficio de una línea y precio de Shopify.
3. «Una solución para cada día»: antes y después arrastrable por producto (el de la mandolina se conservó), cambia cada 3 s con pausa, anterior y siguiente; debajo de cada uno, acceso a la ficha.
4. «Llevá más y pagá menos»: cada pack con qué incluye, precio y ahorro en pesos frente a comprar las mismas unidades sueltas. La opción de mayor ahorro va primera y marcada.
5. «Comprá con tranquilidad»: opiniones, medios de pago, envío y las preguntas que frenan la compra.

**Fichas.** Orden de la columna de compra: disponibilidad → nombre y valoración → precio, cuotas y envío → tres beneficios → elección del pack → botón → opiniones breves (tarjeta rotativa) y medios de pago. Después: «Cómo lo consigue» (cada explicación sincronizada con su demostración; en escritorio la imagen queda fija al costado, en celular va junto al texto), demostración con comparador y video, la duda principal de cada producto, tarjetas de opiniones, y detalles y preguntas. El precio final pesa más que la cuota y el ahorro se lee al lado. En celular, cuando el botón principal sale de pantalla aparece una barra inferior con el precio del pack elegido.

**Animaciones.** Franja de cuotas y envío (con pausa), aparición suave al scrollear, borde de selección de pack animado, precio/cuotas/ahorro que se actualizan juntos, y el carrito lateral que se abre mostrando el producto agregado. Con «reducir movimiento» activado no hay desplazamientos ni cambios automáticos. El scroll es el natural del navegador.

## Datos reales y datos de ejemplo

- **Precios, packs y ahorro**: salen de las variantes de Shopify. Los packs se reconocen por el nombre de la variante (`1 unidad`/`Individual`, `2 unidades`/`Dúo`/`Pack x2`, `3+1`/`4 unidades`), igual que en el tema anterior.
- **Ejemplos de opiniones** (10 por producto): se ven solo en el borrador y en el editor, rotulados «Ejemplos de opiniones». En el tema publicado no aparecen (Personalizar → Configuración del tema → *Nidomía · Compra y confianza* → «Ejemplos de opiniones»).
- **Opiniones reales**: cargalas en el metafield de producto `nidomia.opiniones` (tipo JSON). Las estrellas y el promedio se calculan a partir de esa lista. Ejemplo:
  ```json
  [{"alias":"Rocío V.","rating":5,"texto":"Lo puse en el balcón y ahora paso con la silla.","verificada":true}]
  ```
  El botón «Escribir una opinión» usa el formulario de contacto de siempre: te llega por correo y vos decidís cuáles cargar.
- **«Más vendido»**: solo aparece si agregás la etiqueta `mas-vendido` al producto. Hacelo únicamente si tus ventas lo respaldan.
- **«Últimas unidades»**: sale del inventario de Shopify (productos con stock controlado y sin venta sin stock). El umbral se cambia en Configuración del tema.
- **«% vendido»**: etiqueta `stock-inicial-NN` (stock con el que arrancó) más el inventario actual.
- **Oferta con vencimiento**: etiqueta `oferta-hasta-AAAA-MM-DD`. Muestra «Precio de oferta hasta el DD/MM» y se oculta sola al vencer; **el precio lo seguís cambiando vos en Shopify**.
- **Cuotas, envío y plazo**: Configuración del tema → *Nidomía · Compra y confianza*. El plazo de entrega solo se muestra si lo completás.

## Qué no pude verificar

- **Tu Shopify real.** No subí el tema ni lo probé con tus precios, stock, inventario ni checkout. Las pruebas usaron productos de prueba con los importes de respaldo del tema anterior ($54.990, $50.990, $59.990, $69.990, $149.990 y packs de 5, 15 y 25 %). El checkout fue simulado: confirmá en la vista previa que el importe del checkout coincide con el anunciado. Por construcción coincide, porque el botón agrega la misma variante cuyo precio se muestra.
- **Safari y Android reales.** Probé con Chromium emulando un iPhone 13 (390 × 664 de pantalla visible) y anchos de 320 a 1440 px.
- **Reproducción de los videos.** El navegador de prueba no reproduce H.264. Comprobé que los trozos se arman en un MP4 idéntico byte a byte al original; en tu navegador deberían reproducirse como antes.

Lo que sí se verificó: recorrido completo en celular (elegir producto → pack → agregar → carrito → checkout) con 39 comprobaciones correctas en cada ficha probada (mandolina, tender, lápiz y arrancador) y 37 de 37 con movimiento reducido (mopa); el verificador oficial de temas de Shopify sin errores (2 avisos de rendimiento sobre la precarga de fuentes); accesibilidad automática (axe) con 0 violaciones en home y fichas; ningún desborde horizontal en 63 combinaciones de ancho y página.

## Para que decidas

- **El hero ya trae «3 cuotas sin interés» dentro de la imagen.** El interruptor de cuotas apaga el resto (franja, fichas, carrito) pero no esa imagen: si dejás de ofrecer cuotas, hay que cambiarla.
- **Saqué el enlace a Mercado Libre** de la ficha de la mopa («Ver también el modelo AV2821 en uso»), porque lleva al cliente fuera de la tienda.
- **Menú.** Quité los botones «Buscar» y «Mi lista» (estaban deshabilitados). Con cinco productos, las categorías del menú llevan directo a cada ficha.
- **Videos de referencia.** Los de YouTube (mopa, tender, lápiz, arrancador) siguen rotulados como referencia de terceros y se cargan recién al tocar.
- **Comparadores con imágenes de títulos incrustados.** Arrancan al 72 % para que los textos no se pisen.
- **Las 43 fotos y videos que no se usan** en el diseño nuevo (por ejemplo las fotos de reseñas con personas) siguen en `assets/`: no se borró ninguno. Los videos cortos por pieza de la mandolina vuelven en «Mirá cada pieza en uso».

## Estructura técnica (por si la mantiene un desarrollador)

El tema anterior era una app React ya compilada; no estaba el código fuente, así que se reconstruyó la capa de tienda como Liquid de Shopify + CSS + JavaScript sin dependencias. Se conservó el layout `nidomia`, la sección `nidomia-storefront`, los templates y los productos configurados en Configuración del tema.

- `assets/nidomia.css` y `assets/nidomia.js`: estilos (con los roles de color documentados al inicio) y comportamiento.
- `snippets/nd-home.liquid`, `nd-pdp.liquid` (ficha), `nd-pdp-<producto>.liquid` (texto y medios de cada producto), `nd-cart-drawer.liquid`, `nd-cart-page.liquid`.
- El texto de cada ficha está en `nd-pdp-<producto>.liquid`; los importes nunca están escritos a mano.
