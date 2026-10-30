'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');

const root = path.resolve(__dirname, '..');
const candidates = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const executablePath = candidates.find((candidate) => fs.existsSync(candidate));

test('browser: QR generation, independent decoding, PNG and stale-state protection', { timeout: 120000 }, async (t) => {
  assert.ok(executablePath, 'Set CHROME_PATH to a Chrome or Chromium executable');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const safePath = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!safePath.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    fs.readFile(safePath, (err, data) => { if (err) res.writeHead(404).end(); else res.writeHead(200, { 'Content-Type': types[path.extname(safePath)] || 'application/octet-stream' }).end(data); });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 320, height: 800 }, acceptDownloads: true });
  const page = await context.newPage();
  const foreignRequests = [];
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:')) foreignRequests.push(request.url()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const link = page.locator('#link-input');
  const text = page.locator('#text-input');
  const generate = page.getByRole('button', { name: 'Создать QR-код' });
  const downloadButton = page.getByRole('button', { name: 'Скачать PNG' });
  assert.equal(await downloadButton.isDisabled(), true);
  await link.fill(' https://example.com');
  await generate.click();
  assert.match(await page.locator('#field-error').innerText(), /пробел/i);
  assert.equal(await link.inputValue(), ' https://example.com');
  const sample = 'https://example.com/a?x=Hello#part';
  await link.fill(sample);
  await generate.click();
  assert.equal(await downloadButton.isEnabled(), true);
  const dlPromise = page.waitForEvent('download');
  await downloadButton.click();
  const downloaded = await dlPromise;
  assert.equal(downloaded.suggestedFilename(), 'qr-link.png');
  let png = PNG.sync.read(fs.readFileSync(await downloaded.path()));
  assert.deepEqual([png.width, png.height], [512, 512]);
  assert.equal(jsQR(new Uint8ClampedArray(png.data), png.width, png.height).data, sample);
  await link.fill(sample + '2');
  assert.equal(await downloadButton.isDisabled(), true);
  assert.equal(await page.locator('#qr-canvas').isHidden(), true);
  await page.locator('label[for="mode-text"]').click();
  for (const value of ['  Привет, мир!\n😀  ', 'x'.repeat(1000)]) {
    await text.fill(value); await generate.click();
    assert.equal(await downloadButton.isEnabled(), true, `failed for ${value.length} characters`);
    const dl = page.waitForEvent('download'); await downloadButton.click();
    const file = await dl;
    assert.equal(file.suggestedFilename(), 'qr-text.png');
    png = PNG.sync.read(fs.readFileSync(await file.path()));
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    assert.ok(decoded, 'independent scanner could not read PNG');
    assert.equal(decoded.data, value);
  }
  await text.fill('x'.repeat(1001)); await generate.click();
  assert.match(await page.locator('#field-error').innerText(), /1000 байт/);
  assert.equal(await downloadButton.isDisabled(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(foreignRequests, []);
});
