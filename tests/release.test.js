import { describe, it, expect, afterEach } from 'vitest';
import { environment } from './helpers.js';
let e; afterEach(() => e?.close());
const click = (element, text) => [...e.app.blocker.records.get(element).host.shadowRoot.querySelectorAll('button')].find(b => b.textContent === text).click();
const post = '<article id="post"><h2>GTA VI</h2><span class="counter">1 curtida</span><img alt="Miniatura" src="/small.jpg"></article>';
const videoPost = '<article id="post"><h2>GTA VI trailer</h2><video></video><span class="counter">1 visualização</span></article>';
describe('decisões explícitas de revelação', () => {
  it('preserva mostrar conteúdo após alterações de texto, miniatura e rótulos', () => {
    e = environment(post); e.scan(); const p = e.w.document.querySelector('#post');
    click(p, 'Mostrar conteúdo'); const record = e.app.blocker.records.get(p);
    for (let i = 0; i < 8; i++) {
      p.querySelector('.counter').textContent = `${i + 2} curtidas`;
      p.querySelector('img').src = '/large.jpg?token=' + i;
      p.setAttribute('aria-label', 'GTA VI atualizado ' + i); e.scan();
      expect(p.hasAttribute('data-gb-blocked')).toBe(false);
      expect(e.app.blocker.records.get(p)).toBe(record);
      expect(record.hidden).toBe(false);
    }
    expect(e.app.currentCount).toBe(1);
    click(p, 'Ocultar novamente'); expect(p.hasAttribute('data-gb-blocked')).toBe(true);
    expect(e.app.currentCount).toBe(1);
  });
  it('preserva a revelação sob MutationObserver com várias atualizações reais', async () => {
    e = environment(post); e.app.observer.start(); await new Promise(r=>setTimeout(r,120));
    const p = e.w.document.querySelector('#post'); click(p, 'Mostrar conteúdo');
    const transitions = []; const observer = new e.w.MutationObserver(records=>transitions.push(...records));
    observer.observe(p, { attributes:true, attributeFilter:['data-gb-blocked'] });
    for (let i=0;i<3;i++) { p.querySelector('.counter').textContent = `${i + 5} curtidas`; await new Promise(r=>setTimeout(r,100)); }
    expect(p.hasAttribute('data-gb-blocked')).toBe(false); expect(transitions).toHaveLength(0); observer.disconnect();
  });
  it('não bloqueia novos filhos inseridos em um card já revelado', () => {
    e = environment(post); e.scan(); const p = e.w.document.querySelector('#post'); click(p,'Mostrar conteúdo');
    p.insertAdjacentHTML('beforeend','<div class="card"><h3>GTA VI detalhes</h3></div>'); e.scan();
    expect(p.querySelector('[data-gb-blocked]')).toBeNull(); expect(p.hasAttribute('data-gb-blocked')).toBe(false);
    expect(e.app.blocker.records.size).toBe(1);
  });
  it('mantém outros cards protegidos durante a liberação e atualizações', () => {
    e = environment(post + '<article id="other">GTA 6</article>'); e.scan(); const p = e.w.document.querySelector('#post'); click(p,'Mostrar conteúdo');
    p.querySelector('.counter').textContent = 'Novo contador'; e.scan();
    expect(p.hasAttribute('data-gb-blocked')).toBe(false); expect(e.w.document.querySelector('#other').hasAttribute('data-gb-blocked')).toBe(true);
  });
  it('revoga a decisão quando o mesmo elemento passa a representar outro post identificado', () => {
    e = environment('<article id="post" data-testid="tweet"><a href="/autor/status/123">Autor</a><p>GTA VI</p></article>','https://x.com/home'); e.scan();
    const p = e.w.document.querySelector('#post'); click(p,'Mostrar conteúdo'); p.querySelector('a').href = '/autor/status/456'; e.scan();
    expect(p.hasAttribute('data-gb-blocked')).toBe(true);
    expect(e.app.blocker.records.get(p).hidden).toBe(true);
  });
  it('aceita o identificador que chega depois da revelação sem confundir com outro conteúdo', () => {
    e = environment(post, 'https://x.com/home'); e.scan(); const p = e.w.document.querySelector('#post'); click(p,'Mostrar conteúdo');
    p.insertAdjacentHTML('afterbegin','<a href="/autor/status/123">Autor</a>'); e.scan();
    expect(p.hasAttribute('data-gb-blocked')).toBe(false);
    p.querySelector('a').href = '/autor/status/456'; e.scan(); expect(p.hasAttribute('data-gb-blocked')).toBe(true);
  });
  it('mantém vídeo liberado após metadados, inicialização de streaming e eventos de play', () => {
    e = environment(videoPost); e.scan(); const p = e.w.document.querySelector('#post'), v = p.querySelector('video'); click(p,'Assistir mesmo assim');
    const paused = v.pauseCalls;
    for (let i=0;i<5;i++) {
      p.querySelector('.counter').textContent = `${i + 2} visualizações`; v.setAttribute('aria-label','GTA VI reproduzindo '+i);
      Object.defineProperty(v,'currentSrc',{ configurable:true, value:'blob:https://example.com/stream-'+i });
      v.dispatchEvent(new e.w.Event('loadedmetadata')); v.dispatchEvent(new e.w.Event('play')); e.scan();
      expect(v.muted).toBe(false); expect(v.pauseCalls).toBe(paused); expect(p.hasAttribute('data-gb-blocked')).toBe(false);
    }
  });
  it('preserva a escolha se o site substituir o player dentro do card revelado', () => {
    e = environment(videoPost); e.scan(); const p=e.w.document.querySelector('#post'); click(p,'Assistir mesmo assim');
    p.querySelector('video').remove(); const next=e.w.document.createElement('video'); p.append(next); e.scan(); next.dispatchEvent(new e.w.Event('play'));
    expect(p.hasAttribute('data-gb-blocked')).toBe(false); expect(next.muted).toBe(false); expect(next.pauseCalls || 0).toBe(0);
  });
  it('liberar um card também restaura o áudio de vídeos protegidos nele', () => {
    e = environment(videoPost); e.scan(); const p=e.w.document.querySelector('#post'), v=p.querySelector('video');
    e.app.blocker.remove(p); e.app.blocker.block(p,e.app.detector.analyze('GTA VI'));
    expect(v.muted).toBe(true); click(p,'Mostrar conteúdo');
    expect(v.muted).toBe(false); expect(e.app.video.states.get(v).blocked).toBe(false);
  });
  it('identificador tardio do vídeo não invalida uma liberação pelo arquivo de mídia', () => {
    e = environment(videoPost.replace('<video>', '<video src="/stream.mp4">')); e.scan(); const p=e.w.document.querySelector('#post'); click(p,'Assistir mesmo assim');
    p.dataset.videoId = 'real-video-id'; e.scan(); expect(p.hasAttribute('data-gb-blocked')).toBe(false);
    p.dataset.videoId = 'different-video-id'; e.scan(); expect(p.hasAttribute('data-gb-blocked')).toBe(true);
    expect(p.querySelector('video').muted).toBe(true); expect(e.app.video.states.get(p.querySelector('video')).blocked).toBe(true);
  });
});
