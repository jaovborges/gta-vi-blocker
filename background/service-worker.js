importScripts('../shared/constants.js', '../shared/normalization.js', '../data/characters.js', '../data/keywords.js', '../data/languages/en.js', '../data/languages/de.js', '../data/languages/ar.js', '../data/languages/zh-cn.js', '../data/languages/zh-tw.js', '../data/languages/id.js', '../data/languages/nl.js', '../data/languages/fr.js', '../data/languages/es.js', '../data/languages/it.js', '../data/languages/ja.js', '../data/languages/ko.js', '../data/languages/pl.js', '../data/languages/pt-br.js', '../data/languages/ru.js', '../data/languages/th.js', '../data/languages/tr.js', '../data/languages/vi.js', '../shared/settings.js', '../shared/storage.js');
let queue = Promise.resolve();
const serial = task => { const next = queue.then(task); queue = next.catch(() => {}); return next; };
async function syncState() {
  const s = await GB.load();
  await chrome.alarms.clear('resume');
  if (s.pauseUntil > Date.now()) await chrome.alarms.create('resume', { when: s.pauseUntil });
  else if (s.pauseUntil) { s.pauseUntil = 0; await GB.save(s); }
  const active = GB.active(s);
  await chrome.action.setBadgeText({ text: active ? '' : 'OFF' });
  await chrome.action.setBadgeBackgroundColor({ color: '#586174' });
  await chrome.action.setTitle({ title: 'GTA VI Blocker — ' + (active ? 'proteção ativa' : 'proteção pausada') });
}
async function initialize() { await GB.save(await GB.load()); await syncState(); }
chrome.runtime.onInstalled.addListener(() => serial(initialize));
chrome.runtime.onStartup.addListener(() => serial(initialize));
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'resume') serial(async () => { const s = await GB.load(); if (s.pauseUntil && s.pauseUntil <= Date.now()) { s.pauseUntil = 0; await GB.save(s); } await syncState(); }); });
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.settings) serial(syncState); });
chrome.tabs.onRemoved.addListener(tabId => serial(() => chrome.storage.session.remove('page-' + tabId)));
chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.status === 'loading') serial(() => chrome.storage.session.set({ ['page-' + tabId]: 0 })); });
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  if (!m || sender.id !== chrome.runtime.id) return;
  const fromPage = sender.tab && /^https?:/.test(sender.url || '');
  const fromUI = !sender.tab && sender.url?.startsWith(chrome.runtime.getURL(''));
  if (!fromPage && !fromUI) return;
  serial(async () => {
    if (m.type === 'BLOCK' && fromPage) {
      const hostname = new URL(sender.url).hostname;
      const s = await GB.load(); if (!GB.active(s) || GB.isAllowed(hostname, s.allowedSites)) return;
      const data = await chrome.storage.local.get('stats'); const stats = data.stats || GB.emptyStats();
      const category = Object.hasOwn(GB.CATEGORIES, m.category) ? m.category : 'custom';
      stats.total++; if (m.video === true) stats.videos++;
      stats.bySite[hostname] = (stats.bySite[hostname] || 0) + 1;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      await chrome.storage.local.set({ stats });
      const key = 'page-' + sender.tab.id; const counts = await chrome.storage.session.get(key); await chrome.storage.session.set({ [key]: (counts[key] || 0) + 1 });
    } else if (m.type === 'RESET_PAGE' && fromPage && sender.frameId === 0) await chrome.storage.session.set({ ['page-' + sender.tab.id]: 0 });
    else if (m.type === 'CLEAR_STATS' && fromUI) { await chrome.storage.local.set({ stats: GB.emptyStats() }); await chrome.storage.session.clear(); }
    else if (m.type === 'ALLOW_SITE') {
      const domain = GB.domain(fromPage ? new URL(sender.url).hostname : m.domain);
      if (!domain) throw new Error('Domínio inválido.');
      const s = await GB.load(); s.allowedSites = s.allowedSites.filter(r => r.domain !== domain); s.allowedSites.push({ domain, subdomains: m.subdomains === true }); await GB.save(s);
    }
    return { ok: true };
  }).then(reply, error => reply({ ok: false, error: error.message }));
  return true;
});
