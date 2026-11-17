import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
export function environment(html = '', url = 'https://example.com/feed') {
  const dom = new JSDOM('<!doctype html><html><head><title>Example</title></head><body>' + html + '</body></html>', { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  const data = {}, messages = [], listeners = [];
  w.chrome = { storage: { local: { get: async key => ({ [key]: data[key] }), set: async value => { for (const [key,newValue] of Object.entries(value)) { const oldValue = data[key]; data[key] = newValue; for (const listener of listeners) listener({ [key]: { oldValue, newValue } }, 'local'); } } }, onChanged: { addListener: fn => listeners.push(fn) } }, runtime: { sendMessage: async m => { messages.push(m); return { ok: true }; }, onMessage: { addListener() {} } } };
  w.HTMLMediaElement.prototype.pause = function () { this.pauseCalls = (this.pauseCalls || 0) + 1; };
  w.HTMLMediaElement.prototype.play = function () { this.playCalls = (this.playCalls || 0) + 1; return Promise.resolve(); };
  for (const path of manifest.content_scripts[0].js.filter(p => p !== 'content/content.js')) w.eval(readFileSync(path, 'utf8'));
  // Load App declaration without bootstrapping storage or intervals.
  w.eval(readFileSync('content/content.js', 'utf8').replace(/  G\.load\(\)\.then[\s\S]*?\n\}\)\(\);/, '\n})();'));
  const G = w.GB;
  const app = new G.App(G.defaultSettings());
  function scan() { app.observer.scan(); for (let i = 0; i < 20 && (app.observer.walker || app.observer.queue.size); i++) app.observer.flush(); clearTimeout(app.observer.timer); app.observer.timer = null; }
  return { dom, w, G, app, data, messages, scan, close: () => dom.window.close() };
}
