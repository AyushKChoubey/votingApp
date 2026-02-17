const mongoose = require("mongoose");
require("dotenv").config();

// Define the MongoDB connection URL with proper environment variable handling
const mongoURL =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URI
    : "mongodb://localhost:27017/votingApp";

// Validate connection URL
if (!mongoURL) {
  console.error("❌ No MongoDB connection URL provided");
  process.exit(1);
}

// Set up MongoDB connection
mongoose.connect(mongoURL).catch((err) => {
  console.error("❌ MongoDB initial connection error:", err);
  process.exit(1);
});

// Get the default connection
// Mongoose maintains a default connection object representing the MongoDB connection.
const db = mongoose.connection;

// Define event listeners for database connection

db.on("connected", () => {
  const isAtlas = mongoURL.includes("mongodb+srv");
  const environment = process.env.NODE_ENV || "development";

  console.log("✅ Connected to MongoDB successfully");
  console.log(`🌍 Environment: ${environment}`);
  console.log(`📍 Database: ${mongoose.connection.name}`);
  console.log(`🌐 Host: ${mongoose.connection.host}`);
  console.log(
    `🔗 Type: ${isAtlas ? "MongoDB Atlas (Cloud)" : "Local MongoDB"}`,
  );
});

db.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

db.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

db.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected");
});

// Export the database connection
module.exports = db;
