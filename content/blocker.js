(() => {
  const G = globalThis.GB;
  G.button = (text, action) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); action(); }); return b; };
  G.ui = (title, description) => {
    const host = document.createElement('div'); host.dataset.gbUi = '';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:block!important;position:relative;z-index:2147483646;color-scheme:dark;font:13px/1.5 system-ui!important}section{box-sizing:border-box;background:#151b25;color:#e9eef8;border:1px solid #384456;border-left:3px solid #64efbe;border-radius:12px;padding:16px;margin:8px 0;text-align:left}strong{display:block;font-size:14px}p{color:#aeb9cb;margin:5px 0 12px}button{font:600 12px system-ui;background:#64efbe;color:#08221a;border:0;border-radius:7px;padding:9px 12px;cursor:pointer;margin:3px 6px 3px 0}button:hover{filter:brightness(1.1)}button:focus-visible{outline:3px solid #fff;outline-offset:2px}';
    const section = document.createElement('section');
    const strong = document.createElement('strong'); strong.textContent = title;
    const p = document.createElement('p'); p.textContent = description;
    section.append(strong, p); shadow.append(style, section);
    return { host, section };
  };
  G.Blocker = class {
    constructor(app) { this.app = app; this.records = new Map(); this.revealed = new WeakMap(); this.counted = new WeakMap(); }
    block(element, result, kind = 'content', onReveal) {
      if (!element.isConnected) return;
      const existing = this.records.get(element);
      if (existing) {
        if (kind === 'video' && existing.kind !== 'video' && existing.hidden) this.remove(element);
        else return;
      }
      if (element.parentElement?.closest('[data-gb-blocked]')) return;
      const signature = G.extract(element);
      if (this.revealed.get(element) === signature) return;
      for (const [child] of this.records) if (element.contains(child)) this.remove(child);
      const ui = G.ui(kind === 'video' ? 'Possível spoiler de GTA VI detectado' : 'Conteúdo oculto pelo GTA VI Blocker', kind === 'video' ? 'Este vídeo foi pausado para sua proteção.' : 'Este conteúdo pode conter informações relacionadas ao GTA VI.');
      const record = { ...ui, signature, kind, onReveal, hidden: true };
      const reveal = () => {
        this.revealed.set(element, G.extract(element));
        element.removeAttribute('data-gb-blocked'); record.hidden = false;
        ui.section.replaceChildren(G.button('Ocultar novamente', () => { this.revealed.delete(element); this.remove(element); this.app.processed.delete(element); this.app.video.resetContainer(element); this.app.inspect(element); }));
        onReveal?.();
      };
      if (kind !== 'video' || this.app.settings.videoReveal) ui.section.append(G.button(kind === 'video' ? 'Assistir mesmo assim' : 'Mostrar conteúdo', reveal));
      if (kind === 'video') ui.section.append(G.button('Continuar bloqueando', () => { element.querySelectorAll('video').forEach(v => v.pause()); }));
      if (this.app.settings.display === 'hide' || (kind === 'video' && !this.app.settings.videoWarnings)) ui.host.hidden = true;
      element.before(ui.host); element.setAttribute('data-gb-blocked', '');
      this.records.set(element, record);
      if (this.counted.get(element) !== signature) { this.counted.set(element, signature); this.app.count(result.category, kind === 'video'); }
    }
    remove(element) { const r = this.records.get(element); if (r) { r.host.remove(); element.removeAttribute('data-gb-blocked'); this.records.delete(element); } }
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
        if (record.host.parentElement !== element.parentElement || record.host.nextSibling !== element) element.before(record.host);
      }
    }
  };
})();
