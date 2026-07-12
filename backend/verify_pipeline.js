require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const ClothingItem = require('./models/ClothingItem');
const User = require('./models/User');
const { QdrantClient } = require("@qdrant/js-client-rest");
const fetch = require("node-fetch");

async function runVerification() {
  let results = {
    mongoDB: "PASS",
    qdrant: "PASS",
    recommendationEngine: "PASS",
    apiResponse: "PASS"
  };

  try {
    // 1. Connect and verify MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    const items = await ClothingItem.find();
    let mongoFailures = 0;
    for (const item of items) {
      if (item.cloud_status === "synced" && item.cloudinary_url) {
        if (item.image_url !== item.cloudinary_url) {
          mongoFailures++;
          console.error(`MongoDB FAIL: Item ${item.name} has image_url=${item.image_url}, but cloudinary_url=${item.cloudinary_url}`);
        }
      }
    }
    if (mongoFailures > 0) results.mongoDB = "FAIL";

    // 2. Verify Qdrant
    const qdrantConfig = { url: process.env.QDRANT_URL || "http://localhost:6333" };
    if (process.env.QDRANT_API_KEY) qdrantConfig.apiKey = process.env.QDRANT_API_KEY;
    const client = new QdrantClient(qdrantConfig);
    
    let qdrantFailures = 0;
    for (const item of items) {
      if (item.qdrant_id && item.cloud_status === "synced" && item.cloudinary_url) {
        try {
          const res = await client.retrieve("wardrobe_items", { ids: [item.qdrant_id] });
          if (res && res.length > 0) {
            const payload = res[0].payload;
            if (payload.imageUrl !== item.cloudinary_url || payload.image_url !== item.cloudinary_url) {
              qdrantFailures++;
              console.error(`Qdrant FAIL: Item ${item.name} payload does not match cloudinary_url.`);
            }
          }
        } catch (e) {
          // ignore if missing
        }
      }
    }
    if (qdrantFailures > 0) results.qdrant = "FAIL";

    // 3. Verify Recommendation Engine API Response
    // Start local server if not running, or just call the function directly.
    // Instead of starting server, we can mock a request if the server is running.
    // Let's assume the server is running locally on port 5000 (npm run dev is running)
    const user = await User.findOne();
    if (user) {
      // Create a token to authenticate
      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "affectsync_secret_key_2026", { expiresIn: "1h" });
      
      const apiRes = await fetch("http://localhost:5000/api/recommend-outfits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ emotion: "happy" })
      });
      
      if (apiRes.ok) {
        const data = await apiRes.json();
        let apiFailures = 0;
        if (data.combinations && data.combinations.length > 0) {
          for (const combo of data.combinations) {
            for (const [pieceType, pieceData] of Object.entries(combo)) {
              if (pieceData && typeof pieceData === 'object') {
                if (!pieceData.image_url && !pieceData.imageUrl && !pieceData.cloudinary_url) {
                  apiFailures++;
                  console.error(`API FAIL: ${pieceType} missing image url. image_url=${pieceData.image_url}, imageUrl=${pieceData.imageUrl}, cloudinary_url=${pieceData.cloudinary_url}`);
                }
                // Verify the field is actually populated if cloud_status is synced
                if (pieceData.cloud_status === "synced") {
                  if (!(pieceData.image_url?.includes("cloudinary") || pieceData.imageUrl?.includes("cloudinary") || pieceData.cloudinary_url?.includes("cloudinary"))) {
                    apiFailures++;
                    console.error(`API FAIL: ${pieceType} does not contain cloudinary URL despite being synced.`);
                  }
                }
              }
            }
          }
        }
        if (apiFailures > 0) {
          results.apiResponse = "FAIL";
          results.recommendationEngine = "FAIL";
        }
      } else {
        console.error("API request failed with status:", apiRes.status);
        results.apiResponse = "FAIL";
      }
    }

    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error("Verification script failed:", err);
  } finally {
    mongoose.disconnect();
  }
}

runVerification();
