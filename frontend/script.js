// =====================================================
//  📌 PAGE LOAD & VIEW MANAGEMENT
// =====================================================

// Toggle between Creator & Viewer & Organizer sections
function showSection(section) {
    document.getElementById("creator").style.display = section === "creator" ? "block" : "none";
    document.getElementById("organizer").style.display = section === "organizer" ? "block" : "none";
    document.getElementById("viewer").style.display = section === "viewer" ? "block" : "none";

    // ✅ If switching to Organizer or Creator, refresh the tag list
    if (section === "organizer" || section === "creator") {
        fetchTags();  // ✅ Ensure tags are up-to-date in both views
    }

    // Update Bootstrap active state for tabs
    document.querySelectorAll(".nav-link").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`[onclick="showSection('${section}')"]`).classList.add("active");
}

// Ensure the app starts in Viewer mode
document.addEventListener("DOMContentLoaded", () => {
    showSection("viewer");
    fetchTags();  // ✅ Preload tags at startup
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
    contentList.innerHTML = ""; // ✅ Clear previous content

    if (!Array.isArray(contentData) || contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    contentData.forEach(item => {
        const tagsHTML = item.tags.map(tag => `
            <span class="badge tag-filter bg-secondary me-1" data-tag="${tag}" onclick="toggleTagFilter('${tag}')">${tag}</span>
        `).join(" ");

        contentList.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <p class="head2">${item.title}</p>
                        <h6 class="card-subtitle mb-2 text-muted">${item.category} | ${item.messageType}</h6> <!-- ✅ Display Message Type -->
                        <p class="card-text">${item.message ? item.message : "No message available"}</p>
                        <div>${tagsHTML}</div>
                        <button class="btn btn-edit btn-sm mt-2" 
                            onclick="editContent('${item._id}', '${item.title}', '${item.category}', '${item.tags.join(",")}', '${item.message}', '${item.messageType}')">✏️</button>
                        <button class="btn btn-danger btn-sm mt-2" 
                            onclick="confirmDeleteContent('${item._id}')">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });
}




// Add a new content block
async function addNewContent() {
    const newTitle = document.getElementById("newTitle").value.trim();
    const newCategory = document.getElementById("categorySelect").value.trim();
    const newMessage = document.getElementById("newMessage").value.trim();
    const newMessageType = document.getElementById("messageTypeSelect").value;
    const newTagsDropdown = document.getElementById("newTags");
    const newTags = Array.from(newTagsDropdown.selectedOptions).map(option => option.value);
    const originalPost = document.getElementById("originalPostSelect").value; // ✅ Get Selected Post

    if (!newTitle || !newCategory || !newMessage) {
        alert("Title, category, and message are required.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                title: newTitle, 
                category: newCategory, 
                tags: newTags, 
                message: newMessage, 
                messageType: newMessageType,
                originalPost: originalPost // ✅ Save original post
            })
        });

        if (response.ok) {
            console.log("✅ Content block added successfully.");
            fetchContent();
        } else {
            console.error("❌ Failed to add content block.");
        }
    } catch (error) {
        console.error("❌ Error adding content block:", error);
    }
}



// Edit existing content
async function editContent(id, title, category, tags, message, originalPost) {
    showSection("creator");

    document.getElementById("newTitle").value = title;
    document.getElementById("categorySelect").value = category;
    document.getElementById("newMessage").value = message;

    await fetchOriginalPosts(); // ✅ Ensure dropdown is fully populated

    document.getElementById("originalPostSelect").value = originalPost || ""; // ✅ Pre-select post

    const newTagsDropdown = document.getElementById("newTags");
    if (newTagsDropdown) {
        const selectedTags = tags.split(",").map(tag => tag.trim());

        Array.from(newTagsDropdown.options).forEach(option => {
            option.selected = selectedTags.includes(option.value);
        });
    }

    const addButton = document.getElementById("addContentButton");
    addButton.textContent = "Update Content";
    addButton.onclick = function() {
        updateContent(id);
    };
}





