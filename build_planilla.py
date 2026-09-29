"""Arma la planilla de rentabilidad MercadoLibre a partir de la lista del proveedor
(data/lista_proveedor.json) y los precios de referencia de ML (data/precios_ml.tsv).

Uso: python3 build_planilla.py  ->  Rentabilidad_MercadoLibre.xlsx
"""
import json
import re
from pathlib import Path

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

BASE = Path(__file__).parent
OUT = BASE / "Rentabilidad_MercadoLibre.xlsx"

# ---------------------------------------------------------------- parámetros
# (nombre, valor, formato, nota/fuente)
PARAMS = [
    ("Tipo de cambio (ARS por USD)", 1555, "$#,##0",
     "Dólar blue venta 29/09/2026 ($1.555). Oficial BNA venta: $1.545. Fuente: La Nación, 29/09/2026."),
    ("Flete / traslado / otros costos de compra (% sobre costo)", 0.0, "0.0%",
     "No incluido por defecto. Si traer la mercadería te cuesta, cargalo acá (ej. 10%)."),
    ("Comisión ML publicación Clásica - Belleza (%)", 0.14, "0.0%",
     "Cargo por vender Belleza y Cuidado Personal, publicación clásica (13%-14%). Premium ~+4 pts."),
    ("IVA sobre cargos de ML (%)", 0.21, "0.0%",
     "ML factura sus cargos con IVA 21%."),
    ("Otros impuestos / retenciones (IIBB, etc.) (%)", 0.0, "0.0%",
     "No incluido por defecto; depende de tu situación fiscal y provincia."),
    ("Umbral envío gratis obligatorio ($)", 33000, "$#,##0",
     "Desde $33.000 el envío gratis es obligatorio y lo paga el vendedor."),
    ("Límite tramo 1 costo fijo ($)", 15000, "$#,##0", "Tramos de costo fijo por unidad (ML Argentina 2026)."),
    ("Límite tramo 2 costo fijo ($)", 25000, "$#,##0", ""),
    ("Costo fijo por unidad - hasta $15.000", 1115, "$#,##0",
     "ML Argentina 2026. Pueden haber subido desde el 1/9/2026."),
    ("Costo fijo por unidad - $15.000 a $25.000", 2300, "$#,##0", ""),
    ("Costo fijo por unidad - $25.000 a $33.000", 2810, "$#,##0", ""),
    ("Envío gratis a cargo vendedor - hasta 0,3 kg", 6190, "$#,##0",
     "Reputación verde/MercadoLíder, 50% desc. (sept-2026, $33.000-$49.999)."),
    ("Envío gratis a cargo vendedor - 0,3 a 0,5 kg", 6900, "$#,##0", "Estimado (ML escala por peso)."),
    ("Envío gratis a cargo vendedor - 0,5 a 1 kg", 7800, "$#,##0", "Estimado."),
    ("Envío gratis a cargo vendedor - 1 a 2 kg", 9500, "$#,##0", "Estimado."),
    ("Envío gratis a cargo vendedor - más de 2 kg", 11500, "$#,##0", "Estimado."),
    ("Objetivo ganancia 1", 0.30, "0%", "Ganancia neta sobre el costo."),
    ("Objetivo ganancia 2", 0.40, "0%", ""),
    ("Objetivo ganancia 3", 0.50, "0%", ""),
]
P0 = 4  # primera fila de parámetros
P = {k: f"'Parámetros'!$B${P0 + i}" for i, k in enumerate([
    "tc", "flete", "com", "iva", "otros", "umbral", "t1", "t2", "f1", "f2", "f3",
    "e03", "e05", "e1", "e2", "e2p", "r1", "r2", "r3"])}
DEF = {k: PARAMS[i][1] for i, k in enumerate([
    "tc", "flete", "com", "iva", "otros", "umbral", "t1", "t2", "f1", "f2", "f3",
    "e03", "e05", "e1", "e2", "e2p", "r1", "r2", "r3"])}


