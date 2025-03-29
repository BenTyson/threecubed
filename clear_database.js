require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
});

console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);

const mongoose = require("mongoose");

// 🧠 Check for --all flag
const deleteTagSections = process.argv.includes("--all");

const mongoURI =
    process.env.NODE_ENV === "production"
        ? process.env.MONGO_URI_PROD
        : process.env.MONGO_URI_DEV;

if (!mongoURI) {
    console.error("❌ Error: MongoDB URI is undefined. Check your .env file and NODE_ENV setting.");
    process.exit(1);
}

console.log(`🔍 Using MongoDB URI: ${mongoURI}`);

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log(`✅ Connected to MongoDB (${process.env.NODE_ENV || "development"} Mode)`);

        const collections = await mongoose.connection.db.collections();

        if (collections.length === 0) {
            console.log("✅ Database is already empty.");
            process.exit(0);
        }

        console.log(`🚨 Deleting ${collections.length} collections (except devitems${!deleteTagSections ? " and tagsections" : ""})...`);

        for (let collection of collections) {
            const name = collection.collectionName;

            if (name === "devitems") {
                console.log(`⏭️ Skipped collection: ${name} (Dev Tasks Kept)`);
                continue;
            }

            if (!deleteTagSections && name === "tagsections") {
                console.log(`⏭️ Skipped collection: ${name} (Tag-Section Map Preserved)`);
                continue;
            }

            await collection.drop();
            console.log(`🗑️ Dropped collection: ${name}`);
        }

        console.log("🚀 Database cleared successfully!");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });
