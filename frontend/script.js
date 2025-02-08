// =====================================================
//  📌 PAGE LOAD & VIEW MANAGEMENT
// =====================================================

// Toggle between Creator & Viewer sections
function showSection(section) {
    document.getElementById("creator").style.display = section === "creator" ? "block" : "none";
    document.getElementById("viewer").style.display = section === "viewer" ? "block" : "none";
}

// Ensure the app starts in Viewer mode
document.addEventListener("DOMContentLoaded", () => {
    showSection("viewer");
    fetchTags();
    populateCategories();
    fetchContent();
});

// =====================================================
//  📌 CONTENT MANAGEMENT
// =====================================================

// Fetch and display content blocks
async function fetchContent() {
    try {
        const response = await fetch("http://localhost:5001/content");
        const content = await response.json();
        displayContent(content);
    } catch (error) {
        console.error("Error fetching content:", error);
    }
}

// Display content blocks
function displayContent(contentData) {
    const contentList = document.getElementById("contentList");
    contentList.innerHTML = "";

    if (!Array.isArray(contentData) || contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    contentData.forEach(item => {
        const tagsHTML = item.tags.map(tag => `<span class='tag'>${tag}</span>`).join(" ");
        contentList.innerHTML += `
            <div class="content-item">
                <h3>${item.title}</h3>
                <p><strong>Category:</strong> ${item.category}</p>
                <p><strong>Tags:</strong> ${tagsHTML}</p>
                <p><strong>Message:</strong> ${item.message ? item.message : "No message available"}</p>
                <button class="edit-content-btn" onclick="editContent('${item._id}', '${item.title}', '${item.category}', '${item.tags.join(",")}', '${item.message}')">✏️ Edit</button>
                <button class="delete-content-btn" onclick="confirmDeleteContent('${item._id}')">🗑️ Delete</button>
            </div>
        `;
    });
}

// Add a new content block
async function addNewContent() {
    const newTitle = document.getElementById("newTitle").value.trim();
    const newCategory = document.getElementById("categorySelect").value.trim();
    const newMessage = document.getElementById("newMessage").value.trim();
    const newTagsDropdown = document.getElementById("newTags");
    const newTags = Array.from(newTagsDropdown.selectedOptions).map(option => option.value);

    if (!newTitle || !newCategory || !newMessage) {
        alert("Title, category, and message are required.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, category: newCategory, tags: newTags, message: newMessage })
        });

        if (response.ok) {
            console.log("Content block added successfully.");
            fetchContent();
        } else {
            console.error("Failed to add content block.");
        }
    } catch (error) {
        console.error("Error adding content block:", error);
    }
}

// Edit existing content
function editContent(id, title, category, tags, message) {
    showSection("creator");

    document.getElementById("newTitle").value = title;
    document.getElementById("categorySelect").value = category;
    document.getElementById("newTags").value = tags.split(",");
    document.getElementById("newMessage").value = message;

    const addButton = document.getElementById("addContentButton");
    addButton.textContent = "Update Content";
    addButton.onclick = function() {
        updateContent(id);
    };
}

// Update content
async function updateContent(contentId) {
    const updatedTitle = document.getElementById("newTitle").value.trim();
    const updatedCategory = document.getElementById("categorySelect").value.trim();
    const updatedTags = document.getElementById("newTags").value.split(",").map(tag => tag.trim());
    const updatedMessage = document.getElementById("newMessage").value.trim();

    try {
        const response = await fetch(`http://localhost:5001/content/${contentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: updatedTitle, category: updatedCategory, tags: updatedTags, message: updatedMessage })
        });

        if (response.ok) {
            console.log("Content updated successfully.");
            fetchContent();
        } else {
            console.error("Failed to update content.");
        }
    } catch (error) {
        console.error("Error updating content:", error);
    }
}


//Delete Content
async function deleteContent(contentId) {
    try {
        const response = await fetch(`http://localhost:5001/content/${contentId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            console.log("Content block deleted successfully.");
            fetchContent(); // Refresh content list after deletion
        } else {
            console.error("Failed to delete content block.");
        }
    } catch (error) {
        console.error("Error deleting content block:", error);
    }
}