# ---------------------------------------------------------------- datos
def peso_estimado(desc: str) -> float:
    d = desc.upper().replace(",", ".")
    if "AGE-R" in d and ("BOOSTER" in d or "CLEANSER HEAD" in d or "ROLLER" in d):
        return 0.8
    if "BRUSH STEAM" in d:
        return 1.0
    total = 0.0
    for num, unit in re.findall(r"(\d+(?:\.\d+)?)\s*(ML|GR|G|L)\b", d):
        v = float(num)
        if unit == "L":
            v *= 1000
        elif v < 10 and "." in num and unit == "ML":  # ej. 1.060ML = 1060 ml
            v *= 1000
        total += v
    mult = re.search(r"X\s*(\d+)\s*(UN|UNI|PCS|PC)", d)
    if mult and total:
        total *= int(mult.group(1))
    if total == 0:
        total = 250
    return round(total / 1000 * 1.1 + 0.08, 2)


def cargar():
    items = json.load(open(BASE / "data" / "lista_proveedor.json"))
    for it in items:
        it.update(ml=None, conf="", nota="", url="")
    for line in open(BASE / "data" / "precios_ml.tsv"):
        if line.startswith("#") or not line.strip():
            continue
        idxs, precio, nota, url = line.rstrip("\n").split("\t")
        baja = nota.startswith("[baja]")
        nota = nota.replace("[baja] ", "")
        for i in map(int, idxs.split(",")):
            it = items[i]
            it["nota"], it["url"] = nota, url
            if precio.isdigit():
                it["ml"] = int(precio)
                it["conf"] = "Baja (verificar)" if baja else "Normal"
            else:
                it["conf"] = "Dato contradictorio"
    for it in items:
        it["peso"] = peso_estimado(it["desc"])
        it["marca"] = (it["brand"] or "").replace("AUSSSIE", "AUSSIE").replace("DR, ALTHEA", "DR. ALTHEA")
    return items


# Réplica en Python de las fórmulas (solo para decidir qué producto va en cada hoja)
def envio(peso):
    for lim, k in ((0.3, "e03"), (0.5, "e05"), (1, "e1"), (2, "e2")):
        if peso <= lim:
            return DEF[k]
    return DEF["e2p"]


def calc(it):
    costo = it["usd"] * DEF["tc"] * (1 + DEF["flete"])
    pr = it["ml"]
    if pr is None:
        return None
    ce = DEF["com"] * (1 + DEF["iva"]) + DEF["otros"]
    if pr < DEF["umbral"]:
        fijo = DEF["f1"] if pr < DEF["t1"] else DEF["f2"] if pr < DEF["t2"] else DEF["f3"]
        cargos = pr * ce + fijo * (1 + DEF["iva"])
    else:
        cargos = pr * ce + envio(it["peso"])
    gan = pr - cargos - costo
    return gan / costo


def clasif(roi):
    if roi is None:
        return "Sin precio ML"
    if roi >= 0.5:
        return "50% o más"
    if roi >= 0.4:
        return "40% a 50%"
    if roi >= 0.3:
        return "30% a 40%"
    if roi >= 0:
        return "Menos de 30%"
    return "Pérdida"


# ---------------------------------------------------------------- estilos
FONT = "Arial"
F_BASE = Font(name=FONT, size=10)
F_INPUT = Font(name=FONT, size=10, color="0000FF")
F_LINK = Font(name=FONT, size=10, color="008000")
F_HDR = Font(name=FONT, size=10, bold=True, color="FFFFFF")
F_TITLE = Font(name=FONT, size=14, bold=True)
F_BOLD = Font(name=FONT, size=10, bold=True)
F_NOTE = Font(name=FONT, size=9, italic=True, color="555555")
FILL_HDR = PatternFill("solid", fgColor="1F3864")
FILL_KEY = PatternFill("solid", fgColor="FFFF00")
FILL_BUCKET = {
    "50% o más": PatternFill("solid", fgColor="C6EFCE"),
    "40% a 50%": PatternFill("solid", fgColor="DDEBF7"),
    "30% a 40%": PatternFill("solid", fgColor="FFF2CC"),
}
THIN = Border(bottom=Side(style="thin", color="D9D9D9"))
MONEY = "$#,##0;($#,##0);-"
PCT = "0.0%;(0.0%);-"


