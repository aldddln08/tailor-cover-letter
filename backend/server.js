import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const origins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: origins,
  }),
);
app.use(express.json({ limit: "1mb" }));

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const usageStore = new Map();

function getTodayKey(userId) {
  const date = new Date().toISOString().split("T")[0];
  return `${userId}:${date}`;
}

function getLimit(isLoggedIn) {
  return isLoggedIn ? 5 : 3;
}

function getUsage(userId) {
  const key = getTodayKey(userId);
  return usageStore.get(key) || 0;
}

function incrementUsage(userId) {
  const key = getTodayKey(userId);
  const current = usageStore.get(key) || 0;
  usageStore.set(key, current + 1);
  return current + 1;
}

function buildPrompt(name, skills, jobDescription) {
  return `You are an expert career assistant that writes tailored cover letters.

Name: ${name}
Skills: ${skills}
Job Description: ${jobDescription}

Write a concise, professional cover letter (max 250 words) tailored to the job. Focus only on relevant skills. Do not repeat the job description. Use a natural tone.`;
}

app.get("/api/usage-status", (req, res) => {
  const userId = String(req.query.userId || "").trim();
  const isLoggedIn = String(req.query.isLoggedIn || "false") === "true";

  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  const limit = getLimit(isLoggedIn);
  const usedToday = getUsage(userId);
  const remaining = Math.max(limit - usedToday, 0);

  return res.json({ limit, usedToday, remaining });
});

app.post("/api/generate", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Server is not configured with OPENAI_API_KEY." });
    }

    const { name, skills, jobDescription, userId, isLoggedIn } = req.body;
    const cleanName = String(name || "").trim();
    const cleanSkills = String(skills || "").trim();
    const cleanJobDescription = String(jobDescription || "").trim();
    const cleanUserId = String(userId || "").trim();
    const loggedIn = Boolean(isLoggedIn);

    if (!cleanName || !cleanSkills || !cleanJobDescription || !cleanUserId) {
      return res.status(400).json({
        error: "name, skills, jobDescription, and userId are required.",
      });
    }

    const limit = getLimit(loggedIn);
    const usedToday = getUsage(cleanUserId);

    if (usedToday >= limit) {
      return res.status(429).json({
        error: "Daily generation limit reached.",
        remaining: 0,
        limit,
        usedToday,
      });
    }

    const prompt = buildPrompt(cleanName, cleanSkills, cleanJobDescription);

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 350,
      messages: [{ role: "user", content: prompt }],
    });

    const coverLetter = completion.choices?.[0]?.message?.content?.trim();

    if (!coverLetter) {
      return res.status(502).json({ error: "AI provider returned an empty response." });
    }

    const newUsedCount = incrementUsage(cleanUserId);
    const remaining = Math.max(limit - newUsedCount, 0);

    return res.json({
      coverLetter,
      remaining,
      limit,
      usedToday: newUsedCount,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Failed to generate cover letter." });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
