document.addEventListener("DOMContentLoaded", () => {
    loadTags(); // ✅ Load tags on page load
});

// ✅ Global variables to store tags
let availableTags = [];
let selectedTags = new Set(); // ✅ Tracks selected tags

// ✅ Load existing tags into dropdown
async function loadTags() {
    try {
        const response = await fetch("/tags");
        availableTags = await response.json();
        updateTagDropdown(""); // ✅ Populate dropdown
    } catch (error) {
        console.error("❌ Error loading tags:", error);
    }
}

// ✅ Filter dropdown options as user types
function filterTagDropdown() {
    const searchInput = document.getElementById("tagSearchInput").value.toLowerCase();
    updateTagDropdown(searchInput);
}

// ✅ Update the tag dropdown dynamically (WITHOUT "Select a tag")
function updateTagDropdown(filter) {
    const tagDropdown = document.getElementById("tagDropdown");
    tagDropdown.innerHTML = ""; // ✅ Clear existing options

    // ✅ Filter and display matching tags
    availableTags
        .filter(tag => tag.tag.toLowerCase().includes(filter))
        .forEach(tag => {
            const option = document.createElement("option");
            option.value = tag.tag;
            option.textContent = tag.tag;
            tagDropdown.appendChild(option);
        });

    // ✅ Keep dropdown open
    tagDropdown.size = availableTags.length > 5 ? 5 : availableTags.length + 1;
}

// ✅ Select a tag and apply filtering
function selectTag() {
    const tagDropdown = document.getElementById("tagDropdown");
    const selectedTag = tagDropdown.value;

    if (!selectedTag || selectedTags.has(selectedTag)) return; // ✅ Avoid duplicates

    selectedTags.add(selectedTag); // ✅ Track selected tags
    updateSelectedTagsUI();
    filterContent(); // ✅ Apply filtering
}


// ✅ Remove selected tag & reapply filtering
function removeTag(tag) {
    selectedTags.delete(tag);
    updateSelectedTagsUI();
    filterContent(); // ✅ Apply filtering
}

// ✅ Update the UI for selected tags
function updateSelectedTagsUI() {
    const tagContainer = document.getElementById("selectedTagsContainer");
    tagContainer.innerHTML = ""; // ✅ Clear previous selection

    selectedTags.forEach(tag => {
        const tagElement = document.createElement("span");
        tagElement.classList.add("tag-pill", "bg-primary", "text-white", "px-2", "py-1", "rounded");
        tagElement.setAttribute("data-tag", tag);
        tagElement.innerHTML = `${tag} <span class="remove-tag" onclick="removeTag('${tag}')">✖</span>`;
        tagContainer.appendChild(tagElement);
    });
}

// ✅ Apply filtering logic to content
async function filterContent() {
    const searchQuery = document.getElementById("search").value.toLowerCase();
    const selectedCategory = document.getElementById("categoryFilter").value;

    try {
        const response = await fetch("/content");
        let contentData = await response.json(); // ✅ Fetch content

        console.log("📌 Full Content Data Before Filtering:", contentData); // Debugging

        // ✅ Ensure all tags are lowercase for matching
        contentData = contentData.map(item => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags.map(tag => tag.toLowerCase()) : []
        }));

        console.log("🎯 Selected Tags:", [...selectedTags]); // Debugging

        contentData = contentData.filter(item => {
            const title = item.title ? item.title.toLowerCase() : "";
            const answer = item.answer ? item.answer.toLowerCase() : "";
            const tags = item.tags || [];

            const matchesSearch = (
                title.includes(searchQuery) || 
                answer.includes(searchQuery) || 
                tags.some(tag => tag.includes(searchQuery))
            );

            const matchesCategory = (selectedCategory === "All Categories" || item.category === selectedCategory);

            const matchesTags = (selectedTags.size === 0 || [...selectedTags].every(tag => tags.includes(tag.toLowerCase())));

            console.log(`🔍 Checking Item: ${item.title}`);
            console.log(`✅ Tags in Item: ${tags}`);
            console.log(`✅ Matches Search? ${matchesSearch}`);
            console.log(`✅ Matches Category? ${matchesCategory}`);
            console.log(`✅ Matches Selected Tags? ${matchesTags}`);

            return matchesSearch && matchesCategory && matchesTags;
        });

        console.log("📌 Filtered Content:", contentData); // Debugging

        displayContent(contentData); // ✅ Display filtered content
    } catch (error) {
        console.error("❌ Error filtering content:", error);
    }
}
