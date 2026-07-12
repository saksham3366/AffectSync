const express = require("express");
const ClothingItem = require("../models/ClothingItem");
const User = require("../models/User");
const MoodLog = require("../models/MoodLog");
const { authMiddleware } = require("../middleware/auth");
const qdrant = require("../services/qdrant");
const { getWeather } = require("../services/weather");

const router = express.Router();

// ── Color Harmony Rules from styling-logic.md ────────────────────────
const HARMONIOUS_COMBOS = [
  ["sage", "brown"], ["green", "brown"], ["sage", "grey"],
  ["blue", "red"], ["blue", "orange"],
  ["lavender", "olive"], ["lilac", "olive"],
  ["yellow", "grey"],
  ["pink", "navy"], ["pink", "blue"],
  ["mint", "red"], ["mint", "brown"],
  ["cream", "blue"], ["cream", "tan"], ["cream", "beige"],
  ["beige", "brown"], ["sand", "brown"], ["beige", "sage"], ["sand", "sage"],
  ["beige", "blue"], ["sand", "blue"], ["beige", "black"], ["sand", "black"],
  ["black", "sage"], ["black", "olive"], ["black", "yellow"], ["black", "grey"], ["black", "white"], ["black", "mint"], ["black", "pink"],
  ["white", "lilac"], ["white", "lavender"], ["white", "navy"], ["white", "sage"], ["white", "orange"], ["white", "red"],
  ["blue", "cream"], ["blue", "sage"], ["blue", "grey"],
  ["pink", "sage"], ["pink", "cream"], ["pink", "grey"],
];

function checkColorHarmony(color1, color2) {
  if (!color1 || !color2) return 0;
  
  const c1 = color1.toLowerCase();
  const c2 = color2.toLowerCase();
  
  if (c1 === c2) {
    return 0.8; // Monochrome look
  }
  
  for (const pair of HARMONIOUS_COMBOS) {
    if ((pair[0] === c1 && pair[1] === c2) || (pair[0] === c2 && pair[1] === c1)) {
      return 1.2; // Premium harmonized combo
    }
  }
  
  const neutrals = ["white", "black", "grey", "cream", "beige", "sand", "charcoal", "brown"];
  const isC1Neutral = neutrals.includes(c1);
  const isC2Neutral = neutrals.includes(c2);
  
  if (isC1Neutral && isC2Neutral) {
    return 1.0; // Clean neutral mix
  }
  if (isC1Neutral || isC2Neutral) {
    return 0.9; // Neutral + pop
  }
  
  return 0.5; // Default / unharmonized
}

function checkFootwearHarmony(topCol, botCol, fColor) {
  if (!fColor) return 0;
  const c = fColor.toLowerCase();
  const outfitColors = [topCol.toLowerCase(), botCol.toLowerCase()];
  
  if (['black', 'white', 'grey'].includes(c)) return 1.0;
  
  const hasWarm = outfitColors.some(col => ['brown', 'beige', 'cream', 'olive', 'mustard', 'terracotta'].includes(col));
  const hasCool = outfitColors.some(col => ['navy', 'blue', 'denim', 'charcoal', 'silver'].includes(col));

  if (c === 'beige' || c === 'brown') {
    if (hasWarm || outfitColors.includes('navy') || outfitColors.includes('denim')) return 1.0;
    return 0.6;
  }
  if (c === 'silver') {
    if (outfitColors.includes('brown') || outfitColors.includes('beige') || outfitColors.includes('olive')) return -1.0; 
    if (hasCool || outfitColors.includes('black') || outfitColors.includes('white')) return 1.2;
    return 0.5;
  }
  if (c === 'gold') {
    if (hasWarm || outfitColors.includes('maroon')) return 1.2;
    return 0.5;
  }
  
  return 0.7; // default
}

