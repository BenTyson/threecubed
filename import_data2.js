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

const Content = mongoose.model("Content", contentSchema);

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
        const skippedLogs = [], errorLogs = [];

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

            const document = {
                index: entry.index,
                title: entry.Title.trim(),
                tags: Array.isArray(entry.Tags)
                    ? entry.Tags.flatMap(t => t.split(',').map(tag => tag.trim()))
                    : (typeof entry.Tags === 'string' ? entry.Tags.split(',').map(t => t.trim()) : []),
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
                const result = await Content.findOneAndUpdate(
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

    } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
    } finally {
        mongoose.connection.close();
        console.log("🔌 Disconnected from MongoDB.");
    }
});