async function updateContent(contentId) {
    const updatedTitle = document.getElementById("newTitle").value.trim();
    const updatedCategory = document.getElementById("categorySelect").value.trim();
    const updatedTags = Array.from(document.getElementById("newTags").selectedOptions).map(option => option.value);
    const updatedMessage = document.getElementById("newMessage").value.trim();
    const updatedMessageType = document.getElementById("messageTypeSelect").value; // ✅ Capture Message Type

    try {
        const response = await fetch(`http://localhost:5001/content/${contentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                title: updatedTitle, 
                category: updatedCategory, 
                tags: updatedTags, 
                message: updatedMessage,
                messageType: updatedMessageType // ✅ Update message type
            })
        });

        if (response.ok) {
            console.log("✅ Content updated successfully.");
            fetchContent();
        } else {
            console.error("❌ Failed to update content.");
        }
    } catch (error) {
        console.error("❌ Error updating content:", error);
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

        // ✅ Update Viewer category dropdown
        const categoryFilter = document.getElementById("categoryFilter");
        categoryFilter.innerHTML = "";
        categorySet.forEach(category => {
            categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
        });

        // ✅ Update Creator category dropdown
        const categorySelect = document.getElementById("categorySelect");
        categorySelect.innerHTML = "<option value=''>Select Category</option>";
        categories.forEach(category => {
            categorySelect.innerHTML += `<option value="${category.category}">${category.category}</option>`;
        });

        // ✅ Update Organizer category list
        const categoryList = document.getElementById("categoryList");
        categoryList.innerHTML = ""; // Clear previous categories

        categories.forEach(category => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item d-flex justify-content-between align-items-center";
            listItem.innerHTML = `
                <span>${category.category}</span>
                <div>
                    <button class="btn btn-sm btn-edit xxme-2" onclick="openEditCategoryModal('${category._id}', '${category.category}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteCategory('${category._id}')">🗑️</button>
                </div>
            `;
            categoryList.appendChild(listItem);
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

function confirmDeleteCategory(categoryId) {
    console.log("🛠️ Confirm Delete Category Triggered! ID:", categoryId); // Debugging log

    // ✅ Ensure alert box elements exist
    const alertBox = document.getElementById("confirmDeleteAlert");
    const alertMessage = document.getElementById("confirmDeleteMessage");
    const confirmButton = document.getElementById("confirmDeleteBtn");

    if (!alertBox || !alertMessage || !confirmButton) {
        console.error("❌ Error: Bootstrap alert elements not found in DOM!");
        return;
    }

    // ✅ Set alert message dynamically
    alertMessage.textContent = "Are you sure you want to delete this category? This action is permanent.";

    // ✅ Show the Bootstrap-styled alert
    alertBox.classList.remove("d-none");

    // ✅ Set the confirm button to trigger deletion
    confirmButton.onclick = function () {
        deleteCategory(categoryId);
        hideDeleteAlert(); // ✅ Hide alert after confirming
    };
}


//Hide Delete Alert Box
function hideDeleteAlert() {
    document.getElementById("confirmDeleteAlert").classList.add("d-none");
}


async function deleteCategory(categoryId) {
    console.log(`🗑️ Attempting to delete category with ID: ${categoryId}`); // ✅ Debugging Log

    try {
        const response = await fetch(`http://localhost:5001/categories/${categoryId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            console.log("✅ Category deleted successfully.");
            populateCategories(); // ✅ Refresh category list
            fetchContent(); // ✅ Refresh Viewer Mode Content Blocks
        } else {
            console.error("❌ Failed to delete category. Response:", await response.json());
        }
    } catch (error) {
        console.error("❌ Error deleting category:", error);
    }
}




