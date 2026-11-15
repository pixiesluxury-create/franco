// axe con el carrito abierto (cajón con productos) y el menú
const { chromium, devices } = require('playwright'); const axePath=require.resolve('axe-core');
(async()=>{ const base=process.argv[2]; const b=await chromium.launch(); const ctx=await b.newContext({...devices['iPhone 13'],locale:'es-AR'}); const page=await ctx.newPage();
 await page.request.get(base+'/cart/clear.js'); await page.request.post(base+'/cart/add.js',{data:{items:[{id:51000000003,quantity:1},{id:51000000012,quantity:1}]}});
 for (const [name,fn] of [['cajón del carrito', async()=>{await page.tap('[data-nd-cart-open]'); await page.waitForSelector('dialog.nd-drawer[open]'); await page.waitForTimeout(900)}],['menú', async()=>{await page.keyboard.press('Escape'); await page.waitForTimeout(600); await page.tap('[data-nd-menu-open]'); await page.waitForTimeout(500)}]]) {
   if(name==='cajón del carrito'){ await page.goto(base+'/',{waitUntil:'load'}); await page.waitForTimeout(800);} await fn();
   await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'}); await page.addScriptTag({path:axePath});
   const r=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}}));
   console.log(name,'— violaciones:',r.violations.length); r.violations.forEach(v=>console.log(' ',v.impact,v.id,v.nodes[0].target.join(' ')));
 }
 await page.request.get(base+'/cart/clear.js'); await b.close(); })();
