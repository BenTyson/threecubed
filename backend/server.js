require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));


// Define Content Schema
const contentSchema = new mongoose.Schema({
    title: String,
    category: String,
    tags: [String],
});

const Content = mongoose.model("Content", contentSchema);

// Fetch all content
app.get("/content", async (req, res) => {
    const content = await Content.find();
    res.json(content);
});

// Add new content block
app.post("/content", async (req, res) => {
    const { title, category, tags } = req.body;
    const newContent = new Content({ title, category, tags });
    await newContent.save();
    res.json(newContent);
});

// Define Tag Schema
const tagSchema = new mongoose.Schema({
    tag: String,
});

const Tag = mongoose.model("Tag", tagSchema);

// Fetch all tags
app.get("/tags", async (req, res) => {
    const tags = await Tag.find();
    res.json(tags);
});

// Add new tag
app.post("/tags", async (req, res) => {
	console.log("Received new tag:", req.body); // Debugging log
    const { tag } = req.body;
    const newTag = new Tag({ tag });
    await newTag.save();
    res.json(newTag);
});

// delete tags
app.delete("/tags/:id", async (req, res) => {
    console.log("Delete request received for tag ID:", req.params.id); // Debugging log

    try {
        const deletedTag = await Tag.findByIdAndDelete(req.params.id);
        if (!deletedTag) {
            return res.status(404).json({ error: "Tag not found in database" });
        }
        res.json({ message: "Tag deleted successfully" });
    } catch (error) {
        console.error("Error deleting tag:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
