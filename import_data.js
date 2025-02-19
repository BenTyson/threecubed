require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
});

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ✅ Load MongoDB URI
const mongoURI = process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

console.log("🔍 Connecting to MongoDB:", mongoURI);

// ✅ Define Schemas
const contentSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    question: { type: String, required: true },
    answer: { type: String, required: true },
    messageType: { type: String, required: true },
    originalPostTitle: { type: String },
    originalPostURL: { type: String }
});

const categorySchema = new mongoose.Schema({ category: { type: String, unique: true } });
const tagSchema = new mongoose.Schema({ tag: { type: String, unique: true } });
const messageTypeSchema = new mongoose.Schema({ type: { type: String, unique: true } });

// ✅ Define Models
const Content = mongoose.model("Content", contentSchema);
const Category = mongoose.model("Category", categorySchema);
const Tag = mongoose.model("Tag", tagSchema);
const MessageType = mongoose.model("MessageType", messageTypeSchema);

// ✅ Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
});

// ✅ Load JSON File
const jsonFilePath = path.join(__dirname, "formatted_data.json");

fs.readFile(jsonFilePath, "utf8", async (err, data) => {
    if (err) {
        console.error("❌ Error reading JSON file:", err);
        process.exit(1);
    }

    try {
        const jsonData = JSON.parse(data);
        const tagsToInsert = new Set();
        const categoriesToInsert = new Set();
        const messageTypesToInsert = new Set();

        for (const entry of jsonData) {
            if (!entry.Title || !entry.Category || !entry.Question || !entry.Answer) {
                console.log(`⚠️ Skipping entry due to missing fields: ${JSON.stringify(entry)}`);
                continue;
            }

            const formattedTitle = entry.Title.trim();
            const formattedCategory = entry.Category.trim();
            const formattedMessageType = entry.MessageType?.trim() || "General";

            // ✅ Fix Tags
            let formattedTags = [];
            if (Array.isArray(entry.Tags)) {
                formattedTags = entry.Tags.flatMap(tag =>
                    tag.includes(",") ? tag.split(/\s*,\s*/) : [tag.trim()]
                ).map(tag => tag.trim());
            } else if (typeof entry.Tags === "string") {
                formattedTags = entry.Tags.split(/\s*,\s*/).map(tag => tag.trim());
            } else {
                formattedTags = [];
            }

            // ✅ Track categories, tags, and message types for bulk insertion
            categoriesToInsert.add(formattedCategory);
            messageTypesToInsert.add(formattedMessageType);
            formattedTags.forEach(tag => tagsToInsert.add(tag));

            // ✅ Insert or Update Content
            await Content.findOneAndUpdate(
                { title: formattedTitle },
                {
                    $set: {
                        category: formattedCategory,
                        tags: formattedTags,
                        question: entry.Question,
                        answer: entry.Answer,
                        messageType: formattedMessageType,
                        originalPostTitle: entry.OriginalPostTitle,
                        originalPostURL: entry.OriginalPostURL
                    }
                },
                { new: true, upsert: true }
            );

            console.log(`✅ Inserted/Updated: ${formattedTitle}`);
        }

        // ✅ Insert Categories
        for (const category of categoriesToInsert) {
            await Category.findOneAndUpdate(
                { category },
                { $set: { category } },
                { new: true, upsert: true }
            );
            console.log(`📁 Category Inserted: ${category}`);
        }

        // ✅ Insert Tags
        for (const tag of tagsToInsert) {
            await Tag.findOneAndUpdate(
                { tag },
                { $set: { tag } },
                { new: true, upsert: true }
            );
            console.log(`🏷️ Tag Inserted: ${tag}`);
        }

        // ✅ Insert Message Types
        for (const messageType of messageTypesToInsert) {
            await MessageType.findOneAndUpdate(
                { type: messageType },
                { $set: { type: messageType } },
                { new: true, upsert: true }
            );
            console.log(`📩 Message Type Inserted: ${messageType}`);
        }

        console.log("🚀 Import Complete!");
    } catch (parseError) {
        console.error("❌ Error parsing JSON data:", parseError);
    } finally {
        mongoose.connection.close();
    }
});
