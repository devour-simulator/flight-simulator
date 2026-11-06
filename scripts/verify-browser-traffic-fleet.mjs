const modulePath=process.env.PLAYWRIGHT_MODULE||'playwright';
const{chromium}=await import(modulePath);
const targetUrl=process.env.TEST_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
  await page.goto(targetUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#world canvas',{state:'visible',timeout:15000});
  await page.waitForTimeout(2500);
  if(errors.length)throw new Error(`Page errors: ${errors.join(' | ')}`);
  const result=await page.evaluate(()=>({canvas:!!document.querySelector('#world canvas'),version:document.querySelector('script[src*="game.js"]')?.getAttribute('src')||''}));
  if(!result.canvas||!result.version.includes('traffic-fleet-42'))throw new Error(`Traffic fleet page did not initialize: ${JSON.stringify(result)}`);
  console.log('Browser initialized the detailed NPC traffic fleet without runtime errors');
}finally{await browser.close()}
