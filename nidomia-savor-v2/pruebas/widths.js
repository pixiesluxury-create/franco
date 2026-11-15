const { chromium } = require('playwright');
(async()=>{
  const base='http://localhost:8102'; const paths=['/','/products/mandolina-supremecut','/products/mopa-plana-con-escurridor','/products/tender-retractil-de-pared','/products/lapiz-3d-y-pizarra-led','/products/arrancador-e-inflador-oryx','/cart'];
  const b=await chromium.launch(); let bad=0, n=0;
  for(const w of [320,360,390,414,600,768,1024,1280,1440]){
    const ctx=await b.newContext({viewport:{width:w,height:800},isMobile:w<700,hasTouch:w<700});
    for(const p of paths){ const page=await ctx.newPage(); await page.goto(base+p,{waitUntil:'load'}); await page.waitForTimeout(500);
      const r=await page.evaluate(()=>{const de=document.documentElement; const over=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0 && r.right>innerWidth+1 && !e.closest('.nd-gallery-track,.nd-perks,dialog,.nd-sticky,.nd-slide:not(.is-active),.nd-band,.nd-orb,.nd-hero-actions,.nd-closing')}).slice(0,3).map(e=>e.className||e.tagName); return {sw:de.scrollWidth,iw:innerWidth,over}});
      n++; if(r.sw>r.iw+1 || r.over.length){bad++; console.log('DESBORDE',w,p,JSON.stringify(r));} await page.close(); }
    await ctx.close(); }
  console.log(`${n} combinaciones (ancho × página) · con desborde: ${bad}`); await b.close();})();
