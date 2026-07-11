const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ClothingItem = require("../models/ClothingItem");
const { authMiddleware } = require("../middleware/auth");
const qdrant = require("../services/qdrant");
const cloudinary = require("../services/cloudinary");

const fetch = require("node-fetch");

const router = express.Router();

// ── Multer config for local uploads ──────────────────────────────────
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error("Only image files (jpg, png, webp, gif) are allowed"));
  },
});

/**
 * Call Gemini Vision to extract clothing features
 */
async function analyzeImageWithGemini(imageBuffer, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[GeminiVision] GEMINI_API_KEY not found. Skipping auto-analysis.");
    return null;
  }

  const base64Data = imageBuffer.toString("base64");

  const prompt = `Analyze the uploaded clothing item image. Extract the following information and output ONLY a valid JSON object with this format (do not wrap in markdown tags):
{
  "name": "A descriptive name for the garment, e.g., Beige Loose Cargo Pants",
  "category": "One of: top, bottom, layer, footwear, accessory",
  "subtype": "Detailed category, e.g., shirt, t-shirt, hoodie, jeans, trousers, shorts, jacket, sneakers, watch, etc.",
  "colors": ["list of dominant and secondary colors from this list: dark, light, bright, monochrome, black, white, beige, pink, yellow, red, blue, green, grey, brown, pastel, bold, printed, sage, lavender, mint, peach, olive, navy, cream, charcoal"],
  "fit": "One of: cropped, oversized, regular, slim, wide, or empty string",
  "pattern": "e.g., solid, striped, floral, plaid, graphic, none",
  "sleeveType": "e.g., long, short, sleeveless, none",
  "fabric": "e.g., denim, cotton, linen, wool, leather, silk, knit, none",
  "styleTags": ["streetwear", "casual", "formal", "smart casual", "athletic", "minimal", "cozy", "edgy", "vintage"],
  "season": ["spring", "summer", "autumn", "winter"],
  "occasion": ["casual", "formal", "party", "traditional"],
  "moodSuitability": ["happy", "calm", "confident", "romantic", "sad", "excited", "stressed", "focused"]
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[GeminiVision] Error response:", errText);
      return null;
    }

    const resJson = await response.json();
    const jsonText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) return null;

    return JSON.parse(jsonText.trim());
  } catch (err) {
    console.error("[GeminiVision] Failed to analyze image:", err.message);
    return null;
  }
}

// POST /api/wardrobe/add — Upload image + metadata tags
router.post("/add", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { category, subtype, fit, occasion, color_spectrum, labels, name } = req.body;

    // Parse arrays from comma-separated strings or JSON arrays
    const parseArray = (val) => {
      if (!val) return null;
      if (Array.isArray(val)) return val;
      try { return JSON.parse(val); } catch {}
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    };

    let aiMeta = null;
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename);
      const fileBuffer = fs.readFileSync(filePath);
      aiMeta = await analyzeImageWithGemini(fileBuffer, req.file.mimetype);
      console.log("[Wardrobe] Gemini Vision extracted metadata:", aiMeta);
    }

    const occasionArr = parseArray(occasion) || aiMeta?.occasion || ["casual"];
    const colorArr = parseArray(color_spectrum) || aiMeta?.colors || [];
    const labelsArr = parseArray(labels) || aiMeta?.styleTags || [];

    const finalCategory = category || aiMeta?.category || "top";
    const finalName = name || aiMeta?.name || "Unnamed Item";
    const finalSubtype = subtype || aiMeta?.subtype || "";
    const finalFit = fit || aiMeta?.fit || "regular";
    const finalPattern = aiMeta?.pattern || "";
    const finalSleeveType = aiMeta?.sleeveType || "";
    const finalFabric = aiMeta?.fabric || "";
    const finalSeason = aiMeta?.season || ["summer", "spring", "autumn", "winter"];
    const finalMood = aiMeta?.moodSuitability || ["calm"];

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const item = new ClothingItem({
      user_id: req.user.id,
      image_url: imageUrl,
      name: finalName,
      category: finalCategory,
      subtype: finalSubtype,
      fit: finalFit,
      occasion: occasionArr,
      color_spectrum: colorArr,
      labels: labelsArr,
      pattern: finalPattern,
      sleeveType: finalSleeveType,
      fabric: finalFabric,
      season: finalSeason,
      moodSuitability: finalMood,
    });

    await item.save();

    // Upsert to Qdrant
    const qdrantId = await qdrant.upsertItem(item);
    if (qdrantId) {
      item.qdrant_id = qdrantId;
      item.sync_status = "synced";
      await item.save();
    } else {
      console.log(`[Wardrobe] Item '${item.name}' queued for Qdrant background sync.`);
    }

    // Upsert to Cloudinary (Dual-Storage Backup)
    if (req.file) {
      const localFilePath = path.join(uploadDir, req.file.filename);
      const cloudResult = await cloudinary.uploadImage(localFilePath);
      if (cloudResult) {
        item.cloudinary_url = cloudResult.url;
        item.cloudinary_id = cloudResult.public_id;
        item.cloud_status = "synced";
        await item.save();
        console.log(`[Wardrobe] Cloudinary sync successful for '${item.name}'`);
      } else {
        console.log(`[Wardrobe] Cloudinary failed for '${item.name}', queued for background sync.`);
      }
    }

    console.log(`[Wardrobe] Item '${item.name}' added for user ${req.user.username} (qdrant: ${qdrantId || "n/a"})`);

    res.status(201).json({
      success: true,
      item,
    });
  } catch (err) {
    console.error("[Wardrobe] Add error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wardrobe — Get all wardrobe items for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const items = await ClothingItem.find({ user_id: req.user.id }).sort({ added_at: -1 });
    // Serve Cloudinary URL if synced, otherwise local backup
    const mappedItems = items.map(item => {
      const obj = item.toObject();
      if (obj.cloud_status === "synced" && obj.cloudinary_url) {
        obj.image_url = obj.cloudinary_url;
      }
      return obj;
    });
    res.json({ success: true, items: mappedItems, count: items.length });
  } catch (err) {
    console.error("[Wardrobe] Fetch error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/wardrobe/stats — Get category counts
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const total = await ClothingItem.countDocuments({ user_id: userId });
    const categories = await ClothingItem.aggregate([
      { $match: { user_id: require("mongoose").Types.ObjectId.createFromHexString(userId) } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const stats = { total, top: 0, bottom: 0, layer: 0, footwear: 0, accessory: 0 };
    categories.forEach((c) => { stats[c._id] = c.count; });

    res.json({ success: true, stats });
  } catch (err) {
    console.error("[Wardrobe] Stats error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/wardrobe/:id — Remove item
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const item = await ClothingItem.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Delete from Qdrant
    if (item.qdrant_id) {
      await qdrant.deleteItem(item.qdrant_id);
    }

    // Delete from Cloudinary
    if (item.cloudinary_id) {
      await cloudinary.deleteImage(item.cloudinary_id);
    }

    // Delete the file from disk if it exists
    if (item.image_url) {
      const filePath = path.join(__dirname, "..", item.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    console.log(`[Wardrobe] Item '${item.name}' deleted for user ${req.user.username}`);

    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    console.error("[Wardrobe] Delete error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
