import request from 'supertest';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Em módulos ESM, registramos os mocks antes de importar o app real.
const downloadAudio = jest.fn();
const transcribeAudio = jest.fn();
const cleanupFile = jest.fn();
jest.unstable_mockModule('../src/services/youtube.service.js', () => ({ downloadAudio }));
jest.unstable_mockModule('../src/services/whisper.service.js', () => ({ transcribeAudio }));
jest.unstable_mockModule('../src/utils/cleanup.js', () => ({ cleanupFile }));

const { default: app } = await import('../src/app.js');

describe('Backend API Tests', () => {
  
  describe('GET /health', () => {
    it('deve retornar status ok', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /transcribe', () => {
    let errorLog;

    beforeEach(() => {
      jest.clearAllMocks();
      errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => errorLog.mockRestore());

    it('deve retornar erro se videoUrl não for enviado', async () => {
      const response = await request(app)
        .post('/transcribe')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('videoUrl é obrigatório');
    });

    it('rejeita URL que não é de vídeo do YouTube', async () => {
      const response = await request(app)
        .post('/transcribe')
        .send({ videoUrl: 'https://youtube.com.evil.test/watch?v=1' });

      expect(response.status).toBe(400);
      expect(downloadAudio).not.toHaveBeenCalled();
    });

    it('deve processar transcrição com sucesso', async () => {
      const mockVideoUrl = 'https://www.youtube.com/watch?v=test123';
      const mockAudioPath = '/temp/audio_123.mp3';
      const mockTranscription = {
        language: 'pt',
        segments: [
          { start: 0, end: 5, text: 'Olá mundo' },
          { start: 5, end: 10, text: 'Teste de transcrição' }
        ]
      };

      downloadAudio.mockResolvedValue(mockAudioPath);
      transcribeAudio.mockResolvedValue(mockTranscription);
      cleanupFile.mockResolvedValue();

      const response = await request(app)
        .post('/transcribe')
        .send({ videoUrl: mockVideoUrl });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTranscription);
      expect(downloadAudio).toHaveBeenCalledWith(mockVideoUrl);
      expect(transcribeAudio).toHaveBeenCalledWith(mockAudioPath);
      expect(cleanupFile).toHaveBeenCalledWith(mockAudioPath);
    });

    it('deve retornar erro se download falhar', async () => {
      const mockVideoUrl = 'https://www.youtube.com/watch?v=test123';
      
      downloadAudio.mockRejectedValue(new Error('Erro ao baixar áudio'));

      const response = await request(app)
        .post('/transcribe')
        .send({ videoUrl: mockVideoUrl });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Erro ao baixar áudio');
    });

    it('deve retornar erro se transcrição falhar', async () => {
      const mockVideoUrl = 'https://www.youtube.com/watch?v=test123';
      const mockAudioPath = '/temp/audio_123.mp3';
      
      downloadAudio.mockResolvedValue(mockAudioPath);
      transcribeAudio.mockRejectedValue(new Error('Erro na API Whisper'));
      cleanupFile.mockResolvedValue();

      const response = await request(app)
        .post('/transcribe')
        .send({ videoUrl: mockVideoUrl });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Erro na API Whisper');
      expect(cleanupFile).toHaveBeenCalledWith(mockAudioPath);
    });

    it('informa uma falha de limpeza antes de responder ao popup', async () => {
      const mockVideoUrl = 'https://www.youtube.com/watch?v=test123';
      const mockAudioPath = '/temp/audio_123.mp3';

      downloadAudio.mockResolvedValue(mockAudioPath);
      transcribeAudio.mockResolvedValue({ language: 'pt', segments: [] });
      cleanupFile.mockRejectedValue(new Error('Não foi possível remover o MP3'));

      const response = await request(app)
        .post('/transcribe')
        .send({ videoUrl: mockVideoUrl });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Não foi possível remover o MP3');
      expect(cleanupFile).toHaveBeenCalledWith(mockAudioPath);
    });
  });
});
