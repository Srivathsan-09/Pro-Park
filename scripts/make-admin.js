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

async function makeAdmin() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas!");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const targetEmail = "srimana2006@gmail.com";

    // Find or Upsert srimana2006@gmail.com as Admin
    const existingUser = await usersCollection.findOne({ email: targetEmail });

    if (existingUser) {
      await usersCollection.updateOne(
        { email: targetEmail },
        {
          $set: {
            role: "admin",
            isApproved: true,
            verificationStatus: "approved",
            updatedAt: new Date(),
          },
        }
      );
      console.log(`✅ Successfully promoted existing user ${targetEmail} to ADMIN with full access!`);
    } else {
      await usersCollection.insertOne({
        name: "Sriman Admin",
        email: targetEmail,
        employeeId: "ADM-SRIMAN",
        department: "Executive & Admin",
        companyName: "Tech Mahindra",
        phone: "+91 9876543210",
        role: "admin",
        isApproved: true,
        verificationStatus: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`🎉 Created brand new ADMIN account for ${targetEmail} with full platform access!`);
    }

    const updatedUser = await usersCollection.findOne({ email: targetEmail });
    console.log("\n👤 Admin Account Summary:", {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isApproved: updatedUser.isApproved,
      verificationStatus: updatedUser.verificationStatus,
    });

    await mongoose.disconnect();
    console.log("🔌 Disconnected cleanly.");
  } catch (err) {
    console.error("Error setting admin:", err);
    process.exit(1);
  }
}

makeAdmin();
