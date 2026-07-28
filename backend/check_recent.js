require('dotenv').config();
const mongoose = require('mongoose');
const ClothingItem = require('./models/ClothingItem');

async function checkRecentItems() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const items = await ClothingItem.find().sort({ createdAt: -1 }).limit(5);
    console.log("Most recent 5 items:");
    for (const item of items) {
      console.log(`Name: ${item.name}`);
      console.log(`  cloud_status: ${item.cloud_status}`);
      console.log(`  image_url: ${item.image_url}`);
      console.log(`  cloudinary_url: ${item.cloudinary_url}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}
checkRecentItems();