function openEditCategoryModal(categoryId, categoryName) {
    console.log("📝 Opening Edit Modal for:", categoryId, "→", categoryName); // Debugging Log

    const editCategoryId = document.getElementById("editCategoryId");
    const editCategoryInput = document.getElementById("editCategoryInput");

    if (!editCategoryId || !editCategoryInput) {
        console.error("❌ Error: Edit category modal elements not found!");
        return;
    }

    editCategoryId.value = categoryId;
    editCategoryInput.value = categoryName;

    // ✅ Open Bootstrap modal
    const editCategoryModal = new bootstrap.Modal(document.getElementById("editCategoryModal"));
    editCategoryModal.show();
}



async function saveEditedCategory() {
    const categoryId = document.getElementById("editCategoryId").value;
    const updatedCategory = document.getElementById("editCategoryInput").value.trim();

    console.log("🛠️ Attempting to update category:", categoryId, "→", updatedCategory); // ✅ Debugging log

    if (!updatedCategory) {
        alert("Category name cannot be empty.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/categories/${categoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: updatedCategory })
        });

        if (response.ok) {
            console.log("✅ Category updated successfully.");
            populateCategories(); // ✅ Refresh category list
            fetchContent(); // ✅ Refresh Viewer Mode Content Blocks
            hideEditCategoryModal(); // ✅ Close modal
        } else {
            const errorMessage = await response.text();
            console.error("❌ Failed to update category. Server Response:", errorMessage);
        }
    } catch (error) {
        console.error("❌ Error updating category:", error);
    }
}



function hideEditCategoryModal() {
    console.log("🔄 Closing Edit Category Modal..."); // ✅ Debugging log
    const editCategoryModal = bootstrap.Modal.getInstance(document.getElementById("editCategoryModal"));
    if (editCategoryModal) {
        editCategoryModal.hide();
    } else {
        console.error("❌ Failed to close modal: Bootstrap instance not found!");
    }
}







// =====================================================
//  📌 TAG MANAGEMENT
// =====================================================

async function fetchTags() {
    try {
        const response = await fetch("http://localhost:5001/tags");
        const tags = await response.json();

        console.log("✅ Fetching tags:", tags); // Debugging log

        // ✅ Update tag list (Organizer View)
        const tagList = document.getElementById("tagList");
        if (tagList) {
            tagList.innerHTML = "";
            tags.forEach(tag => {
                const li = document.createElement("li");
                li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

                li.innerHTML = `
                    <span>${tag.tag}</span>
                    <div>
                        <button class="btn btn-sm btn-edit me-2" onclick="openEditTagModal('${tag._id}', '${tag.tag}')">✏️</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDeleteTag('${tag._id}')">🗑️</button>
                    </div>
                `;

                tagList.appendChild(li);
            });
        }

        // ✅ Update tag filters (Viewer Mode - Clickable Tags)
        const tagFilters = document.getElementById("tagFilters");
        if (tagFilters) {
            tagFilters.innerHTML = "";
            tags.forEach(tag => {
                tagFilters.innerHTML += `
                    <span class="badge tag-filter bg-secondary p-2 me-1" 
                        data-tag="${tag.tag}" 
                        onclick="toggleTagFilter(this, '${tag.tag}')">
                        ${tag.tag}
                    </span>
                `;
            });
        }

        // ✅ Update multi-select dropdown in Creator Mode
        const tagDropdown = document.getElementById("newTags");
        if (tagDropdown) {
            tagDropdown.innerHTML = ""; // Clear previous options
            tags.forEach(tag => {
                const option = document.createElement("option");
                option.value = tag.tag;
                option.textContent = tag.tag;
                tagDropdown.appendChild(option);
            });
        }

    } catch (error) {
        console.error("❌ Error fetching tags:", error);
    }
}



