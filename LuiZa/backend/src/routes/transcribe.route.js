import express from 'express';
import { downloadAudio } from '../services/youtube.service.js';
import { transcribeAudio } from '../services/whisper.service.js';
import { cleanupFile } from '../utils/cleanup.js';

const router = express.Router();

function isYouTubeVideoUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return false;

  try {
    const url = new URL(value);
    const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com'];
    return url.protocol === 'https:' &&
      hosts.includes(url.hostname) &&
      url.pathname === '/watch' &&
      Boolean(url.searchParams.get('v'));
  } catch {
    return false;
  }
}

router.post('/', async (req, res) => {
  const { videoUrl } = req.body ?? {};

  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl é obrigatório' });
  }
  if (!isYouTubeVideoUrl(videoUrl)) {
    return res.status(400).json({ error: 'URL de vídeo do YouTube inválida' });
  }

  let audioFilePath = null;
  let transcription = null;
  let failure = null;

  try {
    audioFilePath = await downloadAudio(videoUrl);
    transcription = await transcribeAudio(audioFilePath);
  } catch (error) {
    failure = error;
  } finally {
    if (audioFilePath) {
      try {
        await cleanupFile(audioFilePath);
      } catch (cleanupError) {
        console.error('Falha ao limpar arquivo temporário:', cleanupError.message);
        failure ??= cleanupError;
      }
    }
  }

  if (failure) {
    console.error('Falha na transcrição:', failure.message);
    return res.status(500).json({ error: failure.message });
  }

  return res.json(transcription);
});

export default router;