def header(ws, row, titles, widths):
    for c, (t, w) in enumerate(zip(titles, widths), 1):
        cell = ws.cell(row=row, column=c, value=t)
        cell.font, cell.fill = F_HDR, FILL_HDR
        cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        ws.column_dimensions[get_column_letter(c)].width = w
    ws.row_dimensions[row].height = 42


# ---------------------------------------------------------------- hojas
def hoja_parametros(wb):
    ws = wb.create_sheet("Parámetros")
    ws["A1"] = "Parámetros del cálculo (editá las celdas amarillas)"
    ws["A1"].font = F_TITLE
    ws["A2"] = ("Todo el libro se recalcula al cambiar estos valores. Texto azul = dato ingresado; "
                "negro = fórmula; verde = vínculo a otra hoja.")
    ws["A2"].font = F_NOTE
    ws.column_dimensions["A"].width = 58
    ws.column_dimensions["B"].width = 14
    ws.column_dimensions["C"].width = 90
    for i, (nombre, valor, fmt, nota) in enumerate(PARAMS):
        r = P0 + i
        ws.cell(row=r, column=1, value=nombre).font = F_BASE
        c = ws.cell(row=r, column=2, value=valor)
        c.font, c.number_format, c.fill = F_INPUT, fmt, FILL_KEY
        ws.cell(row=r, column=3, value=nota).font = F_NOTE
    r = P0 + len(PARAMS) + 1
    notas = [
        "Cómo se calcula:",
        "Costo ARS = Precio USD × Tipo de cambio × (1 + Flete %).",
        "Cargos ML = Precio ML × (Comisión × (1 + IVA) + Otros %) + [costo fijo × (1 + IVA) si el precio < $33.000; "
        "si no, costo del envío gratis según peso].",
        "Ganancia neta = Precio ML − Cargos ML − Costo ARS.   % Ganancia = Ganancia neta / Costo ARS (lo que te deja sobre lo que invertiste).",
        "Precio mínimo para X% = el precio de venta en ML con el que la ganancia neta llega a X% del costo.",
        "Peso estimado a partir del volumen de la descripción (+ envase); solo afecta el costo de envío.",
        "Precios ML de referencia: publicaciones en mercadolibre.com.ar relevadas por búsqueda web el 29/09/2026 "
        "(link en cada fila). Son precios de publicación con descuento aplicado cuando lo había.",
    ]
    for t in notas:
        ws.cell(row=r, column=1, value=t).font = F_BOLD if t.endswith(":") else F_NOTE
        r += 1
    return ws


COLS = [
    ("Código", 10), ("Marca", 18), ("Categoría", 16), ("Descripción", 52), ("Precio USD", 10),
    ("Costo ARS", 12), ("Peso est. (kg)", 9), ("Envío ML si ≥ umbral", 11), ("Precio ML referencia", 13),
    ("Confiabilidad precio", 13), ("Cargos ML (comisión + fijo/envío)", 14), ("Ganancia neta ARS", 13),
    ("% Ganancia s/ costo", 11), ("% Margen s/ venta", 10), ("Clasificación", 15),
    ("Precio mín. ML p/ 30%", 13), ("Precio mín. ML p/ 40%", 13), ("Precio mín. ML p/ 50%", 13),
    ("Nota del precio ML", 45), ("Link publicación ML", 40),
]


