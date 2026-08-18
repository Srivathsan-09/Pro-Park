/**
 * Seed script to test connection and create an initial Admin user if desired.
 * Usage: node scripts/seed-admin.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load .env manually if present
let MONGODB_URI = "mongodb://localhost:27017/propark";
try {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/MONGODB_URI=(.+)/);
    if (match && match[1]) {
      MONGODB_URI = match[1].trim();
    }
  }
} catch (e) {}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    employeeId: String,
    email: String,
    phone: String,
    department: String,
    passwordHash: String,
    role: String,
    profileImage: String,
    homeLocation: String,
    commutePreferences: Object,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  console.log("Connecting to MongoDB at:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("✅ Successfully connected to MongoDB!");

  const adminEmail = "admin@propark.corporate.com";
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    console.log("ℹ️  Admin account already exists in 'propark' database:", existingAdmin.email);
  } else {
    const passwordHash = await bcrypt.hash("Admin@ProPark2026", 12);
    const admin = await User.create({
      name: "Campus System Admin",
      employeeId: "ADM-001",
      email: adminEmail,
      phone: "+1 555-0100",
      department: "Facilities & Mobility Management",
      passwordHash,
      role: "admin",
      homeLocation: "Central Campus Tower A",
      commutePreferences: {
        departureTimePreference: "08:00 AM",
        notes: "Campus transport supervisor",
        smokingPreference: false,
        musicPreference: true,
      },
    });

    console.log("🎉 Created initial Admin Account:");
    console.log("   Email:    admin@propark.corporate.com");
    console.log("   Password: Admin@ProPark2026");
    console.log("   Role:     admin");
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("📁 Collections in 'propark' database:", collections.map(c => c.name));

  await mongoose.disconnect();
  console.log("🔌 Database connection closed cleanly.");
}

seed().catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});
