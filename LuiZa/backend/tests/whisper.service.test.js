import { mkdtemp, rm, truncate, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Substituímos apenas a chamada HTTP; o formulário enviado continua sendo real.
const post = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { post } }));
const { transcribeAudio } = await import('../src/services/whisper.service.js');

const previousKey = process.env.OPENAI_API_KEY;
let testDirectory;
let audioFilePath;
let largeFilePath;
let log;

async function readForm(form) {
  const chunks = [];
  const sink = new Writable({
    write(chunk, _encoding, done) {
      chunks.push(chunk);
      done();
    }
  });

  await new Promise((resolve, reject) => {
    form.once('error', reject);
    sink.once('error', reject);
    sink.once('finish', resolve);
    form.pipe(sink);
  });

  return Buffer.concat(chunks).toString('utf8');
}

beforeAll(async () => {
  testDirectory = await mkdtemp(path.join(os.tmpdir(), 'luiza-whisper-test-'));
  audioFilePath = path.join(testDirectory, 'audio.mp3');
  largeFilePath = path.join(testDirectory, 'large.mp3');
  await writeFile(audioFilePath, 'conteúdo fictício');
  await writeFile(largeFilePath, '');
  await truncate(largeFilePath, 25_000_000);
});

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'chave-ficticia-para-teste';
  post.mockReset();
  log = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => log.mockRestore());

afterAll(async () => {
  if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previousKey;
  if (testDirectory) await rm(testDirectory, { recursive: true, force: true });
});

describe('serviço de transcrição Whisper', () => {
  it('envia o MP3 com os parâmetros de timestamps e devolve segmentos', async () => {
    post.mockImplementation(async (url, form, options) => {
      expect(url).toBe('https://api.openai.com/v1/audio/transcriptions');
      expect(options.headers.Authorization).toBe('Bearer chave-ficticia-para-teste');
      expect(options.headers['content-type']).toContain('multipart/form-data');

      const body = await readForm(form);
      expect(body).toContain('name="model"');
      expect(body).toContain('whisper-1');
      expect(body).toContain('name="response_format"');
      expect(body).toContain('verbose_json');
      expect(body).toContain('name="timestamp_granularities[]"');
      expect(body).toContain('segment');

      return {
        data: {
          language: 'portuguese',
          segments: [{ start: 0, end: 1.5, text: ' Olá! ' }]
        }
      };
    });

    await expect(transcribeAudio(audioFilePath)).resolves.toEqual({
      language: 'portuguese',
      segments: [{ start: 0, end: 1.5, text: 'Olá!' }]
    });
  });

  it('informa quando o provedor não devolve segmentos', async () => {
    post.mockImplementation(async (_url, form) => {
      await readForm(form);
      return { data: { text: 'Olá!' } };
    });

    await expect(transcribeAudio(audioFilePath)).rejects.toThrow('não retornou segmentos com timestamps');
  });

  it('recusa áudio com 25 MB antes de enviar à API', async () => {
    await expect(transcribeAudio(largeFilePath)).rejects.toThrow('25 MB ou mais');
    expect(post).not.toHaveBeenCalled();
  });

  it('exige a chave somente no servidor', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(transcribeAudio(audioFilePath)).rejects.toThrow('OPENAI_API_KEY');
    expect(post).not.toHaveBeenCalled();
  });
});
