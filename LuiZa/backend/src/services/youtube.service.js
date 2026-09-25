import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tempDir = path.join(backendDir, 'temp');

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const binary = process.env.YTDLP_BIN?.trim() || 'yt-dlp';
    // Cada opção é um argumento separado; a URL não é interpretada pelo shell.
    const child = spawn(binary, args, {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe']
    });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-4000);
    });
    child.on('error', (error) => {
      const reason = error.code === 'ENOENT'
        ? 'executável não encontrado; instale o yt-dlp ou configure YTDLP_BIN'
        : error.message;
      reject(new Error(`Não foi possível iniciar yt-dlp (${binary}): ${reason}`, { cause: error }));
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp terminou com código ${code}: ${stderr.trim()}`));
    });
  });
}

export async function downloadAudio(videoUrl) {
  await mkdir(tempDir, { recursive: true });
  // Uma pasta por pedido evita que dois vídeos usem o mesmo nome de arquivo.
  const jobDir = await mkdtemp(path.join(tempDir, 'job-'));
  const outputTemplate = path.join(jobDir, 'audio.%(ext)s');
  const finalPath = path.join(jobDir, 'audio.mp3');

  const args = [
    '--no-playlist',
    '--js-runtimes', `node:${process.execPath}`,
    '-f', 'bestaudio/best',
    '--extract-audio',
    '--audio-format', 'mp3',
    // Uma taxa fixa mantém mais vídeos curtos abaixo do limite de 25 MB da API.
    '--audio-quality', '64K',
    '-o', outputTemplate,
    '--', videoUrl
  ];

  try {
    await runYtDlp(args);
    const file = await stat(finalPath);
    if (!file.isFile() || file.size === 0) {
      throw new Error('O yt-dlp não gerou um MP3 válido');
    }
    return finalPath;
  } catch (error) {
    // Também remove arquivos parciais quando o download ou a conversão falha.
    try {
      await rm(jobDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Falha ao apagar download parcial:', cleanupError);
    }
    throw new Error(`Erro ao baixar áudio: ${error.message}`, { cause: error });
  }
}
