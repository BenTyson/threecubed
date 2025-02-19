require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
});

const mongoose = require("mongoose");

// ✅ Load MongoDB URI (Development Only)
const mongoURI = process.env.MONGO_URI_DEV;

if (!mongoURI) {
    console.error("❌ Error: MongoDB URI is undefined. Check your .env file and NODE_ENV setting.");
    process.exit(1);
}

console.log(`🔍 Using MongoDB URI: ${mongoURI}`);

// ✅ Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("✅ Connected to MongoDB (Development Mode)");

        // ✅ Fetch all collections in the database
        const collections = await mongoose.connection.db.collections();

        if (collections.length === 0) {
            console.log("✅ Database is already empty.");
            process.exit(0);
        }

        console.log(`🚨 Deleting ${collections.length} collections (excluding 'devitems')...`);

        // ✅ Drop each collection EXCEPT "devitems"
        for (let collection of collections) {
            if (collection.collectionName !== "devitems") {
                await collection.drop();
                console.log(`🗑️ Dropped collection: ${collection.collectionName}`);
            } else {
                console.log(`⏭️ Skipped collection: ${collection.collectionName} (Dev Tasks Kept)`);
            }
        }

        console.log("🚀 Database cleared successfully (except 'devitems')!");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });
