(() => {
  const G = globalThis.GB;
  G.App = class {
    constructor(settings) {
      this.settings = settings; this.detector = new G.Detector(settings); this.pageReleased = false; this.currentCount = 0;
      this.blocker = new G.Blocker(this); this.video = new G.VideoGuard(this); this.page = new G.PageGuard(this); this.observer = new G.Observer(this);
      this.processed = new WeakMap(); this.url = location.href;
    }
    isActive() { return G.active(this.settings) && !G.isAllowed(location.hostname, this.settings.allowedSites) && !this.pageReleased; }
    count(category, video) { this.currentCount++; G.message({ type: 'BLOCK', category, video }); }
    inspect(element) {
      if (!this.isActive() || element.closest(G.SKIP)) return;
      const container = G.container(element);
      if (element.matches('video')) this.video.inspect(element);
      else if (container) for (const video of container.querySelectorAll('video')) this.video.inspect(video);
      if (this.page.host) return;
      if (!container || container === document.body || container === document.documentElement || container.closest(G.SKIP)) return;
      const text = G.extract(container);
      const old = this.processed.get(container);
      if (old === text) return;
      this.processed.set(container, text);
      const record = this.blocker.records.get(container);
      if (record && record.signature !== text) this.blocker.remove(container);
      const result = this.detector.analyze(text);
      if (result.blocked) this.blocker.block(container, result);
    }
    update(settings) {
      this.blocker.restore(); this.video.restore(); this.page.restore();
      this.settings = settings; this.detector = new G.Detector(settings); this.processed = new WeakMap();
      this.observer.scan();
    }
    route() {
      if (location.href === this.url) return;
      this.url = location.href; this.blocker.restore(); this.video.restore(); this.page.reset(); this.pageReleased = false; this.currentCount = 0;
      this.blocker.revealed = new WeakMap(); this.blocker.counted = new WeakMap(); this.processed = new WeakMap();
      if (window.top === window) G.message({ type: 'RESET_PAGE' });
      this.observer.scan();
    }
    start() {
      this.observer.start();
      chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.settings) this.update(G.validateSettings(changes.settings.newValue || G.defaultSettings())); });
      chrome.runtime.onMessage.addListener((message, sender, reply) => { if (message.type === 'STATUS') reply({ count: this.currentCount, active: this.isActive() }); });
      // A bounded URL check also catches pushState in the page's isolated JavaScript world.
      setInterval(() => { this.route(); if (this.settings.pauseUntil && this.settings.pauseUntil <= Date.now()) { this.settings.pauseUntil = 0; this.update(this.settings); } }, 750);
      for (const name of ['popstate', 'hashchange', 'yt-navigate-finish']) window.addEventListener(name, () => this.route());
    }
  };
  G.load().then(settings => { G.app = new G.App(settings); G.app.start(); }).catch(error => console.warn('GTA VI Blocker: não foi possível iniciar.', error));
})();
