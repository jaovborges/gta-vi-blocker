# Privacidade

O GTA VI Blocker analisa texto, atributos, URLs e metadados **localmente**, dentro das páginas acessadas. Nenhum dado é enviado a servidores pelo código da extensão. Não há telemetria, anúncios, tradução externa, código remoto ou coleta de credenciais e cookies.

Preferências, palavras-chave e exceções ficam em `chrome.storage.local`, no perfil atual do Chrome. Estatísticas guardam somente contagens totais, por domínio e categoria e de vídeos. Não são guardados textos analisados ou URLs completas no armazenamento persistente. O endereço da página pode existir em memória durante a análise e navegação SPA; contagens temporárias de abas ficam em `chrome.storage.session`.

Campos editáveis e formulários de entrada não são analisados. Não há OCR ou processamento real de pixels, áudio ou reconhecimento visual. A extensão precisa ler conteúdos potencialmente privados presentes em feeds para classificá-los, porém faz isso exclusivamente no navegador.

## Permissões

- `storage`: preferências, estatísticas e contagens temporárias.
- `alarms`: retomar pausas temporizadas sem manter o service worker ativo.
- `activeTab`: identificar a aba ao abrir o popup.
- Acesso HTTP/HTTPS: executar os content scripts em sites, incluindo frames compatíveis, para aplicar os bloqueios solicitados. Não há permissão de cookies, histórico, interceptação de rede ou execução de scripts remotos.

Domínios permitidos desativam a análise nesse domínio; as estatísticas anteriores permanecem até você limpá-las. Use **Estatísticas → Limpar estatísticas** para apagar contagens, **Backup → Redefinir configurações** para limpar preferências, ou remova a extensão para excluir seus dados locais.

Backups exportados contêm seus termos e sites permitidos. Compartilhe esses arquivos somente se desejar revelar essas preferências.
