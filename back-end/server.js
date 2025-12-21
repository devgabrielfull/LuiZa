import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import ytdl from "ytdl-core";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (_, res) => {
  res.send("LuiZa backend online 🚀");
});

app.post("/transcrever", async (req, res) => {
  const { videoUrl } = req.body;

  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: "URL inválida" });
  }

  const audioFile = "audio.mp3";

  try {
    await new Promise((resolve, reject) => {
      ytdl(videoUrl, { filter: "audioonly" })
        .pipe(fs.createWriteStream(audioFile))
        .on("finish", resolve)
        .on("error", reject);
    });

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile),
      model: "whisper-1"
    });

    fs.unlinkSync(audioFile);
    res.json({ text: transcription.text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend rodando 🚀");
});
