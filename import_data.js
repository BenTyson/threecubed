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
const originalPostSchema = new mongoose.Schema({
    title: { type: String, unique: true },
    url: { type: String, unique: true }
});

// ✅ Define Models
const Content = mongoose.model("Content", contentSchema);
const Category = mongoose.model("Category", categorySchema);
const Tag = mongoose.model("Tag", tagSchema);
const MessageType = mongoose.model("MessageType", messageTypeSchema);
const OriginalPost = mongoose.model("OriginalPost", originalPostSchema);

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

        let insertedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        const categoriesSet = new Set();
        const tagsSet = new Set();
        const messageTypesSet = new Set();
        const originalPostsSet = new Map(); // Map to avoid duplicate URLs with different titles

        for (const entry of jsonData) {
            if (!entry.Title || !entry.Category || !entry.Question || !entry.Answer) {
                console.log(`⚠️ Skipping entry due to missing fields: ${JSON.stringify(entry)}`);
                skippedCount++;
                continue;
            }

            // ✅ Standardize data
            const formattedTitle = entry.Title.trim();
            const formattedCategory = entry.Category.trim();
            const formattedMessageType = entry.messageType?.trim() || "General";
            const formattedOriginalPostTitle = entry.originalPostTitle?.trim() || "N/A";
            const formattedOriginalPostURL = entry.originalPostURL?.trim() || "N/A";

            // ✅ Collect unique categories, message types, and original posts
            categoriesSet.add(formattedCategory);
            messageTypesSet.add(formattedMessageType);

            if (formattedOriginalPostURL !== "N/A") {
                originalPostsSet.set(formattedOriginalPostURL, formattedOriginalPostTitle);
            }

            // ✅ Fix Tags
            let formattedTags = [];
            if (Array.isArray(entry.Tags)) {
                formattedTags = entry.Tags.flatMap(tag =>
                    tag.includes(",") ? tag.split(/\s*,\s*/) : [tag.trim()]
                ).map(tag => tag.trim());
            } else if (typeof entry.Tags === "string") {
                formattedTags = entry.Tags.split(/\s*,\s*/).map(tag => tag.trim());
            }

            formattedTags.forEach(tag => tagsSet.add(tag));

            // ✅ Insert or Update Content
            try {
                const result = await Content.findOneAndUpdate(
                    { title: formattedTitle },
                    {
                        $set: {
                            category: formattedCategory,
                            tags: formattedTags,
                            question: entry.Question,
                            answer: entry.Answer,
                            messageType: formattedMessageType,
                            originalPostTitle: formattedOriginalPostTitle,
                            originalPostURL: formattedOriginalPostURL
                        }
                    },
                    { new: true, upsert: true }
                );

                if (result) {
                    insertedCount++;
                } else {
                    console.error(`❌ Failed to insert/update: ${formattedTitle}`);
                    errorCount++;
                }
            } catch (error) {
                console.error(`❌ Error inserting/updating content for: ${formattedTitle}`, error);
                errorCount++;
            }
        }

        // ✅ Insert Unique Categories
        await Promise.all([...categoriesSet].map(async category => {
            await Category.findOneAndUpdate({ category }, { category }, { upsert: true });
        }));

        // ✅ Insert Unique Tags
        await Promise.all([...tagsSet].map(async tag => {
            await Tag.findOneAndUpdate({ tag }, { tag }, { upsert: true });
        }));

        // ✅ Insert Unique Message Types
        await Promise.all([...messageTypesSet].map(async type => {
            await MessageType.findOneAndUpdate({ type }, { type }, { upsert: true });
        }));

        // ✅ Insert Unique Original Posts
        await Promise.all([...originalPostsSet.entries()].map(async ([url, title]) => {
            await OriginalPost.findOneAndUpdate(
                { url },
                { title, url },
                { upsert: true }
            );
        }));

        console.log("\n🚀 Import Complete!");
        console.log(`   ✅ Inserted/Updated: ${insertedCount}`);
        console.log(`   ⚠️ Skipped (missing fields): ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);

        // ✅ Verify Database Contents
        console.log("\n🔍 Verifying Data in Database...");
        const totalContents = await Content.countDocuments();
        const totalCategories = await Category.countDocuments();
        const totalTags = await Tag.countDocuments();
        const totalMessageTypes = await MessageType.countDocuments();
        const totalOriginalPosts = await OriginalPost.countDocuments();

        console.log(`📊 Contents: ${totalContents}`);
        console.log(`📊 Categories: ${totalCategories}`);
        console.log(`📊 Tags: ${totalTags}`);
        console.log(`📊 Message Types: ${totalMessageTypes}`);
        console.log(`📊 Original Posts: ${totalOriginalPosts}`);

        if (totalContents > 0) {
            console.log("✅ Data successfully stored in MongoDB!");
        } else {
            console.warn("⚠️ No data found in MongoDB. The import may not have worked.");
        }

    } catch (parseError) {
        console.error("❌ Error parsing JSON data:", parseError);
    } finally {
        mongoose.connection.close();
        console.log("⚠️ MongoDB Disconnected!");
    }
});
