const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const {
      username, password, gender,
      height, weight, bodyType, skinTone, hairType,
      stylePersonality, fitPreference, colorPreference, fabricPreference,
    } = req.body;

    if (!username || !password || !gender) {
      return res.status(400).json({
        success: false,
        message: "username, password, and gender are required",
      });
    }

    if (!["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "gender must be 'Male' or 'Female'",
      });
    }

    // Check if user already exists
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const user = new User({
      username, password, gender,
      height: height || null,
      weight: weight || null,
      bodyType: bodyType || "Average",
      skinTone: skinTone || "Medium",
      hairType: hairType || "Straight",
      stylePersonality: stylePersonality || "Minimal",
      fitPreference: fitPreference || "Regular",
      colorPreference: colorPreference || [],
      fabricPreference: fabricPreference || [],
    });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, gender: user.gender },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`[Auth] Registered new user: ${user.username} (${user.gender})`);

    res.status(201).json({
      success: true,
      token,
      user: user.toProfile(),
    });
  } catch (err) {
    console.error("[Auth] Register error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username and password are required",
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, gender: user.gender },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`[Auth] User '${user.username}' logged in successfully`);

    res.json({
      success: true,
      token,
      user: user.toProfile(),
    });
  } catch (err) {
    console.error("[Auth] Login error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
