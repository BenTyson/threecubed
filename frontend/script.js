function showSection(section) {
    document.getElementById("creator").style.display = section === "creator" ? "block" : "none";
    document.getElementById("viewer").style.display = section === "viewer" ? "block" : "none";
}

// Set default view to "Viewer"
document.addEventListener("DOMContentLoaded", () => {
    showSection('viewer');
});




/*const contentData = [
	{ title: "Article 1", category: "Tech", tags: ["JavaScript", "Web"] },
	{ title: "Article 2", category: "Health", tags: ["Wellness", "Fitness"] },
	{ title: "Article 3", category: "Tech", tags: ["AI", "Machine Learning"] },
	{ title: "Article 4", category: "Lifestyle", tags: ["Travel", "Food"] }
];*/

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
            </div>
        `;
    });
}

// Fetch content on page load
document.addEventListener("DOMContentLoaded", fetchContent);


function filterContent() {
	const searchQuery = document.getElementById("search").value.toLowerCase();
	const selectedCategory = document.getElementById("categoryFilter").value;
	
	const filteredData = contentData.filter(item => 
		(selectedCategory === "All Categories" || item.category === selectedCategory) &&
		item.title.toLowerCase().includes(searchQuery)
	);
	
	displayContent(filteredData);
}

function addNewContent() {
	const newTitle = document.getElementById("newTitle").value.trim();
	const newCategory = document.getElementById("newCategory").value.trim();
	const newTags = document.getElementById("newTags").value.split(",").map(tag => tag.trim()).filter(tag => tag);
	
	if (newTitle && newCategory) {
		contentData.push({ title: newTitle, category: newCategory, tags: newTags });
		populateCategories();
		displayContent();
		document.getElementById("newTitle").value = "";
		document.getElementById("newCategory").value = "";
		document.getElementById("newTags").value = "";
	}
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