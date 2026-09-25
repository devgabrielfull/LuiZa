# O que foi alterado na cópia organizada

Esta pasta foi criada a partir dos arquivos enviados; os anexos originais não foram substituídos.

| Antes | Agora | Motivo |
| --- | --- | --- |
| A captura mostrava `backend/` dentro de `extension/` | `backend/` e `extension/` são pastas irmãs | O navegador carrega apenas os arquivos da extensão; o servidor e seu `.env` ficam fora dela. |
| `youtube.service.js` procurava `yt-dlp.exe` e `ffmpeg.exe` | Usa `yt-dlp` e `ffmpeg` instalados no sistema | Os `.exe` são de Windows; o usuário está no Ubuntu. |
| `exec()` montava uma linha de comando que incluía a URL | `spawn()` passa uma lista de argumentos sem shell | A URL não pode ser interpretada como comando de terminal. |
| `Date.now()` nomeava um MP3 em `temp/` | Cada solicitação tem seu próprio diretório `temp/job-*` | Evita colisões entre solicitações e facilita limpar arquivos parciais. |
| `server.js` misturava configuração do Express e inicialização | `app.js` configura a API; `server.js` inicia o processo | Os testes agora usam o mesmo app da execução real. |
| A rota conferia apenas se `videoUrl` existia | Também exige uma URL HTTPS de vídeo do YouTube | Evita enviar outros endereços ao programa de download. |
| A rota respondia antes do fim da limpeza | A limpeza termina antes do JSON de resposta | Confirma que o temporário foi tratado mesmo quando ocorre erro. |
| `cors()` permitia origens indiscriminadamente | A API usa a permissão de host do popup | O servidor local não permite requisições de sites comuns via CORS. |
| O manifesto citava ícones ausentes | O manifesto usa o ícone padrão | A extensão pode ser carregada com os arquivos disponíveis. |
| O Manifest V3 usava a CSP padrão | A CSP permite apenas código local da extensão e a conexão HTTP com `127.0.0.1:3333` | Impede que a política padrão converta a chamada HTTP local em HTTPS durante o teste. |
| O popup usava `localhost` e misturava callback com Promise | Usa `127.0.0.1` e uma consulta por callback | A URL coincide com o servidor e a consulta funciona nos dois navegadores. O manifesto não fixa a porta porque Firefox não aceita porta no padrão de permissão. |
| Os testes usavam `jest.mock` com imports ESM antecipados | Usam `jest.unstable_mockModule` antes de importar `app.js` | Os serviços são realmente simulados quando a rota é testada. |

## Revisão para o teste local

| Ajuste | Motivo |
| --- | --- |
| O manifesto pede somente `activeTab` e acesso de host a `127.0.0.1` | Abrir o popup já concede acesso temporário à URL da aba; a permissão persistente para YouTube era desnecessária. |
| O yt-dlp gera MP3 a `64K`, confere se ele existe e mostra uma mensagem útil quando o executável falta | Reduz o risco de passar de 25 MB e simplifica o diagnóstico. |
| O serviço Whisper confere a resposta e recusa arquivos com 25 MB ou mais | O popup precisa de `segments` com `start`, `end` e `text` para mostrar timestamps. |
| O popup valida a resposta antes de exibi-la e informa quando a cópia falha | Evita mostrar sucesso sem transcrição ou deixar uma rejeição de Promise sem tratamento. |
| A marcação HTML indica avisos de status e erro | Leitores de tela conseguem acompanhar o resultado da ação. |
| Um teste executa um yt-dlp fictício para conferir o isolamento e a limpeza dos MP3s | Exercita a execução do programa sem baixar vídeo nem chamar a OpenAI. |
| O serviço Whisper recebeu testes com uma resposta HTTP simulada | Confere campos do formulário, formato dos segmentos, limite de 25 MB e mensagem de chave ausente. |
| O comando `lint` fictício foi removido; `npm test` agora roda sem cobertura automática | Os comandos deixam claro o que realmente verificam; use `npm run test:coverage` para gerar o relatório de cobertura. |

Nenhum `.env`, chave ou executável `.exe` foi incluído nesta cópia. O funcionamento completo com YouTube e OpenAI ainda depende da instalação do yt-dlp no Ubuntu, de uma chave válida no seu computador e de um teste manual com o navegador.
