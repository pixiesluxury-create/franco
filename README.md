# Rentabilidad en MercadoLibre Argentina: lista COSMÉTICOS Epic Importados (29/09/2026)

**`Rentabilidad_MercadoLibre.xlsx`**: planilla principal.

| Hoja | Contenido |
|---|---|
| Resumen | Cantidad de productos por rango de ganancia y supuestos |
| 50% o más / 40% a 50% / 30% a 40% | Productos con precio de referencia en ML, separados por ganancia neta sobre el costo |
| Todos los productos | Los 770 ítems de la lista, con costo, cargos de ML, ganancia y el **precio mínimo de venta en ML para ganar 30/40/50%** |
| Parámetros | Tipo de cambio, comisión, costos fijos y envío (se editan y todo se recalcula) |

## Supuestos (editables en "Parámetros")
- Costo = precio US$ × $1.555 (dólar blue venta 29/09/2026). No incluye flete ni traslado.
- Publicación Clásica en Belleza: 14% + IVA. Debajo de $33.000 se cobra un costo fijo por unidad ($1.115 / $2.300 / $2.810 + IVA). Desde $33.000 el vendedor paga el envío gratis ($6.190 hasta 0,3 kg; los tramos de más peso son estimados).
- "% Ganancia" = ganancia neta / costo.

## Datos
- `data/lista_proveedor.json`: lista del PDF del proveedor (770 productos).
- `data/precios_ml.tsv`: precios de referencia de ML relevados por búsqueda web, con nota y link. Los marcados `[baja]` salen de publicaciones importadas o de datos dudosos.
- `build_planilla.py`: regenera la planilla (`python3 build_planilla.py`).

Sólo ~16% de los productos tenían precio visible en ML por búsqueda web, porque el acceso directo a mercadolibre.com.ar estaba bloqueado en el entorno. Para el resto sirven las columnas de precio mínimo.
