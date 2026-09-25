# Arquitetura do LuiZa — guia de estudo

## O que faz cada arquivo

| Arquivo | Papel no projeto |
| --- | --- |
| `extension/manifest.json` | `action.default_popup` abre `popup.html`; `activeTab` libera a URL da aba após o clique; `host_permissions` dá ao popup acesso à origem local `http://127.0.0.1`; a CSP permite a conexão com a porta 3333 e carrega scripts apenas da extensão. A permissão de host não fixa a porta porque o Firefox não aceita portas nesse padrão. |
| `extension/popup.html`, `popup.css` e `popup.js` | Interface, aparência e comportamento. O popup lê a URL, faz o POST, apresenta os segmentos e oferece cópia e download. |
| `backend/package.json` | Nome do pacote, bibliotecas usadas e scripts como `npm test` e `npm run dev`. As versões com `^` permitem atualizações compatíveis quando as dependências são resolvidas. |
| `backend/package-lock.json` | Registra a árvore de dependências e as versões efetivamente resolvidas; `npm ci` usa esse registro para repetir a instalação. É gerado pelo npm, não deve ser editado à mão. |
| `backend/jest.config.js` | Configura os testes Node/Jest em `backend/tests/` e o relatório opcional `npm run test:coverage`. |
| `backend/.env.example` | Modelo para o seu `.env` local; a chave verdadeira nunca vai para a extensão nem para o pacote compartilhado. |
| `backend/src/server.js` | Lê `.env` e escuta em `127.0.0.1:3333`. `127.0.0.1` é este computador; `3333` é uma porta TCP, não um contêiner Docker. |
| `backend/src/app.js` | Cria o aplicativo Express, recebe JSON, declara `GET /health` e monta `POST /transcribe`. A rota é o endereço HTTP solicitado pelo popup. |
| `backend/src/routes/transcribe.route.js` | Valida a URL do YouTube e coordena download, transcrição, limpeza e resposta HTTP. "Rota" não significa movimentar arquivos. |
| `backend/src/services/youtube.service.js` | Executa o yt-dlp, que chama FFmpeg/ffprobe para gerar `temp/job-*/audio.mp3`. Se o download falhar, remove os arquivos parciais. |
| `backend/src/services/whisper.service.js` | Envia o MP3 e a chave à API da OpenAI, pede segmentos com timestamps e converte a resposta para o formato do popup. |
| `backend/src/utils/cleanup.js` | Apaga a pasta `temp/job-*` da solicitação após seu uso. Rejeita caminhos fora dessa pasta. |
| `backend/tests/api.test.js` | Testa rotas e respostas sem usar YouTube ou OpenAI reais. |
| `backend/tests/youtube.service.test.js` e `tests/fixtures/fake-yt-dlp.js` | Testam a execução do programa e a remoção de arquivos com um substituto local do yt-dlp. |
| `backend/tests/whisper.service.test.js` | Testa o formulário enviado à API, a resposta com timestamps, o limite de tamanho e a presença da chave, sem fazer chamada externa. |
| `backend/temp/.gitkeep` | Arquivo propositalmente vazio para manter `temp/` no projeto; os MP3s não entram no pacote. |
| `.gitignore` | Ignora `.env`, `node_modules/`, cobertura e temporários ao usar Git. |

## Uma solicitação, do clique ao texto

| Ordem | Código | Responsabilidade |
| --- | --- | --- |
| 1 | `extension/popup.js` | Lê a URL da aba ativa e valida se é um vídeo do YouTube. |
| 2 | `extension/popup.js` | Envia `POST /transcribe` com JSON `{videoUrl}` ao servidor local. |
| 3 | `backend/src/app.js` e `routes/transcribe.route.js` | Recebem a requisição, validam a URL e coordenam o trabalho. |
| 4 | `backend/src/services/youtube.service.js` | Chama o programa `yt-dlp`, que usa FFmpeg/ffprobe para preparar um MP3 temporário a 64 kbit/s. |
| 5 | `backend/src/services/whisper.service.js` | Envia o MP3 à API de transcrição da OpenAI e normaliza seus segmentos. |
| 6 | `backend/src/utils/cleanup.js` | Apaga o diretório temporário após sucesso ou erro. |
| 7 | `backend/src/routes/transcribe.route.js` e `extension/popup.js` | Devolvem o JSON e apresentam timestamps, texto, cópia e download. |

## Fronteiras e contratos

O **popup** cuida da experiência do usuário; ele conhece a URL do vídeo e o servidor local, mas não conhece a chave OpenAI. O **servidor Express** recebe somente a URL e coordena dois serviços: obter o áudio e transcrever. O **Whisper** é uma dependência externa que exige chave e tem limites de arquivo.

O contrato HTTP é `POST /transcribe` com `{ "videoUrl": "..." }` na entrada e `{ "language": "pt", "segments": [{ "start": 0, "end": 5, "text": "..." }] }` na saída. O popup usa `segments` para desenhar as marcações de tempo. Se esse contrato mudar no servidor, a interface também precisará ser ajustada.

`GET /health` devolve `{ "status": "ok" }` para conferir se o Express está acessível. Uma URL inválida recebe HTTP 400; falhas de download, transcrição ou limpeza recebem HTTP 500 com `{ "error": "..." }`. A porta 3333 só identifica o processo que recebe a conexão dentro do computador.

## Três pontos para entender no código

1. Em `popup.js`, `await getCurrentVideoUrl()` espera a consulta assíncrona à aba. `JSON.stringify({ videoUrl })` transforma o objeto em texto JSON para a requisição HTTP. `await fetch(...)` aguarda a resposta do Express.
2. Em `transcribe.route.js`, `try` executa download e transcrição; `catch` guarda a falha; `finally` remove o MP3. Se o yt-dlp falhar antes de devolver o caminho, o próprio `youtube.service.js` apaga a pasta parcial. A resposta só é enviada depois da limpeza.
3. Em `youtube.service.js`, `spawn(binary, args, { shell: false })` passa cada opção ao yt-dlp separadamente. Isso permite usar `yt-dlp` no `PATH` do Ubuntu e impede que caracteres da URL sejam interpretados como comandos do terminal.

## O que isto ensina de system design

Você já pode explicar **componentes**, **responsabilidades**, **fluxo de dados**, **contrato da API**, **dependências externas**, **limites de entrada**, **isolamento de segredos** e **limpeza após falhas**. Este é system design em escala de um projeto local. Para evoluir o LuiZa, a próxima decisão de arquitetura é como manter o trabalho vivo quando o popup fecha e como processar áudios maiores que o limite da API.

O popup guarda a transcrição somente em memória. Ao fechá-lo, a interface e a resposta pendente se perdem; o servidor pode continuar o processamento e não existe recuperação automática do resultado. Para verificar o fluxo completo atual, mantenha o popup aberto. O servidor também não divide MP3s de 25 MB ou mais.

### Perguntas para praticar

1. Por que `OPENAI_API_KEY` fica em `backend/.env`, e não em `extension/popup.js`?
2. Se o yt-dlp falhar antes de gerar MP3, qual arquivo recebe o erro e quem remove os arquivos parciais?
3. Se a resposta da API tivesse apenas `text`, qual parte do popup deixaria de mostrar os timestamps?
4. O que acontece hoje se você fechar o popup durante uma transcrição demorada?
