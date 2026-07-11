const express = require("express");
const fetch = require("node-fetch");
const { authMiddleware } = require("../middleware/auth");
const MoodLog = require("../models/MoodLog");

const router = express.Router();

// Python emotion API URL
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:5001";

const VALID_LABELS = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"];

const EMOTION_MAP = {
  Angry: "confident",   // maps to Determined
  Disgust: "romantic",  // maps to Reserved
  Fear: "stressed",     // maps to Cautious
  Happy: "happy",       // maps to Joyful
  Neutral: "calm",      // maps to Calm
  Sad: "sad",           // maps to Reflective
  Surprise: "excited",  // maps to Excited
};

const DISPLAY_MAP = {
  Angry: "Determined",
  Disgust: "Reserved",
  Fear: "Cautious",
  Happy: "Joyful",
  Neutral: "Calm",
  Sad: "Reflective",
  Surprise: "Excited"
};

// Helper to calculate Levenshtein distance
function getLevenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Function to clean, correct, and validate raw model output
function normalizeEmotion(label) {
  if (!label || typeof label !== "string") return "Neutral";
  const clean = label.trim();
  
  // 1. Exact case-sensitive match
  if (VALID_LABELS.includes(clean)) return clean;
  
  // 2. Case-insensitive exact match
  const lowerClean = clean.toLowerCase();
  for (const valid of VALID_LABELS) {
    if (valid.toLowerCase() === lowerClean) return valid;
  }
  
  // 3. Typo correction (Levenshtein distance <= 2 for minor typos)
  let bestMatch = null;
  let minDistance = 3; // Must be strictly less than 3
  
  for (const valid of VALID_LABELS) {
    const dist = getLevenshteinDistance(lowerClean, valid.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = valid;
    }
  }
  
  if (bestMatch) return bestMatch;
  
  // 4. Default to Neutral if cannot be confidently corrected
  return "Neutral";
}

// POST /api/ai/detect — Forward webcam frame to Python Keras API
router.post("/detect", authMiddleware, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Missing 'image' field (base64-encoded webcam frame)",
      });
    }

    // Forward to Python Flask API
    const pyResponse = await fetch(`${PYTHON_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });

    if (!pyResponse.ok) {
      throw new Error(`Python API returned status ${pyResponse.status}`);
    }

    const pyData = await pyResponse.json();

    // Map the raw emotion to frontend-compatible label
    const rawEmotion = normalizeEmotion(pyData.emotion);
    const confidence = pyData.confidence || 0;
    // If confidence is very low, default to calm
    const mappedEmotion = confidence < 0.3 ? "calm" : (EMOTION_MAP[rawEmotion] || "calm");

    // Log to database
    const moodLog = new MoodLog({
      userId: req.user.id,
      detectedMood: mappedEmotion,
      rawEmotion,
      confidence,
    });
    await moodLog.save();

    console.log(
      `[AI] Detected: ${rawEmotion} -> ${mappedEmotion} (confidence: ${confidence}) for ${req.user.username}`
    );

    res.json({
      success: true,
      raw_emotion: rawEmotion,
      emotion: mappedEmotion,
      confidence,
      faces_found: pyData.faces_found,
    });
  } catch (err) {
    console.error("[AI] Detection error:", err.message);
    res.status(500).json({
      success: false,
      message: "Emotion detection failed. Is the Python API running on port 5001?",
      error: err.message,
    });
  }
});

// POST /api/ai/scan — Multi-frame scan (collects emotion votes and returns most common)
router.post("/scan", authMiddleware, async (req, res) => {
  try {
    const { frames } = req.body;  // array of base64 images

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing 'frames' field (array of base64-encoded images)",
      });
    }

    const emotions = [];

    for (const frame of frames) {
      try {
        const pyResponse = await fetch(`${PYTHON_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: frame }),
        });

        if (pyResponse.ok) {
          const pyData = await pyResponse.json();
          if (pyData.emotion && pyData.faces_found > 0) {
            const corrected = normalizeEmotion(pyData.emotion);
            emotions.push({
              raw: corrected,
              mapped: EMOTION_MAP[corrected] || "calm",
              confidence: pyData.confidence || 0,
            });
          }
        }
      } catch {
        // Skip failed frame
      }
    }

    // Find most common mapped emotion
    let finalMood = "calm";
    let avgConfidence = 0;
    let finalRaw = "Neutral";

    if (emotions.length > 0) {
      const counts = {};
      emotions.forEach((e) => {
        counts[e.mapped] = (counts[e.mapped] || 0) + 1;
      });
      finalMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const matching = emotions.filter((e) => e.mapped === finalMood);
      avgConfidence = matching.reduce((sum, e) => sum + e.confidence, 0) / matching.length;
      finalRaw = matching[0].raw;
    }

    // Log to database
    const moodLog = new MoodLog({
      userId: req.user.id,
      detectedMood: finalMood,
      rawEmotion: finalRaw,
      confidence: avgConfidence,
    });
    await moodLog.save();

    console.log(
      `[AI] Scan complete: ${finalRaw} -> ${finalMood} (avg confidence: ${avgConfidence.toFixed(2)}, ${emotions.length} frames) for ${req.user.username}`
    );

    res.json({
      success: true,
      emotion: finalMood,
      raw_emotion: finalRaw,
      confidence: avgConfidence,
      frames_analyzed: emotions.length,
      total_frames: frames.length,
    });
  } catch (err) {
    console.error("[AI] Scan error:", err.message);
    res.status(500).json({
      success: false,
      message: "Scan failed",
      error: err.message,
    });
  }
});

module.exports = router;
