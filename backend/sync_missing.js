const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const cloudinary = require('./services/cloudinary');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const ClothingItem = require('./models/ClothingItem');
  
  const items = await ClothingItem.find();
  const toSync = items.filter(item => !item.cloudinary_url && item.image_url && item.image_url.includes('uploads'));
  
  console.log(`Found ${toSync.length} items to sync to Cloudinary.`);

  for (const item of toSync) {
    const localPath = path.join(__dirname, item.image_url);
    console.log(`Uploading ${localPath} to Cloudinary...`);
    try {
      const cloudResult = await cloudinary.uploadImage(localPath);
      if (cloudResult) {
        item.cloudinary_url = cloudResult.url;
        item.image_url = cloudResult.url;
        item.cloudinary_id = cloudResult.public_id;
        item.cloud_status = "synced";
        await item.save();
        console.log(`Success! Updated item ${item._id} to ${cloudResult.url}`);
      } else {
        console.log(`Cloudinary returned null for ${item._id}`);
      }
    } catch (e) {
      console.log(`Failed to upload ${item._id}:`, e.message);
    }
  }

  process.exit(0);
});
