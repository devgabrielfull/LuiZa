import express from 'express';
import transcribeRouter from './routes/transcribe.route.js';

const app = express();

// O popup envia um JSON pequeno: a URL do vídeo.
app.use(express.json({ limit: '16kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/transcribe', transcribeRouter);

export default app;
