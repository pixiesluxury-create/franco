// Escenario del cliente: los productos NO se resuelven en Shopify (borrador). Las fichas tienen que abrir igual.
const { chromium, devices } = require('playwright'); const fs=require('fs');
const base=process.argv[2], out=process.argv[3]; fs.mkdirSync(out,{recursive:true});
const res=[]; const ok=(n,c,x='')=>{res.push(c); console.log((c?'OK   ':'FAIL ')+n+(x?'  → '+x:''))};
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({...devices['iPhone 13'],locale:'es-AR'}); const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push(m.text())});
  const names={'mandolina-supremecut':'Mandolina SupremeCut','mopa-plana-con-escurridor':'Mopa plana con escurridor','tender-retractil-de-pared':'Tender retráctil de pared','lapiz-3d-y-pizarra-led':'Lápiz 3D + pizarra LED','arrancador-e-inflador-oryx':'Arrancador e inflador Oryx'};
  for (const [h,t] of Object.entries(names)) {
    await page.goto(base+'/',{waitUntil:'load'}); await page.waitForTimeout(600);
    await page.evaluate(x=>document.querySelector('.nd-card[href="'+x+'"]').scrollIntoView({block:'center'}),'/products/'+h); await page.waitForTimeout(400);
    await page.tap('.nd-card[href="/products/'+h+'"]'); await page.waitForTimeout(1200);
    const title=await page.textContent('.nd-title').catch(()=>'');
    ok('toca «'+t+'» → abre su ficha (no vuelve al home)', page.url().includes('/products/'+h) && title.trim()===t && !!(await page.$('.nd-preview-note')), page.url().replace(base,'')+' · '+title.trim());
  }
  // compra de vista previa en la mandolina
  await page.goto(base+'/products/mandolina-supremecut',{waitUntil:'load'}); await page.waitForTimeout(900);
  await page.screenshot({path:out+'/preview-ficha.png'});
  const price=await page.textContent('[data-o="price"]');
  await page.evaluate(()=>document.querySelector('#elegir-pack').scrollIntoView({block:'center'})); await page.waitForTimeout(300);
  await page.tap('label[for="nd-pack-preview-mandolina-4"]'); await page.waitForTimeout(400);
  const p4=await page.textContent('[data-o="price"]');
  ok('ficha de vista previa: cambia de pack y actualiza el precio', p4.replace(/\s/g,'')!==price.replace(/\s/g,'') && /164\.970/.test(p4), price.trim()+' → '+p4.trim());
  await page.tap('[data-nd-cta]'); await page.waitForSelector('dialog.nd-drawer[open]'); await page.waitForTimeout(900);
  const d=await page.evaluate(()=>({lines:[...document.querySelectorAll('.nd-drawer .nd-line')].map(l=>l.querySelector('.nd-line-title').textContent.trim()+' | '+l.querySelector('.nd-line-pack').textContent.trim()+' | '+l.querySelector('.nd-line-price b').textContent.trim()), note:!!document.querySelector('.nd-drawer .nd-preview-note'), checkoutLink:!!document.querySelector('[data-nd-checkout]'), total:document.querySelector('.nd-drawer .nd-total-row b').textContent.trim(), count:document.querySelector('[data-nd-cart-count]').textContent.trim()}));
  ok('carrito de vista previa: muestra el producto elegido y avisa que es vista previa', d.lines.length===1 && /3\+1|3 \+ 1/.test(d.lines[0]) && d.note, d.lines[0]);
  ok('carrito de vista previa: NO ofrece ir al checkout real', !d.checkoutLink && /164\.970/.test(d.total), 'total '+d.total);
  ok('contador del header', d.count==='1');
  await page.screenshot({path:out+'/preview-carrito.png'});
  const real=await page.evaluate(()=>fetch('/cart.js').then(r=>r.json())); ok('no se escribió nada en el carrito real de Shopify', real.items.length===0);
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  // recarga: el carrito de vista previa persiste en la sesión
  await page.goto(base+'/cart',{waitUntil:'load'}); await page.waitForTimeout(900);
  ok('página /cart con vista previa', /164\.970/.test(await page.textContent('.nd-cart-page .nd-total-row b')));
  await page.tap('.nd-cart-page [data-nd-qty="0"]'); await page.waitForTimeout(500);
  ok('quitar la línea vacía el carrito de vista previa', !!(await page.$('.nd-empty')));
  // barra: header y menú también abren fichas
  await page.goto(base+'/',{waitUntil:'load'}); await page.tap('[data-nd-menu-open]'); await page.waitForTimeout(400);
  const hrefs=await page.$$eval('#nd-menu a',a=>a.map(x=>x.getAttribute('href'))); ok('menú: los 5 enlaces apuntan a fichas (ninguno al home)', hrefs.length===5 && hrefs.every(h=>/^\/products\//.test(h)), hrefs.join(' '));
  console.log('errores:', errs.length?errs.join(' | '):'ninguno'); console.log(res.filter(Boolean).length+'/'+res.length+' correctas'); await b.close(); process.exit(res.every(Boolean)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
