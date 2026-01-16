import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "bharat-stt-backend" });
});

// POST /api/stt  (multipart/form-data)
// field name: audio
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "audio file is required" });
    }

    const language = req.body.language || "hi"; // hi / en etc

    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      language,
    });

    // delete temp file
    fs.unlink(req.file.path, () => {});

    return res.json({ text: result.text || "" });
  } catch (err) {
    console.log("STT Error:", err);
    return res.status(500).json({ error: "stt_failed" });
  }
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`✅ STT Backend running on http://localhost:${port}`);
});
