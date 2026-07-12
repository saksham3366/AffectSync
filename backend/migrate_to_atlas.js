require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = 'mongodb://localhost:27017/affectsync';
const ATLAS_URI = process.env.MONGO_URI;

if (!ATLAS_URI) {
  console.error("Error: MONGO_URI is missing in backend/.env");
  process.exit(1);
}

async function migrate() {
  console.log("Connecting to Local MongoDB...");
  const localClient = new MongoClient(LOCAL_URI);
  await localClient.connect();
  const localDb = localClient.db();

  console.log("Connecting to MongoDB Atlas...");
  const atlasClient = new MongoClient(ATLAS_URI);
  await atlasClient.connect();
  const atlasDb = atlasClient.db();

  console.log("Successfully connected to both databases.");

  // Discover collections
  const collections = await localDb.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  console.log(`Found ${collectionNames.length} collections:`, collectionNames.join(', '));

  let report = `# Migration Report\n\nDate: ${new Date().toISOString()}\n\n`;
  report += `| Collection | Local Count | Atlas Count | Status |\n`;
  report += `|------------|-------------|-------------|--------|\n`;

  for (const name of collectionNames) {
    console.log(`\nMigrating collection: ${name}`);
    const localCollection = localDb.collection(name);
    const atlasCollection = atlasDb.collection(name);

    // Get documents from local
    const docs = await localCollection.find({}).toArray();
    const localCount = docs.length;

    console.log(`Found ${localCount} documents in local ${name}.`);

    let atlasCount = 0;

    if (localCount > 0) {
      // Clear atlas collection just in case it had partial test data
      await atlasCollection.deleteMany({});
      
      // Insert perfectly preserving ObjectIds, Dates, etc.
      await atlasCollection.insertMany(docs);
    }

    atlasCount = await atlasCollection.countDocuments();
    
    const status = localCount === atlasCount ? 'PASS' : 'FAIL';
    console.log(`Verification for ${name}: Local (${localCount}) vs Atlas (${atlasCount}) -> ${status}`);
    
    report += `| ${name} | ${localCount} | ${atlasCount} | ${status} |\n`;
  }

  const reportPath = path.join(__dirname, '..', 'MIGRATION_REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\nMigration complete! Report saved to ${reportPath}`);

  await localClient.close();
  await atlasClient.close();
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
