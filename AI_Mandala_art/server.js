const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const HF_API_KEY = process.env.HF_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Image Generation Endpoint
app.post("/generate", async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    const finalPrompt = `Ultra-detailed mandala art, intricate patterns, high resolution, vibrant colors, ${userPrompt}`;
    console.log(`🎨 Generating image with prompt: "${finalPrompt}"`);

    // Generate Image using Hugging Face API
    const imageResponse = await axios.post(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large-turbo",
      { inputs: finalPrompt },
      { 
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
        responseType: "arraybuffer" 
      }
    );

    if (!imageResponse.data) {
      throw new Error("Empty image response from Hugging Face");
    }

    const base64Image = Buffer.from(imageResponse.data, "binary").toString("base64");
    console.log("✅ Image successfully generated!");

    // Evaluate with Gemini AI
    const analysis = await evaluateImage(base64Image, userPrompt);
    console.log("🏆 Analysis Complete:", analysis);

    res.json({ image: base64Image, ...analysis });

  } catch (error) {
    console.error("❌ Error during image generation or analysis:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Evaluate Image using Gemini AI
async function evaluateImage(base64Image, prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `Evaluate this mandala using strict criteria:
            - **Prompt Relevance** (1-10)
            - **Symmetry** (1-10)
            - **Color Harmony** (1-10)
            - **Artistic Complexity** (1-10)
            - **Quality Score** (1-10)
            Provide short explanations for each.` },
            { inline_data: { mime_type: "image/png", data: base64Image } }
          ]
        }
      ]
    });

    const text = result.response.text();
    console.log("🔎 AI Response:", text);

    return {
      description: shortenDescription(text),
      prompt_relevance: extractScore(text, "Prompt Relevance"),
      symmetry: extractScore(text, "Symmetry"),
      color_harmony: extractScore(text, "Color Harmony"),
      artistic_complexity: extractScore(text, "Artistic Complexity"),
      quality_score: extractScore(text, "Quality Score")
    };

  } catch (error) {
    console.error("❌ Error during AI evaluation:", error);
    return { description: "Analysis failed.", quality_score: "Error" };
  }
}

// Extract Scores using Improved Regex
function extractScore(text, category) {
  const regex = new RegExp(`${category}:\\s*(\\d+(\\.\\d+)?)`, "gi");
  const match = text.match(regex);
  if (match) {
    return parseFloat(match[0].match(/\d+(\.\d+)?/)[0]);
  } else {
    console.warn(`⚠️ ${category} not found. Defaulting to 5.`);
    return 5;
  }
}

// Shorten AI-Generated Descriptions
function shortenDescription(text) {
  return text.split("\n").slice(0, 3).join(" ");
}

// Start the Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
