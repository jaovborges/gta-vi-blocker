(() => {
  const G = globalThis.GB;
  G.defaultSettings = () => ({ version: G.VERSION, siteDefaultsVersion: G.SITE_DEFAULTS_VERSION, enabled: true, pauseUntil: 0, sensitivity: 'smart', display: 'notice', pageGuard: true, videoGuard: true, videoWarnings: true, autoplay: true, videoReveal: true, languages: Object.keys(G.LANGUAGES), allowedSites: [{ domain: 'github.com', subdomains: true }], keywords: G.defaults() });
  G.validateSettings = input => {
    const d = G.defaultSettings();
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Configurações inválidas.');
    const s = { ...d };
    for (const key of ['enabled', 'pageGuard', 'videoGuard', 'videoWarnings', 'autoplay', 'videoReveal']) if (typeof input[key] === 'boolean') s[key] = input[key];
    if (['smart', 'strict', 'extreme'].includes(input.sensitivity)) s.sensitivity = input.sensitivity;
    if (['notice', 'hide'].includes(input.display)) s.display = input.display;
    s.pauseUntil = Number.isFinite(input.pauseUntil) && input.pauseUntil > 0 ? input.pauseUntil : 0;
    if (Array.isArray(input.languages)) s.languages = [...new Set(input.languages.filter(x => Object.hasOwn(G.LANGUAGES, x)))];
    if (Array.isArray(input.allowedSites)) s.allowedSites = input.allowedSites.slice(0, 2000).flatMap(r => {
      const domain = G.domain(r?.domain);
      return domain ? [{ domain, subdomains: r.subdomains === true }] : [];
    }).filter((r, i, a) => a.findIndex(x => x.domain === r.domain) === i);
    // Apply new site defaults once, independently of keyword migrations. A
    // later user removal must remain removed across saves and browser restarts.
    if (!(Number.isInteger(input.siteDefaultsVersion) && input.siteDefaultsVersion >= G.SITE_DEFAULTS_VERSION) && !s.allowedSites.some(r => r.domain === 'github.com')) s.allowedSites.push({ domain: 'github.com', subdomains: true });
    if (Array.isArray(input.keywords)) {
      if (input.keywords.length > 10000) throw new Error('O limite é de 10.000 palavras-chave.');
      const seen = new Set(), ids = new Set();
      s.keywords = input.keywords.flatMap((r, i) => {
        if (!r || typeof r.text !== 'string' || !G.normalize(r.text) || r.text.length > 160) return [];
        const language = r.language === '*' || Object.hasOwn(G.LANGUAGES, r.language) ? r.language : '*';
        const key = language + ':' + G.normalize(r.text);
        if (seen.has(key)) return [];
        seen.add(key);
        let id = typeof r.id === 'string' && /^[\w-]{1,80}$/.test(r.id) ? r.id : 'import-' + i;
        while (ids.has(id)) id = 'import-' + i + '-' + id.slice(0, 50);
        ids.add(id);
        return [{ id, text: r.text.trim(), language, category: Object.hasOwn(G.CATEGORIES, r.category) ? r.category : 'custom', sensitivity: ['weak', 'moderate', 'strong'].includes(r.sensitivity) ? r.sensitivity : 'strong', rule: ['always', 'context', 'auxiliary'].includes(r.rule) ? r.rule : 'always', active: r.active !== false, origin: r.origin === 'default' ? 'default' : 'custom' }];
      });
    }
    // New releases may add defaults without resurrecting terms deliberately removed by the user.
    if ((input.version || 1) < G.VERSION) for (const term of d.keywords) if (!s.keywords.some(t => t.id === term.id)) s.keywords.push(term);
    return s;
  };
  G.restoreDefaults = (settings, category, id) => {
    const restored = G.defaults().filter(t => (!category || t.category === category) && (!id || t.id === id));
    const result = settings.keywords.filter(t => !restored.some(r => r.id === t.id || (r.language === t.language && G.normalize(r.text) === G.normalize(t.text))));
    return { ...settings, keywords: [...result, ...restored] };
  };
  G.active = s => s.enabled && (!s.pauseUntil || s.pauseUntil <= Date.now());
  G.emptyStats = () => ({ total: 0, videos: 0, bySite: {}, byCategory: {} });
})();
