const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const ClothingItem = require('./models/ClothingItem');
  const items = await ClothingItem.find({ image_url: /1785251959764-460189/ });
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
});
