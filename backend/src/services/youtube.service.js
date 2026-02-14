import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Baixa apenas o áudio de um vídeo do YouTube e converte para mp3
 * @param {string} videoUrl - URL do vídeo do YouTube
 * @returns {Promise<string>} - Caminho do arquivo de áudio
 */
export async function downloadAudio(videoUrl) {
  const timestamp = Date.now();
  const outputPath = path.join(__dirname, '../../temp', `audio_${timestamp}`);
  const finalPath = `${outputPath}.mp3`;

  try {
    // Comando yt-dlp para baixar áudio e converter para mp3
    const command = `yt-dlp -x --audio-format mp3 -o "${outputPath}.%(ext)s" "${videoUrl}"`;
    
    console.log('🔄 Baixando áudio...');
    await execPromise(command, { maxBuffer: 1024 * 1024 * 50 });

    return finalPath;
  } catch (error) {
    throw new Error(`Erro ao baixar áudio: ${error.message}`);
  }
}
