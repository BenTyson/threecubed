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

const Content = mongoose.model("Content", contentSchema);

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

        for (const entry of jsonData) {
            if (!entry.Title || !entry.Category || !entry.Question || !entry.Answer) {
                console.log(`⚠️ Skipping entry due to missing fields: ${JSON.stringify(entry)}`);
                continue;
            }

            const formattedTitle = entry.Title.trim();
            const formattedCategory = entry.Category.trim();
            const formattedMessageType = entry.messageType?.trim() || "General";
            const formattedOriginalPostTitle = entry.originalPostTitle?.trim() || "N/A";
            const formattedOriginalPostURL = entry.originalPostURL?.trim() || "N/A";

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

            // ✅ Logging for debugging
            console.log("📝 Processing Entry:");
            console.log(`   🔹 Title: ${formattedTitle}`);
            console.log(`   🔹 Category: ${formattedCategory}`);
            console.log(`   🔹 Message Type: ${formattedMessageType}`);
            console.log(`   🔹 Original Post Title: ${formattedOriginalPostTitle}`);
            console.log(`   🔹 Original Post URL: ${formattedOriginalPostURL}`);
            console.log(`   🔹 Tags: ${formattedTags.join(", ")}`);

            // ✅ Insert or Update Content
            try {
                const result = await Content.findOneAndUpdate(
                    { title: formattedTitle },
                    {
                        $set: {
                            category: formattedCategory,
                            tags: formattedTags, // ✅ Ensures array format
                            question: entry.Question,
                            answer: entry.Answer,
                            messageType: formattedMessageType,
                            originalPostTitle: formattedOriginalPostTitle,
                            originalPostURL: formattedOriginalPostURL
                        }
                    },
                    { new: true, upsert: true }
                );

                console.log(`✅ Successfully inserted/updated: ${formattedTitle}`);
            } catch (error) {
                console.error(`❌ Error inserting/updating content for: ${formattedTitle}`, error);
            }


            // ✅ Verification log
            if (!result.messageType || !result.originalPostTitle || !result.originalPostURL) {
                console.error(`❌ ERROR: Failed to insert messageType, originalPostTitle, or originalPostURL for '${formattedTitle}'`);
            } else {
                console.log(`✅ Successfully inserted: ${formattedTitle}`);
            }
        }

        console.log("🚀 Import Complete!");
    } catch (parseError) {
        console.error("❌ Error parsing JSON data:", parseError);
    } finally {
        mongoose.connection.close();
    }
});
