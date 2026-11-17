(() => {
  const G = globalThis.GB, $ = id => document.getElementById(id);
  let settings, tab, host;
  const run = task => async () => { try { await task(); await refresh(); } catch (e) { $('feedback').textContent = e.message; } };
  async function refresh() {
    settings = await G.load();
    const active = G.active(settings), allowed = host && G.isAllowed(host, settings.allowedSites);
    $('state').textContent = !active ? 'PROTEÇÃO PAUSADA' : allowed ? 'DESATIVADA NESTE SITE' : 'PROTEÇÃO ATIVA';
    $('state').style.color = active && !allowed ? 'var(--mint)' : 'var(--pink)';
    $('headline').textContent = !active ? 'Uma pausa no escudo.' : allowed ? 'Site liberado por você.' : 'Spoilers ficam de fora.';
    $('detail').textContent = settings.pauseUntil > Date.now() ? 'Retoma às ' + new Date(settings.pauseUntil).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Detecção local, sem enviar seus dados.';
    $('toggle').textContent = active ? 'Pausar proteção' : 'Retomar proteção'; $('toggle').disabled = false;
    $('sensitivity').value = settings.sensitivity;
    $('siteName').textContent = host || 'Página restrita do navegador';
    $('siteStatus').textContent = host ? (allowed ? 'Proteção desativada' : 'Proteção habilitada para este domínio') : 'Abra um site HTTP ou HTTPS';
    $('siteToggle').disabled = !host; $('siteToggle').textContent = allowed ? 'Reativar neste site' : 'Desativar neste site';
    const { stats } = await chrome.storage.local.get('stats'); $('totalCount').textContent = (stats?.total || 0).toLocaleString('pt-BR');
    const key = 'page-' + tab?.id; const counts = await chrome.storage.session.get(key); $('pageCount').textContent = (counts[key] || 0).toLocaleString('pt-BR');
  }
  $('toggle').onclick = run(async () => { const s = await G.load(); s.enabled = !G.active(s); s.pauseUntil = 0; await G.save(s); });
  $('pause').onchange = run(async () => { const value = $('pause').value; if (!value) return; const s = await G.load(); s.enabled = value !== 'manual'; s.pauseUntil = value === 'manual' ? 0 : Date.now() + Number(value) * 60000; await G.save(s); $('pause').value = ''; });
  $('sensitivity').onchange = run(async () => { const s = await G.load(); s.sensitivity = $('sensitivity').value; await G.save(s); });
  $('siteToggle').onclick = run(async () => {
    const s = await G.load();
    if (G.isAllowed(host, s.allowedSites)) { s.allowedSites = s.allowedSites.filter(r => !(r.domain === host || (r.subdomains && host.endsWith('.' + r.domain)))); await G.save(s); }
    else await G.message({ type: 'ALLOW_SITE', domain: host, subdomains: false });
  });
  chrome.storage.onChanged.addListener(() => refresh().catch(() => {}));
  chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => { tab = tabs[0]; host = tab?.url && /^https?:/.test(tab.url) ? G.domain(tab.url) : null; return refresh(); }).catch(e => { $('feedback').textContent = e.message; });
})();