// Confirm Delete Content
function confirmDeleteContent(contentId) {
    const confirmDelete = confirm("Are you sure you want to permanently delete this content block?");
    if (confirmDelete) {
        deleteContent(contentId);
    }
}


// =====================================================
//  📌 CATEGORY MANAGEMENT
// =====================================================



async function populateCategories() {
    try {
        const response = await fetch("http://localhost:5001/categories");
        const categories = await response.json();

        const categorySet = new Set(["All Categories"]);
        categories.forEach(cat => categorySet.add(cat.category));

        // Update Viewer category dropdown
        const categoryFilter = document.getElementById("categoryFilter");
        categoryFilter.innerHTML = "";
        categorySet.forEach(category => {
            categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
        });

        // Update Creator category dropdown
        const categorySelect = document.getElementById("categorySelect");
        categorySelect.innerHTML = "<option value=''>Select Category</option>";
        categories.forEach(category => {
            categorySelect.innerHTML += `<option value="${category.category}">${category.category}</option>`;
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}


async function fetchCategories() {
    try {
        const response = await fetch("http://localhost:5001/categories");
        const categories = await response.json();
        updateCategoryDropdown(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

async function addNewCategory() {
    const newCategoryElement = document.getElementById("newCategoryInput");
    if (!newCategoryElement) {
        console.error("Category input field not found.");
        return;
    }

    const newCategory = newCategoryElement.value.trim();
    if (!newCategory) {
        alert("Category name is required.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: newCategory })
        });

        if (response.ok) {
            console.log("Category added successfully.");
            newCategoryElement.value = ""; // Clear input field
            populateCategories(); // Refresh categories
        } else {
            console.error("Failed to add category.");
        }
    } catch (error) {
        console.error("Error adding category:", error);
    }
}


function updateCategoryDropdown(categories) {
    const categorySelect = document.getElementById("categorySelect");
    categorySelect.innerHTML = "<option value=''>Select Category</option>";
    categories.forEach(category => {
        categorySelect.innerHTML += `<option value="${category.category}">${category.category}</option>`;
    });
}

// =====================================================
//  📌 TAG MANAGEMENT
// =====================================================

async function fetchTags() {
    try {
        const response = await fetch("http://localhost:5001/tags");
        const tags = await response.json();

        // Find the multi-select dropdown
        const tagsDropdown = document.getElementById("newTags");
        tagsDropdown.innerHTML = ""; // Clear previous options

        tags.forEach(tag => {
            const option = document.createElement("option");
            option.value = tag.tag;
            option.textContent = tag.tag;
            tagsDropdown.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching tags:", error);
    }
}

function displayTags(tags) {
    const tagFilters = document.getElementById("tagFilters");
    tagFilters.innerHTML = "";
    tags.forEach(tag => {
        tagFilters.innerHTML += `
            <div class="tag-item">
                <span class="tag">${tag.tag}</span>
                <button class="delete-tag-btn" onclick="confirmDeleteTag('${tag._id}')">🗑️</button>
            </div>
        `;
    });
}

async function addNewTag() {
    console.log("addNewTag function triggered!"); // Debugging log

    const newTagInput = document.getElementById("newTagInput");
    const newTag = newTagInput.value.trim();

    if (!newTag) {
        alert("Please enter a tag name.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: newTag }),
        });

        if (response.ok) {
            console.log("Tag added successfully.");
            newTagInput.value = ""; // Clear input field
            fetchTags(); // Refresh the tag list in the dropdown
        } else {
            console.error("Failed to add tag.");
        }
    } catch (error) {
        console.error("Error adding tag:", error);
    }
}


// =====================================================
//  📌 FILTERING & SEARCH
// =====================================================

async function filterContent() {
    const searchQuery = document.getElementById("search").value.toLowerCase();
    const selectedCategory = document.getElementById("categoryFilter").value;

    try {
        const response = await fetch("http://localhost:5001/content");
        let contentData = await response.json();

        contentData = contentData.filter(item => 
            (selectedCategory === "All Categories" || item.category === selectedCategory) &&
            item.title.toLowerCase().includes(searchQuery)
        );

        displayContent(contentData);
    } catch (error) {
        console.error("Error filtering content:", error);
    }
}
