# Verificação da versão 1.0.2

Validação local em 16/11/2026, Windows, Node 24.21.0, Chromium 141.0.7390.37 (perfil isolado Playwright).

## Automatizado

- `npm test`: suíte Vitest/JSDOM de detecção, Unicode, 18 conjuntos linguísticos, sensibilidade, regras, DOM, mutações, revelação, pausa, sites, páginas, vídeos, backup e persistência. Inclui regressões de player adicionado após bloqueio de card e reocultação sem afetar outros vídeos.
- `npm run test:e2e`: 19 verificações com a extensão efetivamente instalada no Chromium: injeção, ocultação, revelação, mutações, pausa e alarme real, sites permitidos, SPA, vídeo HTML5, criação/edição pela interface, idiomas, popup, estatísticas, feed virtualizado com estrutura do X e reinício do navegador. Nenhum erro JavaScript nas páginas e interfaces monitoradas.
- Regressão X/Twitter: 6 testes de DOM cobrem a seleção do tweet sem ocultar sua célula de layout, revelação/reocultação, mudança de pai, recuperação de aviso removido, descarte de post e reciclagem de texto. A integração Chromium mede as coordenadas do aviso antes e depois de mover uma célula por `transform`, verifica que posts normais continuam visíveis e que avisos acompanham a troca de contêiner e desaparecem ao remover o tweet. O feed é uma fixture local representativa; não valida todas as variantes autenticadas do X.
- Regressão de liberação: 10 testes adicionais verificam atualizações após o clique, estabilidade sob MutationObserver, filhos adicionados, troca de player, restauração do áudio e novos identificadores de conteúdo. A integração Chromium altera texto, miniatura e rótulos de um card revelado e dispara eventos de metadados/play com um `currentSrc` de streaming após liberar o vídeo, confirmando que a ocultação e o mute não são reaplicados.
- `npm run check`: Manifest V3, existência de recursos, HTML sem scripts inline e sintaxe JavaScript.
- `npm run package`: ZIP de instalação contendo somente arquivos de produção e documentação.
- `npm audit`: nenhuma vulnerabilidade reportada no conjunto de dependências instalado durante a validação.

O teste de vídeo do navegador usa um elemento HTML5 sem mídia externa; verifica o estado pausado/silenciado e a liberação, sem afirmar que um stream real foi interrompido antes de seu primeiro frame. Os testes de DOM instrumentam `play`/`pause` para conferir as chamadas. Streams, DRM e interfaces autenticadas requerem verificação manual adicional.

## Página pública real

- `https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI`: título e conteúdo reconhecidos; tela de proteção de página inteira exibida.
- Busca Google por GTA VI: a conexão retornou uma página intermediária de verificação do Google. A proteção de página foi acionada pelo endereço/título. Isso **não valida a cobertura dos cards da página normal de resultados**.

As capturas do popup e das configurações foram renderizadas no Chromium e inspecionadas visualmente. Não foram feitos testes autenticados em Instagram, Facebook, TikTok, X, Twitch ou Reddit. Os seletores desses serviços existem, mas sua cobertura completa não é certificada por este relatório.

## Roteiro manual complementar

1. Carregue a extensão no Chrome e abra um feed com cards seguros e suspeitos.
2. Revele um card e confirme que os demais continuam protegidos; oculte novamente e recarregue.
3. Role feeds, abra comentários e navegue entre vídeos/Shorts sem recarregar.
4. Permita o domínio atual, confirme restauração e remova a exceção.
5. Pause por 5 minutos, feche/reabra o navegador e confira a retomada.
6. Abra um vídeo real com metadados reconhecíveis; confira pausa, áudio, aviso e liberação individual.
7. Troque por outro vídeo suspeito para confirmar nova análise.
8. Teste temas e layouts alternativos dos serviços e registre seletores que precisam de manutenção.
9. Exporte configurações, altere termos/idiomas e importe o backup.

Veja os limites reais no [README](README.md#compatibilidade-e-limites-reais). Os testes não demonstram proteção absoluta contra todos os spoilers.