function displayTags(tags) {
    const tagList = document.getElementById("tagList");

    if (!tagList) {
        console.error("❌ ERROR: 'tagList' element not found in HTML!");
        return;
    }
    
    tagList.innerHTML = ""; // Clear previous list

    console.log("✅ Populating tags:", tags); // Debugging log

    tags.forEach(tag => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

        listItem.innerHTML = `
            <span>${tag.tag}</span>
            <div>
                <button class="btn btn-sm btn-edit me-2" onclick="openEditTagModal('${tag._id}', '${tag.tag}')">✏️ Edit</button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteTag('${tag._id}')">🗑️ Delete</button>
            </div>
        `;

        console.log(`✅ Tag added: ${tag.tag}`); // Debugging log
        tagList.appendChild(listItem);
    });
}


async function addNewTag() {
    console.log("🛠️ addNewTag function triggered!"); // Debugging log

    const newTagInput = document.getElementById("newTagInput");
    const newTagsDropdown = document.getElementById("newTags"); // ✅ This must exist!

    if (!newTagsDropdown) {
        console.error("❌ Error: Could not find 'newTags' element in DOM!");
        return;
    }

    const newTag = newTagInput.value.trim();
    if (!newTag) {
        alert("Please enter a tag.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: newTag }),
        });

        if (response.ok) {
            console.log("✅ Tag added successfully!");
            fetchTags(); // Refresh dropdown list
        } else {
            console.error("❌ Failed to add tag.");
        }
    } catch (error) {
        console.error("❌ Error adding tag:", error);
    }

    newTagInput.value = ""; // Clear input field
}

// Delete alert box
function confirmDeleteTag(tagId) {
    const alertContainer = document.getElementById("confirmDeleteAlert");
    const alertMessage = document.getElementById("confirmDeleteMessage");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    // ✅ Ensure all elements exist before proceeding
    if (!alertContainer || !alertMessage || !confirmDeleteBtn) {
        console.error("❌ Error: Bootstrap alert elements not found in DOM!");
        return;
    }

    // ✅ Set the delete message dynamically
    alertMessage.innerHTML = `Are you sure you want to delete this tag? <strong>This action is permanent!</strong>`;

    // ✅ Show the alert box
    alertContainer.classList.remove("d-none");
    alertContainer.classList.add("show");

    // ✅ Set Confirm button action
    confirmDeleteBtn.onclick = function () {
        deleteTag(tagId);  // ✅ Proceed with deletion
        hideDeleteAlert(); // ✅ Hide alert after confirming
    };
}

// Hide the Delete Alert Box
function hideDeleteAlert() {
    const alertContainer = document.getElementById("confirmDeleteAlert");
    if (alertContainer) {
        alertContainer.classList.add("d-none");
    }
}


