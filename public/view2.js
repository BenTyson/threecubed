


// 🚫 Disable console logs in production
if (location.hostname !== "localhost") {
  console.log = () => {};
  console.debug = () => {};
  console.error = () => {};
}

// =====================================================
// 📌 VIEW 2: TAGS & CONTENT MANAGEMENT
// =====================================================




document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOMContentLoaded Event Fired in View2.js");

    

    // ✅ Attach Original Post Dropdown Listeners
    const desktopDropdown = document.getElementById("originalPostFilter");
    const mobileDropdown = document.getElementById("mobileOriginalPostFilter");

    if (desktopDropdown) {
        desktopDropdown.addEventListener("change", () => {
            console.log("🖱️ Desktop Original Post dropdown changed:", desktopDropdown.value);
            filterView2Content();
        });
    }

    if (mobileDropdown) {
        mobileDropdown.addEventListener("change", () => {
            console.log("📱 Mobile Original Post dropdown changed:", mobileDropdown.value);
            filterView2Content();
        });
    }

    // ✅ Populate dropdowns
    populateOriginalPostDropdowns();

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

    // ✅ Toggle collapse state icon/text
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
/**
 * ✅ Fetch tags for View 2 and display them grouped by section,
 * and sorted by usage frequency within each section (descending)
 */
