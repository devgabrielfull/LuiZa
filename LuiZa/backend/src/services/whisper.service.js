import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

const MAX_AUDIO_BYTES = 25_000_000;
const TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcribeAudio(audioFilePath) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'coloque_sua_chave_aqui') {
    throw new Error('Configure OPENAI_API_KEY no arquivo backend/.env');
  }

  try {
    const file = await stat(audioFilePath);
    if (file.size >= MAX_AUDIO_BYTES) {
      throw new Error('Áudio com 25 MB ou mais; este protótipo ainda não divide vídeos longos em partes');
    }

    const formData = new FormData();
    formData.append('file', createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    console.log('Enviando o áudio para a API Whisper...');

    const response = await axios.post(
      TRANSCRIPTION_URL,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${apiKey}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 10 * 60 * 1000
      }
    );

    return normalizeResponse(response.data);
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.error?.message || `HTTP ${error.response.status}`;
      throw new Error(`Erro na API Whisper: ${message}`, { cause: error });
    }
    throw new Error(`Erro ao transcrever: ${error.message}`, { cause: error });
  }
}

function normalizeResponse(data) {
  if (!Array.isArray(data?.segments)) {
    throw new Error('A API Whisper não retornou segmentos com timestamps');
  }

  const segments = data.segments.map(segment => {
    if (!Number.isFinite(segment?.start) ||
        !Number.isFinite(segment?.end) ||
        typeof segment?.text !== 'string') {
      throw new Error('A API Whisper retornou um segmento inválido');
    }

    return {
      start: segment.start,
      end: segment.end,
      text: segment.text.trim()
    };
  });

  return {
    language: data.language || 'pt',
    segments
  };
}