def formula_target(r, rkey):
    ce = f"({P['com']}*(1+{P['iva']})+{P['otros']})"
    k = f"F{r}*(1+{P[rkey]})"
    c = [f"({k}+{P[f]}*(1+{P['iva']}))/(1-{ce})" for f in ("f1", "f2", "f3")]
    c4 = f"({k}+H{r})/(1-{ce})"
    inner = (f"IF({c[0]}<{P['t1']},{c[0]},IF({c[1]}<{P['t2']},{c[1]},"
             f"IF({c[2]}<{P['umbral']},{c[2]},{c4})))")
    return f"=ROUNDUP(({inner})/100,0)*100"


def hoja_todos(wb, items):
    ws = wb.create_sheet("Todos los productos")
    ws["A1"] = "Lista completa del proveedor con cálculo de rentabilidad en MercadoLibre"
    ws["A1"].font = F_TITLE
    ws["A2"] = ("Columnas P-R: a cuánto tenés que vender en ML para ganar 30/40/50% sobre el costo "
                "(sirve para chequear los productos sin precio de referencia). Usá el filtro de 'Clasificación'.")
    ws["A2"].font = F_NOTE
    hr = 3
    header(ws, hr, [c for c, _ in COLS], [w for _, w in COLS])
    fila = {}
    for n, it in enumerate(items):
        r = hr + 1 + n
        fila[n] = r
        vals = [it["code"], it["marca"], it["cat"], it["desc"], it["usd"]]
        for c, v in enumerate(vals, 1):
            ws.cell(row=r, column=c, value=v).font = F_BASE
        ws.cell(row=r, column=5).font = F_INPUT
        ws.cell(row=r, column=5).number_format = '"US$ "#,##0.00'
        ws.cell(row=r, column=6, value=f"=E{r}*{P['tc']}*(1+{P['flete']})").number_format = MONEY
        g = ws.cell(row=r, column=7, value=it["peso"])
        g.font, g.number_format = F_INPUT, "0.00"
        ws.cell(row=r, column=8, value=(
            f"=IF(G{r}<=0.3,{P['e03']},IF(G{r}<=0.5,{P['e05']},IF(G{r}<=1,{P['e1']},"
            f"IF(G{r}<=2,{P['e2']},{P['e2p']}))))")).number_format = MONEY
        i = ws.cell(row=r, column=9, value=it["ml"])
        i.font, i.number_format = F_INPUT, MONEY
        ws.cell(row=r, column=10, value=it["conf"] or None).font = F_BASE
        ws.cell(row=r, column=11, value=(
            f'=IF(I{r}="","",I{r}*({P["com"]}*(1+{P["iva"]})+{P["otros"]})+IF(I{r}<{P["umbral"]},'
            f'IF(I{r}<{P["t1"]},{P["f1"]},IF(I{r}<{P["t2"]},{P["f2"]},{P["f3"]}))*(1+{P["iva"]}),H{r}))'
        )).number_format = MONEY
        ws.cell(row=r, column=12, value=f'=IF(I{r}="","",I{r}-K{r}-F{r})').number_format = MONEY
        ws.cell(row=r, column=13, value=f'=IF(I{r}="","",L{r}/F{r})').number_format = PCT
        ws.cell(row=r, column=14, value=f'=IF(I{r}="","",L{r}/I{r})').number_format = PCT
        ws.cell(row=r, column=15, value=(
            f'=IF(I{r}="","Sin precio ML",IF(M{r}>=0.5,"50% o más",IF(M{r}>=0.4,"40% a 50%",'
            f'IF(M{r}>=0.3,"30% a 40%",IF(M{r}>=0,"Menos de 30%","Pérdida")))))'))
        for c, rk in ((16, "r1"), (17, "r2"), (18, "r3")):
            ws.cell(row=r, column=c, value=formula_target(r, rk)).number_format = MONEY
        ws.cell(row=r, column=19, value=it["nota"] or None).font = F_NOTE
        if it["url"]:
            u = ws.cell(row=r, column=20, value=it["url"])
            u.hyperlink, u.font = it["url"], Font(name=FONT, size=9, color="0563C1", underline="single")
        for c in range(6, 19):
            if ws.cell(row=r, column=c).font != F_INPUT:
                ws.cell(row=r, column=c).font = F_BASE
        for c in range(1, len(COLS) + 1):
            ws.cell(row=r, column=c).border = THIN
    last = hr + len(items)
    ws.auto_filter.ref = f"A{hr}:{get_column_letter(len(COLS))}{last}"
    ws.freeze_panes = ws.cell(row=hr + 1, column=5)
    for label, fill in FILL_BUCKET.items():
        ws.conditional_formatting.add(f"O{hr + 1}:O{last}",
                                      CellIsRule(operator="equal", formula=[f'"{label}"'], fill=fill))
    ws.conditional_formatting.add(f"O{hr + 1}:O{last}", CellIsRule(
        operator="equal", formula=['"Pérdida"'], fill=PatternFill("solid", fgColor="F8CBAD")))
    ws.cell(row=hr, column=9).comment = Comment(
        "Precio de venta de referencia en ML Argentina (relevado 29/09/2026). Vacío = no se encontró "
        "publicación con precio visible. Podés cargar vos el precio que veas en ML y la fila se recalcula.", "Análisis")
    return ws, fila


