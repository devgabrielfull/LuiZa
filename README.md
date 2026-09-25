Extensão para Chrome e Firefox que envia a URL do vídeo ao servidor local e mostra a transcrição com timestamps. O servidor usa **Node.js/Express**, **yt-dlp**, **FFmpeg** e a **API Whisper** da OpenAI. O áudio é enviado à OpenAI para transcrição; a chave da API fica apenas no servidor.

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
