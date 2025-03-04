require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development"
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

const app = express();
app.use(cors());
app.use(compression());
app.use(express.json());

// ✅ Security Headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",  // ✅ Allows inline scripts
                    "'unsafe-eval'",   // ✅ Needed for some libraries
                    "https://cdn.quilljs.com",
                    "https://cdn.jsdelivr.net"
                ],
                scriptSrcAttr: ["'unsafe-inline'"], // ✅ Allows inline event handlers
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.quilljs.com",
                    "https://cdn.jsdelivr.net",
                    "https://fonts.googleapis.com"
                ],
                fontSrc: [
                    "'self'",
                    "data:",
                    "https://cdn.jsdelivr.net",
                    "https://fonts.gstatic.com"
                ],
                connectSrc: ["'self'", "https://cdn.quilljs.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:"],
                frameSrc: ["'self'"],
            },
        },
    })
);





// ✅ Debugging Middleware
app.use((req, res, next) => {
    console.log(`🔍 Incoming Request: ${req.method} ${req.url}`);
    next();
});

// ✅ Load Environment Variables
console.log("🔍 Checking environment variables...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI_DEV:", process.env.MONGO_URI_DEV ? "✅ Loaded" : "❌ Not Loaded");
console.log("MONGO_URI_PROD:", process.env.MONGO_URI_PROD ? "✅ Loaded" : "❌ Not Loaded");

// 🌍 Choose MongoDB URI
const mongoURI = process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

console.log("Using MongoDB URI:", mongoURI || "❌ Undefined");

// ✅ Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log(`✅ Connected to MongoDB (${process.env.NODE_ENV})`);

    // 🔍 Debugging: Check active database name
    const db = mongoose.connection;
    console.log("📌 Connected to Database:", db.name);

    // 🔍 Debugging: Check available collections
    const collections = await db.db.listCollections().toArray();
    console.log("📂 Available Collections:", collections.map(c => c.name));
})
.catch(err => console.error("❌ MongoDB connection error:", err));




























































// =====================================================
//  📌 CONTENT SCHEMA & ROUTES
// =====================================================

// Define Content Schema
const contentSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    question: { type: String, required: true },
    answer: { type: String, required: true },
    messageType: { type: String, required: false }, // ✅ Ensure correct casing
    originalPostTitle: { type: String, required: false }, // ✅ Ensure exact match
    originalPostURL: { type: String, required: false } // ✅ Ensure exact match
});




const Content = mongoose.model("Content", contentSchema);