// Delete the tag from the database
async function deleteTag(tagId) {
    console.log("Attempting to delete tag with ID:", tagId); // Debugging log

    try {
        const response = await fetch(`http://localhost:5001/tags/${tagId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            console.log("✅ Tag deleted successfully!");
            fetchTags(); // ✅ Refresh tag lists
            fetchContent(); // ✅ Refresh Viewer Mode Content Blocks
        } else {
            console.error("❌ Failed to delete tag.");
        }
    } catch (error) {
        console.error("❌ Error deleting tag:", error);
    }
}


// Open the Edit Tag Modal & Populate Input Field
function openEditTagModal(tagId, currentTagName) {
    const editTagInput = document.getElementById("editTagInput");
    const editTagId = document.getElementById("editTagId");
    const editTagModal = new bootstrap.Modal(document.getElementById("editTagModal"));

    if (!editTagInput || !editTagId || !editTagModal) {
        console.error("❌ Error: Edit modal elements not found in DOM!");
        return;
    }

    // ✅ Populate input fields
    editTagInput.value = currentTagName;
    editTagId.value = tagId;

    // ✅ Show the Bootstrap modal
    editTagModal.show();
}

// Save the Edited Tag Name
async function saveEditedTag() {
    const tagId = document.getElementById("editTagId").value.trim();
    const newTagName = document.getElementById("editTagInput").value.trim();
    const editTagModal = bootstrap.Modal.getInstance(document.getElementById("editTagModal"));

    if (!tagId || !newTagName) {
        alert("Please enter a valid tag name.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/tags/${tagId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: newTagName }),
        });

        if (response.ok) {
            console.log("✅ Tag updated successfully!");
            fetchTags(); // ✅ Refresh tags in Organizer & Viewer
            fetchContent(); // ✅ Refresh Viewer Mode Content Blocks
            editTagModal.hide(); // ✅ Close the modal
        } else {
            console.error("❌ Failed to update tag.");
        }
    } catch (error) {
        console.error("❌ Error updating tag:", error);
    }
}



const activeTags = new Set();

function toggleTagFilter(element, tag) {
    const tagLower = tag.toLowerCase();

    if (activeTags.has(tagLower)) {
        // ✅ Deactivate tag
        activeTags.delete(tagLower);
        element.classList.remove("bg-primary");
        element.classList.add("bg-secondary");
    } else {
        // ✅ Activate tag
        activeTags.add(tagLower);
        element.classList.remove("bg-secondary");
        element.classList.add("bg-primary");
    }

    console.log("🔄 Active Tags:", [...activeTags]); // ✅ Debugging log
    filterContent(); // ✅ Apply updated filtering logic
}




// =====================================================
//  📌 ORIGINAL POST
// =====================================================

async function addNewOriginalPost() {
    const postInput = document.getElementById("newOriginalPostInput");
    const postURL = postInput.value.trim();

    if (!postURL) {
        alert("Please enter a valid URL.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/original-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: postURL })
        });

        if (response.ok) {
            console.log("✅ Original post added successfully!");
            postInput.value = ""; // Clear input field
            fetchOriginalPosts(); // Refresh list
        } else {
            console.error("❌ Failed to add original post.");
        }
    } catch (error) {
        console.error("❌ Error adding original post:", error);
    }
}

async function fetchOriginalPosts() {
    try {
        const response = await fetch("http://localhost:5001/original-posts");
        const posts = await response.json();

        // ✅ Update Organizer View List
        const postList = document.getElementById("originalPostList");
        if (postList) {
            postList.innerHTML = "";
            posts.forEach(post => {
                const li = document.createElement("li");
                li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

                li.innerHTML = `
                    <a href="${post.url}" target="_blank">${post.url}</a>
                    <button class="btn btn-edit btn-sm" onclick="deleteOriginalPost('${post._id}')">Delete</button>
                `;

                postList.appendChild(li);
            });
        }

        // ✅ Update Creator Dropdown
        const postDropdown = document.getElementById("originalPostSelect");
        if (postDropdown) {
            postDropdown.innerHTML = `<option value="">Select a post</option>`; // Reset options
            posts.forEach(post => {
                const option = document.createElement("option");
                option.value = post.url;
                option.textContent = post.url;
                postDropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error("❌ Error fetching original posts:", error);
    }
}

async function deleteOriginalPost(postId) {
    try {
        const response = await fetch(`http://localhost:5001/original-posts/${postId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            console.log("✅ Original post deleted successfully!");
            fetchOriginalPosts(); // Refresh list
        } else {
            console.error("❌ Failed to delete original post.");
        }
    } catch (error) {
        console.error("❌ Error deleting original post:", error);
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
        let contentData = await response.json(); // Fetch latest content

        // ✅ Enhanced Search: Match Title, Message, or Tags
        contentData = contentData.filter(item => {
            const matchesSearch = (
                item.title.toLowerCase().includes(searchQuery) || 
                item.message.toLowerCase().includes(searchQuery) || 
                item.tags.some(tag => tag.toLowerCase().includes(searchQuery))
            );

            const matchesCategory = (selectedCategory === "All Categories" || item.category === selectedCategory);

            const matchesActiveTags = (activeTags.size === 0 || item.tags.some(tag => activeTags.has(tag.toLowerCase())));

            return matchesSearch && matchesCategory && matchesActiveTags;
        });

        displayContent(contentData); // ✅ Display filtered content
    } catch (error) {
        console.error("❌ Error filtering content:", error);
    }
}




