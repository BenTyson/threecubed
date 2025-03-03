// =====================================================
// 📌 VIEW 2: TAGS & CONTENT MANAGEMENT
// =====================================================


document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOMContentLoaded Event Fired in View2.js");

    // ✅ Attach Tag Search Event Listener
    const tagSearchBox = document.getElementById("view2TagSearch");
    console.log("🔍 Checking for Tag Search Box:", tagSearchBox);

    if (tagSearchBox) {
        tagSearchBox.addEventListener("input", () => {
            console.log("🔍 Tag search triggered");
            searchView2Tags();
        });
        console.log("✅ Tag Search Box Found and Event Listener Attached");
    } else {
        console.error("❌ Tag Search Box NOT found inside DOMContentLoaded");
    }

    // ✅ Attach Content Search Event Listener
    const contentSearchBox = document.getElementById("view2ContentSearch");
    console.log("🔍 Checking for Content Search Box:", contentSearchBox);

    if (contentSearchBox) {
        contentSearchBox.addEventListener("input", () => {
            console.log("🔍 Content search triggered");
            filterView2Content();
        });
        console.log("✅ Content Search Box Found and Event Listener Attached");
    } else {
        console.error("❌ Content Search Box NOT found inside DOMContentLoaded");
    }


    const tagToggleButton = document.querySelector('[data-bs-target="#view2TagList"]');
    const tagToggleText = document.getElementById("tagToggleText");
    const tagToggleIcon = document.getElementById("tagToggleIcon");

    if (tagToggleButton) {
        tagToggleButton.addEventListener("click", () => {
            const isExpanded = tagToggleButton.getAttribute("aria-expanded") === "true";
            tagToggleText.textContent = isExpanded ? "Hide Tags" : "Select Tags";
            tagToggleIcon.textContent = isExpanded ? "▲" : "▼";
        });
    }


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
            tagElement.onclick = () => toggleView2Tag(tag.tag);

            tagElement.style.fontSize = "0.79rem"; // ✅ Reduce font size

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


