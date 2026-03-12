Extensão Chrome que transcreve vídeos do YouTube usando a API Whisper da OpenAI.
O áudio é processado localmente via yt-dlp e ffmpeg, e a transcrição é retornada com timestamps por segmento.

📸 Como funciona
[YouTube] → [Extensão Chrome] → [Backend Node.js :3333] → [yt-dlp + ffmpeg] → [Whisper API] → [Transcrição]

Usuário abre um vídeo no YouTube e clica em "Transcrever Vídeo"
A extensão envia a URL para o backend local
O backend baixa o áudio com yt-dlp e converte para .mp3 com ffmpeg
O áudio é enviado para a API Whisper da OpenAI
A transcrição volta para a extensão com timestamps por segmento


🗂️ Estrutura do Projeto
youtube-transcribe-project/
│
├── backend/
│   ├── src/
│   │   ├── server.js                  # Entrada do servidor Express
│   │   ├── routes/
│   │   │   └── transcribe.route.js    # POST /transcribe
│   │   ├── services/
│   │   │   ├── youtube.service.js     # Download do áudio via yt-dlp
│   │   │   └── whisper.service.js     # Transcrição via Whisper API
│   │   └── utils/
│   │       └── cleanup.js             # Remoção de arquivos temporários
│   │
│   ├── tools/
│   │   ├── ffmpeg.exe                 # Binário Windows (não versionado)
│   │   └── yt-dlp.exe                 # Binário Windows (não versionado)
│   │
│   ├── temp/                          # Arquivos de áudio temporários
│   │   └── .gitkeep
│   │
│   ├── tests/
│   │   └── api.test.js                # Testes da API com Jest
│   │
│   ├── .env                           # Variáveis de ambiente (não versionado)
│   ├── .env.example                   # Modelo de configuração
│   ├── package.json
│   └── package-lock.json
│
└── extension/
    ├── manifest.json                  # Manifesto da extensão (MV3)
    ├── popup.html                     # Interface do usuário
    ├── popup.css                      # Estilos
    ├── popup.js                       # Lógica da extensão
    └── icons/
        ├── icon16.png
        ├── icon48.png
        └── icon128.png

