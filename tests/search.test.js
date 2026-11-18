import { describe, it, expect, afterEach } from 'vitest';
import { environment } from './helpers.js';
let e; afterEach(()=>e?.close());
const input='<input id="search" name="search_query" aria-label="GTA VI" value="GTA VI">';
const results='<ytd-video-renderer id="video"><a href="/watch?v=a"><img alt="GTA VI"></a><h3>GTA VI gameplay</h3></ytd-video-renderer>';
describe('barra de pesquisa e sugestões do YouTube', () => {
  it.each(['ytd-searchbox','yt-searchbox','yt-searchbox-desktop','yt-searchbox-desktop-renderer'])('preserva o campo e as sugestões dentro de %s', tag => {
    e=environment(`<${tag}>${input}<div><a href="/results?search_query=GTA+VI"><img alt="GTA VI">GTA VI trailer</a></div></${tag}>`+results,'https://www.youtube.com/'); e.scan();
    expect(e.w.document.querySelector(tag).querySelector('[data-gb-blocked]')).toBeNull(); expect(e.w.document.querySelector('#search').closest('[data-gb-blocked]')).toBeNull(); expect(e.w.document.querySelector('#video').hasAttribute('data-gb-blocked')).toBe(true);
  });
  it('não bloqueia um ancestral da barra mesmo com metadados e links contendo GTA VI', () => {
    e=environment(`<div id="wrapper" aria-label="GTA VI">${input}<a href="/results?search_query=GTA+VI"><img alt="GTA VI"></a></div>`+results,'https://www.youtube.com/'); e.scan(); expect(e.w.document.querySelector('#wrapper').hasAttribute('data-gb-blocked')).toBe(false); expect(e.w.document.querySelector('#search').closest('[data-gb-blocked]')).toBeNull();
  });
  it.each(['role="listbox"','class="gstl_50"','class="ytSearchboxComponentSuggestionsContainer"'])('mantém sugestões anexadas fora da barra: %s', attributes => {
    e=environment(`<form action="/results">${input}</form><div ${attributes} id="suggestions"><div role="option"><a href="/results?search_query=GTA+VI">GTA VI gameplay</a></div></div>`+results,'https://www.youtube.com/'); e.scan(); expect(e.w.document.querySelector('#suggestions [data-gb-blocked]')).toBeNull(); expect(e.w.document.querySelector('#suggestions').hasAttribute('data-gb-blocked')).toBe(false); expect(e.app.blocker.records.size).toBe(1);
  });
  it('ignora atributos de campos e sugestões ao analisar os metadados de um contêiner', () => {
    e=environment(`<article id="normal"><p>Conteúdo normal</p><form>${input}<a href="/results?search_query=GTA+VI">GTA VI</a></form></article>`,'https://www.youtube.com/'); const text=e.G.extract(e.w.document.querySelector('#normal')); expect(e.app.detector.analyze(text).blocked).toBe(false);
  });
  it('mantém o foco e a digitação durante atualizações dinâmicas das sugestões', async () => {
    e=environment(`<yt-searchbox>${input}<div role="listbox" id="suggestions"></div></yt-searchbox>`+results,'https://www.youtube.com/'); e.app.observer.start(); const field=e.w.document.querySelector('#search'); field.focus();
    for (const value of ['G','GTA','GTA VI']) { field.value=value; field.dispatchEvent(new e.w.Event('input',{bubbles:true})); e.w.document.querySelector('#suggestions').textContent=value+' trailer'; await new Promise(r=>setTimeout(r,100)); expect(e.w.document.activeElement).toBe(field); expect(field.closest('[data-gb-blocked]')).toBeNull(); }
    expect(e.w.document.querySelector('#video').hasAttribute('data-gb-blocked')).toBe(true);
  });
});
