const mongoose = require("mongoose");
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
        title: { type: String, required: true, unique: false }, // Unique false because duplicates exist
        category: String,
        tags: [String],
        question: String,
        answer: String,
        messageType: String,
        originalPost: String,
        createdAt: { type: Date, default: Date.now } // Helps in keeping the latest version
    })
);

async function removeDuplicates() {
    try {
        console.log("🔍 Finding duplicate entries...");
        const duplicates = await Content.aggregate([
            {
                $group: {
                    _id: "$title",
                    count: { $sum: 1 },
                    docs: { $push: "$_id" }
                }
            },
            { $match: { count: { $gt: 1 } } } // Only keep entries with more than one match
        ]);

        console.log(`🛠 Found ${duplicates.length} duplicate titles.`);

        let totalDeleted = 0;

        for (let duplicate of duplicates) {
            const { docs } = duplicate;
            
            // ✅ Keep the most recent entry and delete the rest
            docs.sort((a, b) => a.getTimestamp() - b.getTimestamp()); // Sort by creation time
            const keepId = docs.pop(); // Keep the newest entry
            const deleteIds = docs; // All other duplicates to delete

            const deleteResult = await Content.deleteMany({ _id: { $in: deleteIds } });
            console.log(`✅ Kept: ${keepId}, Deleted: ${deleteResult.deletedCount} duplicates`);
            totalDeleted += deleteResult.deletedCount;
        }

        console.log(`🚀 Cleanup complete! Removed ${totalDeleted} duplicate posts.`);
    } catch (error) {
        console.error("❌ Error removing duplicates:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the cleanup process
removeDuplicates();
