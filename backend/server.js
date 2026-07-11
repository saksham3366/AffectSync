/**
 * AffectSync Express Backend Server
 * Connects MongoDB + Qdrant, mounts routes, serves uploads, auto-seeds on first run.
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const qdrant = require("./services/qdrant");
const cloudinary = require("./services/cloudinary");

const app = express();

// ── Config ──────────────────────────────────────────────────────────
function checkEnvVars() {
  const required = ["MONGO_URI", "JWT_SECRET"];
  required.forEach(key => {
    if (!process.env[key]) console.warn(`[WARNING] Missing environment variable: ${key} (Using defaults if available)`);
  });
}

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/affectsync";

// ── Middleware ───────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : [
      "http://localhost:3000",
      "http://localhost:4173",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4173",
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// ── Routes ──────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const wardrobeRoutes = require("./routes/wardrobe");
const aiRoutes = require("./routes/ai");
const recommendRoutes = require("./routes/recommend");
const profileRoutes = require("./routes/profile");
const weatherRoutes = require("./routes/weather");

app.use("/api/auth", authRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/recommend-outfits", recommendRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/weather", weatherRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    server: "AffectSync Backend",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    qdrant: qdrant.isConnected() ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Vector engine health check (Failsafe monitoring)
app.get("/api/health/vector", async (req, res) => {
  try {
    const status = await qdrant.getHealthStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vector health" });
  }
});

// Cloudinary dual-storage health check
app.get("/api/health/storage", async (req, res) => {
  try {
    const status = await cloudinary.getHealthStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch storage health" });
  }
});

// ── Auto-seed on first run ──────────────────────────────────────────
async function autoSeed() {
  const User = require("./models/User");
  const ClothingItem = require("./models/ClothingItem");
  const userCount = await User.countDocuments();

  if (userCount === 0) {
    console.log("[Server] No users found. Running auto-seed...");

    const users = [
      {
        username: "test_male", password: "pass123", gender: "Male",
        height: 178, weight: 75, bodyType: "Athletic", skinTone: "Medium",
        hairType: "Wavy", stylePersonality: "Minimal", fitPreference: "Regular",
        colorPreference: ["Neutral", "Earthy"], fabricPreference: ["Cotton", "Linen"],
      },
      {
        username: "test_female", password: "pass123", gender: "Female",
        height: 165, weight: 58, bodyType: "Hourglass", skinTone: "Light",
        hairType: "Straight", stylePersonality: "Classic", fitPreference: "Regular",
        colorPreference: ["Pastel", "Neutral"], fabricPreference: ["Cotton", "Silk"],
      },
      {
        username: "new_user", password: "pass123", gender: "Male",
        height: 175, weight: 70, bodyType: "Average", skinTone: "Medium",
        hairType: "Straight", stylePersonality: "Streetwear", fitPreference: "Oversized",
        colorPreference: ["Bold", "Dark"], fabricPreference: ["Cotton", "Denim"],
      },
    ];

    const maleItems = [
      { name: "White Oxford Shirt", category: "top", subtype: "shirt", fit: "regular", occasion: ["formal", "casual"], color_spectrum: ["light", "white"], labels: ["office", "smart casual"], pattern: "solid", sleeveType: "long", fabric: "cotton", season: ["spring", "autumn", "winter"], moodSuitability: ["focused", "confident", "calm"] },
      { name: "Sunshine Yellow Polo", category: "top", subtype: "polo", fit: "regular", occasion: ["casual"], color_spectrum: ["bright", "yellow"], labels: ["weekend", "summer"], pattern: "solid", sleeveType: "short", fabric: "cotton", season: ["summer"], moodSuitability: ["happy", "excited"] },
      { name: "Charcoal Crew Tee", category: "top", subtype: "tee", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "grey", "monochrome"], labels: ["everyday"], pattern: "solid", sleeveType: "short", fabric: "cotton", season: ["summer", "spring"], moodSuitability: ["calm", "sad", "stressed"] },
      { name: "Navy Blue Henley", category: "top", subtype: "henley", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "blue", "navy"], labels: ["layering"], pattern: "solid", sleeveType: "long", fabric: "knit", season: ["autumn", "winter"], moodSuitability: ["calm", "focused"] },
      { name: "Beige Linen Shirt", category: "top", subtype: "shirt", fit: "regular", occasion: ["casual", "formal"], color_spectrum: ["light", "beige", "cream"], labels: ["summer", "breathable"], pattern: "solid", sleeveType: "long", fabric: "linen", season: ["summer", "spring"], moodSuitability: ["calm", "happy"] },
      { name: "Sage Green Oversized Tee", category: "top", subtype: "tee", fit: "oversized", occasion: ["casual"], color_spectrum: ["sage", "green", "pastel"], labels: ["gen-z", "streetwear"], pattern: "solid", sleeveType: "short", fabric: "cotton", season: ["summer", "spring"], moodSuitability: ["calm", "happy", "stressed"] },
      { name: "Dark Indigo Jeans", category: "bottom", subtype: "jeans", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "blue"], labels: ["everyday"], pattern: "solid", fabric: "denim", season: ["all-season"], moodSuitability: ["calm", "focused"] },
      { name: "Khaki Chinos", category: "bottom", subtype: "chinos", fit: "regular", occasion: ["casual", "formal"], color_spectrum: ["light", "beige"], labels: ["smart casual"], pattern: "solid", fabric: "cotton", season: ["spring", "summer", "autumn"], moodSuitability: ["focused", "calm"] },
      { name: "Black Slim Trousers", category: "bottom", subtype: "trousers", fit: "slim", occasion: ["formal"], color_spectrum: ["dark", "black", "monochrome"], labels: ["office", "formal"], pattern: "solid", fabric: "wool", season: ["all-season"], moodSuitability: ["confident", "focused"] },
      { name: "Stone Grey Joggers", category: "bottom", subtype: "joggers", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "grey"], labels: ["lounge", "comfort"], pattern: "solid", fabric: "jersey", season: ["all-season"], moodSuitability: ["stressed", "sad", "calm"] },
      { name: "Olive Cargo Pants", category: "bottom", subtype: "cargo", fit: "wide", occasion: ["casual"], color_spectrum: ["dark", "olive", "green"], labels: ["streetwear", "gen-z"], pattern: "solid", fabric: "cotton", season: ["autumn", "spring"], moodSuitability: ["calm", "confident"] },
      { name: "Bold Print Bomber Jacket", category: "layer", subtype: "bomber", fit: "regular", occasion: ["casual", "party"], color_spectrum: ["bold", "bright", "printed"], labels: ["statement", "party"], pattern: "graphic", fabric: "nylon", season: ["autumn", "spring"], moodSuitability: ["excited", "happy"] },
      { name: "Charcoal Wool Overcoat", category: "layer", subtype: "overcoat", fit: "regular", occasion: ["formal"], color_spectrum: ["dark", "grey", "monochrome", "charcoal"], labels: ["winter", "formal"], pattern: "solid", fabric: "wool", season: ["winter"], moodSuitability: ["confident", "focused", "sad"] },
      { name: "Tan Suede Trucker", category: "layer", subtype: "trucker", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "beige", "brown"], labels: ["autumn", "layering"], pattern: "solid", fabric: "suede", season: ["autumn", "spring"], moodSuitability: ["calm", "confident"] },
      { name: "Black Leather Biker", category: "layer", subtype: "biker", fit: "slim", occasion: ["party", "casual"], color_spectrum: ["dark", "black", "bold"], labels: ["edgy", "night out"], pattern: "solid", fabric: "leather", season: ["all-season"], moodSuitability: ["confident", "excited"] },
      { name: "All Black Sneakers", category: "footwear", subtype: "sneakers", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "black", "monochrome"], labels: ["everyday"], pattern: "solid", fabric: "leather", season: ["all-season"], moodSuitability: ["calm", "focused"] },
      { name: "White Canvas Sneakers", category: "footwear", subtype: "sneakers", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "white"], labels: ["clean", "minimal"], pattern: "solid", fabric: "canvas", season: ["summer", "spring"], moodSuitability: ["happy", "calm"] },
      { name: "Matte Black Watch", category: "accessory", subtype: "watch", fit: "", occasion: ["formal", "casual"], color_spectrum: ["dark", "black", "monochrome"], labels: ["daily wear"], pattern: "solid", fabric: "metal", season: ["all-season"], moodSuitability: ["confident", "focused"] },
      { name: "Beige Canvas Cap", category: "accessory", subtype: "cap", fit: "", occasion: ["casual"], color_spectrum: ["light", "beige", "cream"], labels: ["streetwear"], pattern: "solid", fabric: "canvas", season: ["summer", "spring"], moodSuitability: ["happy", "calm"] },
    ];

    const femaleItems = [
      { name: "Blush Pink Silk Blouse", category: "top", subtype: "blouse", fit: "regular", occasion: ["formal", "party"], color_spectrum: ["pastel", "pink", "light"], labels: ["elegant", "date night"], pattern: "solid", sleeveType: "long", fabric: "silk", season: ["spring", "summer"], moodSuitability: ["romantic", "happy", "calm"] },
      { name: "Lemon Yellow Crop Top", category: "top", subtype: "crop", fit: "cropped", occasion: ["casual", "party"], color_spectrum: ["bright", "yellow"], labels: ["summer", "fun"], pattern: "solid", sleeveType: "sleeveless", fabric: "cotton", season: ["summer"], moodSuitability: ["happy", "excited"] },
      { name: "Black Turtleneck", category: "top", subtype: "turtleneck", fit: "regular", occasion: ["formal", "casual"], color_spectrum: ["dark", "black", "monochrome"], labels: ["classic", "layering"], pattern: "solid", sleeveType: "long", fabric: "knit", season: ["autumn", "winter"], moodSuitability: ["confident", "focused", "sad"] },
      { name: "Ivory Knit Sweater", category: "top", subtype: "sweater", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "white", "beige", "cream"], labels: ["cozy", "autumn"], pattern: "solid", sleeveType: "long", fabric: "knit", season: ["autumn", "winter"], moodSuitability: ["calm", "sad", "stressed"] },
      { name: "Lavender Pastel Tee", category: "top", subtype: "tee", fit: "oversized", occasion: ["casual"], color_spectrum: ["pastel", "light", "lavender"], labels: ["gen-z", "soft"], pattern: "solid", sleeveType: "short", fabric: "cotton", season: ["summer", "spring"], moodSuitability: ["calm", "happy"] },
      { name: "Sage Ribbed Tank", category: "top", subtype: "tank", fit: "regular", occasion: ["casual"], color_spectrum: ["sage", "green", "pastel"], labels: ["summer", "minimal"], pattern: "solid", sleeveType: "sleeveless", fabric: "cotton", season: ["summer"], moodSuitability: ["calm", "happy", "stressed"] },
      { name: "White Wide-Leg Trousers", category: "bottom", subtype: "trousers", fit: "wide", occasion: ["formal", "casual"], color_spectrum: ["light", "white"], labels: ["elegant", "summer"], pattern: "solid", fabric: "linen", season: ["summer", "spring"], moodSuitability: ["calm", "focused", "confident"] },
      { name: "Beige Pleated Skirt", category: "bottom", subtype: "skirt", fit: "regular", occasion: ["casual", "formal"], color_spectrum: ["light", "beige", "pastel", "cream"], labels: ["feminine", "classic"], pattern: "solid", fabric: "polyester", season: ["spring", "summer"], moodSuitability: ["romantic", "happy", "calm"] },
      { name: "Black Leather Pants", category: "bottom", subtype: "pants", fit: "slim", occasion: ["party"], color_spectrum: ["dark", "black", "monochrome"], labels: ["edgy", "night out"], pattern: "solid", fabric: "leather", season: ["autumn", "winter"], moodSuitability: ["confident", "excited"] },
      { name: "Dark Navy Straight Jeans", category: "bottom", subtype: "jeans", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "blue", "navy"], labels: ["everyday"], pattern: "solid", fabric: "denim", season: ["all-season"], moodSuitability: ["calm", "focused"] },
      { name: "Pastel Blazer", category: "layer", subtype: "blazer", fit: "regular", occasion: ["formal", "party"], color_spectrum: ["pastel", "pink", "light"], labels: ["chic", "spring"], pattern: "solid", fabric: "cotton", season: ["spring"], moodSuitability: ["confident", "focused", "romantic"] },
      { name: "Black Wool Coat", category: "layer", subtype: "coat", fit: "regular", occasion: ["formal", "casual"], color_spectrum: ["dark", "black", "monochrome"], labels: ["winter", "classic"], pattern: "solid", fabric: "wool", season: ["winter"], moodSuitability: ["confident", "focused", "sad"] },
      { name: "Bright Floral Kimono", category: "layer", subtype: "kimono", fit: "oversized", occasion: ["casual", "party"], color_spectrum: ["bright", "bold", "printed"], labels: ["bohemian", "summer"], pattern: "floral", fabric: "silk", season: ["summer"], moodSuitability: ["happy", "excited"] },
      { name: "Cream Cashmere Wrap", category: "layer", subtype: "wrap", fit: "oversized", occasion: ["casual"], color_spectrum: ["light", "beige", "white", "cream"], labels: ["cozy", "luxury"], pattern: "solid", fabric: "cashmere", season: ["winter"], moodSuitability: ["calm", "sad", "stressed"] },
      { name: "White Minimal Sneakers", category: "footwear", subtype: "sneakers", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "white"], labels: ["clean", "everyday"], pattern: "solid", fabric: "leather", season: ["all-season"], moodSuitability: ["calm", "happy"] },
      { name: "Black Ankle Boots", category: "footwear", subtype: "boots", fit: "regular", occasion: ["formal", "party"], color_spectrum: ["dark", "black"], labels: ["edgy", "autumn"], pattern: "solid", fabric: "leather", season: ["autumn", "winter"], moodSuitability: ["confident", "excited"] },
      { name: "Gold Pendant Necklace", category: "accessory", subtype: "necklace", fit: "", occasion: ["party", "formal"], color_spectrum: ["bright", "yellow"], labels: ["statement", "elegant"], pattern: "solid", fabric: "metal", season: ["all-season"], moodSuitability: ["romantic", "excited"] },
      { name: "Black Statement Bag", category: "accessory", subtype: "bag", fit: "", occasion: ["formal", "party"], color_spectrum: ["dark", "black"], labels: ["classic", "everyday"], pattern: "solid", fabric: "leather", season: ["all-season"], moodSuitability: ["confident", "focused"] },
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`[Seed] Created user: ${user.username} (${user.gender})`);

      const items = user.gender === "Male" ? maleItems : femaleItems;
      for (const itemData of items) {
        const item = new ClothingItem({ ...itemData, user_id: user._id });
        await item.save();

        // Upsert to Qdrant
        const qdrantId = await qdrant.upsertItem(item);
        if (qdrantId) {
          item.qdrant_id = qdrantId;
          item.sync_status = "synced";
          await item.save();
        }
      }
      console.log(`[Seed] Inserted ${items.length} items for ${user.username}`);
    }

    console.log("[Seed] Auto-seed complete!");
    console.log("  Users: test_male / pass123, test_female / pass123, new_user / pass123");
  }
}

// ── Frontend Production Serving ─────────────────────────────────────
const frontendPath = path.join(__dirname, "..", "frontendfinalprolly");
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  // Any route not caught by API goes to index.html (client-side routing fallback)
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// ── Start Server ────────────────────────────────────────────────────
async function start() {
  checkEnvVars();
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[Server] Connected to MongoDB at ${MONGO_URI}`);

    // Initialize Qdrant
    await qdrant.initQdrant();
    qdrant.startAutoRecovery();
    
    // Start Cloudinary Auto-Recovery
    cloudinary.startCloudRecovery();

    // Auto-seed if empty
    await autoSeed();

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  AffectSync Backend running on :${PORT}`);
      console.log(`  MongoDB: ${MONGO_URI}`);
      console.log(`  Health: http://localhost:${PORT}/api/health`);
      console.log(`========================================\n`);
    });
  } catch (err) {
    console.error("[Server] Failed to start:", err.message);
    process.exit(1);
  }
}

start();
