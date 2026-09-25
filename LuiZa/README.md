# LuiZa — extensão e servidor local para transcrever vídeos do YouTube

Extensão para Chrome e Firefox que envia a URL do vídeo ao servidor local e mostra a transcrição com timestamps. O servidor usa **Node.js/Express**, **yt-dlp**, **FFmpeg** e a **API Whisper** da OpenAI. O áudio é enviado à OpenAI para transcrição; a chave da API fica apenas no servidor.

## Estrutura

```text
LuiZa/
├── extension/
│   ├── manifest.json        # Permissões e popup da extensão
│   ├── popup.html           # Interface
│   ├── popup.css            # Estilos
│   └── popup.js             # URL da aba, HTTP, resultado e ações de copiar/baixar
├── backend/
│   ├── .env.example         # Variáveis de exemplo; .env real não é compartilhado
│   ├── package.json
│   ├── package-lock.json
│   ├── jest.config.js
│   ├── src/
│   │   ├── server.js        # Inicia o servidor em 127.0.0.1:3333
│   │   ├── app.js           # Configura Express e rotas
│   │   ├── routes/transcribe.route.js
│   │   ├── services/youtube.service.js
│   │   ├── services/whisper.service.js
│   │   └── utils/cleanup.js
│   ├── tests/
│   │   ├── api.test.js
│   │   ├── youtube.service.test.js
│   │   ├── whisper.service.test.js
│   │   └── fixtures/fake-yt-dlp.js
│   └── temp/.gitkeep
└── docs/
    ├── ARQUITETURA.md
    └── ALTERACOES.md
```

O projeto executa o fluxo diretamente no popup: não há `content.js` nem `background.js`. Como não foram enviados ícones, a extensão usa o ícone padrão do navegador. `temp/.gitkeep` é um arquivo vazio que preserva a pasta `temp/` no pacote.

## Preparar o Ubuntu

