import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Transcreve áudio usando a API oficial do Whisper (OpenAI)
 * @param {string} audioFilePath - Caminho do arquivo de áudio
 * @returns {Promise<Object>} - Objeto com language e segments
 */
export async function transcribeAudio(audioFilePath) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  try {
    // Criar form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    console.log('🔄 Enviando para Whisper API...');

    // Fazer requisição
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    // Normalizar resposta
    const normalized = normalizeResponse(response.data);
    
    return normalized;

  } catch (error) {
    if (error.response) {
      throw new Error(`Erro na API Whisper: ${error.response.data.error?.message || error.message}`);
    }
    throw new Error(`Erro ao transcrever: ${error.message}`);
  }
}

/**
 * Normaliza a resposta da API para o formato esperado
 * @param {Object} data - Resposta da API
 * @returns {Object} - Objeto normalizado
 */
function normalizeResponse(data) {
  const segments = data.segments?.map(segment => ({
    start: segment.start,
    end: segment.end,
    text: segment.text.trim()
  })) || [];

  return {
    language: data.language || 'pt',
    segments
  };
}
