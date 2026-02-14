import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transcribeRouter from './routes/transcribe.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/transcribe', transcribeRouter);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
