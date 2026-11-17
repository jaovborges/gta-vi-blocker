(() => {
  const G = globalThis.GB;
  G.defaults = () => [
    ...['GTA 6', 'GTA VI', 'GTA Six', 'Grand Theft Auto 6', 'Grand Theft Auto VI', 'Grand Theft Auto Six'].map((text, i) => ({ id: 'title-' + i, text, language: '*', category: 'titles', sensitivity: 'strong', rule: 'always', active: true, origin: 'default' })),
    ...G.characters,
    ...['Vice City', 'Leonida', 'Rockstar Games'].map((text, i) => ({ id: 'location-' + i, text, language: '*', category: 'locations', sensitivity: 'moderate', rule: 'context', active: true, origin: 'default' })),
    ...G.dictionaries
  ];
})();
