const modulePath = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = await import(modulePath);
const targetUrl = process.env.TEST_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

try {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Loaded simulator page');
  await page.locator('#quickStart').click();
  await page.waitForFunction(() => document.querySelector('#start')?.classList.contains('hidden'));
  console.log('Started quick flight');
  await page.locator('#viewBtn').click();
  await page.locator('#externalAp').waitFor({ state: 'visible' });

  await page.locator('#externalSpeed').fill('280');
  await page.locator('#externalAltitude').fill('12000');
  await page.locator('[data-atc-action]').click();
  await page.locator('[data-atc-action]').click();
  await page.locator('#autoLandBtn').click();
  await page.locator('#externalCmd').filter({ hasText: '已接通' }).waitFor();
  console.log('Connected external autoflight');
  await page.locator('#externalTargetReadout').filter({ hasText: '280 KT' }).waitFor();
  await page.locator('#externalTargetReadout').filter({ hasText: '12,000 FT' }).waitFor();

  await page.locator('#externalSpeed').fill('310');
  await page.locator('#externalAltitude').fill('18000');
  await page.locator('#airportSearch').focus();
  await page.locator('#externalTargetReadout').filter({ hasText: '310 KT' }).waitFor();
  await page.locator('#externalTargetReadout').filter({ hasText: '18,000 FT' }).waitFor();

  const result = await page.evaluate(() => ({
    speedInput: document.querySelector('#externalSpeed').value,
    altitudeInput: document.querySelector('#externalAltitude').value,
    mcpSpeed: document.querySelector('#mcpSpeed').value,
    mcpAltitude: document.querySelector('#mcpAltitude').value,
    readout: document.querySelector('#externalTargetReadout').textContent.trim(),
    status: document.querySelector('#externalApStatus').textContent.trim(),
  }));
  if (result.speedInput !== '310' || result.altitudeInput !== '18000') throw new Error(`External inputs did not persist: ${JSON.stringify(result)}`);
  if (result.mcpSpeed !== '310' || result.mcpAltitude !== '18000') throw new Error(`MCP did not receive live targets: ${JSON.stringify(result)}`);
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);
  console.log(`External autoflight targets verified: ${result.readout} | ${result.status}`);
} finally {
  await browser.close();
}