BUCKET_COLS = [
    ("Código", 10), ("Descripción", 55), ("Precio USD", 10), ("Costo ARS", 12), ("Precio ML referencia", 13),
    ("Ganancia neta ARS", 13), ("% Ganancia s/ costo", 11), ("% Margen s/ venta", 10),
    ("Clasificación actual", 15), ("Confiabilidad precio", 14), ("Nota del precio ML", 45), ("Link", 40),
]
BUCKET_SRC = ["A", "D", "E", "F", "I", "L", "M", "N", "O", "J", "S", "T"]


def hoja_bucket(wb, nombre, titulo, items, fila, roi):
    ws = wb.create_sheet(nombre)
    ws["A1"] = titulo
    ws["A1"].font = F_TITLE
    ws["A2"] = ("Lista armada con los parámetros por defecto (TC $1.555). Los valores están vinculados a "
                "'Todos los productos': si cambiás parámetros, revisá la columna 'Clasificación actual'.")
    ws["A2"].font = F_NOTE
    header(ws, 3, [c for c, _ in BUCKET_COLS], [w for _, w in BUCKET_COLS])
    sel = sorted(items, key=lambda n: -roi[n])
    fmts = {3: '"US$ "#,##0.00', 4: MONEY, 5: MONEY, 6: MONEY, 7: PCT, 8: PCT}
    for k, n in enumerate(sel):
        r = 4 + k
        src = fila[n]
        for c, col in enumerate(BUCKET_SRC, 1):
            cell = ws.cell(row=r, column=c, value=f"=IF('Todos los productos'!{col}{src}=\"\",\"\",'Todos los productos'!{col}{src})")
            cell.font = F_LINK
            if c in fmts:
                cell.number_format = fmts[c]
            cell.border = THIN
    if not sel:
        ws.cell(row=4, column=1, value="(ningún producto en este rango)").font = F_NOTE
    ws.freeze_panes = "C4"
    return len(sel)


