import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${resolve('.')}`, `--load-extension=${resolve('.')}`] });
const server = createServer((req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end('<!doctype html><title>Feed de teste</title><body style="margin:0;background:#100d1c;color:#fff;font-family:system-ui;padding:32px"><main style="max-width:650px;margin:auto"><h1>Seu feed, sem spoilers.</h1><article><h2>GTA VI gameplay</h2></article></main>'); });
try {
  mkdirSync('test-results', { recursive: true });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`chrome-extension://${id}/options/options.html`);
  await page.getByText('✓ Preferências salvas neste navegador').waitFor();
  for (const section of ['general', 'keywords', 'languages', 'videos', 'sites', 'stats', 'backup']) {
    await page.goto(`chrome-extension://${id}/options/options.html#${section}`);
    await page.locator('#' + section).waitFor(); await page.waitForTimeout(200);
    await page.screenshot({ path: `test-results/vice-${section}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`chrome-extension://${id}/options/options.html#general`);
  await page.locator('#enabled').waitFor(); await page.waitForTimeout(200);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Configurações com overflow horizontal no celular.');
  await page.screenshot({ path: 'test-results/vice-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 380, height: 800 });
  await page.goto(`chrome-extension://${id}/popup/popup.html`);
  await page.locator('#toggle:enabled').waitFor(); await page.waitForTimeout(200);
  await page.locator('main').screenshot({ path: 'test-results/vice-popup.png' });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  await page.setViewportSize({ width: 760, height: 340 });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole('button', { name: 'Mostrar conteúdo' }).waitFor();
  await page.screenshot({ path: 'test-results/vice-notice.png' });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Capturas desktop, celular, popup e aviso criadas em test-results/. Nenhum erro JavaScript.');
} finally { server.close(); await context.close(); }
