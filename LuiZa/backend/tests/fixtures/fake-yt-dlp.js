#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

// Simula apenas a criação do MP3: nenhum vídeo é baixado durante os testes.
const args = process.argv.slice(2);
const outputIndex = args.indexOf('-o');
const template = args[outputIndex + 1];

if (!template || !args.includes('--no-playlist') ||
    !args.includes('--audio-quality') || !args.includes('64K')) {
  process.stderr.write('Argumentos inesperados no teste do yt-dlp\n');
  process.exitCode = 2;
} else {
  await writeFile(template.replace('%(ext)s', 'mp3'), 'MP3 fictício');

  if (path.basename(process.argv[1]) === 'yt-dlp-fail') {
    process.stderr.write('Falha simulada depois de criar um arquivo parcial\n');
    process.exitCode = 2;
  }
}
