(() => {
  const G = globalThis.GB;
  G.Detector = class {
    constructor(settings) {
      this.settings = settings;
      this.terms = settings.keywords.filter(t => t.active && (t.language === '*' || settings.languages.includes(t.language))).map(term => ({ ...term, pattern: G.termPattern(term.text) }));
      this.cache = new Map();
    }
    analyze(input) {
      const text = G.normalize(input).slice(0, 30000);
      if (this.cache.has(text)) return this.cache.get(text);
      const matches = this.terms.filter(t => t.pattern.test(text));
      const always = matches.some(t => t.rule === 'always');
      const contextual = matches.filter(t => t.rule === 'context');
      const auxiliary = matches.filter(t => t.rule === 'auxiliary');
      const distinct = new Set(contextual.map(t => G.normalize(t.text)));
      const evidence = contextual.some(t => t.sensitivity !== 'weak');
      let score = always ? 100 : 0;
      if (contextual.length) score = Math.max(score, evidence ? 40 : 15);
      if (distinct.size >= 2) score += 25;
      if (auxiliary.length && contextual.length) score += 35;
      const threshold = { smart: 70, strict: 40, extreme: 15 }[this.settings.sensitivity];
      const blocked = always || (contextual.length > 0 && score >= threshold);
      const primary = matches.find(t => t.rule === 'always') || contextual[0] || auxiliary[0];
      const result = { blocked, confidence: Math.min(score, 100), terms: matches.map(t => t.text), languages: [...new Set(matches.map(t => t.language).filter(x => x !== '*'))], category: primary?.category || 'custom', recommendation: blocked ? 'container' : 'none' };
      if (this.cache.size >= 700) this.cache.delete(this.cache.keys().next().value);
      this.cache.set(text, result);
      return result;
    }
  };
})();
