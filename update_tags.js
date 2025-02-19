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

// ✅ Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// ✅ Define Models
const Content = mongoose.model(
    "Content",
    new mongoose.Schema({
        title: { type: String, required: true, unique: true }, 
        category: String,
        tags: [String],
        question: String,
        answer: String,
        messageType: String,
        originalPost: String,
    })
);

const Tag = mongoose.model(
    "Tag",
    new mongoose.Schema({
        tag: { type: String, unique: true }
    })
);

// ✅ Read and Update Tags from JSON
fs.readFile("update_tags.json", "utf8", async (err, data) => {
    if (err) {
        console.error("❌ Error reading JSON file:", err);
        return;
    }

    try {
        const updates = JSON.parse(data);
        const tagsToInsert = new Set();

        for (const entry of updates) {
            if (!entry.Title || !entry.Tags) {
                console.log(`⚠️ Skipping entry due to missing fields: ${JSON.stringify(entry)}`);
                continue;
            }

            const formattedTitle = entry.Title.trim();
            const formattedTags = Array.isArray(entry.Tags)
                ? entry.Tags.map(tag => tag.trim()) 
                : entry.Tags.split(",").map(tag => tag.trim());

            // ✅ Update tags inside `contents` collection
            const updated = await Content.findOneAndUpdate(
                { title: formattedTitle }, 
                { $set: { tags: formattedTags } },
                { new: true, upsert: false }
            );

            if (updated) {
                console.log(`✅ Updated: ${updated.title} -> ${updated.tags}`);
                formattedTags.forEach(tag => tagsToInsert.add(tag));
            } else {
                console.log(`❌ No match found for: ${formattedTitle}`);
            }
        }

        // ✅ Ensure tags exist in `tags` collection
        for (const tag of tagsToInsert) {
            await Tag.updateOne(
                { tag: tag },
                { $set: { tag: tag } },
                { upsert: true }
            );
            console.log(`✅ Ensured tag exists: ${tag}`);
        }

        console.log("🚀 Bulk update completed!");
    } catch (error) {
        console.error("❌ Error updating database:", error);
    } finally {
        mongoose.connection.close();
    }
});
