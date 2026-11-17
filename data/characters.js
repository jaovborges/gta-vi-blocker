(() => {
  const G = globalThis.GB;
  G.characters = ['Lucia', 'Lucia Caminos', 'Jason', 'Jason Duval', 'Cal Hampton', 'Boobie Ike', "Dre’Quan Priest", 'Real Dimez', 'Raul Bautista', 'Brian Heder'].map((text, i) => ({ id: 'character-' + i, text, language: '*', category: 'characters', sensitivity: ['Lucia', 'Jason'].includes(text) ? 'weak' : 'moderate', rule: 'context', active: true, origin: 'default' }));
})();
