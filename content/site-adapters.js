(() => {
  const G = globalThis.GB;
  G.CARD_SELECTORS = [
    'ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer', 'ytd-grid-video-renderer', 'ytd-reel-item-renderer', 'yt-lockup-view-model', 'ytd-comment-thread-renderer', 'ytd-shorts', 'ytm-shorts-lockup-view-model',
    '[data-testid="tweet"]', '[data-testid="cellInnerDiv"]', 'shreddit-post', 'shreddit-comment', '[data-testid="post-container"]', '.thing',
    '[role="article"]', 'article', '[data-e2e="recommend-list-item-container"]', '[data-e2e="comment-level-1"]', '[data-e2e="search_top-item"]', '[data-e2e="feed-video"]',
    '.g', '.MjjYud .g', '.SoaBEf', '[data-news-cluster-id]', '.isv-r', '[data-ri]', '.b_algo', '.b_newsitem', '[data-testid="result"]', '.result',
    '[data-a-target="video-tower-card"]', '[data-a-target="preview-card-image-link"]', '.video-card', '.news-card', '.post', '.comment', '.card', '[data-spoiler-card]'
  ].join(',');
  G.SKIP = 'script,style,noscript,template,nav,header,footer,input,textarea,select,button,[contenteditable]:not([contenteditable="false"]),[data-gb-ui]';
  G.extract = element => {
    const parts = [];
    // Read bounded text nodes, excluding editable areas and injected UI.
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement?.closest(G.SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    let n, count = 0, length = 0;
    while ((n = walker.nextNode()) && count++ < 500 && length < 24000) { parts.push(n.nodeValue); length += n.nodeValue.length; }
    const nodes = [element, ...element.querySelectorAll('a[href],img,video,[title],[aria-label]')].slice(0, 180);
    for (const node of nodes) for (const key of ['alt', 'title', 'aria-label', 'href', 'src', 'poster']) {
      const v = node.getAttribute(key);
      if (v) { try { parts.push(decodeURIComponent(v)); } catch { parts.push(v); } }
    }
    return parts.join(' ').slice(0, 30000);
  };
  G.container = element => {
    if (!element || element.closest(G.SKIP)) return null;
    const card = element.closest(G.CARD_SELECTORS);
    if (card && !['BODY', 'HTML', 'MAIN'].includes(card.tagName)) return card;
    const semantic = element.closest('li,figure,p');
    if (semantic && semantic !== document.body && semantic.querySelectorAll('a').length < 35) return semantic;
    let candidate = element.closest('div');
    for (let depth = 0; candidate && depth < 3; depth++, candidate = candidate.parentElement?.closest('div')) {
      if (candidate.querySelector(G.CARD_SELECTORS) || candidate.querySelectorAll('h1,h2,h3,h4').length > 1 || candidate.querySelectorAll('a').length > 3) break;
      if (candidate.querySelector('img,video') && candidate.querySelector('h2,h3,h4,a')) return candidate;
    }
    return element.closest('a') || (element.matches('img,video,h1,h2,h3,h4') ? element : null);
  };
})();
