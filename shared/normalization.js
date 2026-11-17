(() => {
  const G = globalThis.GB;
  G.normalize = value => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '').toLowerCase().replace(/[٦۶]/g, '6').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  G.escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  G.termPattern = text => {
    const normalized = G.normalize(text);
    const body = normalized.split(' ').map(G.escapeRE).join('[\\s]*');
    // Latin and Cyrillic words need boundaries; CJK/Thai strings can be embedded in sentences.
    const left = /^[\p{Script=Latin}\p{Script=Cyrillic}\p{N}]/u.test(normalized) ? '(?<![\\p{Script=Latin}\\p{Script=Cyrillic}\\p{N}])' : '';
    const right = /[\p{Script=Latin}\p{Script=Cyrillic}\p{N}]$/u.test(normalized) ? '(?![\\p{Script=Latin}\\p{Script=Cyrillic}\\p{N}])' : '';
    return new RegExp(left + body + right, 'u');
  };
  G.domain = value => {
    try {
      const raw = String(value).trim();
      const url = new URL(raw.includes('://') ? raw : 'https://' + raw);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname || /\s/.test(raw)) return null;
      return url.hostname.toLowerCase().replace(/\.$/, '');
    } catch { return null; }
  };
  G.isAllowed = (hostname, rules) => rules.some(rule => hostname === rule.domain || (rule.subdomains && hostname.endsWith('.' + rule.domain)));
})();
