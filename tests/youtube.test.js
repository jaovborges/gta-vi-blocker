import { describe, it, expect, afterEach } from 'vitest';
import { environment } from './helpers.js';
let e; afterEach(() => e?.close());
const card = (tag='ytd-rich-item-renderer', id='a', channel='Canal de Jogos') => `<${tag} id="${id}"><ytd-thumbnail><a id="thumbnail" href="/watch?v=${id}"><img alt="Miniatura"></a></ytd-thumbnail><h3><a href="/watch?v=${id}">GTA VI trailer</a></h3><ytd-channel-name><a id="text" href="/@canal">${channel}</a></ytd-channel-name></${tag}>`;
const watch = '<ytd-watch-flexy><div id="player"><div id="movie_player"><video></video></div></div><ytd-watch-metadata><h1>GTA VI gameplay</h1><div id="description">GTA VI detalhes</div></ytd-watch-metadata><aside>' + card('ytd-compact-video-renderer') + '</aside></ytd-watch-flexy>';
const click = (p, text) => [...e.app.blocker.records.get(p).host.shadowRoot.querySelectorAll('button')].find(b=>b.textContent===text).click();
describe('YouTube: aviso sobre a miniatura com canal', () => {
  it.each(['ytd-rich-item-renderer','ytd-video-renderer','ytd-compact-video-renderer','ytd-grid-video-renderer'])('sobrepõe a miniatura de %s sem remover o espaço do card', tag => {
    e = environment(card(tag), 'https://www.youtube.com/'); e.scan();
    const p=e.w.document.querySelector('#a'), r=e.app.blocker.records.get(p);
    expect(r.preview).toBe(true); expect(p.hasAttribute('data-gb-preview-blocked')).toBe(true);
    expect(r.host.parentElement).toBe(p.querySelector('ytd-thumbnail'));
    expect(r.channel.textContent).toBe('Canal: Canal de Jogos');
    expect(r.host.shadowRoot.querySelector('strong').textContent).toBe('Vídeo oculto · GTA VI');
    expect(e.app.currentCount).toBe(1);
  });
  it('obtém o canal no layout moderno de lockup', () => {
    e=environment('<yt-lockup-view-model id="a"><a class="yt-lockup-view-model__content-image" href="/watch?v=a"><img alt="GTA VI"></a><div class="yt-content-metadata-view-model__metadata-row"><span class="yt-content-metadata-view-model__metadata-text">Canal Moderno</span></div></yt-lockup-view-model>','https://www.youtube.com/'); e.scan();
    const r=e.app.blocker.records.get(e.w.document.querySelector('#a')); expect(r.preview).toBe(true); expect(r.channel.textContent).toBe('Canal: Canal Moderno');
  });
  it('atualiza o canal carregado depois sem criar outro aviso ou duplicar contagem', () => {
    e=environment(card('ytd-rich-item-renderer','a',''), 'https://www.youtube.com/'); e.scan(); const p=e.w.document.querySelector('#a'), r=e.app.blocker.records.get(p);
    expect(r.channel.textContent).toBe('Canal: não disponível');
    p.querySelector('ytd-channel-name a').textContent='Nome carregado depois'; e.scan();
    expect(e.app.blocker.records.get(p)).toBe(r); expect(r.channel.textContent).toBe('Canal: Nome carregado depois');
    expect(p.querySelectorAll('[data-gb-ui]')).toHaveLength(1); expect(e.app.currentCount).toBe(1);
  });
  it('realoca o overlay se a miniatura for substituída', () => {
    e=environment(card(), 'https://www.youtube.com/'); e.scan(); const p=e.w.document.querySelector('#a'), r=e.app.blocker.records.get(p);
    const old=p.querySelector('ytd-thumbnail'), next=old.cloneNode(true); next.querySelector('[data-gb-ui]')?.remove(); old.replaceWith(next); e.app.blocker.prune();
    expect(r.host.parentElement).toBe(next); expect(old.hasAttribute('data-gb-preview-position')).toBe(false); expect(e.app.currentCount).toBe(1);
  });
  it('revela somente o card escolhido e permite ocultá-lo novamente', () => {
    e=environment(card()+card('ytd-rich-item-renderer','b'), 'https://www.youtube.com/'); e.scan(); const p=e.w.document.querySelector('#a'); click(p,'Mostrar conteúdo'); e.scan();
    expect(p.hasAttribute('data-gb-preview-blocked')).toBe(false); expect(e.w.document.querySelector('#b').hasAttribute('data-gb-preview-blocked')).toBe(true);
    click(p,'Ocultar novamente'); expect(p.hasAttribute('data-gb-preview-blocked')).toBe(true); expect(e.app.currentCount).toBe(2);
  });
  it('restaura miniatura, título e posicionamento ao pausar', () => {
    e=environment(card(), 'https://www.youtube.com/'); e.scan(); const p=e.w.document.querySelector('#a'), anchor=p.querySelector('ytd-thumbnail');
    e.app.update({...e.app.settings,enabled:false}); e.scan();
    expect(p.hasAttribute('data-gb-blocked')).toBe(false); expect(p.hasAttribute('data-gb-preview-blocked')).toBe(false); expect(anchor.hasAttribute('data-gb-preview-position')).toBe(false); expect(p.querySelector('[data-gb-ui]')).toBeNull();
  });
  it('mantém ocultação completa quando escolhida nas configurações', () => {
    e=environment(card(), 'https://www.youtube.com/'); e.app.update({...e.app.settings,display:'hide'}); e.scan(); const p=e.w.document.querySelector('#a');
    expect(p.hasAttribute('data-gb-blocked')).toBe(true); expect(p.hasAttribute('data-gb-preview-blocked')).toBe(false);
  });
  it('não pausa nem oculta o vídeo aberto, mas protege as recomendações', () => {
    e=environment(watch, 'https://www.youtube.com/watch?v=opened'); e.w.document.title='GTA VI gameplay'; e.scan();
    const v=e.w.document.querySelector('video'); v.dispatchEvent(new e.w.Event('play'));
    expect(v.pauseCalls || 0).toBe(0); expect(v.muted).toBe(false); expect(v.closest('[data-gb-blocked]')).toBeNull();
    expect(e.w.document.querySelector('h1').hasAttribute('data-gb-blocked')).toBe(false); expect(e.app.page.host).toBeNull();
    expect(e.app.blocker.records.get(e.w.document.querySelector('#a')).preview).toBe(true);
  });
  it('não usa proteção de página inteira em uma busca do YouTube', () => {
    e=environment('<main><h1>GTA VI</h1>'+card()+'</main>', 'https://www.youtube.com/results?search_query=GTA+VI'); e.w.document.title='GTA VI - YouTube'; e.scan();
    expect(e.app.page.host).toBeNull(); expect(e.app.blocker.records.get(e.w.document.querySelector('#a')).preview).toBe(true);
  });
  it('mantém o player livre após trocar de vídeo sem recarregar', () => {
    e=environment(watch, 'https://www.youtube.com/watch?v=opened'); e.scan(); e.w.history.pushState({},'', '/watch?v=next'); e.app.route(); e.scan();
    const v=e.w.document.querySelector('video'); v.dispatchEvent(new e.w.Event('loadedmetadata'));
    expect(v.pauseCalls || 0).toBe(0); expect(v.muted).toBe(false); expect(e.app.page.host).toBeNull(); expect(e.app.blocker.records.size).toBe(1);
  });
  it('não oculta os wrappers do player pela estratégia genérica', () => {
    e=environment('<ytd-watch-flexy><div id="columns"><div id="primary"><div id="player"><div id="movie_player"><video></video></div></div><ytd-watch-metadata><h1>GTA VI</h1><a href="/@autor"><img alt="Autor">Autor</a></ytd-watch-metadata></div></div></ytd-watch-flexy>', 'https://www.youtube.com/watch?v=opened'); e.scan();
    expect(e.w.document.querySelector('[data-gb-blocked]')).toBeNull(); expect(e.app.blocker.records.size).toBe(0);
  });
  it('um preview nas recomendações não usa o player principal como contêiner', () => {
    const safe=card('ytd-compact-video-renderer','safe','Canal Natureza').replace('GTA VI trailer','Uma viagem pela natureza').replace('<img alt="Miniatura">','<img alt="Miniatura"><video id="safe-preview"></video>');
    e=environment(watch.replace('<img alt="Miniatura">','<img alt="Miniatura"><video id="preview"></video>').replace('</aside>',safe+'</aside>'), 'https://www.youtube.com/watch?v=opened'); e.w.document.title='GTA VI gameplay'; e.scan();
    const main=e.w.document.querySelector('#movie_player video'), preview=e.w.document.querySelector('#preview');
    expect(main.pauseCalls || 0).toBe(0); expect(main.muted).toBe(false); expect(main.closest('[data-gb-blocked]')).toBeNull();
    expect(preview.pauseCalls).toBeGreaterThan(0); expect(preview.muted).toBe(true); expect(e.app.video.states.get(preview).container).toBe(e.w.document.querySelector('#a'));
    expect(e.app.blocker.records.get(e.w.document.querySelector('#a')).preview).toBe(true);
    const safePreview=e.w.document.querySelector('#safe-preview');
    expect(safePreview.pauseCalls || 0).toBe(0); expect(safePreview.muted).toBe(false); expect(safePreview.closest('[data-gb-blocked]')).toBeNull();
    const pauses=preview.pauseCalls; e.w.document.querySelector('#movie_player').append(preview); e.app.settings.autoplay=false;
    preview.dispatchEvent(new e.w.Event('play'));
    expect(preview.pauseCalls).toBe(pauses); expect(preview.muted).toBe(false); expect(e.app.video.states.has(preview)).toBe(false);
  });
});
