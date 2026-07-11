/**
 * AffectSync Database Seeder (Standalone)
 * Creates dummy users and clothing items for testing.
 * Run: node seed.js  (or npm run seed from root)
 * 
 * Note: server.js auto-seeds on first run too.
 * This script does a clean re-seed (drops existing data).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const ClothingItem = require("./models/ClothingItem");
const MoodLog = require("./models/MoodLog");
const OutfitFormula = require("./models/OutfitFormula");
const ColorCombo = require("./models/ColorCombo");
const qdrant = require("./services/qdrant");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/affectsync";

const USERS = [
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

function getItems(userId, gender) {
  if (gender === "Male") {
    return [
      { user_id: userId, name: "White Oxford Shirt", category: "top", subtype: "shirt", fit: "regular", occasion: ["formal", "casual"], color_spectrum: ["light", "white"], labels: ["office", "smart casual"], pattern: "solid", sleeveType: "long", fabric: "cotton", season: ["spring", "autumn", "winter"], moodSuitability: ["focused", "confident", "calm"] },
      { user_id: userId, name: "Sunshine Yellow Polo", category: "top", subtype: "polo", fit: "regular", occasion: ["casual"], color_spectrum: ["bright", "yellow"], labels: ["weekend", "summer"], pattern: "solid", sleeveType: "short", fabric: "cotton", season: ["summer"], moodSuitability: ["happy", "excited"] },
      { user_id: userId, name: "Charcoal Crew Tee", category: "top", subtype: "tee", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "grey", "monochrome"], labels: ["everyday"], pattern: "solid", sleeveType: "short", fabric: "cotton", season: ["summer", "spring"], moodSuitability: ["calm", "sad", "stressed"] },
      { user_id: userId, name: "Navy Blue Henley", category: "top", subtype: "henley", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "blue", "navy"], labels: ["layering"], pattern: "solid", sleeveType: "long", fabric: "knit", season: ["autumn", "winter"], moodSuitability: ["calm", "focused"] },
      { user_id: userId, name: "Beige Linen Shirt", category: "top", subtype: "shirt", fit: "regular", occasion: ["casual", "formal"], color_spectrum: ["light", "beige", "cream"], labels: ["summer"], pattern: "solid", sleeveType: "long", fabric: "linen", season: ["summer", "spring"], moodSuitability: ["calm", "happy"] },
      { user_id: userId, name: "Sage Green Oversized Tee", category: "top", subtype: "tee", fit: "oversized", occasion: ["casual"], color_spectrum: ["sage", "green", "pastel"], labels: ["gen-z", "streetwear"], pattern: "solid", sleeveType: "short", fabric: "cotton", season: ["summer", "spring"], moodSuitability: ["calm", "happy", "stressed"] },
      { user_id: userId, name: "Dark Indigo Jeans", category: "bottom", subtype: "jeans", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "blue"], labels: ["everyday"], pattern: "solid", fabric: "denim", season: ["all-season"], moodSuitability: ["calm", "focused"] },
      { user_id: userId, name: "Khaki Chinos", category: "bottom", subtype: "chinos", fit: "regular", occasion: ["casual", "formal"], color_spectrum: ["light", "beige"], labels: ["smart casual"], pattern: "solid", fabric: "cotton", season: ["spring", "summer", "autumn"], moodSuitability: ["focused", "calm"] },
      { user_id: userId, name: "Black Slim Trousers", category: "bottom", subtype: "trousers", fit: "slim", occasion: ["formal"], color_spectrum: ["dark", "black", "monochrome"], labels: ["office", "formal"], pattern: "solid", fabric: "wool", season: ["all-season"], moodSuitability: ["confident", "focused"] },
      { user_id: userId, name: "Stone Grey Joggers", category: "bottom", subtype: "joggers", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "grey"], labels: ["lounge"], pattern: "solid", fabric: "jersey", season: ["all-season"], moodSuitability: ["stressed", "sad", "calm"] },
      { user_id: userId, name: "Olive Cargo Pants", category: "bottom", subtype: "cargo", fit: "wide", occasion: ["casual"], color_spectrum: ["dark", "olive", "green"], labels: ["streetwear"], pattern: "solid", fabric: "cotton", season: ["autumn", "spring"], moodSuitability: ["calm", "confident"] },
      { user_id: userId, name: "Bold Print Bomber Jacket", category: "layer", subtype: "bomber", fit: "regular", occasion: ["casual", "party"], color_spectrum: ["bold", "bright", "printed"], labels: ["statement"], pattern: "graphic", fabric: "nylon", season: ["autumn", "spring"], moodSuitability: ["excited", "happy"] },
      { user_id: userId, name: "Charcoal Wool Overcoat", category: "layer", subtype: "overcoat", fit: "regular", occasion: ["formal"], color_spectrum: ["dark", "grey", "monochrome", "charcoal"], labels: ["winter"], pattern: "solid", fabric: "wool", season: ["winter"], moodSuitability: ["confident", "focused", "sad"] },
      { user_id: userId, name: "Tan Suede Trucker", category: "layer", subtype: "trucker", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "beige", "brown"], labels: ["autumn"], pattern: "solid", fabric: "suede", season: ["autumn", "spring"], moodSuitability: ["calm", "confident"] },
      { user_id: userId, name: "All Black Sneakers", category: "footwear", subtype: "sneakers", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "black", "monochrome"], labels: ["everyday"], pattern: "solid", fabric: "leather", season: ["all-season"], moodSuitability: ["calm", "focused"] },
      { user_id: userId, name: "White Canvas Sneakers", category: "footwear", subtype: "sneakers", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "white"], labels: ["clean"], pattern: "solid", fabric: "canvas", season: ["summer", "spring"], moodSuitability: ["happy", "calm"] },
      { user_id: userId, name: "Matte Black Watch", category: "accessory", subtype: "watch", fit: "", occasion: ["formal", "casual"], color_spectrum: ["dark", "black", "monochrome"], labels: ["daily wear"], pattern: "solid", fabric: "metal", season: ["all-season"], moodSuitability: ["confident", "focused"] },
    ];
  } else {
    return [
      { user_id: userId, name: "Blush Pink Silk Blouse", category: "top", subtype: "blouse", fit: "regular", occasion: ["formal", "party"], color_spectrum: ["pastel", "pink", "light"], labels: ["elegant"], pattern: "solid", sleeveType: "long", fabric: "silk", season: ["spring", "summer"], moodSuitability: ["romantic", "happy", "calm"] },
      { user_id: userId, name: "Lemon Yellow Crop Top", category: "top", subtype: "crop", fit: "cropped", occasion: ["casual", "party"], color_spectrum: ["bright", "yellow"], labels: ["summer"], pattern: "solid", sleeveType: "sleeveless", fabric: "cotton", season: ["summer"], moodSuitability: ["happy", "excited"] },
      { user_id: userId, name: "Black Turtleneck", category: "top", subtype: "turtleneck", fit: "regular", occasion: ["formal", "casual"], color_spectrum: ["dark", "black", "monochrome"], labels: ["classic"], pattern: "solid", sleeveType: "long", fabric: "knit", season: ["autumn", "winter"], moodSuitability: ["confident", "focused", "sad"] },
      { user_id: userId, name: "Ivory Knit Sweater", category: "top", subtype: "sweater", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "white", "beige", "cream"], labels: ["cozy"], pattern: "solid", sleeveType: "long", fabric: "knit", season: ["autumn", "winter"], moodSuitability: ["calm", "sad", "stressed"] },
      { user_id: userId, name: "Lavender Pastel Tee", category: "top", subtype: "tee", fit: "oversized", occasion: ["casual"], color_spectrum: ["pastel", "light", "lavender"], labels: ["gen-z"], pattern: "solid", sleeveType: "short", fabric: "cotton", season: ["summer", "spring"], moodSuitability: ["calm", "happy"] },
      { user_id: userId, name: "White Wide-Leg Trousers", category: "bottom", subtype: "trousers", fit: "wide", occasion: ["formal", "casual"], color_spectrum: ["light", "white"], labels: ["elegant"], pattern: "solid", fabric: "linen", season: ["summer", "spring"], moodSuitability: ["calm", "focused", "confident"] },
      { user_id: userId, name: "Beige Pleated Skirt", category: "bottom", subtype: "skirt", fit: "regular", occasion: ["casual", "formal"], color_spectrum: ["light", "beige", "pastel", "cream"], labels: ["feminine"], pattern: "solid", fabric: "polyester", season: ["spring", "summer"], moodSuitability: ["romantic", "happy", "calm"] },
      { user_id: userId, name: "Black Leather Pants", category: "bottom", subtype: "pants", fit: "slim", occasion: ["party"], color_spectrum: ["dark", "black", "monochrome"], labels: ["edgy"], pattern: "solid", fabric: "leather", season: ["autumn", "winter"], moodSuitability: ["confident", "excited"] },
      { user_id: userId, name: "Dark Navy Straight Jeans", category: "bottom", subtype: "jeans", fit: "regular", occasion: ["casual"], color_spectrum: ["dark", "blue", "navy"], labels: ["everyday"], pattern: "solid", fabric: "denim", season: ["all-season"], moodSuitability: ["calm", "focused"] },
      { user_id: userId, name: "Pastel Blazer", category: "layer", subtype: "blazer", fit: "regular", occasion: ["formal", "party"], color_spectrum: ["pastel", "pink", "light"], labels: ["chic"], pattern: "solid", fabric: "cotton", season: ["spring"], moodSuitability: ["confident", "focused", "romantic"] },
      { user_id: userId, name: "Black Wool Coat", category: "layer", subtype: "coat", fit: "regular", occasion: ["formal", "casual"], color_spectrum: ["dark", "black", "monochrome"], labels: ["winter"], pattern: "solid", fabric: "wool", season: ["winter"], moodSuitability: ["confident", "focused", "sad"] },
      { user_id: userId, name: "Bright Floral Kimono", category: "layer", subtype: "kimono", fit: "oversized", occasion: ["casual", "party"], color_spectrum: ["bright", "bold", "printed"], labels: ["bohemian"], pattern: "floral", fabric: "silk", season: ["summer"], moodSuitability: ["happy", "excited"] },
      { user_id: userId, name: "White Minimal Sneakers", category: "footwear", subtype: "sneakers", fit: "regular", occasion: ["casual"], color_spectrum: ["light", "white"], labels: ["everyday"], pattern: "solid", fabric: "leather", season: ["all-season"], moodSuitability: ["calm", "happy"] },
      { user_id: userId, name: "Black Ankle Boots", category: "footwear", subtype: "boots", fit: "regular", occasion: ["formal", "party"], color_spectrum: ["dark", "black"], labels: ["autumn"], pattern: "solid", fabric: "leather", season: ["autumn", "winter"], moodSuitability: ["confident", "excited"] },
      { user_id: userId, name: "Gold Pendant Necklace", category: "accessory", subtype: "necklace", fit: "", occasion: ["party", "formal"], color_spectrum: ["bright", "yellow"], labels: ["statement"], pattern: "solid", fabric: "metal", season: ["all-season"], moodSuitability: ["romantic", "excited"] },
    ];
  }
}

// Color combos from styling-logic.md
const COLOR_COMBOS = [
  { baseColor: { name: "Sage Green", hex: "#B7C4A8" }, pairColor: { name: "Chocolate Brown", hex: "#3D2B1F" }, relationship: "neutral+pop", genders: ["men", "women", "unisex"], moodTags: ["calm", "focused"], styleTags: ["earthy", "elevated-streetwear", "gen-z"] },
  { baseColor: { name: "Baby Blue", hex: "#AFCBE3" }, pairColor: { name: "Burnt Orange", hex: "#CC5500" }, relationship: "complementary", genders: ["men", "women"], moodTags: ["confident", "excited"], styleTags: ["high-contrast", "statement"] },
  { baseColor: { name: "Lavender", hex: "#D9C9E8" }, pairColor: { name: "Olive", hex: "#5A6040" }, relationship: "complementary", genders: ["men", "women", "unisex"], moodTags: ["calm"], styleTags: ["unexpected", "minimal-edge"] },
  { baseColor: { name: "Butter Yellow", hex: "#F5E6A8" }, pairColor: { name: "Grey", hex: "#B4B2A9" }, relationship: "neutral+pop", genders: ["men", "women"], moodTags: ["happy", "calm"], styleTags: ["layering", "soft"] },
  { baseColor: { name: "Blush Pink", hex: "#F2D4D4" }, pairColor: { name: "Navy", hex: "#2C3E6B" }, relationship: "complementary", genders: ["women"], moodTags: ["romantic"], styleTags: ["feminine", "classic"] },
  { baseColor: { name: "Mint", hex: "#C9E4D8" }, pairColor: { name: "Maroon", hex: "#6B2C2C" }, relationship: "complementary", genders: ["men", "women"], moodTags: ["excited"], styleTags: ["bold", "wearable"] },
  { baseColor: { name: "Baby Blue", hex: "#AFCBE3" }, pairColor: { name: "Butter Yellow", hex: "#F5E6A8" }, relationship: "analogous", genders: ["men", "women"], moodTags: ["happy"], styleTags: ["gen-z", "pastel", "y2k"] },
];

// Outfit formulas from styling-logic.md
const FORMULAS = [
  { name: "Cargo Core", gender: "men", pieces: [{ type: "top", item: "Oversized tee", colorHex: "#EDE8DF" }, { type: "bottom", item: "Cargo pants", colorHex: "#B7C4A8" }, { type: "footwear", item: "Chunky sneakers", colorHex: "#FFFFFF" }], moodTags: ["calm", "casual"], silhouette: "baggy-bottom-relaxed-top", fabricNotes: ["cotton", "ripstop"] },
  { name: "Soft Layer", gender: "men", pieces: [{ type: "top", item: "Baby blue shirt", colorHex: "#AFCBE3" }, { type: "bottom", item: "Beige baggy trousers", colorHex: "#D4C5A9" }], moodTags: ["calm", "romantic"], silhouette: "soft-oversized", fabricNotes: ["linen", "cotton"] },
  { name: "Quiet Luxe", gender: "men", pieces: [{ type: "top", item: "Monochrome knitwear", colorHex: "#3D2B1F" }, { type: "bottom", item: "Wide trousers", colorHex: "#D4C5A9" }, { type: "footwear", item: "Loafers", colorHex: "#3D2B1F" }], moodTags: ["confident", "focused"], silhouette: "structured-relaxed", fabricNotes: ["wool", "cotton"] },
  { name: "Coquette Soft", gender: "women", pieces: [{ type: "top", item: "Blush pink baby tee", colorHex: "#F2D4D4" }, { type: "bottom", item: "Light-wash baggy jeans", colorHex: "#AFCBE3" }, { type: "footwear", item: "Ballet flats", colorHex: "#F5F0E8" }], moodTags: ["romantic", "calm"], silhouette: "fitted-top-baggy-bottom", fabricNotes: ["cotton", "denim"] },
  { name: "Clean Girl Pastel", gender: "women", pieces: [{ type: "top", item: "Lavender cropped top", colorHex: "#D9C9E8" }, { type: "bottom", item: "Lavender baggy trousers", colorHex: "#D9C9E8" }, { type: "footwear", item: "White sneakers", colorHex: "#FFFFFF" }], moodTags: ["calm", "focused"], silhouette: "matching-set", fabricNotes: ["cotton", "jersey"] },
  { name: "Y2K Revival", gender: "women", pieces: [{ type: "top", item: "Mint cropped tank", colorHex: "#C9E4D8" }, { type: "bottom", item: "Low-rise baggy cargo", colorHex: "#B4B2A9" }], moodTags: ["excited", "happy"], silhouette: "cropped-top-baggy-bottom", fabricNotes: ["cotton", "ripstop"] },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("[Seed] Connected to MongoDB");

    // Initialize Qdrant
    const qdrantOk = await qdrant.initQdrant();

    // Clear all collections
    await User.deleteMany({});
    await ClothingItem.deleteMany({});
    await MoodLog.deleteMany({});
    await OutfitFormula.deleteMany({});
    await ColorCombo.deleteMany({});
    console.log("[Seed] Cleared all collections");

    // Seed color combos
    await ColorCombo.insertMany(COLOR_COMBOS);
    console.log(`[Seed] Inserted ${COLOR_COMBOS.length} color combos`);

    // Seed outfit formulas
    await OutfitFormula.insertMany(FORMULAS);
    console.log(`[Seed] Inserted ${FORMULAS.length} outfit formulas`);

    // Seed users and items
    for (const userData of USERS) {
      const user = new User(userData);
      await user.save();
      console.log(`[Seed] Created user: ${user.username} (${user.gender})`);

      // Clear Qdrant for this user
      if (qdrantOk) await qdrant.deleteAllForUser(user._id.toString());

      const items = getItems(user._id, user.gender);
      for (const itemData of items) {
        const item = new ClothingItem(itemData);
        await item.save();

        if (qdrantOk) {
          const qdrantId = await qdrant.upsertItem(item);
          if (qdrantId) {
            item.qdrant_id = qdrantId;
            await item.save();
          }
        }
      }
      console.log(`[Seed] Inserted ${items.length} items for ${user.username}`);
    }

    console.log("\n[Seed] Done! Dummy data created successfully.");
    console.log("  Users:");
    console.log("    test_male   / pass123 (Male, Athletic)");
    console.log("    test_female / pass123 (Female, Hourglass)");
    console.log("    new_user    / pass123 (Male, Average, Streetwear)");
    console.log(`  Total clothing items: ${await ClothingItem.countDocuments()}`);
    console.log(`  Color combos: ${await ColorCombo.countDocuments()}`);
    console.log(`  Outfit formulas: ${await OutfitFormula.countDocuments()}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[Seed] Error:", err.message);
    process.exit(1);
  }
}

seed();
