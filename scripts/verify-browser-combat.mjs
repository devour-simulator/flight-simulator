const modulePath=process.env.PLAYWRIGHT_MODULE||'playwright';
const{chromium}=await import(modulePath);
const targetUrl=process.env.TEST_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
  await page.goto(targetUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#combatStart').click();
  await page.waitForFunction(()=>document.body.classList.contains('combat-mode'));
  await page.locator('#combatHud').waitFor({state:'visible'});
  await page.waitForFunction(()=>Number(document.querySelector('#combatEnemies')?.textContent)>0);
  await page.keyboard.down('Space');
  await page.waitForTimeout(350);
  await page.keyboard.up('Space');
  await page.keyboard.press('Shift+W');
  await page.waitForTimeout(1200);
  const result=await page.evaluate(()=>({canvas:!!document.querySelector('#world canvas'),wave:document.querySelector('#combatWave')?.textContent,enemies:document.querySelector('#combatEnemies')?.textContent,health:document.querySelector('#combatHealthText')?.textContent,model:document.querySelector('#modelName')?.textContent}));
  if(process.env.COMBAT_SCREENSHOT)await page.screenshot({path:process.env.COMBAT_SCREENSHOT,fullPage:true});
  if(errors.length)throw new Error(`Page errors: ${errors.join(' | ')}`);
  if(!result.canvas||result.model!=='XF-27 SHADOW'||Number(result.enemies)<1)throw new Error(`Combat mode did not initialize: ${JSON.stringify(result)}`);
  console.log(`Combat browser test passed: ${JSON.stringify(result)}`);
}finally{await browser.close()}
