function showSection(section) {
    document.getElementById("creator").style.display = section === "creator" ? "block" : "none";
    document.getElementById("viewer").style.display = section === "viewer" ? "block" : "none";
}

// Set default view to "Viewer"
document.addEventListener("DOMContentLoaded", () => {
    showSection('viewer');
});




async function populateCategories() {
    try {
        const response = await fetch("http://localhost:5001/categories");
        const categories = await response.json();

        const categorySet = new Set(["All Categories"]);
        categories.forEach(cat => categorySet.add(cat.category));

        const categoryFilter = document.getElementById("categoryFilter");
        categoryFilter.innerHTML = "";
        categorySet.forEach(category => {
            categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}


async function fetchContent() {
    try {
        const response = await fetch("http://localhost:5001/content");
        const content = await response.json();
        displayContent(content);
    } catch (error) {
        console.error("Error fetching content:", error);
    }
}



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


function editContent(id, title, category, tags, message) {
    // Ensure switching to Creator view
    document.getElementById("creatorView").style.display = "block";
    document.getElementById("viewerView").style.display = "none";

    // Populate the form fields
    document.getElementById("newTitle").value = title;
    document.getElementById("categorySelect").value = category;
    document.getElementById("newTags").value = tags.split(",");
    document.getElementById("newMessage").value = message;

    // Ensure the "Add Content" button is visible and change its function
    const addButton = document.getElementById("addContentButton");
    if (!addButton) {
        console.error("Error: addContentButton not found!");
        return;
    }

    addButton.textContent = "Update Content";
    addButton.onclick = function() {
        updateContent(id);
    };
}



async function updateContent(contentId) {
    const updatedTitle = document.getElementById("newTitle").value.trim();
    const updatedCategory = document.getElementById("categorySelect").value.trim();
    const updatedTags = document.getElementById("newTags").value.split(",").map(tag => tag.trim()).filter(tag => tag);
    const updatedMessage = document.getElementById("newMessage").value.trim();

    if (!updatedTitle || !updatedCategory || !updatedMessage) {
        alert("Title, category, and message are required.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/content/${contentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: updatedTitle,
                category: updatedCategory,
                tags: updatedTags,
                message: updatedMessage
            })
        });

        if (response.ok) {
            console.log("Content updated successfully.");
            fetchContent(); // Refresh the content list
            document.getElementById("addContentButton").textContent = "Add Content"; // Reset button text
            document.getElementById("addContentButton").onclick = addNewContent; // Reset button action
        } else {
            console.error("Failed to update content.");
        }
    } catch (error) {
        console.error("Error updating content:", error);
    }
}








// Fetch content on page load
document.addEventListener("DOMContentLoaded", fetchContent);


//delete content
function confirmDeleteContent(contentId) {
    const confirmDelete = confirm("Are you sure you want to permanently delete this content block?");
    if (confirmDelete) {
        deleteContent(contentId);
    }
}

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



//filter content
async function filterContent() {
    const searchQuery = document.getElementById("search").value.toLowerCase();
    const selectedCategory = document.getElementById("categoryFilter").value;

    try {
        const response = await fetch("http://localhost:5001/content");
        let contentData = await response.json(); // Fetch latest content from the backend

        contentData = contentData.filter(item => 
            (selectedCategory === "All Categories" || item.category === selectedCategory) &&
            item.title.toLowerCase().includes(searchQuery)
        );

        displayContent(contentData);
    } catch (error) {
        console.error("Error filtering content:", error);
    }
}


async function addNewContent() {
    const newTitle = document.getElementById("newTitle").value.trim();
    const newCategory = document.getElementById("categorySelect").value.trim();
    const newMessage = document.getElementById("newMessage").value.trim();
    
    // Get selected tags as an array
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
            document.getElementById("newTitle").value = "";
            document.getElementById("categorySelect").value = "";
            document.getElementById("newMessage").value = "";
            newTagsDropdown.selectedIndex = -1; // Clear selection
        } else {
            console.error("Failed to add content block.");
        }
    } catch (error) {
        console.error("Error adding content block:", error);
    }
}





//categories
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
            fetchCategories(); // Refresh category list
        } else {
            console.error("Failed to add category.");
        }
    } catch (error) {
        console.error("Error adding category:", error);
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

function updateCategoryDropdown(categories) {
    const categorySelect = document.getElementById("categorySelect");
    if (!categorySelect) return;

    categorySelect.innerHTML = "<option value=''>Select Category</option>";
    categories.forEach(category => {
        categorySelect.innerHTML += `<option value="${category.category}">${category.category}</option>`;
    });
}

// Fetch categories when the page loads
document.addEventListener("DOMContentLoaded", fetchCategories);



async function addNewTag() {
    console.log("addNewTag function triggered!"); // Debugging log

    const newTagInput = document.getElementById("newTagInput");
    const newTag = newTagInput.value.trim();

    if (newTag) {
        try {
            const response = await fetch("http://localhost:5001/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tag: newTag }),
            });

            const result = await response.json();
            console.log("Tag added:", result);

            fetchTags(); // Refresh the tag list on frontend
        } catch (error) {
            console.error("Error adding tag:", error);
        }

        newTagInput.value = ""; // Clear input field
    }
}


async function fetchTags() {
    try {
        const response = await fetch("http://localhost:5001/tags");
        const tags = await response.json();

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
    tagFilters.innerHTML = ""; // Clear previous tags

    tags.forEach(tag => {
        const tagElement = document.createElement("div");
        tagElement.classList.add("tag-item");
        tagElement.innerHTML = `
            <span class="tag">${tag.tag}</span>
            <button class="delete-tag-btn" onclick="confirmDeleteTag('${tag._id}')">🗑️</button>
        `;
        tagFilters.appendChild(tagElement);
    });
}

function confirmDeleteTag(tagId) {
    if (confirm("Are you sure you want to permanently delete this tag?")) {
        deleteTag(tagId);
    }
}

async function deleteTag(tagId) {
    console.log("Attempting to delete tag with ID:", tagId); // Debugging log

    try {
        const response = await fetch(`http://localhost:5001/tags/${tagId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            console.log("Tag deleted successfully.");
            fetchTags(); // Refresh tags after deletion
        } else {
            console.error("Failed to delete tag.");
        }
    } catch (error) {
        console.error("Error deleting tag:", error);
    }
}



document.addEventListener("DOMContentLoaded", () => {
    // Start in Viewer mode by default
    document.getElementById("creator").style.display = "none";
    document.getElementById("viewerView").style.display = "block";

    fetchTags();  
    populateCategories();  
    fetchContent();
});

