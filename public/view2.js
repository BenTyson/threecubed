// =====================================================
// 📌 VIEW 2: TAGS & CONTENT MANAGEMENT
// =====================================================


document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOMContentLoaded Event Fired in View2.js");

    // ✅ Attach Tag Search Event Listener
    const tagSearchBox = getElementForContext("view2TagSearch");

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
    const contentSearchBox = getElementForContext("view2ContentSearch");
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


function getElementForContext(id) {
    const isMobile = window.innerWidth < 768;
    return isMobile
        ? document.getElementById("mobile" + id.charAt(0).toUpperCase() + id.slice(1))
        : document.getElementById(id);
}




/**
 * ✅ Fetch tags for View 2 and display them with Bootstrap badges
 */
async function fetchView2Tags() {
    try {
        // Fetch tags, tag-section assignments, and content
        const [tagsResponse, contentResponse, tagSectionResponse] = await Promise.all([
            fetch("/tags"),
            fetch("/content"),
            fetch("/tag-sections")
        ]);

        const showParentTagCounts = false; // 👈 Set to false to hide counts
        const tags = await tagsResponse.json();
        const contentData = await contentResponse.json();
        const tagSections = await tagSectionResponse.json();

        // Create a tag count dictionary
        const tagCounts = {};
        contentData.forEach(item => {
            if (Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Group tags by section
        const groupedTags = {};
        tags.forEach(tagObj => {
            const tag = tagObj.tag;
            const match = tagSections.find(ts => ts.tag === tag);
            const section = match ? match.section : "Unassigned";

            if (!groupedTags[section]) groupedTags[section] = [];
            groupedTags[section].push(tag);
        });

        // Select the tag container and clear it
        const tagContainer = getElementForContext("view2TagList");

        tagContainer.innerHTML = "";

        for (const [section, tags] of Object.entries(groupedTags)) {
            // 👉 Create parent (section) button
            const parentButton = document.createElement("button");
            parentButton.classList.add(
                "list-group-item",
                "list-group-item-action",
                "text-start",
                "bg-light",
                "text-dark",
                "fw-bold",
                "mb-1",
                "py-1",
                "px-2",
                "border-0",
                "d-flex",                 
                "justify-content-between", 
                "align-items-center"       
            );
            parentButton.style.fontSize = "0.75rem";
            parentButton.style.padding = "0.25rem 0.5rem";

            const totalTagsInSection = tags.length;

            parentButton.innerHTML = `
                <span>${section}</span>
                ${
                    showParentTagCounts
                        ? `<span class="badge bg-secondary text-white rounded-circle px-2 py-1" style="min-width: 1.5rem; text-align: center;">${totalTagsInSection}</span>`
                        : ""
                }
            `;

            // 🎯 On click, toggle all child tags under this parent
            parentButton.onclick = () => {
                tags.forEach(tag => toggleView2Tag(tag));
            };

            tagContainer.appendChild(parentButton);

            // 👉 Render each child tag under this parent
            tags.forEach(tag => {
                const count = tagCounts[tag] || 0;
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
                tagElement.setAttribute("data-tag", tag.toLowerCase());
                tagElement.onclick = () => toggleView2Tag(tag);

                tagElement.style.fontSize = "0.79rem";

                tagElement.innerHTML = `
                    <span>${tag}</span>
                    <span class="badge bg-light text-dark">${count}</span>
                `;

                tagContainer.appendChild(tagElement);
            });
        }

        console.log("✅ View 2 Tags Loaded and Grouped by Parent");
    } catch (error) {
        console.error("❌ Error fetching View 2 tags:", error);
    }
}





/**
 * ✅ Toggle tag selection & filter View 2 content
 */
const activeView2Tags = new Set();

// ✅ Ensure this div exists in your HTML (above the tag list)
const selectedView2TagsContainer = getElementForContext("selectedView2Tags");


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
    const tagButtons = getElementForContext("view2TagList")?.querySelectorAll(".list-group-item")
;
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
    const desktopContainer = document.getElementById("selectedView2Tags");
    const mobileContainer = document.getElementById("selectedView2TagsMobile");

    // Clear both containers
    desktopContainer.innerHTML = "";
    mobileContainer.innerHTML = "";

    activeView2Tags.forEach(tagLower => {
        // Get the original capitalization
        const tagElement = getElementForContext("view2TagList")?.querySelector(`.list-group-item[data-tag="${tagLower}"]`)
;
        let originalTag = tagLower;

        if (tagElement) {
            const tagSpan = tagElement.querySelector("span:first-child");
            if (tagSpan) {
                originalTag = tagSpan.textContent.trim();
            }
        }

        // Create tag pill
        const tagPill = document.createElement("span");
        tagPill.classList.add("tag-pill", "bg-primary", "text-white", "px-2", "py-1", "rounded", "mb-1");
        tagPill.setAttribute("data-tag", tagLower);

        const removeBtn = document.createElement("span");
        removeBtn.classList.add("remove-tag", "ms-2", "cursor-pointer");
        removeBtn.innerHTML = "✖";
        removeBtn.onclick = function () {
            removeView2Tag(tagLower);
        };

        tagPill.appendChild(document.createTextNode(originalTag + " "));
        tagPill.appendChild(removeBtn);

        // Append to both containers
        desktopContainer.appendChild(tagPill.cloneNode(true));
        mobileContainer.appendChild(tagPill);
    });
}







async function filterView2Content() {
    try {
        const contentInput = getElementForContext("view2ContentSearch");
        const searchQuery = contentInput ? contentInput.value.toLowerCase().trim() : "";

        const response = await fetch("/content");
        let contentData = await response.json(); 

        // ✅ Apply Content Search Filtering
        if (searchQuery !== "") {
            contentData = contentData.filter(item =>
                (item.title && item.title.toLowerCase().includes(searchQuery)) ||
                (item.question && item.question.toLowerCase().includes(searchQuery)) ||
                (item.answer && item.answer.toLowerCase().includes(searchQuery))
            );
        }

        // ✅ Apply Tag Selection Filtering (Strict Matching)
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


    // ✅ Update Total Entries Count
    document.getElementById("totalEntries").textContent = `Entries: ${contentData.length}`;


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

        // ✅ Ensure proper paragraph formatting
        const formattedAnswer = item.answer
            .split("\n") // Split into paragraphs
            .map(para => `<p>${para.trim()}</p>`) // Wrap in <p> tags
            .join(""); // Join them as HTML

        const card = document.createElement("div");
        card.classList.add("col-12", "content-block"); // ✅ Apply animation class
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

        // ✅ Delay adding "show" class to create a staggered effect
        setTimeout(() => {
            card.classList.add("show");
        }, index * 50); // Stagger each card by 50ms
    });

    console.log("✅ View 2 Content Updated with Proper Paragraph Formatting");
}



function searchView2Tags() {
    const tagInput = getElementForContext("view2TagSearch");
    const query = tagInput ? tagInput.value.toLowerCase() : "";
    console.log("🔍 Searching for:", query);

    const tagElements = getElementForContext("view2TagList")?.querySelectorAll(".list-group-item") || [];

    if (!tagElements.length) {
        console.warn("⚠️ No tags found in the list!");
        return;
    }

    tagElements.forEach(tagElement => {
        const tagSpan = tagElement.querySelector("span:first-child");
        const tagText = tagSpan ? tagSpan.textContent.trim().toLowerCase() : "";

        const shouldShow = tagText.includes(query);
        tagElement.style.setProperty("display", shouldShow ? "block" : "none", "important");
    });
}



function highlightSearchTerm(text, searchQuery) {
    if (!searchQuery) return text; // No search term, return original text
    const regex = new RegExp(`(${searchQuery})`, "gi"); // Case-insensitive search
    return text.replace(regex, `<span class="bg-info text-white px-1 rounded">$1</span>`);
}




async function toggleView2ParentSection(sectionName) {
    try {
        // Fetch all tag-to-section mappings
        const response = await fetch("/tag-sections");
        const tagSections = await response.json();

        // 🧠 Find tags that belong to the selected section
        const sectionTags = tagSections
            .filter(ts => ts.section.toLowerCase() === sectionName.toLowerCase())
            .map(ts => ts.tag.toLowerCase());

        // 🔁 Toggle each tag (add if not already selected, remove if selected)
        let isSelecting = false;
        for (let tag of sectionTags) {
            if (!activeView2Tags.has(tag)) {
                isSelecting = true;
                break;
            }
        }

        sectionTags.forEach(tag => {
            if (isSelecting) {
                // ✅ Add tag
                if (!activeView2Tags.has(tag)) activeView2Tags.add(tag);
                const tagEl = document.querySelector(`#view2TagList .list-group-item[data-tag="${tag}"]`);
                if (tagEl) tagEl.style.setProperty("display", "none", "important");
            } else {
                // ❌ Remove tag
                activeView2Tags.delete(tag);
                const tagEl = document.querySelector(`#view2TagList .list-group-item[data-tag="${tag}"]`);
                if (tagEl) tagEl.style.setProperty("display", "block", "important");
            }
        });

        updateSelectedView2TagsUI();
        filterView2Content();

        console.log(`🔄 ${isSelecting ? "Selected" : "Deselected"} all tags under section:`, sectionName);

    } catch (err) {
        console.error("❌ Error toggling parent section:", err);
    }
}

