GTA VI Blocker 1.2.1 — GitHub liberado e pesquisa do YouTube protegida contra bloqueios indevidos

- `github.com` e seus subdomínios são permitidos por padrão.
- Instalações anteriores recebem essa exceção uma única vez, preservando palavras-chave, idiomas, pausas e sites personalizados. Você pode remover a regra em Sites permitidos; a remoção não é desfeita ao reiniciar.
- A barra de pesquisa do YouTube, suas sugestões e os contêineres da interface ficam fora da filtragem. Digitar GTA VI não oculta o campo nem interrompe a digitação.
- Os cards de vídeos continuam sendo filtrados normalmente.
- Atributos de campos editáveis e formulários também são excluídos da análise de metadados.

Validação: 99 testes automatizados e 25 verificações Chromium, incluindo digitação real com foco preservado, sugestões dinâmicas e acesso ao GitHub e seus subdomínios com a extensão ativa. As páginas externas são representadas por fixtures roteadas localmente nos testes.

Atualize os arquivos e recarregue a extensão em `chrome://extensions`, depois recarregue as abas do GitHub e YouTube. As preferências da mesma instalação são preservadas.
