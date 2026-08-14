const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const url = process.argv[2] || 'http://localhost:5173/';
  const outPath = process.argv[3] || 'shot.png';
  const role = process.argv[4] || 'subadmin';

  await page.addInitScript((role) => {
    const user = {
      _id: 'demo123', id: 'demo123', email: 'demo@mbusiness.test',
      name: 'Demo User', role, companyName: 'Demo Co', companyId: 'demo123'
    };
    window.localStorage.setItem('user', JSON.stringify(user));
  }, role);

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message + '\n' + err.stack));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Saved:', outPath);
  console.log('Errors:', JSON.stringify(errors.slice(0, 15), null, 2));
  await browser.close();
})();
