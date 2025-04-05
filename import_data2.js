// import_data2.js
require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
});

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const mongoURI = process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

console.log("🔍 Connecting to MongoDB:", mongoURI);

const contentSchema = new mongoose.Schema({
    index: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    tags: [{ type: String }],
    question: { type: String },
    answer: { type: String },
    passageIntro: { type: String },
    passageContent: { type: String },
    passageSummary: { type: String },
    entity: { type: String },
    author: { type: String, required: true },
    messageType: { type: String, required: true },
    originalPostTitle: { type: String, required: true },
    originalPostURL: { type: String, required: true },
    date: { type: String, required: true }
});

const tagSectionSchema = new mongoose.Schema({
    tag: { type: String, required: true, unique: true },
    section: { type: String, required: true }
});

const Content = mongoose.model("Content", contentSchema);
const TagSection = mongoose.model("TagSection", tagSectionSchema);

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
});

const jsonFilePath = path.join(__dirname, "formatted_data2.json");

fs.readFile(jsonFilePath, "utf8", async (err, data) => {
    if (err) {
        console.error("❌ Error reading JSON file:", err);
        process.exit(1);
    }

    try {
        const jsonData = JSON.parse(data);
        let inserted = 0, skipped = 0, errors = 0;
        const skippedLogs = [], errorLogs = [], allTags = new Set();

        for (const [i, entry] of jsonData.entries()) {
            console.log(`🔍 Processing entry ${i + 1}...`);

            const requiredFields = ["index", "Title", "author", "messageType", "originalPostTitle", "originalPostURL", "date"];
            const missing = requiredFields.filter(f => !entry[f] || entry[f].toString().trim() === "");

            if (missing.length > 0) {
                skipped++;
                skippedLogs.push({ entry: i + 1, reason: `Missing: ${missing.join(", ")}`, data: entry });
                console.log(`⚠️ Entry ${i + 1} skipped due to missing fields: ${missing.join(", ")}`);
                continue;
            }

            const parsedTags = Array.isArray(entry.Tags)
                ? entry.Tags.flatMap(t => t.split(',').map(tag => tag.trim()))
                : (typeof entry.Tags === 'string' ? entry.Tags.split(',').map(t => t.trim()) : []);

            parsedTags.forEach(tag => allTags.add(tag));

            const document = {
                index: entry.index,
                title: entry.Title.trim(),
                tags: parsedTags,
                question: entry.Question?.trim() || "",
                answer: entry.Answer?.trim() || "",
                passageIntro: entry.passageIntro || "",
                passageContent: entry.passageContent || "",
                passageSummary: entry.passageSummary || "",
                entity: entry.entity || "",
                author: entry.author.trim(),
                messageType: entry.messageType.trim(),
                originalPostTitle: entry.originalPostTitle.trim(),
                originalPostURL: entry.originalPostURL.trim(),
                date: entry.date.trim()
            };

            try {
                await Content.findOneAndUpdate(
                    { index: document.index },
                    { $set: document },
                    { new: true, upsert: true }
                );
                inserted++;
            } catch (e) {
                errors++;
                console.error(`❌ Failed to insert/update entry ${i + 1}: ${e.message}`);
                errorLogs.push({ entry: i + 1, error: e.message, data: entry });
            }
        }

        // ✅ Assign tags with no section
        const existingAssignments = await TagSection.find({}, "tag").lean();
        const assignedTags = new Set(existingAssignments.map(t => t.tag));

        const unassigned = [...allTags].filter(tag => !assignedTags.has(tag));
        console.log(`📌 Assigning ${unassigned.length} unassigned tags to section 'Unassigned'...`);

        await Promise.all(unassigned.map(tag =>
            new TagSection({ tag, section: "Unassigned" }).save().catch(e => {
                console.error(`⚠️ Failed to assign tag '${tag}': ${e.message}`);
            })
        ));

        // ✅ Save logs
        if (skippedLogs.length > 0) {
            fs.writeFileSync("import2_skipped.json", JSON.stringify(skippedLogs, null, 2));
            console.log("📝 Skipped entries saved to: import2_skipped.json");
        }

        if (errorLogs.length > 0) {
            fs.writeFileSync("import2_errors.json", JSON.stringify(errorLogs, null, 2));
            console.log("📝 Errors saved to: import2_errors.json");
        }

        console.log("\n🚀 Import Summary");
        console.log(`   ✅ Inserted/Updated: ${inserted}`);
        console.log(`   ⚠️ Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`   🧩 Tag assignments: ${unassigned.length} new assigned to 'Unassigned'`);


        // ================================
        // ✅ PATCH: Sync Tag + Post + Section data
        // ================================
        const Tag = mongoose.model("Tag", new mongoose.Schema({ tag: String }));
        const OriginalPost = mongoose.model("OriginalPost", new mongoose.Schema({ title: String, url: String }));

        // 🧠 Insert tags into Tag collection
        await Promise.all([...allTags].map(tag =>
            Tag.findOneAndUpdate({ tag }, { tag }, { upsert: true })
        ));

        // 🧠 Insert original posts into OriginalPost collection
        const uniquePosts = new Map();
        jsonData.forEach(entry => {
            const title = entry.originalPostTitle?.trim();
            const url = entry.originalPostURL?.trim();
            if (title && url) uniquePosts.set(url, title);
        });

        await Promise.all([...uniquePosts.entries()].map(([url, title]) =>
            OriginalPost.findOneAndUpdate({ url }, { title, url }, { upsert: true })
        ));

        // 🧠 Optional: Auto-assign tags to 'Unassigned' section if not already mapped
        await Promise.all([...allTags].map(async tag => {
            const exists = await TagSection.findOne({ tag });
            if (!exists) {
                await TagSection.create({ tag, section: "Unassigned" });
            }
        }));

        console.log("✅ Tags, OriginalPosts, and TagSections synced.");




    } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
    } finally {
        mongoose.connection.close();
        console.log("🔌 Disconnected from MongoDB.");
    }
});
