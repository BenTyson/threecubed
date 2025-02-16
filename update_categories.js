const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
});

// ✅ Load MongoDB URI
const mongoURI = process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

// ✅ Debugging: Confirm environment
console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔍 Using MongoDB URI: ${mongoURI}`);

// ✅ Check if MongoDB URI is loaded correctly
if (!mongoURI) {
    console.error("❌ Error: MongoDB URI is undefined. Check your .env file and NODE_ENV setting.");
    process.exit(1);
}

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const Content = mongoose.model(
    "Content",
    new mongoose.Schema({
        title: { type: String, required: true, unique: true }, // ✅ Ensure unique title
        category: String,
        tags: [String],
        question: String,
        answer: String,
        messageType: String,
        originalPost: String,
    })
);

// ✅ Read the update JSON file
fs.readFile("update_categories.json", "utf8", async (err, data) => {
    if (err) {
        console.error("❌ Error reading JSON file:", err);
        return;
    }

    try {
        const updates = JSON.parse(data);

        for (const entry of updates) {
            if (!entry.Title || !entry.Category) {
                console.log(`⚠️ Skipping entry due to missing fields: ${JSON.stringify(entry)}`);
                continue;
            }

            const formattedTitle = entry.Title.trim();
            const formattedCategory = entry.Category.trim();

            // ✅ Only update existing entries, prevent duplicates
            const updated = await Content.findOneAndUpdate(
                { title: formattedTitle }, // Match by title
                { $set: { category: formattedCategory } }, // Only update category field
                { new: true, upsert: false } // ✅ Prevent new content creation
            );

            if (updated) {
                console.log(`✅ Updated: ${updated.title} -> ${updated.category}`);
            } else {
                console.log(`❌ No match found for: ${formattedTitle}`);
            }
        }

        console.log("🚀 Bulk update completed!");
    } catch (error) {
        console.error("❌ Error updating database:", error);
    } finally {
        mongoose.connection.close();
    }
});
