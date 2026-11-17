Correção da liberação individual que voltava a ocultar posts e vídeos logo após o clique.

- “Mostrar conteúdo” permanece válido quando mudam contadores, rótulos, miniaturas e outros metadados.
- “Assistir mesmo assim” prevalece sobre eventos de reprodução, carregamento de metadados e inicialização do streaming.
- A liberação de um card também se aplica a um player recriado dentro dele, sem liberar os demais posts.
- Identificadores estáveis permitem reconhecer quando o site reutiliza o contêiner para outro post ou vídeo. Sem identificador, a decisão permanece válida para aquele elemento até reocultar, recarregar ou navegar para outra rota.
- “Ocultar novamente” continua disponível após atualizações do conteúdo.

Validação: 70 testes automatizados e 19 verificações Chromium, incluindo mutações reais observadas após clicar nos botões de liberação.

Atualização: em `chrome://extensions`, clique em **Recarregar** no GTA VI Blocker e depois recarregue as abas dos sites. Se usa uma cópia extraída do ZIP, substitua os arquivos dessa pasta primeiro. As preferências da mesma instalação são preservadas.
