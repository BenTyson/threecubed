const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

const mongoURI = process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

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
        return;
    }

    try {
        const updates = JSON.parse(data);

        for (const entry of updates) {
            const updated = await Content.findOneAndUpdate(
                { title: entry.title }, // Match by title
                { $set: { tags: entry.tags } }, // Only update tags field
                { new: true }
            );

            if (updated) {
                console.log(`✅ Updated: ${updated.title} -> ${updated.tags}`);
            } else {
                console.log(`❌ No match found for: ${entry.title}`);
            }
        }

        console.log("🚀 Bulk update completed!");
    } catch (error) {
        console.error("❌ Error updating database:", error);
    } finally {
        mongoose.connection.close();
    }
});
