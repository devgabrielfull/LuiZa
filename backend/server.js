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

  try {
    console.log(`📥 Baixando áudio de: ${videoUrl}`);
    
    // SOLUÇÃO: Usar cliente Android + formato específico + nodejs runtime
    const ytDlpCommand = [
      'yt-dlp',
      '--extractor-args "youtube:player_client=android"',
      '--format "bestaudio[ext=m4a]/bestaudio/best"',
      '--extract-audio',
      '--audio-format mp3',
      '--no-playlist',
      '--no-warnings',
      `--output "${file}"`,
      `"${videoUrl}"`
    ].join(' ');

    console.log(`🔧 Executando: ${ytDlpCommand}`);

    await execPromise(ytDlpCommand);

    if (!fs.existsSync(file)) {
      throw new Error("Arquivo de áudio não foi gerado");
    }

    console.log(`🎤 Transcrevendo áudio: ${file}`);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file),
      model: "whisper-1"
    });

    fs.unlinkSync(file);
    console.log("✅ Transcrição concluída");

    res.json({ text: transcription.text });

  } catch (err) {
    console.error("❌ Erro completo:", err);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.status(500).json({ 
      error: "Erro ao transcrever vídeo: " + (err.message || err),
      details: err.stderr || err.stdout || "Sem detalhes adicionais"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});