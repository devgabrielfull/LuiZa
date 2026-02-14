# YouTube Transcribe Backend

Backend local para transcrição de vídeos do YouTube usando Whisper API.

## Pré-requisitos

- Node.js 18+
- yt-dlp instalado
- ffmpeg instalado
- Chave da API OpenAI

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Edite o arquivo .env e adicione sua OPENAI_API_KEY
```

## Executar

```bash
npm run dev
```

O servidor rodará em `http://localhost:3333`

## Testes

```bash
# Executar testes
npm test

# Executar testes em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

## GitHub Actions

O projeto inclui workflows de CI/CD que executam automaticamente:

- ✅ Testes em Node.js 18.x e 20.x
- ✅ Cobertura de código
- ✅ Lint (placeholder)

Os testes rodam automaticamente em:
- Push para `main` ou `develop`
- Pull requests para `main` ou `develop`

## Rotas

### GET /health
Verifica se o servidor está online.

**Resposta:**
```json
{
  "status": "ok"
}
```

### POST /transcribe
Transcreve um vídeo do YouTube.

**Body:**
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=..."
}
```

**Resposta:**
```json
{
  "language": "pt",
  "segments": [
    {
      "start": 0,
      "end": 12,
      "text": "Texto transcrito"
    }
  ]
}
```

## Estrutura

```
backend/
 ├── src/
 │   ├── server.js
 │   ├── routes/
 │   │    └── transcribe.route.js
 │   ├── services/
 │   │    ├── youtube.service.js
 │   │    └── whisper.service.js
 │   └── utils/
 │        └── cleanup.js
 ├── tests/
 │   └── api.test.js
 ├── .github/
 │   └── workflows/
 │       └── ci.yml
 ├── temp/
 ├── .env
 ├── .gitignore
 ├── jest.config.js
 └── package.json
```

## Cobertura de Testes

Os testes cobrem:
- ✅ Health check endpoint
- ✅ Validação de entrada (videoUrl obrigatório)
- ✅ Fluxo completo de transcrição
- ✅ Tratamento de erro no download
- ✅ Tratamento de erro na transcrição
- ✅ Limpeza de arquivos temporários
