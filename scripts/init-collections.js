const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Read MONGODB_URI from .env
const envPath = path.resolve(__dirname, "../.env");
let MONGODB_URI = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/^MONGODB_URI=(.+)$/m);
  if (match) {
    MONGODB_URI = match[1].trim();
  }
}

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

async function initCollections() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas!");

    const db = mongoose.connection.db;

    // Explicitly create all required corporate mobility collections
    const collectionsToCreate = [
      "users",
      "vehicles",
      "rides",
      "riderequests",
      "notifications",
    ];

    const existingCollections = (await db.listCollections().toArray()).map((c) => c.name);

    for (const colName of collectionsToCreate) {
      if (!existingCollections.includes(colName)) {
        await db.createCollection(colName);
        console.log(`✅ Initialized collection: ${colName}`);
      } else {
        console.log(`ℹ️ Collection already exists: ${colName}`);
      }
    }

    const finalCollections = (await db.listCollections().toArray()).map((c) => c.name);
    console.log("\n📁 All collections in 'propark' database:", finalCollections);

    await mongoose.disconnect();
    console.log("🔌 Disconnected cleanly.");
  } catch (err) {
    console.error("Initialization error:", err);
    process.exit(1);
  }
}

initCollections();
