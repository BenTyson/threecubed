require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
});

console.log("🔍 Checking environment variables...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI_DEV:", process.env.MONGO_URI_DEV ? "✅ Loaded" : "❌ Not Loaded");
console.log("MONGO_URI_PROD:", process.env.MONGO_URI_PROD ? "✅ Loaded" : "❌ Not Loaded");

// 🌍 Choose MongoDB URI based on environment
const mongoURI = process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

console.log("Using MongoDB URI:", mongoURI || "❌ Undefined"); // Debugging log

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const app = express();
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

if (process.env.NODE_ENV === "production") {
    const morgan = require("morgan");
    app.use(morgan("combined"));
}

mongoose.connect(mongoURI, {})



.then(() => console.log(`✅ Connected to MongoDB (${process.env.NODE_ENV})`))
.catch(err => console.error("❌ MongoDB connection error:", err));



// 🚀 Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));




console.log("🔍 Checking environment variables...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI_DEV:", process.env.MONGO_URI_DEV ? "✅ Loaded" : "❌ Not Loaded");
console.log("MONGO_URI_PROD:", process.env.MONGO_URI_PROD ? "✅ Loaded" : "❌ Not Loaded");
console.log("Using MongoDB URI:", mongoURI);











// =====================================================
//  📌 CONTENT SCHEMA & ROUTES
// =====================================================

// Define Content Schema
const contentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    tags: [String],
    message: { type: String, required: true },
    messageType: { type: String, required: true },
    originalPost: { type: String } // ✅ New: Stores the selected original post URL
});

const Content = mongoose.model("Content", contentSchema);

// Fetch all content
app.get("/content", async (req, res) => {
    try {
        const content = await Content.find();
        res.json(content);
    } catch (error) {
        console.error("❌ Error fetching content:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add new content block
app.post("/content", async (req, res) => {
    try {
        const { title, category, tags, message, messageType, originalPost } = req.body;
        if (!title || !category || !message) {
            return res.status(400).json({ error: "Title, category, and message are required." });
        }

        const newContent = new Content({ title, category, tags, message, messageType, originalPost });
        await newContent.save();
        res.json(newContent);
    } catch (error) {
        console.error("❌ Error adding content:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Edit content block
app.put("/content/:id", async (req, res) => {
    try {
        const { title, category, tags, message, messageType, originalPost } = req.body;
        if (!title || !category || !message) {
            return res.status(400).json({ error: "Title, category, and message are required." });
        }

        const updatedContent = await Content.findByIdAndUpdate(req.params.id, {
            title, category, tags, message, messageType, originalPost
        }, { new: true });

        if (!updatedContent) {
            return res.status(404).json({ error: "Content not found" });
        }

        res.json(updatedContent);
    } catch (error) {
        console.error("❌ Error updating content:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete content
app.delete("/content/:id", async (req, res) => {
    try {
        const deletedContent = await Content.findByIdAndDelete(req.params.id);
        if (!deletedContent) {
            return res.status(404).json({ error: "Content block not found" });
        }
        res.json({ message: "✅ Content block deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting content:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// =====================================================
//  📌 CATEGORY SCHEMA & ROUTES
// =====================================================

const categorySchema = new mongoose.Schema({ category: String });
const Category = mongoose.model("Category", categorySchema);

// Fetch all categories
app.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        console.error("❌ Error fetching categories:", error);
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
        console.error("❌ Error adding category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Edit category
app.put("/categories/:id", async (req, res) => {
    try {
        const { category } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, { category }, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }
        res.json(updatedCategory);
    } catch (error) {
        console.error("❌ Error updating category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete category
app.delete("/categories/:id", async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }
        res.json({ message: "✅ Category deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// =====================================================
//  📌 TAG SCHEMA & ROUTES
// =====================================================

const tagSchema = new mongoose.Schema({ tag: String });
const Tag = mongoose.model("Tag", tagSchema);

// Fetch all tags
app.get("/tags", async (req, res) => {
    try {
        const tags = await Tag.find();
        res.json(tags);
    } catch (error) {
        console.error("❌ Error fetching tags:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add new tag
app.post("/tags", async (req, res) => {
    try {
        const { tag } = req.body;
        const newTag = new Tag({ tag });
        await newTag.save();
        res.json(newTag);
    } catch (error) {
        console.error("❌ Error adding tag:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Edit tag
app.put("/tags/:id", async (req, res) => {
    try {
        const { tag } = req.body;
        const updatedTag = await Tag.findByIdAndUpdate(req.params.id, { tag }, { new: true });
        if (!updatedTag) {
            return res.status(404).json({ error: "Tag not found" });
        }
        res.json(updatedTag);
    } catch (error) {
        console.error("❌ Error updating tag:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete tag
app.delete("/tags/:id", async (req, res) => {
    try {
        const deletedTag = await Tag.findByIdAndDelete(req.params.id);
        if (!deletedTag) {
            return res.status(404).json({ error: "Tag not found" });
        }
        res.json({ message: "✅ Tag deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting tag:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// =====================================================
//  📌 ORIGINAL POST ROUTES (UPDATED)
// =====================================================

const originalPostSchema = new mongoose.Schema({
    title: { type: String, required: true }, // ✅ Ensures Post Title is required
    url: { type: String, required: true, unique: true } // ✅ Ensures URL is required & unique
});
const OriginalPost = mongoose.model("OriginalPost", originalPostSchema);

// ✅ Fetch all original posts (returns both title & URL)
app.get("/original-posts", async (req, res) => {
    try {
        const posts = await OriginalPost.find({}, "title url"); // ✅ Only return `title` and `url`
        res.json(posts);
    } catch (error) {
        console.error("❌ Error fetching original posts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Add a new original post (requires both title & URL)
app.post("/original-posts", async (req, res) => {
    try {
        const { title, url } = req.body;

        if (!title || !url) {
            return res.status(400).json({ error: "Both Post Title and URL are required." });
        }

        const newPost = new OriginalPost({ title, url });
        await newPost.save();

        res.json({ message: "✅ Original post added successfully!", post: newPost });
    } catch (error) {
        console.error("❌ Error adding original post:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Delete an original post by ID
app.delete("/original-posts/:id", async (req, res) => {
    try {
        const deletedPost = await OriginalPost.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json({ message: "✅ Original post deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting original post:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



