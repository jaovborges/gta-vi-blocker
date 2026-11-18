(() => {
  const G = globalThis.GB;
  G.PageGuard = class {
    constructor(app) { this.app = app; this.host = null; this.released = false; this.counted = false; }
    inspect() {
      if (window.top !== window || this.released || !this.app.isActive() || !this.app.settings.pageGuard || G.isYouTube()) { this.restore(); return; }
      const detector = this.app.detector;
      let url; try { url = decodeURIComponent(location.pathname + location.search); } catch { url = location.pathname; }
      const title = detector.analyze(document.title);
      const heading = detector.analyze(document.querySelector('main h1,article h1,h1')?.textContent || '');
      const address = detector.analyze(url);
      const meta = detector.analyze([...document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]')].map(n => n.content).join(' '));
      const main = document.querySelector('article,main');
      const snippets = main ? [...main.querySelectorAll('p')].slice(0, 12) : [];
      const density = snippets.length > 2 && snippets.filter(n => detector.analyze(n.textContent).blocked).length / snippets.length >= 0.6;
      const score = (title.blocked ? 3 : 0) + (heading.blocked ? 2 : 0) + (address.blocked ? 2 : 0) + (meta.blocked ? 1 : 0) + (density ? 2 : 0);
      if (score < 4) { this.restore(); return; }
      if (this.host) return;
      const ui = G.ui('Página bloqueada pelo GTA VI Blocker', 'Detectamos conteúdo potencialmente relacionado ao GTA VI nesta página.');
      ui.host.style.cssText = 'position:fixed!important;inset:0!important;z-index:2147483647!important;background:radial-gradient(ellipse at 70% 10%,#59304e,#1e142f 50%,#120e20 85%)!important;display:grid!important;place-items:center!important;padding:24px!important;';
      ui.section.style.maxWidth = '520px';
      ui.section.append(G.button('Voltar', () => history.back()), G.button('Liberar esta página temporariamente', () => { this.released = true; this.restore(); this.app.blocker.restore(); this.app.video.restore(); this.app.pageReleased = true; }), G.button('Desativar proteção neste site', async () => { await G.message({ type: 'ALLOW_SITE', domain: location.hostname, subdomains: false }); }));
      document.documentElement.append(ui.host); document.documentElement.setAttribute('data-gb-page-covered', ''); this.host = ui.host;
      if (!this.counted) { this.counted = true; this.app.count((title.blocked ? title : heading).category, false); }
    }
    restore() { this.host?.remove(); this.host = null; document.documentElement.removeAttribute('data-gb-page-covered'); }
    reset() { this.restore(); this.released = false; this.counted = false; }
  };
})();
