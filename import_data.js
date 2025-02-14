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

// ✅ Define Content Schema (Must match your server.js schema)
const contentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    tags: [String],
    question: { type: String, required: true },
    answer: { type: String, required: true },
    messageType: { type: String, required: true },
    originalPost: { type: String } // ✅ New: Stores the selected original post URL
});

const Content = mongoose.model("Content", contentSchema);

// ✅ Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log(`✅ Connected to MongoDB (${process.env.NODE_ENV})`))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Load JSON File
const jsonFilePath = path.join(__dirname, "formatted_data.json");

fs.readFile(jsonFilePath, "utf8", async (err, data) => {
    if (err) {
        console.error("❌ Error reading JSON file:", err);
        process.exit(1);
    }

    try {
        const jsonData = JSON.parse(data);

        // ✅ Format Data to Match Schema
        const formattedData = jsonData.map(entry => ({
            title: entry.Title,
            category: entry.Category,
            tags: Array.isArray(entry.Tags) ? entry.Tags : [], // Ensure it's an array
            question: entry.Question,
            answer: entry.Answer,
            messageType: entry.MessageType,
            originalPost: entry.OriginalPostURL
        }));

        // ✅ Insert Data into MongoDB
        await Content.insertMany(formattedData);
        console.log("✅ Data successfully inserted into MongoDB!");

        // ✅ Close Connection
        mongoose.connection.close();
    } catch (parseError) {
        console.error("❌ Error parsing JSON data:", parseError);
        process.exit(1);
    }
});
