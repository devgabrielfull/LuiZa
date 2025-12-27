import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import crypto from "crypto";
import { exec } from "child_process";
import util from "util";

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (_, res) => {
  res.send("LuiZa backend online 🚀");
});

const execPromise = util.promisify(exec);

app.post("/transcrever", async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl ausente" });
  }

  const file = `audio-${crypto.randomUUID()}.mp3`;
  const pythonScript = 'download_audio.py';

  try {
    console.log(`📥 Baixando áudio de: ${videoUrl}`);
    
    const downloadCommand = `python3 ${pythonScript} "${videoUrl}" "${file}"`;
    
    console.log(`🔧 Executando: ${downloadCommand}`);
    
    const { stdout, stderr } = await execPromise(downloadCommand, {
      timeout: 120000
    });
    
    if (stderr && !stderr.includes('warning')) {
      console.log('⚠️ Python stderr:', stderr);
    }
    if (stdout) {
      console.log('ℹ️ Python stdout:', stdout);
    }

    if (!fs.existsSync(file)) {
      throw new Error("Arquivo de áudio não foi gerado");
    }

    const stats = fs.statSync(file);
    console.log(`📁 Arquivo gerado: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    if (stats.size > 25 * 1024 * 1024) {
      fs.unlinkSync(file);
      return res.status(400).json({ 
        error: "Vídeo muito longo. Tente um vídeo mais curto." 
      });
    }

    console.log(`🎤 Transcrevendo áudio com Whisper...`);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file),
      model: "whisper-1",
      language: "pt"
    });

    fs.unlinkSync(file);
    console.log("✅ Transcrição concluída!");

    res.json({ text: transcription.text });

  } catch (err) {
    console.error("❌ Erro completo:", err);
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (cleanupErr) {
        console.error("Erro ao limpar arquivo:", cleanupErr);
      }
    }
    
    res.status(500).json({ 
      error: "Erro ao transcrever vídeo",
      message: err.message || "Erro desconhecido",
      details: err.stderr || err.stdout || "Sem detalhes"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
