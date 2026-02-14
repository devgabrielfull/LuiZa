import request from 'supertest';
import express from 'express';
import cors from 'cors';
import transcribeRouter from '../src/routes/transcribe.route.js';

// Mock dos serviços
jest.mock('../src/services/youtube.service.js');
jest.mock('../src/services/whisper.service.js');
jest.mock('../src/utils/cleanup.js');

import { downloadAudio } from '../src/services/youtube.service.js';
import { transcribeAudio } from '../src/services/whisper.service.js';
import { cleanupFile } from '../src/utils/cleanup.js';

// Criar app de teste
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/transcribe', transcribeRouter);

describe('Backend API Tests', () => {
  
  describe('GET /health', () => {
    it('deve retornar status ok', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /transcribe', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve retornar erro se videoUrl não for enviado', async () => {
      const response = await request(app)
        .post('/transcribe')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('videoUrl é obrigatório');
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

    it('deve limpar arquivo mesmo em caso de erro', async () => {
      const mockVideoUrl = 'https://www.youtube.com/watch?v=test123';
      const mockAudioPath = '/temp/audio_123.mp3';
      
      downloadAudio.mockResolvedValue(mockAudioPath);
      transcribeAudio.mockRejectedValue(new Error('Erro qualquer'));
      cleanupFile.mockResolvedValue();

      await request(app)
        .post('/transcribe')
        .send({ videoUrl: mockVideoUrl });

      expect(cleanupFile).toHaveBeenCalledWith(mockAudioPath);
    });
  });
});
