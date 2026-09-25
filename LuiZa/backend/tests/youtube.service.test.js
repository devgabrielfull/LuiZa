import { chmod, copyFile, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { downloadAudio } from '../src/services/youtube.service.js';
import { cleanupFile } from '../src/utils/cleanup.js';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = path.join(backendDir, 'temp');
const fixture = path.join(backendDir, 'tests/fixtures/fake-yt-dlp.js');
const videoUrl = 'https://www.youtube.com/watch?v=abcdef01234';
const previousBinary = process.env.YTDLP_BIN;

let fakeBinary;
let fakeFailBinary;
let fakeDirectory;

beforeAll(async () => {
  fakeDirectory = await mkdtemp(path.join(os.tmpdir(), 'luiza-test-'));
  fakeBinary = path.join(fakeDirectory, 'yt-dlp');
  fakeFailBinary = path.join(fakeDirectory, 'yt-dlp-fail');
  await copyFile(fixture, fakeBinary);
  await copyFile(fixture, fakeFailBinary);
  await chmod(fakeBinary, 0o755);
  await chmod(fakeFailBinary, 0o755);
  process.env.YTDLP_BIN = fakeBinary;
});

afterAll(async () => {
  if (previousBinary === undefined) delete process.env.YTDLP_BIN;
  else process.env.YTDLP_BIN = previousBinary;
  if (fakeDirectory) await rm(fakeDirectory, { recursive: true, force: true });
});

describe('serviço de download e limpeza', () => {
  it('gera um arquivo isolado e apaga seu diretório após o uso', async () => {
    const audioFilePath = await downloadAudio(videoUrl);

    try {
      expect(path.dirname(path.dirname(audioFilePath))).toBe(tempDir);
      expect(path.basename(audioFilePath)).toBe('audio.mp3');
      expect(await readFile(audioFilePath, 'utf8')).toBe('MP3 fictício');
    } finally {
      await cleanupFile(audioFilePath);
    }

    await expect(stat(path.dirname(audioFilePath))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('remove arquivos parciais quando o yt-dlp falha', async () => {
    const before = (await readdir(tempDir)).sort();
    process.env.YTDLP_BIN = fakeFailBinary;

    try {
      await expect(downloadAudio(videoUrl)).rejects.toThrow('Falha simulada');
    } finally {
      process.env.YTDLP_BIN = fakeBinary;
    }

    expect((await readdir(tempDir)).sort()).toEqual(before);
  });

  it('impede que a limpeza apague uma pasta fora de temp/job-*', async () => {
    await expect(cleanupFile(fixture)).rejects.toThrow('Caminho temporário inválido');
  });
});
