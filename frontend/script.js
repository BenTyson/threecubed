function showSection(section) {
    document.getElementById("creator").style.display = section === "creator" ? "block" : "none";
    document.getElementById("viewer").style.display = section === "viewer" ? "block" : "none";
}

// Set default view to "Viewer"
document.addEventListener("DOMContentLoaded", () => {
    showSection('viewer');
});




function populateCategories() {
	const categorySet = new Set(["All Categories"]);
	contentData.forEach(item => categorySet.add(item.category));
	
	const categoryFilter = document.getElementById("categoryFilter");
	categoryFilter.innerHTML = "";
	categorySet.forEach(category => {
		categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
	});
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
    contentList.innerHTML = ""; // Clear previous content

    if (contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    contentData.forEach(item => {
        const tagsHTML = item.tags.map(tag => `<span class='tag'>${tag}</span>`).join(" ");
        contentList.innerHTML += `
            <div class="content-item">
                <h3>${item.title}</h3>
                <p>Category: ${item.category}</p>
                <p>Tags: ${tagsHTML}</p>
                <button class="delete-content-btn" onclick="confirmDeleteContent('${item._id}')">🗑️ Delete</button>
            </div>
        `;
    });
}


// Fetch content on page load
document.addEventListener("DOMContentLoaded", fetchContent);


//delete content
function confirmDeleteContent(contentId) {
    if (confirm("Are you sure you want to permanently delete this content block?")) {
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
            console.error("Failed to delete content.");
        }
    } catch (error) {
        console.error("Error deleting content:", error);
    }
}


//filter content
function filterContent() {
	const searchQuery = document.getElementById("search").value.toLowerCase();
	const selectedCategory = document.getElementById("categoryFilter").value;
	
	const filteredData = contentData.filter(item => 
		(selectedCategory === "All Categories" || item.category === selectedCategory) &&
		item.title.toLowerCase().includes(searchQuery)
	);
	
	displayContent(filteredData);
}

async function addNewContent() {
    const newTitleElement = document.getElementById("newTitle");
    const newCategoryElement = document.getElementById("categorySelect");
    const newTagsElement = document.getElementById("newTags");

    console.log("Title Field:", newTitleElement);
    console.log("Category Field:", newCategoryElement);
    console.log("Tags Field:", newTagsElement);

    if (!newTitleElement || !newCategoryElement || !newTagsElement) {
        console.error("Error: One or more input fields are missing.");
        return;
    }

    const newTitle = newTitleElement.value.trim();
    const newCategory = newCategoryElement.value.trim();
    const newTags = newTagsElement.value.split(",").map(tag => tag.trim()).filter(tag => tag);

    console.log("New Content:", { newTitle, newCategory, newTags }); // Debugging log

    if (!newTitle || !newCategory) {
        alert("Title and category are required.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, category: newCategory, tags: newTags })
        });

        if (response.ok) {
            console.log("Content block added successfully.");
            fetchContent();
            newTitleElement.value = "";
            newCategoryElement.value = "";
            newTagsElement.value = "";
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

        console.log("Tags from backend:", tags); // Debugging log
        displayTags(tags);
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



// Call fetchTags when the page loads
document.addEventListener("DOMContentLoaded", fetchTags);



document.addEventListener("DOMContentLoaded", () => {
	populateCategories();
	displayContent();
});