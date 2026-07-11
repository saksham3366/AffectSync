const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
let ClothingItem;

function getClothingItemModel() {
  if (!ClothingItem) ClothingItem = require("../models/ClothingItem");
  return ClothingItem;
}

// Configure Cloudinary
function initCloudinary() {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
}

let isConfigured = false;

/**
 * Upload a local file to Cloudinary
 */
async function uploadImage(localPath) {
  if (!isConfigured) {
    isConfigured = initCloudinary();
    if (!isConfigured) return null;
  }
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'affectsync_wardrobe',
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (err) {
    console.error("[Cloudinary] Upload failed:", err.message);
    return null;
  }
}

/**
 * Delete an image from Cloudinary
 */
async function deleteImage(publicId) {
  if (!isConfigured) {
    isConfigured = initCloudinary();
    if (!isConfigured) return false;
  }
  if (!publicId) return false;
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err) {
    console.error("[Cloudinary] Delete failed for", publicId, ":", err.message);
    return false;
  }
}

let recoveryInterval = null;
let lastSyncTime = null;
let pendingCount = 0;

/**
 * Background recovery worker to sync pending uploads
 */
async function syncPendingUploads() {
  const Model = getClothingItemModel();
  try {
    const pendingItems = await Model.find({ cloud_status: "pending" });
    pendingCount = pendingItems.length;
    if (pendingItems.length === 0) return;

    console.log(`[Cloudinary Recovery] Found ${pendingItems.length} pending uploads to sync.`);
    let successCount = 0;

    for (const item of pendingItems) {
      if (!item.image_url) {
        item.cloud_status = "failed";
        await item.save();
        console.warn(`[Cloudinary Recovery] Item ${item._id} has no image_url.`);
        continue;
      }
      
      const localFilePath = path.join(__dirname, "..", item.image_url);
      if (fs.existsSync(localFilePath)) {
        const uploadResult = await uploadImage(localFilePath);
        if (uploadResult) {
          item.cloudinary_url = uploadResult.url;
          item.cloudinary_id = uploadResult.public_id;
          item.cloud_status = "synced";
          await item.save();
          successCount++;
        } else {
          // Upload failed (e.g. invalid image), mark as failed to stop infinite loop
          item.cloud_status = "failed";
          await item.save();
          console.warn(`[Cloudinary Recovery] Upload failed for item ${item._id}, marking as failed.`);
        }
      } else {
        // Local file is missing, we can't sync it
        item.cloud_status = "failed";
        await item.save();
        console.warn(`[Cloudinary Recovery] Local file missing for item ${item._id}`);
      }
    }

    if (successCount > 0) {
      lastSyncTime = new Date().toISOString();
      console.log(`[Cloudinary Recovery] Successfully synced ${successCount} uploads.`);
    }
  } catch (err) {
    console.error("[Cloudinary Recovery] Error during sync:", err.message);
  }
}

/**
 * Start 60-second recovery worker
 */
function startCloudRecovery() {
  if (recoveryInterval) return;
  console.log("[Cloudinary] Starting auto-recovery background task (every 60s)...");
  recoveryInterval = setInterval(syncPendingUploads, 60000);
}

/**
 * Health check status
 */
async function getHealthStatus() {
  if (!isConfigured) {
    isConfigured = initCloudinary();
  }
  
  const Model = getClothingItemModel();
  try {
    pendingCount = await Model.countDocuments({ cloud_status: "pending" });
  } catch (e) {
    // Ignore error in health check
  }
  
  return {
    mode: isConfigured ? "Dual Storage (Cloudinary + Local)" : "Local Storage Mode",
    cloudinary_status: isConfigured ? "configured" : "unconfigured",
    local_status: "operational",
    pending_uploads: pendingCount,
    last_sync: lastSyncTime || "never"
  };
}

module.exports = {
  uploadImage,
  deleteImage,
  startCloudRecovery,
  getHealthStatus,
};