async function fetchView2Tags() {
    try {
        const [tagsResponse, contentResponse, tagSectionResponse] = await Promise.all([
            fetch("/tags"),
            fetch("/content"),
            fetch("/tag-sections")
        ]);

        const showParentTagCounts = false;
        const tags = await tagsResponse.json();
        const contentData = await contentResponse.json();
        const tagSections = await tagSectionResponse.json();

        // Count how many times each tag is used
        const tagCounts = {};
        contentData.forEach(item => {
            if (Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Group tags by their assigned section
        const groupedTags = {};
        tags.forEach(tagObj => {
            const tag = tagObj.tag;
            const match = tagSections.find(ts => ts.tag === tag);
            const section = match ? match.section : "Unassigned";

            if (!groupedTags[section]) groupedTags[section] = [];
            groupedTags[section].push(tag);
        });

        const tagContainer = getElementForContext("view2TagList");
        tagContainer.innerHTML = "";

        for (const [section, tags] of Object.entries(groupedTags)) {
            // 🔷 Create parent section button
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

            // 🎯 Click to toggle all child tags under this section
            parentButton.onclick = () => {
                tags.forEach(tag => toggleView2Tag(tag));
            };

            tagContainer.appendChild(parentButton);

            // 🔽 Sort tags in this section by usage count (desc)
            const sortedTags = [...tags].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0));

            // 🔁 Render each tag button
            sortedTags.forEach(tag => {
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

        console.log("✅ View 2 Tags Loaded, Grouped by Section, Sorted by Usage Desc");
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
        const tagElement = getElementForContext("view2TagList")?.querySelector(`.list-group-item[data-tag="${tagLower}"]`);
        let originalTag = tagLower;

        if (tagElement) {
            const tagSpan = tagElement.querySelector("span:first-child");
            if (tagSpan) {
                originalTag = tagSpan.textContent.trim();
            }
        }

        // 🔁 Function to create a tag pill (desktop or mobile)
        const createTagPill = () => {
            const pill = document.createElement("span");
            pill.classList.add("tag-pill", "bg-primary", "text-white", "px-2", "py-1", "rounded", "mb-1", "mx-1");
            pill.setAttribute("data-tag", tagLower);

            const tagText = document.createTextNode(originalTag + " ");
            pill.appendChild(tagText);

            const removeBtn = document.createElement("span");
            removeBtn.classList.add("remove-tag", "ms-2", "cursor-pointer");
            removeBtn.innerHTML = "✖";
            removeBtn.onclick = () => {
                console.log("✖ Removing tag:", tagLower);
                removeView2Tag(tagLower);
            };

            pill.appendChild(removeBtn);
            return pill;
        };

        desktopContainer.appendChild(createTagPill());
        mobileContainer.appendChild(createTagPill());
    });
}









async function filterView2Content() {
    try {
        // 🔄 Show loading spinner
        showLoader();

        // Small delay to help hide flashing (optional)
        await wait(150);

        const contentInput = getElementForContext("view2ContentSearch");
        const searchQuery = contentInput ? contentInput.value.toLowerCase().trim() : "";

        const response = await fetch("/content");
        let contentData = await response.json();

        // ✅ Apply content search
        if (searchQuery !== "") {
            contentData = contentData.filter(item =>
                (item.title && item.title.toLowerCase().includes(searchQuery)) ||
                (item.question && item.question.toLowerCase().includes(searchQuery)) ||
                (item.answer && item.answer.toLowerCase().includes(searchQuery))
            );
        }

        // ✅ Apply tag filter
        if (activeView2Tags.size > 0) {
            contentData = contentData.filter(item =>
                item.tags?.some(tag => activeView2Tags.has(tag.toLowerCase()))
            );
        }

        // ✅ Apply Original Post filter
        const desktopFilter = document.getElementById("originalPostFilter")?.value;
        const mobileFilter = document.getElementById("mobileOriginalPostFilter")?.value;
        const selectedPostTitle = window.innerWidth < 768 ? mobileFilter : desktopFilter;

        if (selectedPostTitle) {
            const normalizedSelected = selectedPostTitle.trim().toLowerCase();
            contentData = contentData.filter(item =>
                item.originalPostTitle?.trim().toLowerCase() === normalizedSelected
            );
        }

        // ✅ Show filtered content now that everything is ready
        displayView2Content(contentData);

        // ✅ Hide the spinner
        hideLoader();

    } catch (error) {
        console.error("❌ Error filtering View 2 content:", error);
        hideLoader(); // Ensure spinner is hidden even if error
    }
}












/**
 * ✅ Fetch all content for View 2
 */
async function fetchView2Content() {
  try {
    showLoader();
    const response = await fetch("/content");
    const contentData = await response.json();
    displayView2Content(contentData);
    hideLoader();
  } catch (error) {
    console.error("❌ Error fetching View 2 content:", error);
    hideLoader();
  }
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
    return text.replace(regex, `<span style="background-color: #d0f0ff; color: #000;" class="px-1 rounded">$1</span>`);

}




function displayView2Content(contentData) {
    const contentList = document.getElementById("view2ContentList");
    contentList.innerHTML = ""; // ✅ Clear previous content

    document.getElementById("totalEntries").textContent = `Entries: ${contentData.length}`;
    const totalEntriesMobile = document.getElementById("totalEntriesMobile");
    if (totalEntriesMobile) totalEntriesMobile.textContent = `Entries: ${contentData.length}`;

    if (!Array.isArray(contentData) || contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    // 🔍 Grab current search query (for highlight)
    const contentInput = getElementForContext("view2ContentSearch");
    const searchQuery = contentInput ? contentInput.value.trim() : "";

    contentData.forEach((item, index) => {
        console.log("🧪 Card Entry:", item);
        const tagsHTML = item.tags.map(tag => {
            const tagLower = tag.toLowerCase();
            const isSelected = activeView2Tags.has(tagLower)
                ? "bg-info text-white"
                : "bg-light text-dark";
            return `<span class="badge ${isSelected} me-1" style="font-weight: 400;">${tag}</span>`;
        }).join(" ");

        const highlightedTitle = highlightSearchTerm(item.title || "", searchQuery);

        const card = document.createElement("div");
        card.classList.add("col-12", "content-block");

        let cardHTML = `
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
        `;

        // 🧠 Decide rendering logic based on messageType
        if ((item.messageType || "").toLowerCase() === "q & a") {
            const highlightedQuestion = highlightSearchTerm(item.question || "", searchQuery);
            const highlightedAnswer = highlightSearchTerm(item.answer || "", searchQuery);
            const formattedAnswer = highlightedAnswer
                .split("\n")
                .map(para => `<p>${para.trim()}</p>`)
                .join("");

            cardHTML += `
                <p class="contentQuestion"><strong>${highlightedQuestion}</strong></p>
                <div class="card-text contentAnswer">${formattedAnswer}</div>
            `;
        } else {
            // 🆕 Blog or other message types
            const highlightedIntro = highlightSearchTerm(item.passageIntro || "", searchQuery);
            const highlightedContent = highlightSearchTerm(item.passageContent || "", searchQuery);
            const formattedContent = highlightedContent
                .split("\n")
                .map(para => `<p>${para.trim()}</p>`)
                .join("");

            if (highlightedIntro) {
                cardHTML += `<p class="contentIntro"><em>${highlightedIntro}</em></p>`;
            }

            cardHTML += `<div class="card-text contentPassage">${formattedContent}</div>`;
        }

        cardHTML += `
            <span class="head3">${highlightedTitle}</span><br/>
            <p>${tagsHTML}</p>
                </div>
            </div>
        `;

        card.innerHTML = cardHTML;
        contentList.appendChild(card);

        // 🌀 Fade-in animation
        setTimeout(() => {
            card.classList.add("show");
        }, index * 50);
    });

    console.log("✅ View 2 Content Updated with Q&A/Blog Switching");
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




async function populateOriginalPostDropdowns() {
    try {
        const response = await fetch("/original-posts");
        let posts = await response.json();

        // ✅ Sort by numeric prefix in title (e.g., "001 - Some Title")
        posts.sort((a, b) => {
            const getPartNumber = title => {
                const match = title.match(/Part\s+(\d+)/i);
                return match ? parseInt(match[1]) : 0;
            };

            return getPartNumber(a.title) - getPartNumber(b.title);
        });


        const desktopDropdown = document.getElementById("originalPostFilter");
        const mobileDropdown = document.getElementById("mobileOriginalPostFilter");

        // Clear existing options
        desktopDropdown.innerHTML = '<option value="">All Posts</option>';
        mobileDropdown.innerHTML = '<option value="">All Posts</option>';

        // Add sorted options
        posts.forEach(post => {
            const option = new Option(post.title, post.title);
            desktopDropdown.appendChild(option.cloneNode(true));
            mobileDropdown.appendChild(option);
        });

        console.log("✅ Original Post Dropdowns Populated & Sorted");
        console.log("📦 Posts fetched from /original-posts:", posts);

    } catch (error) {
        console.error("❌ Error populating original post dropdowns:", error);

    }
}





function showLoader() {
    const loader = document.getElementById("contentLoader");
    const contentList = document.getElementById("view2ContentList");
    if (loader) loader.style.display = "block";
    if (contentList) contentList.style.display = "none";
}

function hideLoader() {
    const loader = document.getElementById("contentLoader");
    const contentList = document.getElementById("view2ContentList");
    if (loader) loader.style.display = "none";
    if (contentList) contentList.style.display = "flex";
}

// Optional delay helper (to simulate smoother UX)
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



