Oi! Essa é a minha ferramente que transcreve seus vídeos do youtube com 1 clique apenas  
Minha arquitetura que uso para rodar localmente...

youtube-transcribe-project/
│
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   └── transcribe.route.js                            
│   │   ├── services/
│   │   │   ├── youtube.service.js
│   │   │   └── whisper.service.js
│   │   └── utils/
│   │       └── cleanup.js
│   │
│   ├── tools/
│   │   ├── ffmpeg.exe
│   │   └── yt-dlp.exe
│   │
│   ├── temp/
│   │   └── .gitkeep
│   │
│   ├── tests/
│   │   └── api.test.js
│   │
│   ├── .env
│   ├── package.json
│   └── package-lock.json
│
└── extension/
    ├── manifest.json
    ├── popup.html
    ├── popup.css
    ├── popup.js
    └── icons/
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
