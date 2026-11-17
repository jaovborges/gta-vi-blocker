(() => {
  const G = globalThis.GB, $ = id => document.getElementById(id);
  let settings, queue = Promise.resolve();
  const managers = [];
  const node = (tag, text, className) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (className) n.className = className; return n; };
  const button = (text, action) => { const b = node('button', text); b.type = 'button'; b.onclick = () => Promise.resolve().then(action).catch(error); return b; };
  function error(e) { $('saveStatus').textContent = e.message || String(e); $('saveStatus').style.color = 'var(--pink)'; }
  function commit(change) {
    const next = queue.then(async () => {
      $('saveStatus').textContent = 'Salvando…';
      const latest = await G.load(); settings = G.validateSettings(await change(latest) || latest); await G.save(settings); render();
      $('saveStatus').style.color = 'var(--mint)'; $('saveStatus').textContent = '✓ Todas as alterações salvas';
    });
    queue = next.catch(error); return next;
  }
  function download(name, value) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    const a = node('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function readJSON(file) { if (!file) return null; if (file.size > 5 * 1024 * 1024) throw new Error('O arquivo deve ter até 5 MB.'); return JSON.parse(await file.text()); }
  function options(select, values, placeholder) {
    select.replaceChildren(); if (placeholder) { const o = node('option', placeholder); o.value = ''; select.append(o); }
    for (const [value, label] of Object.entries(values)) { const o = node('option', label); o.value = value; select.append(o); }
  }
  function manager(rootId, characters = false) {
    const root = $(rootId);
    // This template contains only application constants; user data is inserted using textContent.
    root.innerHTML = `<form class="box keyword-form"><h2 class="full">Adicionar ou editar termo</h2><label>Palavra-chave<input name="text" maxlength="160" required placeholder="Digite um termo"></label><label>Idioma<select name="language"></select></label><label>Categoria<select name="category"></select></label><label>Regra<select name="rule"><option value="always">Bloquear sempre</option><option value="context">Exigir contexto do jogo</option><option value="auxiliary">Apenas auxiliar</option></select></label><label>Sensibilidade<select name="sensitivity"><option value="strong">Forte</option><option value="moderate">Moderada</option><option value="weak">Fraca / nome comum</option></select></label><label class="inline"><input type="checkbox" name="active" checked>Termo ativo</label><div class="toolbar full"><button class="primary" type="submit">Salvar termo</button><button type="button" name="cancel" hidden>Cancelar edição</button></div></form><div class="toolbar filters"><input type="search" placeholder="Pesquisar palavras-chave" aria-label="Pesquisar palavras-chave"><select aria-label="Filtrar idioma"></select><select aria-label="Filtrar categoria"></select></div><div class="toolbar tools"></div><div class="box keyword-list"></div><div class="pagination"></div><details><summary>Sugestões removidas · restaurar individualmente</summary><div class="deleted box"></div></details>`;
    const form = root.querySelector('form'), f = form.elements;
    options(f.language, { '*': 'Compartilhado / qualquer idioma', ...G.LANGUAGES }); options(f.category, G.CATEGORIES);
    f.category.value = characters ? 'characters' : 'custom'; f.rule.value = characters ? 'context' : 'always';
    if (characters) { f.category.value = 'characters'; f.category.disabled = true; }
    const [search, languageFilter, categoryFilter] = root.querySelector('.filters').children;
    options(languageFilter, { '*': 'Compartilhado', ...G.LANGUAGES }, 'Todos os idiomas'); options(categoryFilter, G.CATEGORIES, 'Todas as categorias');
    if (characters) { categoryFilter.value = 'characters'; categoryFilter.disabled = true; }
    let page = 0, editing = null;
    const clear = () => { form.reset(); editing = null; f.category.value = characters ? 'characters' : 'custom'; f.rule.value = characters ? 'context' : 'always'; f.cancel.hidden = true; };
    f.cancel.onclick = clear;
    form.onsubmit = event => {
      event.preventDefault();
      const term = { id: editing || crypto.randomUUID(), text: f.text.value.trim(), language: f.language.value, category: f.category.value, rule: f.rule.value, sensitivity: f.sensitivity.value, active: f.active.checked, origin: 'custom' };
      if (!G.normalize(term.text)) { error(new Error('Digite um termo com letras ou números.')); return; }
      commit(s => {
        if (s.keywords.some(t => t.id !== editing && t.language === term.language && G.normalize(t.text) === G.normalize(term.text))) throw new Error('Esse termo já está cadastrado nesse idioma.');
        const original = s.keywords.find(t => t.id === editing);
        if (original) term.origin = original.origin;
        s.keywords = s.keywords.filter(t => t.id !== editing); s.keywords.push(term); return s;
      }).then(clear).catch(error);
    };
    const tools = root.querySelector('.tools');
    tools.append(button('Restaurar sugestões padrão', () => commit(s => G.restoreDefaults(s, characters ? 'characters' : undefined))), button('Restaurar categoria selecionada', () => { if (!categoryFilter.value) throw new Error('Selecione uma categoria no filtro.'); return commit(s => G.restoreDefaults(s, categoryFilter.value)); }), button('Exportar termos', () => download('gta-vi-termos.json', { type: 'gta-vi-keywords', version: 1, keywords: settings.keywords.filter(t => !characters || t.category === 'characters') })));
    const fileLabel = node('label', 'Importar termos', 'file-button'), fileInput = node('input'); fileInput.type = 'file'; fileInput.accept = '.json,application/json'; fileLabel.append(fileInput); tools.append(fileLabel);
    fileInput.onchange = async () => { try { const data = await readJSON(fileInput.files[0]); const terms = Array.isArray(data) ? data : data?.keywords; if (!Array.isArray(terms)) throw new Error('A lista de termos é inválida.'); await commit(s => ({ ...s, keywords: [...s.keywords, ...terms.map(t => ({ ...t, id: crypto.randomUUID(), origin: 'custom' }))] })); } catch (e) { error(e); } fileInput.value = ''; };
    for (const input of [search, languageFilter, categoryFilter]) input.oninput = () => { page = 0; draw(); };
    function draw() {
      const terms = settings.keywords.filter(t => (!characters || t.category === 'characters') && (!search.value || G.normalize(t.text).includes(G.normalize(search.value))) && (!languageFilter.value || t.language === languageFilter.value) && (!categoryFilter.value || t.category === categoryFilter.value));
      const pageCount = Math.max(1, Math.ceil(terms.length / 35)); page = Math.min(page, pageCount - 1);
      const list = root.querySelector('.keyword-list'); list.replaceChildren();
      for (const term of terms.slice(page * 35, (page + 1) * 35)) {
        const row = node('div', null, 'row keyword-row'), check = node('input'); check.type = 'checkbox'; check.checked = term.active; check.setAttribute('aria-label', 'Ativar ' + term.text); check.onchange = () => commit(s => { const t = s.keywords.find(t => t.id === term.id); if (t) t.active = check.checked; return s; }).catch(error);
        const text = node('div', null, 'term'); text.append(node('strong', term.text), node('small', `${G.LANGUAGES[term.language] || 'Compartilhado'} · ${G.CATEGORIES[term.category]} · ${{ always: 'Sempre', context: 'Com contexto', auxiliary: 'Auxiliar' }[term.rule]} · ${{ strong: 'Forte', moderate: 'Moderada', weak: 'Fraca' }[term.sensitivity]} · ${term.origin === 'custom' ? 'Personalizado' : 'Padrão'}`));
        const actions = node('div', null, 'actions'); actions.append(button('Editar', () => { editing = term.id; for (const name of ['text','language','category','rule','sensitivity']) f[name].value = term[name]; f.active.checked = term.active; f.cancel.hidden = false; f.text.focus(); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); }), button('Remover', () => commit(s => ({ ...s, keywords: s.keywords.filter(t => t.id !== term.id) })))); row.append(check, text, actions); list.append(row);
      }
      if (!terms.length) list.append(node('p', 'Nenhum termo encontrado.', 'empty'));
      const pagination = root.querySelector('.pagination'); const previous = button('← Anterior', () => { page--; draw(); }), next = button('Próxima →', () => { page++; draw(); }); previous.disabled = page === 0; next.disabled = page >= pageCount - 1; pagination.replaceChildren(previous, node('span', `${terms.length} termos · página ${page + 1} de ${pageCount}`), next);
      const deleted = root.querySelector('.deleted'); deleted.replaceChildren();
      const removed = G.defaults().filter(t => (!characters || t.category === 'characters') && !settings.keywords.some(k => k.id === t.id || (k.language === t.language && G.normalize(k.text) === G.normalize(t.text))));
      for (const term of removed) { const row = node('div', null, 'row'); row.append(node('span', term.text), button('Restaurar', () => commit(s => G.restoreDefaults(s, null, term.id)))); deleted.append(row); }
      if (!removed.length) deleted.append(node('p', 'Todas as sugestões estão cadastradas.', 'empty'));
    }
    managers.push(draw);
  }
  function drawLanguages() {
    const grid = $('languageGrid'); grid.replaceChildren();
    for (const [language, name] of Object.entries(G.LANGUAGES)) {
      const label = node('label', null, 'language-card'), checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.checked = settings.languages.includes(language);
      checkbox.onchange = () => commit(s => { s.languages = checkbox.checked ? [...new Set([...s.languages, language])] : s.languages.filter(l => l !== language); return s; }).catch(error);
      const text = node('span'); text.append(node('b', name), node('small', settings.keywords.filter(t => t.language === language).length + ' termos cadastrados')); label.append(checkbox, text); grid.append(label);
    }
  }
  function drawSites() {
    const list = $('siteList'); list.replaceChildren();
    const sites = settings.allowedSites.filter(r => r.domain.includes($('siteSearch').value.toLowerCase().trim()));
    for (const rule of sites) { const row = node('div', null, 'row'), text = node('div'); text.append(node('b', rule.domain), node('small', rule.subdomains ? 'Inclui subdomínios' : 'Somente este domínio')); const actions = node('div', null, 'actions'); actions.append(button(rule.subdomains ? 'Excluir subdomínios' : 'Incluir subdomínios', () => commit(s => { s.allowedSites.find(r => r.domain === rule.domain).subdomains = !rule.subdomains; return s; })), button('Remover', () => commit(s => ({ ...s, allowedSites: s.allowedSites.filter(r => r.domain !== rule.domain) })))); row.append(text, actions); list.append(row); }
    if (!sites.length) list.append(node('p', 'Nenhum site permitido nesta lista.', 'empty'));
  }
  async function drawStats() {
    const { stats = G.emptyStats() } = await chrome.storage.local.get('stats'); $('statTotal').textContent = stats.total.toLocaleString('pt-BR'); $('statVideos').textContent = stats.videos.toLocaleString('pt-BR');
    for (const [id, values, categories] of [['statsSites', stats.bySite, false], ['statsCategories', stats.byCategory, true]]) {
      const list = $(id); list.replaceChildren();
      for (const [key, count] of Object.entries(values).sort((a,b) => b[1] - a[1])) { const row = node('div', null, 'row'); row.append(node('span', categories ? G.CATEGORIES[key] || key : key), node('b', count.toLocaleString('pt-BR'))); list.append(row); }
      if (!Object.keys(values).length) list.append(node('p', 'Os próximos bloqueios aparecerão aqui.', 'empty'));
    }
  }
  function render() {
    for (const id of ['enabled','pageGuard','videoGuard','videoWarnings','autoplay','videoReveal']) $(id).checked = settings[id];
    for (const id of ['sensitivity','display']) $(id).value = settings[id];
    $('globalStatus').textContent = G.active(settings) ? 'PROTEÇÃO ATIVA' : 'PROTEÇÃO PAUSADA';
    for (const draw of managers) draw(); drawLanguages(); drawSites(); drawStats().catch(error);
  }
  function route() {
    const id = ['general','keywords','languages','characters','videos','sites','stats','backup'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'general';
    for (const section of document.querySelectorAll('.panel')) section.hidden = section.id !== id;
    for (const a of $('navigation').children) { const active = a.hash === '#' + id; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
  }
  async function start() {
    settings = await G.load(); manager('keywordManager'); manager('characterManager', true); render(); route(); $('saveStatus').textContent = '✓ Preferências salvas neste navegador';
    for (const id of ['enabled','pageGuard','videoGuard','videoWarnings','autoplay','videoReveal','sensitivity','display']) $(id).onchange = () => { const value = $(id).type === 'checkbox' ? $(id).checked : $(id).value; commit(s => { s[id] = value; if (id === 'enabled') s.pauseUntil = 0; return s; }).catch(error); };
    $('allLanguages').onclick = $('defaultLanguages').onclick = () => commit(s => ({ ...s, languages: Object.keys(G.LANGUAGES) })); $('noLanguages').onclick = () => commit(s => ({ ...s, languages: [] }));
    $('siteForm').onsubmit = event => { event.preventDefault(); const domain = G.domain($('siteInput').value); if (!domain) return error(new Error('Informe um domínio HTTP ou HTTPS válido.')); const subdomains = $('subdomains').checked; commit(s => { s.allowedSites = s.allowedSites.filter(r => r.domain !== domain); s.allowedSites.push({ domain, subdomains }); return s; }).then(() => $('siteForm').reset()).catch(error); };
    $('siteSearch').oninput = drawSites; $('clearSites').onclick = () => commit(s => ({ ...s, allowedSites: [] }));
    $('clearStats').onclick = async () => { if (confirm('Limpar todas as estatísticas? Suas configurações serão preservadas.')) { const response = await G.message({ type: 'CLEAR_STATS' }); if (!response?.ok) error(new Error('Não foi possível limpar as estatísticas.')); else drawStats(); } };
    $('exportSettings').onclick = () => download('gta-vi-blocker-backup.json', { type: 'gta-vi-blocker', version: 1, settings });
    $('importSettings').onchange = async () => { try { const data = await readJSON($('importSettings').files[0]); if (!data) return; const source = data.settings || data; if (!Array.isArray(source.keywords)) throw new Error('Backup inválido: lista de palavras-chave ausente.'); const imported = G.validateSettings(source); await commit(() => imported); } catch(e) { error(e); } $('importSettings').value = ''; };
    $('resetSettings').onclick = () => { if (confirm('Redefinir todas as preferências e apagar palavras personalizadas e sites permitidos?')) commit(() => G.defaultSettings()); };
    chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.stats) drawStats(); if (area === 'local' && changes.settings) { settings = G.validateSettings(changes.settings.newValue); render(); } });
  }
  window.addEventListener('hashchange', route); start().catch(error);
})();