def hoja_resumen(wb, counts, n_total):
    ws = wb["Resumen"]
    ws["A1"] = "Rentabilidad en MercadoLibre Argentina — Lista COSMÉTICOS Epic Importados (29/09/2026)"
    ws["A1"].font = F_TITLE
    ws.column_dimensions["A"].width = 34
    ws.column_dimensions["B"].width = 16
    ws.column_dimensions["C"].width = 90
    ws["A3"], ws["B3"] = "Clasificación (ganancia neta s/ costo)", "Cant. productos"
    for c in ("A3", "B3"):
        ws[c].font, ws[c].fill = F_HDR, FILL_HDR
    rng = f"'Todos los productos'!$O$4:$O${3 + n_total}"
    labels = ["50% o más", "40% a 50%", "30% a 40%", "Menos de 30%", "Pérdida", "Sin precio ML"]
    for i, lab in enumerate(labels):
        r = 4 + i
        ws.cell(row=r, column=1, value=lab).font = F_BASE
        ws.cell(row=r, column=2, value=f'=COUNTIF({rng},A{r})').font = F_BASE
        if lab in FILL_BUCKET:
            ws.cell(row=r, column=1).fill = FILL_BUCKET[lab]
    ws.cell(row=10, column=1, value="Total productos en la lista").font = F_BOLD
    ws.cell(row=10, column=2, value="=SUM(B4:B9)").font = F_BOLD
    notas = [
        ("Qué hay en cada hoja", True),
        ("• '50% o más', '40% a 50%', '30% a 40%': los productos con precio de referencia en ML, separados por ganancia.", False),
        ("• 'Todos los productos': los 770 ítems de la lista, con costo, cargos de ML, ganancia y el precio mínimo "
         "de venta en ML para ganar 30/40/50%.", False),
        ("• 'Parámetros': tipo de cambio, comisiones, costos fijos y envío. Cambiá ahí y se recalcula todo.", False),
        ("", False),
        ("Supuestos importantes", True),
        ("• Costo = precio US$ de la lista × dólar $1.555 (blue venta 29/09/2026). No incluye flete/traslado ni impuestos "
         "de importación: si tenés esos costos, cargalos en 'Parámetros' (Flete %).", False),
        ("• Venta con publicación Clásica (14% + IVA). Debajo de $33.000 se suma el costo fijo por unidad; "
         "desde $33.000 el envío gratis lo pagás vos (reputación verde, 50% desc.).", False),
        ("• 'Ganancia' = ganancia neta sobre lo que invertiste (ganancia / costo). También se muestra el margen sobre el precio de venta.", False),
        ("• Precios de ML relevados con búsqueda web: solo aparecieron con precio visible ~16% de los productos. "
         "Los marcados 'Baja (verificar)' vienen de publicaciones importadas o datos dudosos: confirmalos antes de comprar.", False),
        ("• Para el resto, usá las columnas 'Precio mín. ML p/ 30/40/50%' y comparalas con lo que veas en ML.", False),
    ]
    r = 12
    for t, bold in notas:
        ws.cell(row=r, column=1, value=t).font = F_BOLD if bold else F_BASE
        r += 1


def main():
    items = cargar()
    roi = {n: calc(it) for n, it in enumerate(items)}
    wb = Workbook()
    wb.active.title = "Resumen"
    hoja_parametros(wb)
    _, fila = hoja_todos(wb, items)
    counts = {}
    for nombre, titulo in (("50% o más", "Productos que dejan 50% o más de ganancia neta sobre el costo"),
                           ("40% a 50%", "Productos que dejan entre 40% y 50% de ganancia neta sobre el costo"),
                           ("30% a 40%", "Productos que dejan entre 30% y 40% de ganancia neta sobre el costo")):
        sel = [n for n in roi if clasif(roi[n]) == nombre]
        counts[nombre] = hoja_bucket(wb, nombre, titulo, sel, fila, roi)
    hoja_resumen(wb, counts, len(items))
    order = ["Resumen", "50% o más", "40% a 50%", "30% a 40%", "Todos los productos", "Parámetros"]
    wb._sheets = [wb[s] for s in order]
    for ws in wb.worksheets:
        ws.sheet_view.zoomScale = 100
    wb.save(OUT)
    print("guardado", OUT)
    for k in ("50% o más", "40% a 50%", "30% a 40%", "Menos de 30%", "Pérdida", "Sin precio ML"):
        print(k, sum(1 for n in roi if clasif(roi[n]) == k))


if __name__ == "__main__":
    main()
