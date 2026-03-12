import fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Remove arquivo temporário do sistema
 * @param {string} filePath - Caminho do arquivo a ser removido
 */
export async function cleanupFile(filePath) {
  // Verificar existência antes de tentar deletar evita erros silenciosos
  // que ocorrem quando a conversão falhou e o arquivo tem extensão diferente
  if (!existsSync(filePath)) {
    console.warn('⚠️  Arquivo não encontrado para remoção:', filePath);
    return;
  }

  try {
    await fs.unlink(filePath);
    console.log('🗑️  Arquivo temporário removido:', filePath);
  } catch (error) {
    console.error('⚠️  Erro ao remover arquivo:', error.message);
  }
}
