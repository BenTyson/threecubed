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
    message: { type: String, required: true } // Ensure this field exists
});



const Content = mongoose.model("Content", contentSchema);

// Fetch all content
app.get("/content", async (req, res) => {
    const content = await Content.find();
    res.json(content);
});

// Add new content block
app.post("/content", async (req, res) => {
    try {
        console.log("Received request body:", req.body); // Debugging Log

        const { title, category, tags, message } = req.body;

        if (!title || !category || !message) {
            return res.status(400).json({ error: "Title, category, and message are required." });
        }

        const newContent = new Content({ title, category, tags, message });
        await newContent.save();
        res.json(newContent);
    } catch (error) {
        console.error("Error adding content:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Delete content
app.delete("/content/:id", async (req, res) => {
    console.log("Delete request received for content ID:", req.params.id); // Debugging log

    try {
        const deletedContent = await Content.findByIdAndDelete(req.params.id);
        if (!deletedContent) {
            return res.status(404).json({ error: "Content block not found" });
        }
        res.json({ message: "Content block deleted successfully" });
    } catch (error) {
        console.error("Error deleting content:", error);
        res.status(500).json({ error: "Error deleting content" });
    }
});


// Define Category Schema
const categorySchema = new mongoose.Schema({
    category: String,
});

const Category = mongoose.model("Category", categorySchema);

// Fetch all categories
app.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add new category
app.post("/categories", async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) {
            return res.status(400).json({ error: "Category is required" });
        }
        const newCategory = new Category({ category });
        await newCategory.save();
        res.json(newCategory);
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
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
    console.log("Received new tag:", req.body);
    const { tag } = req.body;
    const newTag = new Tag({ tag });
    await newTag.save();
    res.json(newTag);
});

// Delete tags
app.delete("/tags/:id", async (req, res) => {
    console.log("Delete request received for tag ID:", req.params.id);

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