function toggleView2Tag(tag) {
    if (typeof tag !== "string") {
        console.error("❌ toggleView2Tag received a non-string value:", tag);
        return;
    }

    const tagLower = tag.toLowerCase();
    const tagElements = document.querySelectorAll(`#view2TagList .list-group-item[data-tag="${tagLower}"]`);

    if (activeView2Tags.has(tagLower)) {
        activeView2Tags.delete(tagLower);

        // ✅ Show the tag again in the list
        tagElements.forEach(tagElement => {
            tagElement.style.setProperty("display", "block", "important");
        });

    } else {
        activeView2Tags.add(tagLower);

        // ✅ Hide the tag from the list
        tagElements.forEach(tagElement => {
            tagElement.style.setProperty("display", "none", "important");
        });
    }

    // ✅ Update selected tag display
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
 * ✅ Apply filtering logic for content based on search & selected tags
 */
async function filterView2Content() {
    try {
        const searchQuery = document.getElementById("view2ContentSearch").value.toLowerCase(); // ✅ Get content search input
        const response = await fetch("/content");
        let contentData = await response.json(); // ✅ Fetch all content

        // ✅ Apply Content Search Filtering
        if (searchQuery.trim() !== "") {
            contentData = contentData.filter(item => 
                (item.title && item.title.toLowerCase().includes(searchQuery)) || 
                (item.question && item.question.toLowerCase().includes(searchQuery)) || 
                (item.answer && item.answer.toLowerCase().includes(searchQuery))
            );
        }

        // ✅ Apply Tag Selection Filtering
        if (activeView2Tags.size > 0) {
            contentData = contentData.filter(item =>
                item.tags.some(tag => activeView2Tags.has(tag.toLowerCase()))
            );
        }

        displayView2Content(contentData); // ✅ Update content display
    } catch (error) {
        console.error("❌ Error filtering View 2 content:", error);
    }
}


async function fetchReaderContent() {
    try {
        const response = await fetch("/content");  // ✅ Ensure this URL is correct
        let contentData = await response.json();
        
        console.log("📥 Fetched Content Data:", contentData);
        console.log("📥 Number of Entries Fetched:", contentData.length);

        displayReaderContent(contentData);
    } catch (error) {
        console.error("❌ Error fetching Reader content:", error);
    }
}

function displayReaderContent(contentData) {
    const contentList = document.getElementById("readerContentList");
    
    if (!contentList) {
        console.error("❌ readerContentList element not found!");
        return;
    }

    if (!Array.isArray(contentData) || contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    contentList.innerHTML = ""; // ✅ Clear previous content

    contentData.forEach((item, index) => {
        console.log(`📌 Adding Post ${index + 1}:`, item.title); // ✅ Debug each post

        const tagsHTML = item.tags
            ? item.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join(" ")
            : "";

        const formattedAnswer = item.answer
            .split("\n") // ✅ Convert paragraphs
            .map(para => `<p>${para.trim()}</p>`)
            .join("");

        const card = document.createElement("div");
        card.classList.add("col-12", "content-block");
        card.innerHTML = `
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    <p><strong>${item.question}</strong></p>
                    <div class="card-text">${formattedAnswer}</div>
                    <span class="head3">${item.title}</span><br/>
                    <p>${tagsHTML}</p>
                </div>
            </div>
        `;

        contentList.appendChild(card);
    });

    console.log(`✅ Total Posts Rendered: ${contentData.length}`);
}

// ✅ Load the content when the page is ready
document.addEventListener("DOMContentLoaded", fetchReaderContent);


function displayView2Content(contentData) {
    const contentList = document.getElementById("view2ContentList");

    if (!Array.isArray(contentData) || contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    contentList.innerHTML = ""; // ✅ Clear previous content

    contentData.forEach((item, index) => {
        console.log(`📌 Adding Post ${index + 1}:`, item.title); // ✅ Debug each post

        const tagsHTML = item.tags.map(tag => {
            const tagLower = tag.toLowerCase();
            const isSelected = activeView2Tags.has(tagLower) ? "bg-info text-white" : "bg-light text-dark";
            return `<span class="badge ${isSelected} me-1">${tag}</span>`;
        }).join(" ");

        const formattedAnswer = item.answer
            .split("\n")
            .map(para => `<p>${para.trim()}</p>`)
            .join("");

        const card = document.createElement("div");
        card.classList.add("col-12", "content-block");
        card.innerHTML = `
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    <p><strong>${item.question}</strong></p>
                    <div class="card-text">${formattedAnswer}</div>
                    <span class="head3">${item.title}</span><br/>
                    <p>${tagsHTML}</p>
                </div>
            </div>
        `;

        contentList.appendChild(card);
    });

    // ✅ Force reflow to ensure visibility
    setTimeout(() => {
        contentList.style.height = `${contentList.scrollHeight}px`;
        contentList.style.overflowY = "auto";
        console.log("📌 Updated Content List Height:", contentList.scrollHeight);
    }, 100);

    console.log(`✅ Total Posts Rendered: ${contentData.length}`);
}





function searchView2Tags() {
    const query = document.getElementById("view2TagSearch").value.toLowerCase();
    console.log("🔍 Searching for:", query);

    const tagElements = document.querySelectorAll("#view2TagList .list-group-item");

    if (!tagElements.length) {
        console.warn("⚠️ No tags found in the list!");
        return;
    }

    tagElements.forEach(tagElement => {
        const tagSpan = tagElement.querySelector("span:first-child");
        const tagText = tagSpan ? tagSpan.textContent.trim().toLowerCase() : "";

        const shouldShow = tagText.includes(query);

        // ✅ Force `display: none` or `display: block` with `!important`
        tagElement.style.setProperty("display", shouldShow ? "block" : "none", "important");

        console.log(`🔍 Checking Tag: "${tagText}" - Displaying: ${shouldShow ? "✅ YES" : "❌ NO"}`);
    });
}