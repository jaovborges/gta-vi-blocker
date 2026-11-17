(() => {
  const G = globalThis.GB;
  G.VideoGuard = class {
    constructor(app) {
      this.app = app; this.states = new Map();
      this.onPlay = event => {
        if (!(event.target instanceof HTMLVideoElement) || !app.isActive() || !app.settings.videoGuard) return;
        if (app.settings.autoplay) this.inspect(event.target);
        const state = this.states.get(event.target);
        if (state?.blocked) { event.target.muted = true; event.target.pause(); }
      };
      document.addEventListener('play', this.onPlay, true);
      document.addEventListener('loadedmetadata', this.onPlay, true);
    }
    inspect(video) {
      const app = this.app;
      if (!app.isActive() || !app.settings.videoGuard) return;
      const container = video.closest('ytd-watch-flexy')?.querySelector('#player') || G.container(video) || video;
      // Check the explicit decision before inspecting mutable player metadata.
      // Includes ancestor cards, so a recreated player inherits that card's release.
      if (app.blocker.isRevealed(video) || app.blocker.isRevealed(container)) {
        const previous = this.states.get(video);
        if (previous?.blocked) this.release(video, previous);
        return;
      }
      let text = G.extract(container);
      if (app.page.host) text += ' ' + document.title;
      if (location.hostname.includes('youtube.com') && location.pathname === '/watch') text += ' ' + document.title + ' ' + (document.querySelector('ytd-watch-metadata h1')?.textContent || '') + ' ' + (document.querySelector('meta[name="description"]')?.content || '');
      const signature = location.href + '|' + (G.releaseIdentity(container) || '') + '|' + (video.currentSrc || video.src) + '|' + G.normalize(text);
      const previous = this.states.get(video);
      if (previous?.signature === signature) return;
      if (previous) { this.release(video, previous); app.blocker.remove(previous.container); }
      const result = app.detector.analyze(text);
      if (!result.blocked) { this.states.delete(video); return; }
      const state = { signature, container, blocked: true, muted: video.muted };
      this.states.set(video, state);
      video.muted = true;
      try { video.pause(); } catch { /* Unsupported media implementation. */ }
      app.blocker.block(container, result, 'video', () => {
        state.blocked = false; video.muted = state.muted;
        // Playback resumes only after this explicit user gesture.
        const promise = video.play(); promise?.catch(() => {});
      });
    }
    release(video, state) { video.muted = state.muted; state.blocked = false; }
    allowContainer(container) { for (const [video, state] of this.states) if (state.container === container || container.contains(video)) this.release(video, state); }
    resetContainer(container) { for (const [video, state] of this.states) if (state.container === container || container.contains(video)) { this.release(video, state); this.states.delete(video); } }
    restore() { for (const [video, state] of this.states) this.release(video, state); this.states.clear(); }
    prune() { for (const [video] of this.states) if (!video.isConnected) this.states.delete(video); }
  };
})();
