# Nidomía «Placas cuadradas» · v3.0 (borrador)

Es tu ZIP `Nidomia-Placas-Cuadradas` con las **fichas de producto** rediseñadas siguiendo la lógica de venta de la página de referencia, pero con el texto de cada uno de tus cinco productos. El home y el resto del tema quedaron igual.

Incluye lo de la v2.5 (arranque de la ficha, abajo) y suma **cinco secciones nuevas** en cada ficha.

## Cómo queda cada ficha, de arriba hacia abajo

1. **Arranque de la compra** (v2.5): stock animado, título grande, insignia de envío, estrellas, promoción, barra de stock, packs, botón y opiniones reales debajo del botón.
2. **Por qué te va a servir** (nueva): cuatro beneficios con íconos y tres datos grandes que cuentan al aparecer (por ejemplo «3 cortes», «7 marcadores», «12 V»).
3. **Cómo lo consigue** (la que ya tenías): ahora el número del paso activo late.
4. **Banda con ondas** (nueva): una frase en tres líneas, ondas que se expanden y una cinta de palabras en movimiento.
5. **Demostración** (la que ya tenías).
6. **Comparación** (nueva): tabla con tildes que se dibujan, con tu producto resaltado frente a dos alternativas habituales.
7. **La duda más común** (la que ya tenías).
8. **Tu compra, paso a paso** (nueva): línea de tiempo que se va rellenando: pagás, lo preparamos, te llega, cambios y devoluciones.
9. **Opiniones** (la que ya tenías).
10. **Para regalar** (nueva): texto propio de cada producto y botón «Ir a comprar» que lleva al bloque de compra.
11. **Detalles y preguntas** y **Seguí explorando** (los que ya tenías).

Cada ficha usa la paleta de su producto. Con «reducir movimiento» activado no se mueve nada y todo queda visible.

## Los textos de cada producto

| Producto | Beneficios | Banda | Comparación (frente a…) | Para regalar |
|---|---|---|---|---|
| Mandolina SupremeCut | Picar deja de ser lo que más tarda | Cuando hay que picar de todo, cae todo en un solo recipiente | Una mandolina frente a lo de siempre (cuchillo y tabla, rallador de caja) | Un regalo que se usa todos los días |
| Mopa plana con escurridor | Trapear sin retorcer el trapo | Cuando toca repasar el piso, enjuagás y escurrís sin tocar el paño | Una mopa que escurre por vos (mopa y balde común, trapo de piso) | Un regalo útil para el primer departamento |
| Tender retráctil de pared | Tendés cuando lo necesitás | Cuando hay ropa para tender, sacás la línea y la recogés al terminar | Un tender que no ocupa el piso (tender de pie, soga atada) | Pensado para los espacios chicos |
| Lápiz 3D + pizarra LED | Creá en volumen y dibujá con luz | Hoy una figura en volumen, mañana un dibujo que brilla | Un solo kit en lugar de dos compras (papel y marcadores, lápiz 3D solo) | Un regalo para quien disfruta de crear |
| Arrancador e inflador Oryx | Inflás, asistís el arranque y tenés luz | Cuando la rueda está baja o la batería sin carga, tenés todo en el mismo equipo | Un equipo en lugar de varios (inflador manual, cables de arranque) | Un regalo para quien maneja seguido |

Todo lo que dicen sale de la ficha de cada producto: medidas, piezas, funciones y advertencias (por ejemplo «el lápiz se usa siempre acompañado por un adulto» o «revisá el voltaje y el manual del OR-EVS6K»). No hay números ni promesas inventadas.

**Las comparaciones son honestas a propósito:** donde una alternativa gana, también se marca (la mandolina no sirve para carne ni huesos; el tender necesita fijarse a la pared). Donde el resultado cambia según el modelo, dice «depende» (–). Esto la hace más creíble.

## Cómo cambiar un texto

Los textos están en estos archivos, un bloque por producto (`when 'mandolina'`, `when 'mopa'`, etc.):

- `snippets/nd-sx-ben.liquid`: beneficios y datos
- `snippets/nd-sx-band.liquid`: banda
- `snippets/nd-sx-cmp.liquid`: comparación
- `snippets/nd-sx-gift.liquid`: para regalar
- `snippets/nd-sx-tl.liquid`: compra paso a paso (es la misma para todos)

Los ítems se separan con `||` y los campos con `::`. No uses el carácter `|` ni comillas simples dentro de un texto.
En «paso a paso», el plazo de entrega aparece si lo cargás en Configuración del tema (*Plazo de entrega*), y el enlace a cambios y devoluciones sale de las políticas de tu tienda. No prometo plazos ni garantías que no estén cargados.

## Lo que no incluí, y por qué

- **Mensajes de Instagram y reseñas con foto:** hace falta contenido real tuyo. No armé ninguno inventado.
- **«Nuestra historia»:** no conozco la historia real de la marca y no quise inventarla. Si me la contás, la escribo.
- **Carrusel de videos en vertical:** solo la mandolina tiene clips propios; el bloque de video de «Demostración» sigue como estaba.
- **«Conocé a…» con puntos sobre el producto:** pide fotos recortadas de cada pieza. Si las tenés, se agrega.
- **Cartel de mail con 10 %:** interrumpe la compra y depende de una herramienta de terceros. Lo agrego si lo querés.

No hizo falta ninguna imagen nueva: todo está hecho con código.

## Lo que viene de la v2.5

- Arranque de la ficha (stock, título, insignia, estrellas, promoción, barra de stock) con datos reales de Shopify.
- Las opiniones debajo del botón se llenan solas con **reseñas reales**: cargalas en el metafield `nidomia.opiniones` (hay un molde en `plantilla-resenas-reales.json`) o con una app de reseñas. No hay reseñas ni cantidades de reseñas inventadas: sin reseñas cargadas, el renglón dice «Opiná sobre este producto».
- Correcciones: nombre accesible del botón de compra, «volver arriba» ya no tapa el precio y la advertencia de complejidad de la ficha.

## Pruebas

- **Secciones nuevas:** 32 de 32 comprobaciones en las 5 fichas (que aparezcan, que los números terminen en su valor, tabla accesible, botón «Ir a comprar», sin desplazamiento horizontal) y con movimiento reducido.
- **Accesibilidad automática (axe):** 0 violaciones en home, las 5 fichas, carrito, cajón del carrito y menú.
- **Compra completa en celular** en las 5 fichas: 36 de 39 comprobaciones, igual que tu ZIP sin tocar. Las 3 que no pasan ya fallaban antes y vienen de tu diseño.
- **Verificador oficial de temas de Shopify:** sin errores y solo 2 avisos de precarga de fuentes.
- Las capturas de `vista-previa/` usan datos de prueba del arnés local (importes y stock de ejemplo).

## Lo que no pude comprobar

Tu Shopify real (precios, inventario, checkout), Safari y Android reales. Lo hice con Chromium emulando un iPhone 13 y anchos de 320 a 1440 px. Con productos que Shopify no devuelve, la ficha ya daba «No encontramos esa página» en tu ZIP; eso no lo toqué.