Use Node.js **22 ou superior**, `ffmpeg` e `yt-dlp` com suporte ao YouTube. O yt-dlp recomenda o componente `yt-dlp-ejs` e um runtime JavaScript; este projeto informa ao yt-dlp o caminho do próprio Node.js. [Instalação oficial](https://github.com/yt-dlp/yt-dlp/wiki/Installation) · [Guia EJS](https://github.com/yt-dlp/yt-dlp/wiki/EJS)

Se `ffmpeg` e `yt-dlp` ainda não estiverem disponíveis:

```bash
sudo apt install ffmpeg pipx
pipx install 'yt-dlp[default]'
pipx ensurepath
```

Após `pipx ensurepath`, abra um novo terminal se `yt-dlp` ainda não aparecer. Confira as ferramentas:

```bash
node --version
yt-dlp --version
ffmpeg -version
```

Os executáveis `.exe` são de Windows. No Ubuntu, yt-dlp e FFmpeg devem estar instalados no sistema; não coloque os `.exe` na pasta do backend.

### Iniciar o servidor

```bash
cd LuiZa/backend
npm ci
cp .env.example .env
# Edite .env localmente e substitua o valor de OPENAI_API_KEY.
npm test
npm run dev
```

Em outro terminal, confirme que o servidor respondeu:

```bash
curl http://127.0.0.1:3333/health
```

A resposta esperada é `{"status":"ok"}`. A chave da API nunca deve ser colocada em `extension/` nem enviada em conversas. Os testes não consomem a chave. Se alterar `PORT`, atualize `API_URL` em `extension/popup.js` e a diretiva `connect-src` em `extension/manifest.json`. A permissão de host do manifesto concede acesso ao endereço local sem fixar a porta, conforme a compatibilidade do Firefox.

### Carregar a extensão

- **Chrome:** abra `chrome://extensions/`, ative o modo de desenvolvedor, clique em **Carregar sem compactação** e selecione a pasta `LuiZa/extension`.
- **Firefox:** abra `about:debugging`, escolha **Este Firefox** → **Carregar extensão temporária** e selecione `LuiZa/extension/manifest.json`. Se o navegador pedir acesso a `127.0.0.1`, conceda essa permissão para este teste local. Extensões temporárias são removidas ao reiniciar o Firefox. [Instruções da Mozilla](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

Abra um vídeo em `https://www.youtube.com/watch?v=...`, clique no ícone do LuiZa e depois em **Transcrever Vídeo**. Faça o primeiro teste com um vídeo curto. Mantenha o popup aberto até a resposta chegar.

## Contrato entre extensão e servidor

| Etapa | Dados |
| --- | --- |
| Popup → servidor | `POST http://127.0.0.1:3333/transcribe`, JSON `{"videoUrl":"https://www.youtube.com/watch?v=..."}` |
| Servidor → popup | JSON `{"language":"pt","segments":[{"start":0,"end":5,"text":"Olá mundo"}]}` |
| Erro | HTTP 400 para URL ausente/inválida; HTTP 500 com `{"error":"..."}` para falhas de download/transcrição |

O servidor escuta apenas em `127.0.0.1`. A extensão tem permissão para consultar esse endereço. A política de conteúdo permite a conexão HTTP local, mantendo os scripts restritos aos arquivos da extensão. A API não habilita CORS para sites da web comuns; Chrome e Firefox permitem a requisição a partir do popup quando a permissão de host é concedida. `activeTab` permite ler a URL da aba depois do clique na extensão. [Chrome](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests) · [Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions) · [CSP no Manifest V3](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy)

## Testes e limites atuais

Na pasta `backend/`, execute `npm test`. Os testes de rota simulam os serviços; o teste do download executa um yt-dlp fictício para verificar a limpeza, e o teste do Whisper substitui apenas a chamada HTTP para verificar os parâmetros enviados. Nenhum teste baixa vídeos nem usa uma chave real da API. Um teste completo com o navegador, yt-dlp e a OpenAI precisa ser feito no seu computador.

- A API de transcrição exige arquivos menores que **25 MB**. O MP3 é gerado a 64 kbit/s para reduzir seu tamanho. O servidor informa quando o arquivo alcança o limite; divisão de áudios longos em partes ainda não foi implementada. [Documentação da OpenAI](https://developers.openai.com/api/docs/guides/speech-to-text)
- O resultado fica apenas na memória do popup. Fechar o popup durante a transcrição perde a interface dessa solicitação; persistência e execução em segundo plano são próximas evoluções.
- O Firefox pode usar temporariamente esta mesma extensão, mas o teste real nos dois navegadores ainda precisa confirmar permissões e comportamento do popup na sua máquina.

Leia [docs/ARQUITETURA.md](docs/ARQUITETURA.md) para entender as responsabilidades e o fluxo do código. As diferenças em relação aos arquivos enviados estão em [docs/ALTERACOES.md](docs/ALTERACOES.md).

## Publicar o código no GitHub

O repositório deve ter `README.md`, `.gitignore`, `extension/`, `backend/` e `docs/` na **raiz**. O pacote para GitHub já usa essa estrutura: extraia seus arquivos em uma pasta vazia antes de publicar. Não envie o ZIP como se fosse o código do repositório.

Na raiz extraída, confira o que será enviado:

```bash
git init -b main
git add .
git status --short
```

Confirme que a lista **não contém** `backend/.env`, `node_modules/`, `backend/temp/job-*` ou MP3s. O único exemplo de configuração publicado é `backend/.env.example`. Em seguida, crie um repositório **vazio** no GitHub, copie a URL SSH exibida por ele e execute:

```bash
git commit -m "Organiza o projeto LuiZa"
git remote add origin URL_SSH_DO_SEU_REPOSITORIO
git push -u origin main
```

Substitua `URL_SSH_DO_SEU_REPOSITORIO` pela URL copiada, como `git@github.com:usuario/repositorio.git`. Se já houver um repositório Git nessa pasta, confira `git remote -v` antes de adicionar outra origem. GitHub armazena o código; o servidor Express e a extensão continuam sendo executados no seu computador.
