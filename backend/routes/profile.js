const express = require("express");
const User = require("../models/User");
const ClothingItem = require("../models/ClothingItem");
const MoodLog = require("../models/MoodLog");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// GET /api/profile — Get current user's full profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: user.toProfile() });
  } catch (err) {
    console.error("[Profile] Fetch error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/profile — Update profile fields
router.put("/", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "height", "weight", "bodyType", "skinTone", "hairType",
      "stylePersonality", "fitPreference", "colorPreference", "fabricPreference",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(`[Profile] Updated profile for ${user.username}`);

    res.json({ success: true, user: user.toProfile() });
  } catch (err) {
    console.error("[Profile] Update error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/profile/stats — Dashboard stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [itemCount, moodLogs, user] = await Promise.all([
      ClothingItem.countDocuments({ user_id: userId }),
      MoodLog.find({ userId }).sort({ timestamp: -1 }).limit(100).lean(),
      User.findById(userId).lean(),
    ]);

    // Count distinct outfits served
    const outfitCount = moodLogs.filter((l) => l.outfitServed && l.outfitServed.length > 0).length;

    // Days active (since account creation)
    const createdAt = user?.createdAt || new Date();
    const daysActive = Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / 86400000));

    // Mood distribution from logs
    const moodCounts = {};
    moodLogs.forEach((l) => {
      moodCounts[l.detectedMood] = (moodCounts[l.detectedMood] || 0) + 1;
    });

    // Convert to percentages
    const totalMoods = moodLogs.length || 1;
    const moodDistribution = {};
    Object.entries(moodCounts).forEach(([mood, count]) => {
      moodDistribution[mood] = Math.round((count / totalMoods) * 100);
    });

    res.json({
      success: true,
      stats: {
        itemCount,
        outfitCount,
        favoriteCount: 0,  // favorites are stored client-side for now
        daysActive,
        moodDistribution,
        recentMoods: moodLogs.slice(0, 10).map((l) => ({
          mood: l.detectedMood,
          confidence: l.confidence,
          timestamp: l.timestamp,
        })),
      },
    });
  } catch (err) {
    console.error("[Profile] Stats error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
