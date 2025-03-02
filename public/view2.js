// =====================================================
// 📌 VIEW 2: TAGS & CONTENT MANAGEMENT
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ View 2 JS Loaded");
    fetchView2Tags();
    fetchView2Content();
});

/**
 * ✅ Fetch tags for View 2 and display them in a vertical list
 */
async function fetchView2Tags() {
    try {
        // Fetch both tags and content data
        const [tagsResponse, contentResponse] = await Promise.all([
            fetch("/tags"),
            fetch("/content")
        ]);

        const tags = await tagsResponse.json();
        const contentData = await contentResponse.json();

        // Create a tag count dictionary
        const tagCounts = {};

        contentData.forEach(item => {
            if (Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Select the tag container
        const tagContainer = document.getElementById("view2TagList");
        tagContainer.innerHTML = ""; // Clear existing tags

        // Populate tags with counts
        tags.forEach(tag => {
            const count = tagCounts[tag.tag] || 0; // Get count or default to 0
            const tagElement = document.createElement("button");
            tagElement.classList.add("list-group-item", "list-group-item-action", "text-start", "border-0", "rounded-0");
            tagElement.textContent = `${tag.tag} (${count})`; // Append count
            tagElement.setAttribute("data-tag", tag.tag.toLowerCase());

            tagElement.onclick = () => toggleView2Tag(tagElement, tag.tag);
            tagContainer.appendChild(tagElement);
        });

        console.log("✅ View 2 Tags Loaded with Counts:", tagCounts);
    } catch (error) {
        console.error("❌ Error fetching View 2 tags:", error);
    }
}


/**
 * ✅ Toggle tag selection & filter View 2 content
 */
const activeView2Tags = new Set();

// ✅ Ensure this div exists in your HTML (above the tag list)
const selectedView2TagsContainer = document.getElementById("selectedView2Tags");


/**
 * ✅ Toggle tag selection & filter View 2 content
 */
function toggleView2Tag(element, tag) {
    const tagLower = tag.toLowerCase();

    if (activeView2Tags.has(tagLower)) {
        activeView2Tags.delete(tagLower);
        element.classList.remove("active");
    } else {
        activeView2Tags.add(tagLower);
        element.classList.add("active");
    }

    console.log("🔍 Active View 2 Tags:", [...activeView2Tags]);
    
    updateSelectedView2TagsUI();
    filterView2Content();
}

/**
 * ✅ Update the UI to show selected tags
 */
function updateSelectedView2TagsUI() {
    selectedView2TagsContainer.innerHTML = ""; // Clear previous selections

    activeView2Tags.forEach(tag => {
        const tagElement = document.createElement("span");
        tagElement.classList.add("tag-pill", "bg-primary", "text-white", "px-2", "py-1", "rounded");
        tagElement.setAttribute("data-tag", tag);
        tagElement.innerHTML = `${tag} <span class="remove-tag" onclick="removeView2Tag('${tag}')">✖</span>`;
        selectedView2TagsContainer.appendChild(tagElement);
    });
}

/**
 * ✅ Remove selected tag & reapply filtering
 */
function removeView2Tag(tag) {
    activeView2Tags.delete(tag);

    // ✅ Update selected tag display
    updateSelectedView2TagsUI();

    // ✅ Find and un-highlight the corresponding tag in the list
    const tagButtons = document.querySelectorAll("#view2TagList .list-group-item");
    tagButtons.forEach(button => {
        if (button.getAttribute("data-tag") === tag.toLowerCase()) {
            button.classList.remove("active");
        }
    });

    // ✅ Apply content filtering
    filterView2Content();
}



/**
 * ✅ Fetch & Filter View 2 content based on selected tags
 */
async function filterView2Content() {
    try {
        const response = await fetch("/content");
        let contentData = await response.json();

        if (activeView2Tags.size > 0) {
            contentData = contentData.filter(item =>
                item.tags.some(tag => activeView2Tags.has(tag.toLowerCase()))
            );
        }

        displayView2Content(contentData);
    } catch (error) {
        console.error("❌ Error filtering View 2 content:", error);
    }
}

/**
 * ✅ Fetch all content for View 2
 */
async function fetchView2Content() {
    try {
        const response = await fetch("/content");
        const contentData = await response.json();
        displayView2Content(contentData);
    } catch (error) {
        console.error("❌ Error fetching View 2 content:", error);
    }
}

/**
 * ✅ Display content blocks for View 2
 */
function displayView2Content(contentData) {
    const contentList = document.getElementById("view2ContentList");
    contentList.innerHTML = ""; // Clear previous content

    if (!Array.isArray(contentData) || contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    contentData.forEach(item => {
        const tagsHTML = item.tags.map(tag => `
            <span class="badge bg-secondary me-1">${tag}</span>
        `).join(" ");

        const card = document.createElement("div");
        card.classList.add("col-12");
        card.innerHTML = `
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    
                    
                    <p><strong>${item.question}</strong></p>
                    <p class="card-text">${item.answer}</p>
                    <span class="head3">${item.title}</span><br/>
                    <p><span class="head3">Tags:</span> ${tagsHTML}</p>
                </div>
            </div>
        `;
        contentList.appendChild(card);
    });

    console.log("✅ View 2 Content Loaded:", contentData);
}

/**
 * ✅ Filter tag list based on search input
 */
function searchView2Tags() {
    const query = document.getElementById("view2TagSearch").value.toLowerCase();
    const tags = document.querySelectorAll("#view2TagList .list-group-item");

    tags.forEach(tagElement => {
        const tagText = tagElement.textContent.toLowerCase();
        tagElement.style.display = tagText.includes(query) ? "block" : "none";
    });
}
