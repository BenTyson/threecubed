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

const Category = mongoose.model(
    "Category",
    new mongoose.Schema({
        category: { type: String, unique: true }
    })
);

// ✅ Read and Update Categories from JSON
fs.readFile("update_categories.json", "utf8", async (err, data) => {
    if (err) {
        console.error("❌ Error reading JSON file:", err);
        return;
    }

    try {
        const updates = JSON.parse(data);
        const categoriesToInsert = new Set();

        for (const entry of updates) {
            if (!entry.Title || !entry.Category) {
                console.log(`⚠️ Skipping entry due to missing fields: ${JSON.stringify(entry)}`);
                continue;
            }

            const formattedTitle = entry.Title.trim();
            const formattedCategory = entry.Category.trim();

            // ✅ Update category inside `contents` collection
            const updated = await Content.findOneAndUpdate(
                { title: formattedTitle }, 
                { $set: { category: formattedCategory } },
                { new: true, upsert: false }
            );

            if (updated) {
                console.log(`✅ Updated: ${updated.title} -> ${updated.category}`);
                categoriesToInsert.add(formattedCategory);
            } else {
                console.log(`❌ No match found for: ${formattedTitle}`);
            }
        }

        // ✅ Ensure categories exist in `categories` collection
        for (const category of categoriesToInsert) {
            await Category.updateOne(
                { category: category },
                { $set: { category: category } },
                { upsert: true }
            );
            console.log(`✅ Ensured category exists: ${category}`);
        }

        console.log("🚀 Bulk update completed!");
    } catch (error) {
        console.error("❌ Error updating database:", error);
    } finally {
        mongoose.connection.close();
    }
});