// ── Silhouette proportion play ───────────────────────────────────────
function getSilhouetteScore(topFit, bottomFit) {
  const t = (topFit || "regular").toLowerCase();
  const b = (bottomFit || "regular").toLowerCase();
  
  const isTopOversized = ["oversized", "relaxed", "baggy"].includes(t);
  const isTopFitted = ["slim", "fitted", "cropped"].includes(t);
  const isBottomOversized = ["wide", "relaxed", "baggy", "oversized"].includes(b);
  const isBottomFitted = ["slim", "tapered", "fitted"].includes(b);
  
  if (isTopOversized && isBottomFitted) return 1.2;
  if (isTopFitted && isBottomOversized) return 1.2;
  if (t === "regular" && b === "regular") return 1.0;
  if (isTopOversized && isBottomOversized) return 0.6; // Avoid baggy-on-baggy
  if (isTopFitted && isBottomFitted) return 0.7;
  
  return 0.9;
}

// ── Mood Styles from styling-logic.md ────────────────────────────────
const MOOD_STYLES = {
  happy: { colors: ["yellow", "mint", "peach", "bright", "pastel"], fits: ["relaxed", "regular"] },
  calm: { colors: ["sage", "lavender", "cream", "sand", "white"], fits: ["oversized", "relaxed", "wide"] },
  confident: { colors: ["black", "brown", "charcoal", "bold", "dark"], fits: ["regular", "slim"] },
  romantic: { colors: ["pink", "lilac", "cream", "navy", "pastel"], fits: ["regular", "slim", "cropped"] },
  sad: { colors: ["blue", "grey", "charcoal", "brown", "dark", "black"], fits: ["oversized", "relaxed"] },
  excited: { colors: ["bright", "bold", "yellow", "red", "blue", "printed"], fits: ["regular", "oversized"] },
  stressed: { colors: ["sage", "mint", "lavender", "cream", "sand"], fits: ["oversized", "relaxed", "wide"] },
  focused: { colors: ["charcoal", "navy", "olive", "grey", "dark"], fits: ["regular", "slim"] },
};

/**
 * MongoDB Fallback queries.
 */
async function queryItemsFallback(userId, category, excludeIds, limit = 15) {
  const query = { user_id: userId, category };
  if (excludeIds && excludeIds.length > 0) {
    query._id = { $nin: excludeIds };
  }
  const items = await ClothingItem.find(query).limit(limit).lean();
  return items.map(item => ({
    ...item,
    mongoId: item._id.toString(),
    colors: item.color_spectrum || [],
    image_url: item.cloudinary_url || item.image_url,
    imageUrl: item.cloudinary_url || item.image_url,
  }));
}

