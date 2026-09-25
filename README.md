Extensão para Chrome e Firefox que envia a URL do vídeo ao servidor local e mostra a transcrição com timestamps. O servidor usa **Node.js/Express**, **yt-dlp**, **FFmpeg** e a **API Whisper** da OpenAI. O áudio é enviado à OpenAI para transcrição; a chave da API fica apenas no servidor.

## Estrutura

```text
LuiZa/
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── jest.config.js
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
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
