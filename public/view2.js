// =====================================================
// 📌 VIEW 2: TAGS & CONTENT MANAGEMENT
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ View 2 JS Loaded");
    fetchView2Tags();
    fetchView2Content();
});

/**
 * ✅ Fetch tags for View 2 and display them with Bootstrap badges
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

        // Populate tags with counts (using Bootstrap badges)
        tags.forEach(tag => {
            const count = tagCounts[tag.tag] || 0; // Get count or default to 0
            const tagElement = document.createElement("button");

            tagElement.classList.add(
                "list-group-item",
                "list-group-item-action",
                "text-start",
                "border-0",
                "rounded-0",
                "d-flex",
                "justify-content-between",
                "align-items-center"
            );
            tagElement.setAttribute("data-tag", tag.tag.toLowerCase());
            tagElement.onclick = () => toggleView2Tag(tagElement, tag.tag);
            tagElement.style.fontSize = "0.85rem"; // ✅ Reduce font size

            tagElement.innerHTML = `
                <span>${tag.tag}</span>
                <span class="badge bg-light text-dark">${count}</span> 
            `;

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
 * ✅ Toggle tag selection & hide from list
 */
function toggleView2Tag(element, tag) {
    const tagLower = tag.toLowerCase();

    if (activeView2Tags.has(tagLower)) {
        activeView2Tags.delete(tagLower);
        element.style.display = "block"; // ✅ Show tag again in list
    } else {
        activeView2Tags.add(tagLower);
        element.style.display = "none"; // ✅ Hide tag from list
    }

    console.log("🔍 Active View 2 Tags:", [...activeView2Tags]);
    
    updateSelectedView2TagsUI();
    filterView2Content();
}

/**
 * ✅ Remove selected tag & show it again in the tag list
 */
function removeView2Tag(tag) {
    activeView2Tags.delete(tag);

    // ✅ Update selected tag display
    updateSelectedView2TagsUI();

    // ✅ Find and show the corresponding tag in the list
    const tagButtons = document.querySelectorAll("#view2TagList .list-group-item");
    tagButtons.forEach(button => {
        if (button.getAttribute("data-tag") === tag.toLowerCase()) {
            button.style.display = "block"; // ✅ Show it back in the list
        }
    });

    // ✅ Apply content filtering
    filterView2Content();
}


/**
 * ✅ Update the UI to show selected tags while maintaining capitalization
 */
function updateSelectedView2TagsUI() {
    selectedView2TagsContainer.innerHTML = ""; // Clear previous selections

    activeView2Tags.forEach(tagLower => {
        // ✅ Find the original capitalization from the tag list
        const tagElement = document.querySelector(`#view2TagList .list-group-item[data-tag="${tagLower}"]`);
        
        let originalTag = tagLower; // Default fallback

        if (tagElement) {
            // Extract only the tag name, ignoring the count badge
            const tagSpan = tagElement.querySelector("span:first-child"); // Selects the first <span> inside the button
            if (tagSpan) {
                originalTag = tagSpan.textContent.trim(); // Use the proper capitalization
            }
        }

        // ✅ Create the selected tag element
        const selectedTag = document.createElement("span");
        selectedTag.classList.add("tag-pill", "bg-primary", "text-white", "px-2", "py-1", "rounded", "mb-1");
        selectedTag.setAttribute("data-tag", tagLower);

        // ✅ Create the "X" button properly and add event listener
        const removeButton = document.createElement("span");
        removeButton.classList.add("remove-tag", "ms-2", "cursor-pointer");
        removeButton.innerHTML = "✖";
        
        // ✅ Correctly attach event listener using an inline function
        removeButton.onclick = function() {
            removeView2Tag(tagLower); // ✅ Ensure function is called with lowercase tag
        };

        selectedTag.appendChild(document.createTextNode(originalTag + " "));
        selectedTag.appendChild(removeButton);
        selectedView2TagsContainer.appendChild(selectedTag);
    });
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

function displayView2Content(contentData) {
    const contentList = document.getElementById("view2ContentList");
    contentList.innerHTML = ""; // ✅ Clear previous content

    if (!Array.isArray(contentData) || contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    contentData.forEach((item, index) => {
        const tagsHTML = item.tags.map(tag => {
            const tagLower = tag.toLowerCase();
            const isSelected = activeView2Tags.has(tagLower) ? "bg-info text-white" : "bg-light text-dark"; // ✅ Change bg if selected

            return `<span class="badge ${isSelected} me-1">${tag}</span>`;
        }).join(" ");

        const card = document.createElement("div");
        card.classList.add("col-12", "content-block"); // ✅ Apply animation class
        card.innerHTML = `
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    <p><strong>${item.question}</strong></p>
                    <p class="card-text">${item.answer}</p>
                    <span class="head3">${item.title}</span><br/>
                    <p>${tagsHTML}</p>
                </div>
            </div>
        `;

        contentList.appendChild(card);

        // ✅ Delay adding "show" class to create a staggered effect
        setTimeout(() => {
            card.classList.add("show");
        }, index * 50); // Stagger each card by 50ms
    });

    console.log("✅ View 2 Content Updated with Selected Tag Highlighting");
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