// POST /api/recommend-outfits
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { emotion, exclude_ids, city, lat, lon } = req.body;
    const userId = req.user.id;

    if (!emotion) {
      return res.status(400).json({
        success: false,
        message: "emotion is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const gender = user.gender;
    const moodKey = emotion.toLowerCase();
    const excludeIds = exclude_ids || [];

    // Fetch Weather
    let weatherType = null;
    let weatherData = null;
    if (city || (lat && lon)) {
      weatherData = await getWeather(city, lat, lon);
      if (weatherData) weatherType = weatherData.type;
    }

    // Retrieve candidates from Qdrant first, fall back to MongoDB if empty
    let tops = [];
    let bottoms = [];
    let layers = [];
    let footwear = [];
    let accessories = [];

    if (qdrant.isConnected()) {
      tops = await qdrant.searchOutfit(moodKey, gender, userId, "top", excludeIds, 15);
      bottoms = await qdrant.searchOutfit(moodKey, gender, userId, "bottom", excludeIds, 15);
      layers = await qdrant.searchOutfit(moodKey, gender, userId, "layer", excludeIds, 15);
      footwear = await qdrant.searchOutfit(moodKey, gender, userId, "footwear", excludeIds, 15);
      accessories = await qdrant.searchOutfit(moodKey, gender, userId, "accessory", excludeIds, 15);
    }

    if (tops.length === 0) tops = await queryItemsFallback(userId, "top", excludeIds, 15);
    if (bottoms.length === 0) bottoms = await queryItemsFallback(userId, "bottom", excludeIds, 15);
    if (layers.length === 0) layers = await queryItemsFallback(userId, "layer", excludeIds, 15);
    if (footwear.length === 0) footwear = await queryItemsFallback(userId, "footwear", excludeIds, 15);
    if (accessories.length === 0) accessories = await queryItemsFallback(userId, "accessory", excludeIds, 15);

    // Retrieve recently worn outfits to penalize repetition
    const recentLogs = await MoodLog.find({ userId }).sort({ timestamp: -1 }).limit(10).lean();
    const recentlyWornIds = new Set();
    recentLogs.forEach(log => {
      if (log.wornItemIds) {
        log.wornItemIds.forEach(id => recentlyWornIds.add(id.toString()));
      }
    });

    // Build combinations
    const combos = [];
    for (let t of tops) {
      for (let b of bottoms) {
        const layerPool = [null, ...layers];
        const footwearPool = [null, ...footwear];
        const accessoryPool = [null, ...accessories];
        
        for (let l of layerPool.slice(0, 5)) {
          for (let f of footwearPool.slice(0, 5)) {
            for (let a of accessoryPool.slice(0, 5)) {
              combos.push({ top: t, bottom: b, layer: l, footwear: f, accessory: a });
            }
          }
        }
      }
    }

    // Score combinations
    const scored = combos.map(combo => {
      let score = 0;
      
      // 1. Semantic base score
      score += (combo.top.score || 0.5) + (combo.bottom.score || 0.5);
      if (combo.layer) score += (combo.layer.score || 0.5) * 0.5;

      // Ensure vector score doesn't overpower everything by reducing its weight for accessories/footwear
      if (combo.footwear) score += (combo.footwear.score || 0.5) * 0.2; 
      if (combo.accessory) score += (combo.accessory.score || 0.5) * 0.15;

      // Bonus for completeness
      if (combo.footwear) score += 0.6;
      if (combo.accessory) score += 0.4;

      // 2. Color harmony
      const topCol = combo.top.colors?.[0] || "";
      const botCol = combo.bottom.colors?.[0] || "";
      score += checkColorHarmony(topCol, botCol) * 1.5;

      if (combo.layer) {
        const layCol = combo.layer.colors?.[0] || "";
        score += checkColorHarmony(topCol, layCol) * 0.8;
        score += checkColorHarmony(botCol, layCol) * 0.8;
      }

      // Footwear Advanced Color Harmony
      if (combo.footwear) {
        const fCol = combo.footwear.colors?.[0] || "";
        score += checkFootwearHarmony(topCol, botCol, fCol) * 1.2;
      }

      // 3. Silhouette balance
      score += getSilhouetteScore(combo.top.fit, combo.bottom.fit) * 1.2;

      // 4. Mood suitability
      const moodStyle = MOOD_STYLES[moodKey];
      if (moodStyle) {
        if (combo.top.colors?.some(c => moodStyle.colors.includes(c))) score += 0.4;
        if (moodStyle.fits.includes(combo.top.fit)) score += 0.2;
        if (moodStyle.fits.includes(combo.bottom.fit)) score += 0.2;
      }
      if (combo.top.moodSuitability?.includes(moodKey)) score += 0.5;
      if (combo.bottom.moodSuitability?.includes(moodKey)) score += 0.5;

      // 5. Weather suitability
      if (weatherType) {
        if (weatherType === "HOT") {
          // Penalize layers and heavy fabrics in hot weather
          if (combo.layer) score -= 1.0; 
          if (combo.top.colors?.some(c => ['black', 'charcoal'].includes(c))) score -= 0.5;
        } else if (weatherType === "COLD") {
          if (!combo.layer) score -= 0.8; // Need a layer in cold
          if (combo.layer) score += 1.0;
        } else if (weatherType === "RAINY") {
          if (combo.footwear?.colors?.some(c => c === 'white')) score -= 0.8; // Avoid white shoes in rain
          if (combo.layer) score += 0.5;
        }
      }

      // 6. Occasion suitability
      const commonOccasions = (combo.top.occasion || []).filter(o => (combo.bottom.occasion || []).includes(o));
      if (commonOccasions.length > 0) score += 0.8;

      // 7. History penalty (Heavy penalization for recently worn accessories/shoes)
      const topId = combo.top._id || combo.top.mongoId;
      const botId = combo.bottom._id || combo.bottom.mongoId;
      if (recentlyWornIds.has(topId)) score -= 1.5;
      if (recentlyWornIds.has(botId)) score -= 1.5;
      
      if (combo.accessory) {
        const accId = combo.accessory._id || combo.accessory.mongoId;
        if (recentlyWornIds.has(accId)) score -= 2.0; // Rotate accessories aggressively
      }
      if (combo.footwear) {
        const ftId = combo.footwear._id || combo.footwear.mongoId;
        if (recentlyWornIds.has(ftId)) score -= 1.0;
      }

      return { combo, score };
    });

    // Sort by styling score descending
    scored.sort((a, b) => b.score - a.score);

    // Take top 3 unique AND diverse outfits
    const finalCombinations = [];
    const seenCombos = new Set();
    const seenTops = new Set();
    const seenBottoms = new Set();
    const seenAccessories = new Set();
    const seenFootwear = new Set();

    for (const item of scored) {
      if (finalCombinations.length >= 3) break;
      
      const topId = item.combo.top._id || item.combo.top.mongoId;
      const botId = item.combo.bottom._id || item.combo.bottom.mongoId;
      const layId = item.combo.layer ? (item.combo.layer._id || item.combo.layer.mongoId) : 'none';
      const ftId = item.combo.footwear ? (item.combo.footwear._id || item.combo.footwear.mongoId) : 'none';
      const accId = item.combo.accessory ? (item.combo.accessory._id || item.combo.accessory.mongoId) : 'none';
      const key = `${topId}-${botId}-${layId}-${ftId}-${accId}`;
      
      if (seenCombos.has(key)) continue;
      
      // Enforce diversity: vary top, bottom, accessory, footwear if possible
      // We allow repetition if they don't have enough clothes, but prioritize variety.
      if (finalCombinations.length > 0) {
        if (seenTops.has(topId) && seenBottoms.has(botId)) continue;
        if (accId !== 'none' && seenAccessories.has(accId) && accessories.length > 2) continue;
        if (ftId !== 'none' && seenFootwear.has(ftId) && footwear.length > 2) continue;
      }
      
      seenCombos.add(key);
      seenTops.add(topId);
      seenBottoms.add(botId);
      seenAccessories.add(accId);
      seenFootwear.add(ftId);
      
      // Format to expected frontend schema
      const cleanCombo = {
        top: item.combo.top,
        bottom: item.combo.bottom,
      };
      if (item.combo.layer) cleanCombo.layer = item.combo.layer;
      if (item.combo.footwear) cleanCombo.footwear = item.combo.footwear;
      if (item.combo.accessory) cleanCombo.accessory = item.combo.accessory;
      
      finalCombinations.push(cleanCombo);
    }

    // Log the worn recommendation to update history
    if (finalCombinations.length > 0) {
      const topCombo = finalCombinations[0];
      const wornIds = [];
      if (topCombo.top) wornIds.push(topCombo.top._id || topCombo.top.mongoId);
      if (topCombo.bottom) wornIds.push(topCombo.bottom._id || topCombo.bottom.mongoId);
      if (topCombo.layer) wornIds.push(topCombo.layer._id || topCombo.layer.mongoId);
      if (topCombo.footwear) wornIds.push(topCombo.footwear._id || topCombo.footwear.mongoId);
      if (topCombo.accessory) wornIds.push(topCombo.accessory._id || topCombo.accessory.mongoId);

      // Create a log entry
      const log = new MoodLog({
        userId,
        detectedMood: moodKey,
        rawEmotion: emotion,
        confidence: 1.0,
        wornItemIds: wornIds,
        weather: weatherData ? {
          type: weatherData.type,
          temp: weatherData.temp,
          condition: weatherData.condition
        } : null
      });
      await log.save();
    }

    res.json({
      success: true,
      mood: moodKey,
      gender,
      weather: weatherData,
      combinations: finalCombinations,
      pool_sizes: {
        tops: tops.length,
        bottoms: bottoms.length,
        layers: layers.length,
      },
    });

  } catch (err) {
    console.error("[Recommend] Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
