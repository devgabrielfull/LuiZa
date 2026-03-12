import fs from 'fs/promises';

/**
 * Remove arquivo temporário do sistema
 * @param {string} filePath - Caminho do arquivo a ser removido
 */
export async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log('🗑️  Arquivo temporário removido:', filePath);
  } catch (error) {
    console.error('⚠️  Erro ao remover arquivo:', error.message);
  }
}
