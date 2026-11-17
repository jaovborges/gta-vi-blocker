(() => {
  const G = globalThis.GB;
  G.load = async () => {
    const { settings } = await chrome.storage.local.get('settings');
    return G.validateSettings(settings || G.defaultSettings());
  };
  G.save = async settings => chrome.storage.local.set({ settings: G.validateSettings(settings) });
  G.message = async message => {
    try { return await chrome.runtime.sendMessage(message); } catch { return null; }
  };
})();
