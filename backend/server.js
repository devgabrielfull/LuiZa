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
    
    await execPromise(
      `yt-dlp -f bestaudio --extract-audio --audio-format mp3 -o "${file}" "${videoUrl}"`
    );

    console.log(`🎤 Transcrevendo áudio: ${file}`);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file),
      model: "whisper-1"
    });

    fs.unlinkSync(file);
    console.log("✅ Transcrição concluída");

    res.json({ text: transcription.text });

  } catch (err) {
    console.error("❌ Erro:", err);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.status(500).json({ 
      error: "Erro ao transcrever vídeo: " + (err.message || err) 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
