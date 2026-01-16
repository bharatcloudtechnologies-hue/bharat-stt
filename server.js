import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { AssemblyAI } from "assemblyai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "bharat-stt" });
});

// ✅ URL audio STT
app.post("/api/stt/url", async (req, res) => {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl) return res.status(400).json({ error: "audioUrl required" });

    const transcript = await client.transcripts.transcribe({
      audio: audioUrl,
      speech_models: ["universal"],
    });

    return res.json({ text: transcript.text || "" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ✅ File upload STT (mobile app से)
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio file required" });

    // AssemblyAI को direct buffer नहीं भेज सकते
    // पहले file upload करना पड़ता है (AssemblyAI upload API)
    const uploadUrl = await client.files.upload(req.file.buffer);

    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      speech_models: ["universal"],
    });

    return res.json({ text: transcript.text || "" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("STT running on port", port));
