import { describe, it, expect, afterEach } from 'vitest';
import { environment } from './helpers.js';
let e; afterEach(() => e?.close());
const tweet = (id, text) => `<article data-testid="tweet" id="${id}"><div><a href="/user/status/${id}">Autor</a><div data-testid="tweetText">${text}</div><img alt="Miniatura"></div></article>`;
const cell = (id, text) => `<div data-testid="cellInnerDiv" id="cell-${id}" style="position:absolute;transform:translateY(500px)">${tweet(id,text)}</div>`;
const html = cell('spoiler','GTA VI gameplay') + cell('safe','Um post normal');
const click = (record, text) => [...record.host.shadowRoot.querySelectorAll('button')].find(b => b.textContent === text).click();
describe('avisos no feed virtualizado do X', () => {
  it('substitui somente o tweet e mantém o aviso dentro da célula posicionada', () => {
    e = environment(html, 'https://x.com/home'); e.scan();
    const post = e.w.document.querySelector('#spoiler'), row = post.parentElement;
    expect(e.G.container(row)).toBe(post);
    expect(e.G.container(post.querySelector('[data-testid="tweetText"]'))).toBe(post);
    expect(row.hasAttribute('data-gb-blocked')).toBe(false);
    expect(post.hasAttribute('data-gb-blocked')).toBe(true);
    expect(e.app.blocker.records.size).toBe(1);
    const notice = e.app.blocker.records.get(post).host;
    expect(notice.parentElement).toBe(row);
    expect(notice.nextSibling).toBe(post);
    expect(e.w.document.querySelector('#cell-safe [data-gb-ui]')).toBeNull();
    expect(e.app.currentCount).toBe(1);
  });
  it('mantém mostrar e reocultar vinculados ao tweet, sem criar banners extras', () => {
    e = environment(html, 'https://x.com/home'); e.scan();
    const post = e.w.document.querySelector('#spoiler');
    click(e.app.blocker.records.get(post), 'Mostrar conteúdo'); e.scan();
    expect(post.hasAttribute('data-gb-blocked')).toBe(false);
    expect(e.w.document.querySelectorAll('[data-gb-ui]')).toHaveLength(1);
    expect(e.app.blocker.records.get(post).host.parentElement).toBe(post.parentElement);
    click(e.app.blocker.records.get(post), 'Ocultar novamente'); e.scan();
    expect(post.hasAttribute('data-gb-blocked')).toBe(true);
    expect(e.w.document.querySelectorAll('[data-gb-ui]')).toHaveLength(1);
    expect(e.app.currentCount).toBe(1);
  });
  it('move o aviso junto quando o mesmo tweet muda de pai', () => {
    e = environment(html, 'https://x.com/home'); e.scan();
    const post = e.w.document.querySelector('#spoiler'), oldRow = post.parentElement, record = e.app.blocker.records.get(post);
    const newRow = e.w.document.createElement('div'); newRow.dataset.testid = 'cellInnerDiv'; e.w.document.body.append(newRow); newRow.append(post);
    e.app.blocker.prune();
    expect(oldRow.querySelector('[data-gb-ui]')).toBeNull();
    expect(record.host.parentElement).toBe(newRow);
    expect(record.host.nextSibling).toBe(post);
    expect(e.app.currentCount).toBe(1);
  });
  it('recupera o aviso removido pelo site sem recontar o bloqueio', () => {
    e = environment(html, 'https://x.com/home'); e.scan();
    const post = e.w.document.querySelector('#spoiler'), record = e.app.blocker.records.get(post);
    record.host.remove(); e.app.blocker.prune();
    expect(record.host.nextSibling).toBe(post); expect(e.app.currentCount).toBe(1);
  });
  it('limpa avisos de tweets removidos e não bloqueia o post que ocupa sua célula', async () => {
    e = environment(html, 'https://x.com/home'); e.app.observer.start();
    await new Promise(r => setTimeout(r,120));
    const post = e.w.document.querySelector('#spoiler'), row = post.parentElement;
    post.remove(); row.insertAdjacentHTML('beforeend', tweet('replacement','Outro assunto, sem spoilers'));
    await new Promise(r => setTimeout(r,180));
    expect(row.querySelector('[data-gb-ui]')).toBeNull();
    expect(row.querySelector('[data-gb-blocked]')).toBeNull();
    expect(e.app.blocker.records.size).toBe(0);
    expect(post.hasAttribute('data-gb-blocked')).toBe(false);
    row.append(post); await new Promise(r => setTimeout(r,180));
    expect(post.hasAttribute('data-gb-blocked')).toBe(true);
    expect(row.querySelectorAll('[data-gb-ui]')).toHaveLength(1);
    expect(e.app.blocker.records.get(post).host.nextSibling).toBe(post);
  });
  it('reanalisar um tweet reciclado remove o aviso antigo e preserva os outros posts', () => {
    e = environment(html, 'https://x.com/home'); e.scan();
    const post = e.w.document.querySelector('#spoiler');
    post.querySelector('[data-testid="tweetText"]').textContent = 'Agora este post é sobre futebol'; e.scan();
    expect(post.hasAttribute('data-gb-blocked')).toBe(false);
    expect(post.parentElement.querySelector('[data-gb-ui]')).toBeNull();
    expect(e.w.document.querySelector('#safe').hasAttribute('data-gb-blocked')).toBe(false);
  });
});
