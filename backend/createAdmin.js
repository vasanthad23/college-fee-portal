const mongoose = require("mongoose");
const User = require("./models/User");

const MONGO_URI = "mongodb://admin:admin123@ac-ujawd1p-shard-00-00.6riz1nq.mongodb.net:27017,ac-ujawd1p-shard-00-01.6riz1nq.mongodb.net:27017,ac-ujawd1p-shard-00-02.6riz1nq.mongodb.net:27017/college-fee-erp?ssl=true&replicaSet=atlas-11x5rl-shard-0&authSource=admin&retryWrites=true&w=majority";
async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);

    const existing = await User.findOne({ email: "admin@college.com" });
    if (existing) {
      console.log("Admin already exists");
      return process.exit();
    }

    // Let the User model's pre-save hook handle password hashing
    const admin = new User({
      name: "Admin",
      email: "admin@college.com",
      password: "adminpassword",
      role: "admin"
    });

    await admin.save();

    console.log("Admin created successfully ✅");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
