(() => {
  const G = globalThis.GB;
  G.button = (text, action) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); action(); }); return b; };
  G.ui = (title, description) => {
    const host = document.createElement('div'); host.dataset.gbUi = '';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:block!important;position:relative;z-index:2147483646;color-scheme:dark;font:13px/1.5 system-ui!important}:host([hidden]){display:none!important}section{box-sizing:border-box;background:linear-gradient(115deg,#30203b,#1d172d 75%);color:#fff4f8;border:1px solid #75516d;border-left:3px solid #ff90c2;border-radius:12px;padding:16px;margin:8px 0;text-align:left;box-shadow:0 4px 20px #170e2420}.label{display:block;color:#75e9df;font:700 9px/1.5 system-ui;letter-spacing:1.6px;margin-bottom:8px}strong{display:block;font-size:14px}p{color:#c9b8d2;margin:5px 0 12px}button{font:600 12px system-ui;background:linear-gradient(110deg,#ff94c8,#ffb4b5);color:#301330;border:1px solid #ffc0d4;border-radius:7px;padding:8px 12px;cursor:pointer;margin:3px 6px 3px 0}button:hover{filter:brightness(1.1)}button:focus-visible{outline:3px solid #75e9df;outline-offset:2px}';
    style.textContent += ':host([data-gb-preview-overlay]){position:absolute!important;inset:0!important;visibility:visible!important;container-type:inline-size;z-index:50!important}:host([data-gb-preview-overlay]) section{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:7px;width:100%;height:100%;padding:14px;margin:0;overflow:auto;border:1px solid #986080;border-radius:10px;background:linear-gradient(125deg,#392442,#1b152b)}:host([data-gb-preview-overlay]) .label,:host([data-gb-preview-overlay]) p{display:none}:host([data-gb-preview-overlay]) .channel{display:block;max-width:100%;color:#75e9df;font-size:12px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}:host([data-gb-preview-overlay]) button{margin:0;flex-shrink:0}:host([data-gb-preview-revealed]){bottom:auto!important}:host([data-gb-preview-revealed]) section{padding:5px;gap:0}@container(max-width:240px){:host([data-gb-preview-overlay]) section{padding:7px;gap:4px;border-radius:7px}:host([data-gb-preview-overlay]) strong{font-size:11px;line-height:1.3}:host([data-gb-preview-overlay]) .channel{font-size:10px}:host([data-gb-preview-overlay]) button{font-size:10px;padding:5px 7px}}';
    const section = document.createElement('section');
    const strong = document.createElement('strong'); strong.textContent = title;
    const p = document.createElement('p'); p.textContent = description;
    const label = document.createElement('span'); label.className = 'label'; label.textContent = 'VI / ÁREA PROTEGIDA';
    section.append(label, strong, p); shadow.append(style, section);
    return { host, section };
  };
  G.Blocker = class {
    constructor(app) { this.app = app; this.records = new Map(); this.revealed = new WeakMap(); this.counted = new WeakMap(); }
    isRevealed(element) {
      for (let owner = element; owner; owner = owner.parentElement) {
        const release = this.revealed.get(owner);
        if (!release) continue;
        const identity = G.releaseIdentity(owner);
        const identityType = value => value.startsWith('media:') ? 'media' : value.slice(0, value.lastIndexOf(':'));
        if (release.identity && identity && identityType(release.identity) === identityType(identity) && release.identity !== identity) {
          this.revealed.delete(owner);
          this.remove(owner);
          this.app.processed.delete(owner);
          continue;
        }
        // Bind late-arriving metadata without treating hydration as new content.
        if (identity && (!release.identity || !identity.startsWith('media:'))) release.identity = identity;
        return true;
      }
      return false;
    }
    block(element, result, kind = 'content', onReveal) {
      if (!element.isConnected || element.closest(G.SKIP) || G.isYouTubeSearchUI(element)) return;
      if (this.isRevealed(element)) return;
      const existing = this.records.get(element);
      if (existing) {
        if (kind === 'video' && existing.kind !== 'video' && existing.hidden) this.remove(element);
        else return;
      }
      if (element.parentElement?.closest('[data-gb-blocked]')) return;
      const signature = G.extract(element);
      const preview = this.app.settings.display !== 'hide' && !(kind === 'video' && !this.app.settings.videoWarnings) ? G.youtubePreview(element) : null;
      for (const [child] of this.records) if (element.contains(child)) this.remove(child);
      const ui = G.ui(kind === 'video' ? 'Possível spoiler de GTA VI detectado' : 'Conteúdo oculto pelo GTA VI Blocker', kind === 'video' ? 'Este vídeo foi pausado para sua proteção.' : 'Este conteúdo pode conter informações relacionadas ao GTA VI.');
      const record = { ...ui, signature, kind, onReveal, hidden: true, preview: !!preview, identity: G.releaseIdentity(element) };
      if (preview) {
        ui.host.dataset.gbPreviewOverlay = '';
        ui.section.querySelector('strong').textContent = 'Vídeo oculto · GTA VI';
        record.channel = document.createElement('span'); record.channel.className = 'channel';
        ui.section.append(record.channel);
      }
      const reveal = () => {
        this.revealed.set(element, { identity: G.releaseIdentity(element) });
        element.removeAttribute('data-gb-blocked'); record.hidden = false;
        element.removeAttribute('data-gb-preview-blocked');
        if (record.preview) ui.host.dataset.gbPreviewRevealed = '';
        this.app.video.allowContainer(element);
        ui.section.replaceChildren(G.button('Ocultar novamente', () => { this.revealed.delete(element); this.remove(element); this.app.processed.delete(element); this.app.video.resetContainer(element); this.app.inspect(element); }));
        onReveal?.();
      };
      if (kind !== 'video' || this.app.settings.videoReveal) ui.section.append(G.button(kind === 'video' ? 'Assistir mesmo assim' : 'Mostrar conteúdo', reveal));
      if (kind === 'video' && !preview) ui.section.append(G.button('Continuar bloqueando', () => { element.querySelectorAll('video').forEach(v => v.pause()); }));
      if (this.app.settings.display === 'hide' || (kind === 'video' && !this.app.settings.videoWarnings)) ui.host.hidden = true;
      if (preview) { element.setAttribute('data-gb-preview-blocked', ''); this.refreshPreview(element, record); }
      else element.before(ui.host);
      element.setAttribute('data-gb-blocked', '');
      this.records.set(element, record);
      if (this.counted.get(element) !== signature) { this.counted.set(element, signature); this.app.count(result.category, kind === 'video'); }
    }
    refreshPreview(element, record) {
      const preview = G.youtubePreview(element);
      if (!preview) return;
      if (record.anchor !== preview.anchor) {
        if (record.positioned) record.anchor?.removeAttribute('data-gb-preview-position');
        record.anchor = preview.anchor;
        record.positioned = getComputedStyle(record.anchor).position === 'static' || !getComputedStyle(record.anchor).position;
        if (record.positioned) record.anchor.setAttribute('data-gb-preview-position', '');
      }
      if (record.host.parentElement !== record.anchor) record.anchor.append(record.host);
      if (record.hidden && record.channel) {
        const name = preview.channelName || 'não disponível';
        const text = 'Canal: ' + name;
        if (record.channel.textContent !== text) record.channel.textContent = text;
        record.channel.title = name;
      }
    }
    remove(element) { const r = this.records.get(element); if (r) { r.host.remove(); if (r.positioned) r.anchor?.removeAttribute('data-gb-preview-position'); element.removeAttribute('data-gb-blocked'); element.removeAttribute('data-gb-preview-blocked'); this.records.delete(element); } }
    restore() { for (const [element] of this.records) this.remove(element); }
    prune() {
      for (const [element, record] of this.records) {
        if (!element.isConnected) {
          this.remove(element);
          this.app.processed.delete(element);
          this.app.video.resetContainer(element);
          continue;
        }
        // Frameworks can move a card without moving its injected sibling, or
        // remove the notice while keeping the card. Keep the pair together.
        if (record.preview) this.refreshPreview(element, record);
        else if (record.host.parentElement !== element.parentElement || record.host.nextSibling !== element) element.before(record.host);
      }
    }
  };
})();
