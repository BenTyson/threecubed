const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
});

// ✅ Load MongoDB URI
const mongoURI = process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

if (!mongoURI) {
    console.error("❌ Error: MongoDB URI is undefined. Check your .env file and NODE_ENV setting.");
    process.exit(1);
}

console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔍 Using MongoDB URI: ${mongoURI}`);

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const Content = mongoose.model(
    "Content",
    new mongoose.Schema({
        title: String,
        category: String,
        tags: [String],
        question: String,
        answer: String,
        messageType: String,
        originalPost: String,
    })
);

// ✅ Read the update JSON file
fs.readFile("update_tags.json", "utf8", async (err, data) => {
    if (err) {
        console.error("❌ Error reading JSON file:", err);
        process.exit(1);
    }

    try {
        let updates = JSON.parse(data);

        for (let entry of updates) {
            if (!entry.Title || !entry.Tags) {
                console.log(`⚠️ Skipping entry due to missing fields: ${JSON.stringify(entry)}`);
                continue;
            }

            // ✅ Auto-fix JSON field names
            const formattedTitle = entry.Title.trim();
            const formattedTags = Array.isArray(entry.Tags) 
                ? entry.Tags 
                : entry.Tags.split(",").map(tag => tag.trim());

            const updated = await Content.findOneAndUpdate(
                { title: formattedTitle }, // Match by title
                { $set: { tags: formattedTags } }, // Convert to proper array
                { new: true }
            );

            if (updated) {
                console.log(`✅ Updated: ${updated.title} -> ${updated.tags}`);
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