// Fetch all content
app.get("/content", async (req, res) => {
    try {
        const content = await Content.find({}, "title category tags question answer messageType originalPostTitle originalPostURL");
        
        // ✅ Debugging: Log the output to confirm correct data retrieval
        console.log("📤 Sending Content Data:", content);
        
        res.json(content);
    } catch (error) {
        console.error("❌ Error fetching content:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// Add new content block
app.post("/content", async (req, res) => {
    try {
        const { title, category, tags, question, answer, messageType, originalPostTitle, originalPostURL } = req.body;

        if (!title || !category || !question || !answer || !originalPostTitle || !originalPostURL) {
            return res.status(400).json({ error: "Title, category, question, answer, originalPostTitle, and originalPostURL are required." });
        }

        // ✅ Check if content already exists by title
        const existingContent = await Content.findOne({ title });

        if (existingContent) {
            // ✅ Update existing entry
            existingContent.category = category;
            existingContent.tags = tags;
            existingContent.question = question;
            existingContent.answer = answer;
            existingContent.messageType = messageType;
            existingContent.originalPostTitle = originalPostTitle;  // ✅ FIXED FIELD
            existingContent.originalPostURL = originalPostURL;      // ✅ FIXED FIELD
            await existingContent.save();

            return res.json({ message: "✅ Content updated successfully!", content: existingContent });
        }

        // ✅ Create new entry if it doesn't exist
        const newContent = new Content({ title, category, tags, question, answer, messageType, originalPostTitle, originalPostURL });
        await newContent.save();

        res.json({ message: "✅ New content created!", content: newContent });
    } catch (error) {
        console.error("❌ Error adding/updating content:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Edit content block
app.put("/content/:id", async (req, res) => {
    try {
        const { title, category, tags, question, answer, messageType, originalPostTitle, originalPostURL } = req.body;

        if (!title || !category || !question || !answer || !originalPostTitle || !originalPostURL) {
            return res.status(400).json({ error: "Title, category, question, answer, originalPostTitle, and originalPostURL are required." });
        }

        const updatedContent = await Content.findByIdAndUpdate(req.params.id, {
            title, category, tags, question, answer, messageType, originalPostTitle, originalPostURL  // ✅ FIXED FIELDS
        }, { new: true });

        if (!updatedContent) {
            return res.status(404).json({ error: "Content not found" });
        }

        res.json({ message: "✅ Content updated successfully!", content: updatedContent });
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


// ✅ Update an original post by ID
app.put("/original-posts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url } = req.body;

        if (!title || !url) {
            return res.status(400).json({ error: "Both Title and URL are required." });
        }

        const updatedPost = await OriginalPost.findByIdAndUpdate(
            id,
            { title, url },
            { new: true } // ✅ Return the updated post
        );

        if (!updatedPost) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json({ message: "✅ Original post updated successfully!", post: updatedPost });
    } catch (error) {
        console.error("❌ Error updating original post:", error);
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






// =====================================================
//  📌 MESSAGE TYPE SCHEMA & ROUTES
// =====================================================

const messageTypeSchema = new mongoose.Schema({ type: String }, { collection: "messagetypes" });
const MessageType = mongoose.model("MessageType", messageTypeSchema);


// ✅ Fetch all message types
app.get("/message-types", async (req, res) => {
    try {
        const types = await MessageType.find();
        res.json(types);
    } catch (error) {
        console.error("❌ Error fetching message types:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Add a new message type
app.post("/message-types", async (req, res) => {
    try {
        const { type } = req.body;
        if (!type) {
            return res.status(400).json({ error: "Message Type is required" });
        }
        const newType = new MessageType({ type });
        await newType.save();
        res.json(newType);
    } catch (error) {
        console.error("❌ Error adding message type:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Edit a message type
app.put("/message-types/:id", async (req, res) => {
    try {
        const { type } = req.body;
        const updatedType = await MessageType.findByIdAndUpdate(req.params.id, { type }, { new: true });
        if (!updatedType) {
            return res.status(404).json({ error: "Message Type not found" });
        }
        res.json(updatedType);
    } catch (error) {
        console.error("❌ Error updating message type:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Delete a message type
app.delete("/message-types/:id", async (req, res) => {
    try {
        const deletedType = await MessageType.findByIdAndDelete(req.params.id);
        if (!deletedType) {
            return res.status(404).json({ error: "Message Type not found" });
        }
        res.json({ message: "✅ Message Type deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting message type:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// =====================================================
//  📌 DEV TRACKER
// =====================================================

// ✅ Dev Item Schema & Model
const devItemSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }, // ✅ New Field
});

const DevItem = mongoose.model("DevItem", devItemSchema);

// ✅ Fetch All Dev Items
app.get("/dev-items", async (req, res) => {
    try {
        const devItems = await DevItem.find();
        res.json(devItems);
    } catch (error) {
        console.error("❌ Error fetching dev items:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Add a New Dev Item
app.post("/dev-items", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Text is required" });

        const newItem = new DevItem({ text });
        await newItem.save();
        res.json(newItem);
    } catch (error) {
        console.error("❌ Error adding dev item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Update a Dev Item (Edit)
app.put("/dev-items/:id", async (req, res) => {
    try {
        const { text } = req.body;
        const updatedItem = await DevItem.findByIdAndUpdate(req.params.id, { text }, { new: true });
        if (!updatedItem) return res.status(404).json({ error: "Item not found" });

        res.json(updatedItem);
    } catch (error) {
        console.error("❌ Error updating dev item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Mark Dev Item as Complete
app.put("/dev-items/:id/complete", async (req, res) => {
    try {
        const updatedItem = await DevItem.findByIdAndUpdate(req.params.id, { completed: true }, { new: true });
        if (!updatedItem) return res.status(404).json({ error: "Item not found" });

        res.json(updatedItem);
    } catch (error) {
        console.error("❌ Error marking item complete:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Delete a Dev Item
app.delete("/dev-items/:id", async (req, res) => {
    try {
        const deletedItem = await DevItem.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ error: "Item not found" });

        res.json({ message: "✅ Dev Item deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting dev item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});











// =====================================================
//  📌 TAG PARENTS - SECTIONS MANAGEMENT
// =====================================================

// ✅ Section Schema
const sectionSchema = new mongoose.Schema({
    section: { type: String, required: true, unique: true }
});
const Section = mongoose.model("Section", sectionSchema);

// ✅ Tag-Parent Schema (Tag Assignments)
const tagSectionSchema = new mongoose.Schema({
    tag: { type: String, required: true, unique: true },
    section: { type: String, required: true }
});
const TagSection = mongoose.model("TagSection", tagSectionSchema);


// ✅ Fetch all sections (ONLY section names, no tag assignments)
app.get("/sections", async (req, res) => {
    try {
        const sections = await Section.find({}, "section");
        res.json(sections.map(s => s.section)); 
    } catch (error) {
        console.error("❌ Error fetching sections:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Add a new section
app.post("/sections", async (req, res) => {
    try {
        const { section } = req.body;
        if (!section) {
            return res.status(400).json({ error: "Section name is required" });
        }

        // ✅ Prevent duplicate sections
        const existingSection = await Section.findOne({ section });
        if (existingSection) {
            return res.status(400).json({ error: "Section already exists" });
        }

        const newSection = new Section({ section });
        await newSection.save();

        res.json({ message: "✅ Section created!", section });
    } catch (error) {
        console.error("❌ Error adding section:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Edit a section (Find by name, update tag assignments)
app.put("/sections/:section", async (req, res) => {
    try {
        const { section: newSection } = req.body;
        const { section: oldSection } = req.params;

        if (!newSection) {
            return res.status(400).json({ error: "New section name is required" });
        }

        // ✅ Check if the new section name already exists
        const existingSection = await Section.findOne({ section: newSection });
        if (existingSection) {
            return res.status(400).json({ error: "A section with this name already exists" });
        }

        // ✅ Find and update section
        const updatedSection = await Section.findOneAndUpdate(
            { section: oldSection }, // Find by name
            { section: newSection }, // Update to new name
            { new: true }
        );

        if (!updatedSection) {
            return res.status(404).json({ error: "Section not found" });
        }

        // ✅ Also update TagSection assignments
        await TagSection.updateMany({ section: oldSection }, { section: newSection });

        res.json({ message: "✅ Section updated successfully!", section: updatedSection });
    } catch (error) {
        console.error("❌ Error updating section:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Delete a section (Find by name, remove tag assignments)
app.delete("/sections/:section", async (req, res) => {
    try {
        const { section } = req.params;  // ✅ Get section name

        // ✅ Find section by name
        const sectionToDelete = await Section.findOne({ section });
        if (!sectionToDelete) {
            return res.status(404).json({ error: "Section not found" });
        }

        // ✅ Remove section
        await Section.deleteOne({ section });

        // ✅ Remove tag assignments tied to this section
        await TagSection.deleteMany({ section });

        res.json({ message: `✅ Section '${section}' deleted successfully!` });
    } catch (error) {
        console.error("❌ Error deleting section:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});





// ✅ Assign or reassign a tag to a section
app.post("/tag-sections", async (req, res) => {
    try {
        const { tag, section } = req.body;
        if (!tag || !section) {
            return res.status(400).json({ error: "Tag and Section are required" });
        }

        // ✅ Either update existing entry or create new
        const tagSection = await TagSection.findOneAndUpdate(
            { tag },
            { section },
            { new: true, upsert: true }
        );

        res.json({ message: "✅ Tag assigned to section!", tagSection });
    } catch (error) {
        console.error("❌ Error assigning tag to section:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fetch all tag-to-section assignments
app.get("/tag-sections", async (req, res) => {
    try {
        const tagSections = await TagSection.find();
        res.json(tagSections);
    } catch (error) {
        console.error("❌ Error fetching tag sections:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
























// =====================================================
// ✅ **SERVE FRONTEND FILES (MUST COME AFTER API ROUTES)**
// =====================================================


// ✅ Log to confirm debugging route is active
console.log("✅ Debugging route '/debug/message-types' is now active!");

app.get("/debug/message-types", async (req, res) => {
    try {
        const testFetch = await mongoose.connection.db.collection("messageTypes").find({}).toArray();
        console.log("📢 Direct DB Fetch:", testFetch);
        res.json(testFetch);
    } catch (error) {
        console.error("❌ Direct DB Fetch Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});






















// ✅ Serve frontend files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// ✅ SPA Fallback (Ensure API requests are not overridden)
app.get("*", (req, res) => {
    if (!req.url.startsWith("/api") && !req.url.startsWith("/tags") && !req.url.startsWith("/content") && !req.url.startsWith("/categories") && !req.url.startsWith("/original-posts")) {
        res.sendFile(path.join(__dirname, "public", "index.html"));
    }
});


//**DEBUGGING**

app.get("/debug/message-types", async (req, res) => {
    try {
        const types = await MessageType.find({});
        console.log("📢 Test Route Output (Message Types):", types);
        res.json(types);
    } catch (error) {
        console.error("❌ Error fetching message types:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// 🚀 Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



