import express from 'express';
import { downloadAudio } from '../services/youtube.service.js';
import { transcribeAudio } from '../services/whisper.service.js';
import { cleanupFile } from '../utils/cleanup.js';

const router = express.Router();

router.post('/', async (req, res) => {
  let audioFilePath = null;

  try {
    const { videoUrl } = req.body;

    // Validar URL
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl é obrigatório' });
    }

    console.log('📥 Recebendo URL:', videoUrl);

    // Baixar áudio do YouTube
    audioFilePath = await downloadAudio(videoUrl);
    console.log('✅ Áudio baixado:', audioFilePath);

    // Transcrever áudio
    const transcription = await transcribeAudio(audioFilePath);
    console.log('✅ Transcrição completa');

    // Retornar resultado
    res.json(transcription);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    // Limpar arquivo temporário
    if (audioFilePath) {
      await cleanupFile(audioFilePath);
    }
  }
});

export default router;
