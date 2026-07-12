require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const ClothingItem = require('./models/ClothingItem');
const qdrant = require('./services/qdrant');
const { QdrantClient } = require("@qdrant/js-client-rest");

const REPORT_PATH = path.join(process.env.ARTIFACTS_DIR || __dirname, "IMAGE_REPORT.md");

async function generateEmbedding(text) {
  const fetch = require("node-fetch");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Array(768).fill(0.0);
  }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text }] },
        outputDimensionality: 768
      })
    });
    const json = await res.json();
    return json.embedding.values;
  } catch (err) {
    return new Array(768).fill(0.0);
  }
}

function getItemDescription(item) {
  const category = item.category || "";
  const subtype = item.subtype || "";
  const colors = (item.color_spectrum || []).join(", ");
  const fit = item.fit || "";
  const occasion = (item.occasion || []).join(", ");
  const labels = (item.labels || []).join(", ");
  const pattern = item.pattern || "";
  const sleeveType = item.sleeveType || "";
  const fabric = item.fabric || "";
  
  let desc = `A ${colors} ${fit} ${subtype || category}`;
  if (sleeveType) desc += ` with ${sleeveType} sleeves`;
  if (pattern) desc += `, featuring a ${pattern} pattern`;
  if (fabric) desc += `, made of ${fabric}`;
  if (occasion) desc += `, suitable for ${occasion}`;
  if (labels) desc += `. Tags: ${labels}`;
  desc += ".";
  return desc;
}

async function run() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected.");

  console.log("Connecting to Qdrant...");
  const qdrantConfig = { url: process.env.QDRANT_URL || "http://localhost:6333" };
  if (process.env.QDRANT_API_KEY) {
    qdrantConfig.apiKey = process.env.QDRANT_API_KEY;
  }
  const client = new QdrantClient(qdrantConfig);
  console.log("Connected to Qdrant.");

  const items = await ClothingItem.find();
  console.log(`Found ${items.length} clothing items.`);

  let reportLines = [
    "# Image Diagnostics & Repair Report",
    "",
    "| Item Name | Category | MongoDB \`image_url\` | MongoDB \`cloudinary_url\` | Action Taken |",
    "|-----------|----------|-----------------------|----------------------------|--------------|"
  ];

  let repairedCount = 0;

  for (const item of items) {
    let action = "None";
    
    // Check if it has a cloudinary url but image_url is still local
    if (item.cloudinary_url && !item.image_url.includes("cloudinary.com")) {
      action = "Repaired MongoDB + Qdrant";
      
      // 1. Repair MongoDB
      item.image_url = item.cloudinary_url;
      await item.save();
      repairedCount++;

      // 2. Repair Qdrant payload directly
      const desc = getItemDescription(item);
      const vector = await generateEmbedding(desc);
      
      try {
        await client.upsert("wardrobe_items", {
          wait: true,
          points: [
            {
              id: item.qdrant_id,
              vector,
              payload: {
                mongoId: item._id.toString(),
                userId: item.user_id ? item.user_id.toString() : "",
                category: item.category,
                name: item.name,
                colors: item.color_spectrum || [],
                occasion: item.occasion || [],
                fit: item.fit || "regular",
                labels: item.labels || [],
                subtype: item.subtype || "",
                imageUrl: item.cloudinary_url,
                image_url: item.cloudinary_url,
                cloudinary_url: item.cloudinary_url,
                pattern: item.pattern || "",
                sleeveType: item.sleeveType || "",
                fabric: item.fabric || "",
                season: item.season || [],
                moodSuitability: item.moodSuitability || [],
                description: desc,
              },
            }
          ]
        });
      } catch (e) {
        console.error("Failed to sync to Qdrant:", e.message);
        action = "Failed Qdrant Sync";
      }
    }

    reportLines.push(
      `| ${item.name} | ${item.category} | ${item.image_url} | ${item.cloudinary_url || "N/A"} | ${action} |`
    );
  }

  console.log(`Repaired ${repairedCount} items.`);
  
  const reportPath = process.env.ARTIFACTS_DIR 
    ? path.join(process.env.ARTIFACTS_DIR, "IMAGE_REPORT.md") 
    : path.join(__dirname, "IMAGE_REPORT.md");
    
  fs.writeFileSync(reportPath, reportLines.join("\n"));
  console.log(`Report generated at: ${reportPath}`);

  mongoose.disconnect();
}

run().catch(console.error);
