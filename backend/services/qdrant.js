/**
 * Qdrant Vector Service for AffectSync
 * 
 * Stores wardrobe items as vectors in Qdrant for similarity-based outfit matching.
 * Uses Gemini text-embedding-004 for high-quality semantic embeddings (768 dims).
 */
const { QdrantClient } = require("@qdrant/js-client-rest");
const { v4: uuidv4 } = require("uuid");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
// Lazy require to avoid circular dependencies if any
let ClothingItem;
function getClothingItemModel() {
  if (!ClothingItem) ClothingItem = require("../models/ClothingItem");
  return ClothingItem;
}

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION_NAME = "wardrobe_items";
const VECTOR_SIZE = 768; // Gemini text-embedding-004 size

let client = null;

/**
 * Generate 768-dimensional text embedding from Gemini API.
 */
async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Qdrant] GEMINI_API_KEY not found. Using fallback zero embedding.");
    return new Array(VECTOR_SIZE).fill(0.0);
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: {
          parts: [{ text }]
        },
        outputDimensionality: 768
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Embedding API status ${res.status}: ${errText}`);
    }

    const json = await res.json();
    if (json.embedding && json.embedding.values) {
      return json.embedding.values;
    } else {
      throw new Error("Invalid embedding response structure");
    }
  } catch (err) {
    console.error("[Qdrant] generateEmbedding failed:", err.message);
    return new Array(VECTOR_SIZE).fill(0.0);
  }
}

/**
 * Get description for a ClothingItem to embed.
 */
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

// ── Public API ──────────────────────────────────────────────────────

async function initQdrant() {
  try {
    const qdrantConfig = { url: QDRANT_URL };
    if (process.env.QDRANT_API_KEY) {
      qdrantConfig.apiKey = process.env.QDRANT_API_KEY;
    }
    client = new QdrantClient(qdrantConfig);

    // Check if collection exists
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

    if (exists) {
      // Check collection params to see if size matches
      const info = await client.getCollection(COLLECTION_NAME);
      const currentSize = info.config?.params?.vectors?.size;
      if (currentSize !== VECTOR_SIZE) {
        console.log(`[Qdrant] Dimension mismatch (existing=${currentSize}, target=${VECTOR_SIZE}). Recreating collection '${COLLECTION_NAME}'...`);
        await client.deleteCollection(COLLECTION_NAME);
        await client.createCollection(COLLECTION_NAME, {
          vectors: {
            size: VECTOR_SIZE,
            distance: "Cosine",
          },
        });
      } else {
        console.log(`[Qdrant] Collection '${COLLECTION_NAME}' already exists with size ${VECTOR_SIZE}`);
      }
    } else {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`[Qdrant] Created collection '${COLLECTION_NAME}' (${VECTOR_SIZE} dims, Cosine)`);
    }

    return true;
  } catch (err) {
    console.error(`[Qdrant] Connection failed (${QDRANT_URL}): ${err.message}`);
    console.error("[Qdrant] Outfit recommendations will use MongoDB fallback only.");
    client = null;
    return false;
  }
}

/**
 * Upsert a ClothingItem to Qdrant. Returns the point ID.
 */
async function upsertItem(item) {
  if (!client) return null;

  const pointId = item.qdrant_id || uuidv4();
  const desc = getItemDescription(item);
  const vector = await generateEmbedding(desc);

  try {
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: pointId,
          vector,
          payload: {
            mongoId: item._id ? item._id.toString() : "",
            userId: item.user_id ? item.user_id.toString() : "",
            category: item.category,
            name: item.name,
            colors: item.color_spectrum || [],
            occasion: item.occasion || [],
            fit: item.fit || "regular",
            labels: item.labels || [],
            subtype: item.subtype || "",
            imageUrl: item.image_url || "",
            pattern: item.pattern || "",
            sleeveType: item.sleeveType || "",
            fabric: item.fabric || "",
            season: item.season || [],
            moodSuitability: item.moodSuitability || [],
            description: desc,
          },
        },
      ],
    });
    return pointId;
  } catch (err) {
    console.error(`[Qdrant] Upsert failed for '${item.name}': ${err.message}`);
    return null;
  }
}

/**
 * Search for matching wardrobe items by mood + category.
 */
async function searchOutfit(mood, gender, userId, category, excludeIds = [], limit = 15) {
  if (!client) return [];

  const queryText = `A ${category} item for ${mood} mood, suitable for ${gender}.`;
  const queryVector = await generateEmbedding(queryText);

  try {
    const filter = {
      must: [
        { key: "userId", match: { value: userId } },
        { key: "category", match: { value: category } },
      ],
    };

    // Exclude already-shown items
    if (excludeIds.length > 0) {
      filter.must_not = excludeIds.map((id) => ({
        key: "mongoId",
        match: { value: id },
      }));
    }

    const results = await client.search(COLLECTION_NAME, {
      vector: queryVector,
      filter,
      limit,
      with_payload: true,
    });

    return results.map((r) => ({
      qdrantId: r.id,
      score: r.score,
      _id: r.payload.mongoId,
      ...r.payload,
    }));
  } catch (err) {
    console.error(`[Qdrant] Search failed: ${err.message}`);
    return [];
  }
}

/**
 * Delete a point from Qdrant.
 */
async function deleteItem(qdrantId) {
  if (!client || !qdrantId) return;
  try {
    await client.delete(COLLECTION_NAME, { points: [qdrantId] });
  } catch (err) {
    console.error(`[Qdrant] Delete failed for ${qdrantId}: ${err.message}`);
  }
}

/**
 * Delete all points for a user.
 */
async function deleteAllForUser(userId) {
  if (!client) return;
  try {
    await client.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: "userId", match: { value: userId } }],
      },
    });
  } catch (err) {
    console.error(`[Qdrant] Bulk delete failed: ${err.message}`);
  }
}

function isConnected() {
  return client !== null;
}

let recoveryInterval = null;
let lastSyncTime = null;
let pendingCount = 0;

/**
 * Sync pending items from MongoDB to Qdrant
 */
async function syncPendingItems() {
  if (!client) return;
  const Model = getClothingItemModel();
  
  try {
    const pendingItems = await Model.find({ sync_status: "vector_pending" });
    pendingCount = pendingItems.length;
    
    if (pendingItems.length === 0) return;
    
    console.log(`[Qdrant] Found ${pendingItems.length} pending items to sync.`);
    let successCount = 0;
    
    for (const item of pendingItems) {
      const pointId = await upsertItem(item);
      if (pointId) {
        item.qdrant_id = pointId;
        item.sync_status = "synced";
        await item.save();
        successCount++;
      }
    }
    
    if (successCount > 0) {
      lastSyncTime = new Date().toISOString();
      console.log(`[Qdrant] Successfully synced ${successCount} items.`);
    }
  } catch (err) {
    console.error("[Qdrant] Error during background sync:", err.message);
  }
}

/**
 * Start automatic background recovery and synchronization
 */
function startAutoRecovery() {
  if (recoveryInterval) return;
  
  console.log("[Qdrant] Starting auto-recovery and sync background task (every 60s)...");
  recoveryInterval = setInterval(async () => {
    // Attempt to reconnect if disconnected
    if (!client) {
      console.log("[Qdrant] Attempting to reconnect to Qdrant...");
      const connected = await initQdrant();
      if (connected) {
        console.log("[Qdrant] Reconnected successfully. Initiating background sync...");
        await syncPendingItems();
      }
    } else {
      // If connected, just sync pending items (in case uploads happened during an interruption)
      await syncPendingItems();
    }
  }, 60000);
}

/**
 * Get vector engine health status
 */
async function getHealthStatus() {
  const Model = getClothingItemModel();
  try {
    pendingCount = await Model.countDocuments({ sync_status: "vector_pending" });
  } catch (e) {
    // Ignore db errors for health check
  }
  
  return {
    mode: client ? "Qdrant" : "MongoDB Fallback",
    connection_status: client ? "connected" : "disconnected",
    pending_sync_count: pendingCount,
    last_sync: lastSyncTime || "never",
    qdrant_url: QDRANT_URL
  };
}

module.exports = {
  initQdrant,
  upsertItem,
  searchOutfit,
  deleteItem,
  deleteAllForUser,
  isConnected,
  generateEmbedding,
  startAutoRecovery,
  getHealthStatus,
};
