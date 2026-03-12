import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
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
  
  // Caminhos completos para os executáveis
  const backendRoot = path.join(__dirname, '../..');
  const ytDlpPath = path.join(backendRoot, 'yt-dlp.exe');
  const ffmpegPath = path.join(backendRoot, 'ffmpeg.exe');
  
  try {
    // Comando yt-dlp com caminhos completos
    const command = `"${ytDlpPath}" -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" -o "${outputPath}.%(ext)s" "${videoUrl}"`;
    
    console.log('🔄 Baixando áudio...');
    await execPromise(command, { maxBuffer: 1024 * 1024 * 50 });

    // Verificar se o mp3 foi gerado — se não, o ffmpeg falhou na conversão
    // e o yt-dlp pode ter deixado um arquivo .webm para trás
    if (!existsSync(finalPath)) {
      throw new Error(
        `Conversão para mp3 falhou. Verifique se ffmpeg.exe está em: ${ffmpegPath}`
      );
    }

    return finalPath;
  } catch (error) {
    throw new Error(`Erro ao baixar áudio: ${error.message}`);
  }
}