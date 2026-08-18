const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env");
let MONGODB_URI = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/^MONGODB_URI=(.+)$/m);
  if (match) {
    MONGODB_URI = match[1].trim();
  }
}

async function updateAdminName() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    await usersCollection.updateOne(
      { email: "srimana2006@gmail.com" },
      {
        $set: {
          name: "Vathsan",
          employeeId: "ADM-VATHSAN",
          updatedAt: new Date(),
        },
      }
    );

    const user = await usersCollection.findOne({ email: "srimana2006@gmail.com" });
    console.log("✅ Admin name updated successfully in MongoDB Atlas:", {
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error updating admin name:", err);
    process.exit(1);
  }
}

updateAdminName();
