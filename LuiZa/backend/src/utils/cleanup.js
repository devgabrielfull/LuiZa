import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tempDir = path.join(backendDir, 'temp');

export async function cleanupFile(filePath) {
  const jobDir = path.dirname(path.resolve(filePath));

  // Nunca apagar uma pasta fora dos trabalhos temporários criados pelo LuiZa.
  if (path.dirname(jobDir) !== tempDir || !path.basename(jobDir).startsWith('job-')) {
    throw new Error('Caminho temporário inválido');
  }

  await rm(jobDir, { recursive: true, force: true });
}
