// =====================================================
//  📌 PAGE LOAD & VIEW MANAGEMENT
// =====================================================

// Toggle between Creator, Viewer, Organizer, Dev, and View 2 sections
function showSection(section) {
    document.getElementById("creator").style.display = section === "creator" ? "block" : "none";
    document.getElementById("organizer").style.display = section === "organizer" ? "block" : "none";
    document.getElementById("viewer").style.display = section === "viewer" ? "block" : "none";
    document.getElementById("viewer2").style.display = section === "viewer2" ? "block" : "none"; // ✅ Added View 2
    document.getElementById("dev").style.display = section === "dev" ? "block" : "none"; // ✅ Dev Section
    document.getElementById("tags").style.display = section === "tags" ? "block" : "none"; // ✅ Show Tags Section


    if (section === "organizer" || section === "creator") {
        fetchMessageTypes(); // ✅ Ensure this runs when switching to "Organize"
        fetchOriginalPosts();
    }





    document.querySelectorAll(".nav-link").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`[onclick="showSection('${section}')"]`).classList.add("active");

    // ✅ Fetch tags and content ONLY when View 2 is activated (Prevents unnecessary API calls)
    if (section === "viewer2") {
        fetchView2Tags();
        fetchView2Content();
    }

    // ✅ Load tags when entering the "Tags" tab
    if (section === "tags") {
        loadTags();  
    }
}





let quill;

// Ensure the app starts in Viewer mode and loads necessary data
document.addEventListener("DOMContentLoaded", () => {
    showSection("tags");
    fetchTags();  
    fetchContent();
    fetchOriginalPosts();
    fetchMessageTypes();

    // ✅ Initialize Quill Editor for Question
    questionQuill = new Quill("#newQuestion", {
        theme: "snow",
        modules: { toolbar: "#questionToolbar" }
    });

    // ✅ Initialize Quill Editor for Answer (Existing)
    quill = new Quill("#newMessage", {
        theme: "snow",
        modules: { toolbar: "#answerToolbar" }
    });
});

if (window.MutationObserver) {
    const observer = new MutationObserver(() => {
        console.log("Mutation observed (instead of deprecated event)");
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
} else {
    console.warn("Your browser doesn't support MutationObserver.");
}




// =====================================================
//  📌 CONTENT MANAGEMENT
// =====================================================

let contentData = []; // Declare globally

// Fetch and display content blocks
async function fetchContent() {
    try {
        const response = await fetch("/content");
        contentData = await response.json();  // ✅ Update global contentData
        displayContent(contentData);         // ✅ Pass the updated data
    } catch (error) {
        console.error("Error fetching content:", error);
    }
}


// Display content blocks with full answer and action buttons
function displayContent(contentData) {
    console.log("📌 Displaying Content:", contentData); // ✅ Log displayed content

    const contentList = document.getElementById("contentList");
    contentList.innerHTML = ""; // ✅ Clear previous content

    if (!Array.isArray(contentData) || contentData.length === 0) {
        contentList.innerHTML = "<p>No content available.</p>";
        return;
    }

    contentData.forEach(item => {
        console.log("🖥️ Displaying:", item.title); // ✅ Confirm content is showing

        const tagsHTML = item.tags.map(tag => `
            <span class="badge tag-filter bg-secondary me-1" data-tag="${tag}" onclick="removeTag('${tag}')">${tag}</span>
        `).join(" ");

        const card = document.createElement("div");
        card.classList.add("col-12");

        card.innerHTML = `
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    <p><strong>${item.question}</strong></p>
                    <p class="card-text">${item.answer}</p> <!-- ✅ Full Answer is now displayed -->

                    <p>
                        <span class="head3">ID:</span> <span class="head4">${item.title}</span><br/>
                        <span class="head3">Category:</span> <span class="head4">${item.category}</span><br/>
                        <span class="head3">Message Type:</span> <span class="head4">${item.messageType}</span> <br/>
                        <span class="head3">Tags:</span> <span class="head4">${tagsHTML}</span>
                    </p>

                    <!-- ✅ Edit & Delete Buttons Restored -->
                    <button class="btn btn-edit btn-outline-dark btn-sm mt-2" onclick="editContent('${item._id}', '${item.title}', '${item.category}', '${JSON.stringify(item.tags)}', '${encodeURIComponent(item.question)}', '${encodeURIComponent(item.answer)}', '${item.messageType}', '${item.originalPost}')">
                        <span class="material-icons icon-small">edit</span>
                    </button>
                    <!--<button class="btn btn-danger btn-sm mt-2" onclick="confirmDeleteContent('${item._id}')">
                        <span class="material-icons icon-small">delete</span>
                    </button>-->
                </div>
            </div>
        `;

        contentList.appendChild(card);
    });
}










// Function to Open Full-Screen Modal with Full Content
async function expandMessage(contentId) {
    // Get the content block data
    const content = contentData.find(item => item._id === contentId);
    if (!content) return;

    // ✅ Format tags consistently
    const tagsHTML = content.tags.map(tag => `
        <span class="badge tag-filter bg-secondary me-1">${tag}</span>
    `).join(" ");

    // ✅ Handle Original Post (If available)
    let originalPostHTML = `<span class="text-muted">None</span>`; // Default if no original post

    if (content.originalPost) {
        try {
            // Fetch the list of original posts to find the title associated with the stored URL
            const response = await fetch("/original-posts");
            const originalPosts = await response.json();

            // Find the matching original post based on the URL
            const matchedPost = originalPosts.find(post => post.url === content.originalPost);

            if (matchedPost) {
                // Display the actual title as a clickable link
                originalPostHTML = `
                    <a href="${matchedPost.url}" target="_blank" class="head4">${matchedPost.title}</a>
                `;
            }
        } catch (error) {
            console.error("❌ Error fetching original posts:", error);
        }
    }

    // ✅ Populate modal fields
    document.getElementById("modalTitle").textContent = content.title;

    const modalBody = document.getElementById("modalMessage");
    modalBody.innerHTML = `
        <p><strong>${content.question}</strong></p>
        <p>${content.answer}</p>
        <br/>
        <p><span class="head3">Category:</span> <span class="head4">${content.category}</span><br/>
        <span class="head3">Message Type:</span> <span class="head4">${content.messageType}</span> <br/>
        <span class="head3">Original Post:</span> ${originalPostHTML}<br/>
        <span class="head3">Tags:</span> <span class="head4">${tagsHTML}</span></p>
    `;

    // Show the Bootstrap Modal
    const contentModal = new bootstrap.Modal(document.getElementById("contentModal"));
    contentModal.show();
}








// Add a new content block
async function addNewContent() {
    const newTitle = document.getElementById("newTitle").value.trim();
    const newCategory = document.getElementById("categorySelect").value.trim();
    const newMessageType = document.getElementById("messageTypeSelect").value;
    const newTagsDropdown = document.getElementById("newTags");
    const newTags = Array.from(newTagsDropdown.selectedOptions).map(option => option.value);
    const originalPost = document.getElementById("originalPostSelect").value;

    // ✅ Ensure Quill Editors are correctly initialized
    const newQuestion = questionQuill ? questionQuill.root.innerHTML.trim() : "";
    const newAnswer = quill ? quill.root.innerHTML.trim() : "";

    // ✅ Debugging Logs
    console.log("📝 New Question:", newQuestion);
    console.log("📝 New Answer:", newAnswer);

    if (!newTitle || !newCategory || !newQuestion || !newAnswer) {
        alert("Title, category, question, and answer are required.");
        return;
    }

    const contentData = { 
        title: newTitle, 
        category: newCategory, 
        tags: newTags, 
        question: newQuestion, 
        answer: newAnswer, 
        messageType: newMessageType, 
        originalPost: originalPost 
    };

    console.log("📤 Sending Content Data:", contentData);

    try {
        const response = await fetch("/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contentData)
        });

        const textResponse = await response.text();
        console.log("📥 Raw Server Response:", textResponse);

        const jsonResponse = JSON.parse(textResponse);
        console.log("✅ Parsed JSON:", jsonResponse);

        if (response.ok) {
            console.log("✅ Content block added successfully.");
            fetchContent();
            showSuccessModal("Transmission Received!");
        } else {
            console.error("❌ Failed to add content block.");
        }
    } catch (error) {
        console.error("❌ Error adding content block:", error);
    }
}



function showSuccessModal(message, modalId = "successModal", focusElementId = "addContentButton") {
    document.getElementById(`${modalId}Message`).textContent = message; // ✅ Set dynamic message
    
    const successModal = new bootstrap.Modal(document.getElementById(modalId));
    
    // ✅ Show the modal
    successModal.show();

    // ✅ When the modal is closed, move focus to a visible button
    const modalElement = document.getElementById(modalId);
    modalElement.addEventListener("hidden.bs.modal", function () {
        const mainButton = document.getElementById(focusElementId) || document.body;
        mainButton.focus(); // ✅ Moves focus back to the page
    });
}



// Edit existing content
async function editContent(id, title, category, tags, encodedQuestion, encodedAnswer, messageType, originalPost) {
    showSection("creator"); // ✅ Switch to "Create" View

    document.getElementById("newTitle").value = title;
    document.getElementById("categorySelect").value = category;
    document.getElementById("messageTypeSelect").value = messageType;

    // ✅ Initialize Quill if not already initialized
    if (!window.questionQuill) {
        console.warn("🛠️ Initializing quillQuestion...");
        questionQuill = new Quill("#newQuestion", {
            theme: "snow",
            modules: { toolbar: "#questionToolbar" }
        });
    }

    if (!window.quill) {
        console.warn("🛠️ Initializing quill...");
        quill = new Quill("#newMessage", {
            theme: "snow",
            modules: { toolbar: "#answerToolbar" }
        });
    }

    // ✅ Decode the question and answer to prevent syntax errors
    const question = decodeURIComponent(encodedQuestion);
    const answer = decodeURIComponent(encodedAnswer);

    questionQuill.root.innerHTML = question; // ✅ Populate the Question Quill editor
    quill.root.innerHTML = answer; // ✅ Populate the Answer Quill editor

    await fetchOriginalPosts();
    document.getElementById("originalPostSelect").value = originalPost || "";

    // ✅ Ensure tags are an array
    let selectedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
    if (!Array.isArray(selectedTags)) {
        console.warn("🚨 Unexpected tag format:", tags);
        selectedTags = [];
    }

    // ✅ Pre-select existing tags in multi-select dropdown
    const newTagsDropdown = document.getElementById("newTags");
    if (newTagsDropdown) {
        Array.from(newTagsDropdown.options).forEach(option => {
            option.selected = selectedTags.includes(option.value);
        });
    }

    // ✅ Set the update button functionality
    const addButton = document.getElementById("addContentButton");
    addButton.textContent = "Update Content";
    addButton.onclick = function () {
        updateContent(id);
    };
}




async function updateContent(contentId) {
    // ✅ Ensure Quill editors are initialized
    if (!window.questionQuill) {
        console.warn("🛠️ Initializing quillQuestion...");
        window.questionQuill = new Quill("#newQuestion", {
            theme: "snow",
            modules: { toolbar: "#questionToolbar" }
        });
    }

    if (!window.quill) {
        console.warn("🛠️ Initializing quill...");
        window.quill = new Quill("#newMessage", {
            theme: "snow",
            modules: { toolbar: "#answerToolbar" }
        });
    }

    const updatedTitle = document.getElementById("newTitle").value.trim();
    const updatedCategory = document.getElementById("categorySelect").value.trim();
    const updatedTags = Array.from(document.getElementById("newTags").selectedOptions).map(option => option.value);
    const updatedMessageType = document.getElementById("messageTypeSelect").value;
    const updatedOriginalPost = document.getElementById("originalPostSelect").value;

    const updatedQuestion = questionQuill.root.innerHTML.trim(); // ✅ Fetch from Quill Question Editor
    const updatedAnswer = quill.root.innerHTML.trim(); // ✅ Fetch from Quill Answer Editor

    // ✅ Ensure required fields are filled
    if (!updatedTitle || !updatedCategory || !updatedQuestion || !updatedAnswer) {
        alert("Title, category, question, and answer are required.");
        return;
    }

    try {
        const response = await fetch(`/content/${contentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                title: updatedTitle, 
                category: updatedCategory, 
                tags: updatedTags, 
                question: updatedQuestion, // ✅ Send Question
                answer: updatedAnswer, // ✅ Send Answer
                messageType: updatedMessageType, 
                originalPost: updatedOriginalPost 
            })
        });

        if (response.ok) {
            console.log("✅ Content updated successfully.");
            fetchContent(); // ✅ Refresh the content list
            showSuccessModal("Content Updated!"); // ✅ Show success message
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
        const response = await fetch(`/content/${contentId}`, {
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
//  📌 TAG MANAGEMENT
// =====================================================

async function fetchTags() {
    try {
        const response = await fetch("/tag-sections"); // ✅ RAW JSON endpoint
        const data = await response.json();

        console.log("✅ Raw Tags Response:", data);

        const { assigned = {}, unassigned = [] } = data;
        const tagList = document.getElementById("tagList");
        tagList.innerHTML = ""; // Clear previous list

        // Display grouped tags
        Object.entries(assigned).forEach(([section, tags]) => {
            const header = document.createElement("li");
            header.className = "list-group-item active text-white";
            header.textContent = section;
            tagList.appendChild(header);

            tags.forEach(tag => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.innerHTML = `
                    <span class="text-primary tag-clickable" style="cursor:pointer;" onclick="openEditTagModal('${tag._id}', '${tag.tag}')">
                        ${tag.tag}
                    </span>
                    <div>
                        <button class="btn btn-sm btn-edit" onclick="openEditTagModal('${tag._id}', '${tag.tag}')">
                            <span class="material-icons icon-small">edit</span>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDeleteTag('${tag._id}')">
                            <span class="material-icons icon-small">delete</span>
                        </button>
                    </div>
                `;
                tagList.appendChild(li);
            });
        });

        // Display unassigned tags
        if (unassigned.length > 0) {
            const header = document.createElement("li");
            header.className = "list-group-item active text-white mt-3";
            header.textContent = "Ungrouped Tags";
            tagList.appendChild(header);

            unassigned.forEach(tag => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.innerHTML = `
                    <span class="text-primary tag-clickable" style="cursor:pointer;" onclick="openEditTagModal('${tag._id}', '${tag.tag}')">
                        ${tag.tag}
                    </span>
                    <div>
                        <button class="btn btn-sm btn-edit" onclick="openEditTagModal('${tag._id}', '${tag.tag}')">
                            <span class="material-icons icon-small">edit</span>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDeleteTag('${tag._id}')">
                            <span class="material-icons icon-small">delete</span>
                        </button>
                    </div>
                `;
                tagList.appendChild(li);
            });
        }

    } catch (error) {
        console.error("❌ Error fetching grouped tags for Tags tab:", error);
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
        const response = await fetch("/tags", {
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

// Delete modal
function confirmDeleteTag(tagId) {
    console.log("🛠️ Confirm Delete Tag Triggered! ID:", tagId);

    // ✅ Set event listener on confirm button
    const confirmButton = document.getElementById("confirmDeleteTagBtn");
    confirmButton.onclick = function () {
        deleteTag(tagId);
        const modal = bootstrap.Modal.getInstance(document.getElementById("confirmDeleteTagModal"));
        modal.hide(); // ✅ Close modal after confirmation
    };

    // ✅ Show the modal
    const tagModal = new bootstrap.Modal(document.getElementById("confirmDeleteTagModal"));
    tagModal.show();
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
        const response = await fetch(`tags/${tagId}`, {
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


function openEditTagModal(tagId, currentTagName) {
    console.log("🧪 openEditTagModal received:", { tagId, currentTagName });

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

    console.log("🧪 saveEditedTag called with:", { tagId, newTagName });

    if (!tagId || !newTagName) {
        alert("Please enter a valid tag name.");
        return;
    }

    try {
        const response = await fetch(`/tags/${tagId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: newTagName }),
        });

        const responseText = await response.text(); // get raw response
        console.log("📥 Raw Server Response:", responseText);

        if (response.ok) {
            console.log("✅ Tag updated successfully!");
            fetchTags(); // ✅ Refresh tag list
            fetchContent(); // ✅ Refresh viewer content
            editTagModal.hide();
        } else {
            console.error("❌ Failed to update tag. Status:", response.status);
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
//  📌 MESSAGE TYPE MANAGEMENT
// =====================================================

async function fetchMessageTypes() {
    try {
        const response = await fetch("/message-types");
        const messageTypes = await response.json();

        console.log("✅ Fetched Message Types:", messageTypes);

        // ✅ Update the dropdown in the "Create" view
        const messageTypeSelect = document.getElementById("messageTypeSelect");
        const currentSelection = messageTypeSelect.value; // Store selection
        messageTypeSelect.innerHTML = "<option value=''>Select Message Type</option>";

        messageTypes.forEach(type => {
            messageTypeSelect.innerHTML += `<option value="${type.type}">${type.type}</option>`;
        });

        messageTypeSelect.value = currentSelection; // Restore previous selection

        // ✅ Update the "Organize" view (Message Type List)
        const messageTypeList = document.getElementById("messageTypeList");
        if (!messageTypeList) {
            console.error("❌ ERROR: 'messageTypeList' element not found in HTML!");
            return;
        }

        messageTypeList.innerHTML = ""; // Clear previous items

        messageTypes.forEach(type => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

            li.innerHTML = `
                <span>${type.type}</span>
                <div>
                    <button class="btn btn-sm btn-edit" onclick="openEditMessageTypeModal('${type._id}', '${type.type}')">
                        <span class="material-icons icon-small">edit</span>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteMessageType('${type._id}')">
                        <span class="material-icons icon-small">delete</span>
                    </button>
                </div>
            `;

            messageTypeList.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Error fetching message types:", error);
    }
}




// ✅ Add new message type
async function addNewMessageType() {
    const newMessageType = document.getElementById("newMessageTypeInput").value.trim();
    if (!newMessageType) {
        alert("Please enter a message type.");
        return;
    }

    try {
        const response = await fetch("/message-types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: newMessageType }),
        });

        if (response.ok) {
            console.log("✅ Message type added successfully!");
            fetchMessageTypes();
            document.getElementById("newMessageTypeInput").value = "";
        } else {
            console.error("❌ Failed to add message type.");
        }
    } catch (error) {
        console.error("❌ Error adding message type:", error);
    }
}

// ✅ Open Edit Message Type Modal
function openEditMessageTypeModal(id, type) {
    document.getElementById("editMessageTypeId").value = id;
    document.getElementById("editMessageTypeInput").value = type;

    const editMessageTypeModal = new bootstrap.Modal(document.getElementById("editMessageTypeModal"));
    editMessageTypeModal.show();
}

// ✅ Save Edited Message Type
async function saveEditedMessageType() {
    const id = document.getElementById("editMessageTypeId").value;
    const updatedType = document.getElementById("editMessageTypeInput").value.trim();

    try {
        const response = await fetch(`/message-types/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: updatedType }),
        });

        if (response.ok) {
            console.log("✅ Message type updated successfully!");
            fetchMessageTypes();
            bootstrap.Modal.getInstance(document.getElementById("editMessageTypeModal")).hide();
        }
    } catch (error) {
        console.error("❌ Error updating message type:", error);
    }
}

// ✅ Delete Message Type
async function confirmDeleteMessageType(id) {
    if (confirm("Are you sure you want to delete this message type?")) {
        await fetch(`/message-types/${id}`, { method: "DELETE" });
        fetchMessageTypes();
    }
}





// =====================================================
//  📌 ORIGINAL POST
// =====================================================

async function addNewOriginalPost() {
    const postTitleInput = document.getElementById("newOriginalPostTitle");
    const postUrlInput = document.getElementById("newOriginalPostInput");

    const postTitle = postTitleInput.value.trim();
    const postURL = postUrlInput.value.trim();

    if (!postTitle || !postURL) {
        alert("Both Post Title and URL are required.");
        return;
    }

    try {
        const response = await fetch("/original-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: postTitle, url: postURL }) // ✅ Ensure title is sent
        });

        if (response.ok) {
            console.log("✅ Original post added successfully!");
            postTitleInput.value = ""; // Clear input field
            postUrlInput.value = ""; // Clear input field
            fetchOriginalPosts(); // Refresh list
        } else {
            console.error("❌ Failed to add original post.");
        }
    } catch (error) {
        console.error("❌ Error adding original post:", error);
    }
}



async function fetchOriginalPosts() {
    console.log("🔍 Fetching Original Posts..."); // ✅ Debugging log
    try {
        const response = await fetch("/original-posts");
        const posts = await response.json();

        console.log("✅ Fetched Original Posts:", posts); // ✅ See what we got

        const originalPostList = document.getElementById("originalPostList");
        originalPostList.innerHTML = ""; // ✅ Clear previous list

        if (!Array.isArray(posts) || posts.length === 0) {
            originalPostList.innerHTML = "<p>No original posts found.</p>";
            return;
        }

        posts.forEach(post => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

            li.innerHTML = `
                <span>${post.title}</span>
                <div>
                    <button class="btn btn-sm btn-edit" onclick="openEditOriginalPostModal('${post._id}', '${post.title}', '${post.url}')">
                        <span class="material-icons icon-small">edit</span>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteOriginalPost('${post._id}')">
                        <span class="material-icons icon-small">delete</span>
                    </button>
                </div>
            `;

            originalPostList.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Error fetching original posts:", error);
    }
}





function openEditOriginalPostModal(postId, postTitle, postUrl) {
    console.log("📝 Opening Edit Modal for:", postId, "→", postTitle, postUrl);

    // ✅ Populate the modal fields
    document.getElementById("editOriginalPostId").value = postId;
    document.getElementById("editOriginalPostTitle").value = postTitle;
    document.getElementById("editOriginalPostUrl").value = postUrl;

    // ✅ Show Bootstrap modal
    const editPostModal = new bootstrap.Modal(document.getElementById("editOriginalPostModal"));
    editPostModal.show();
}

async function saveEditedOriginalPost() {
    const postId = document.getElementById("editOriginalPostId").value;
    const updatedTitle = document.getElementById("editOriginalPostTitle").value.trim();
    const updatedUrl = document.getElementById("editOriginalPostUrl").value.trim();

    console.log("🛠️ Attempting to update post:", postId, "→", updatedTitle, updatedUrl);

    if (!updatedTitle || !updatedUrl) {
        alert("Both Post Title and URL are required.");
        return;
    }

    try {
        const response = await fetch(`/original-posts/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: updatedTitle, url: updatedUrl })
        });

        if (response.ok) {
            console.log("✅ Original post updated successfully!");
            fetchOriginalPosts(); // ✅ Refresh list
            const modal = bootstrap.Modal.getInstance(document.getElementById("editOriginalPostModal"));
            modal.hide(); // ✅ Close modal
        } else {
            const errorMessage = await response.text();
            console.error("❌ Failed to update original post. Server Response:", errorMessage);
        }
    } catch (error) {
        console.error("❌ Error updating original post:", error);
    }
}



// ✅ Delete the original post from the database
async function deleteOriginalPost(postId) {
    console.log("🗑️ Attempting to delete original post with ID:", postId); // ✅ Debugging log

    try {
        const response = await fetch(`/original-posts/${postId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            console.log("✅ Original post deleted successfully!");
            fetchOriginalPosts(); // ✅ Refresh list
        } else {
            console.error("❌ Failed to delete original post.");
        }
    } catch (error) {
        console.error("❌ Error deleting original post:", error);
    }
}

function confirmDeleteOriginalPost(postId) {
    console.log("🛠️ Confirm Delete Triggered! ID:", postId);

    const deleteModal = new bootstrap.Modal(document.getElementById("confirmDeleteOriginalPostModal"));
    const confirmButton = document.getElementById("confirmDeleteOriginalPostBtn");

    if (!deleteModal || !confirmButton) {
        console.error("❌ Error: Modal elements not found in DOM!");
        return;
    }

    confirmButton.onclick = async function () {
        try {
            const response = await fetch(`/original-posts/${postId}`, { method: "DELETE" });

            if (response.ok) {
                console.log("✅ Original post deleted successfully!");
                fetchOriginalPosts(); // Refresh the post list
                deleteModal.hide(); // Close the modal only after successful deletion
            } else {
                console.error("❌ Failed to delete original post.");
            }
        } catch (error) {
            console.error("❌ Error deleting original post:", error);
        }
    };

    deleteModal.show();
}


// =====================================================
//  📌 DEV PROJECT TRACKER
// =====================================================


// ✅ Load Dev Items on Page Load
document.addEventListener("DOMContentLoaded", () => {
    loadDevItems();
    loadCompletedDevItems();
});

// ✅ Fetch and Display Dev Items from MongoDB
async function loadDevItems() {
    const devItemList = document.getElementById("devItemList");
    devItemList.innerHTML = ""; // Clear existing list

    try {
        const response = await fetch("/dev-items");
        const devItems = await response.json();

        devItems.forEach(item => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

            listItem.innerHTML = `
                <span id="devItemText-${item._id}">${item.text}</span>
                <div>
                    <!-- ✅ Mark Complete Button -->
                    <button class="btn btn-sm btn-success" onclick="markDevItemComplete('${item._id}')">
                        <span class="material-icons icon-small">check</span>
                    </button>

                    <!-- ✅ Edit Button -->
                    <button class="btn btn-sm btn-edit" onclick="editDevItem('${item._id}')">
                        <span class="material-icons icon-small">edit</span>
                    </button>

                    <!-- ✅ Delete Button -->
                    <button class="btn btn-sm btn-danger" onclick="deleteDevItem('${item._id}')">
                        <span class="material-icons icon-small">delete</span>
                    </button>
                </div>
            `;

            devItemList.appendChild(listItem);
        });

    } catch (error) {
        console.error("❌ Error loading dev items:", error);
    }
}

// ✅ Fetch & Display Completed Dev Items
async function loadCompletedDevItems() {
    const completedDevItemList = document.getElementById("completedDevItemList");
    completedDevItemList.innerHTML = ""; // Clear existing list

    try {
        const response = await fetch("/dev-items");
        const devItems = await response.json();

        devItems
            .filter(item => item.completed) // ✅ Only show completed items
            .forEach(item => {
                const listItem = document.createElement("li");
                listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

                listItem.innerHTML = `
                    <span>${item.text}</span>
                    <button class="btn btn-sm btn-danger" onclick="deleteDevItem('${item._id}')">
                        <span class="material-icons icon-small">delete</span>
                    </button>
                `;

                completedDevItemList.appendChild(listItem);
            });

    } catch (error) {
        console.error("❌ Error loading completed dev items:", error);
    }
}

// ✅ Add New Dev Item
async function addNewDevItem() {
    const inputField = document.getElementById("newDevItemInput");
    const newItemText = inputField.value.trim();

    if (!newItemText) {
        alert("Please enter a valid item.");
        return;
    }

    try {
        const response = await fetch("/dev-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newItemText })
        });

        if (response.ok) {
            inputField.value = "";
            loadDevItems(); // Refresh list
        }

    } catch (error) {
        console.error("❌ Error adding dev item:", error);
    }
}

// ✅ Edit Dev Item
async function editDevItem(id) {
    const currentText = document.getElementById(`devItemText-${id}`).textContent;
    const newText = prompt("Edit your item:", currentText);

    if (newText !== null && newText.trim() !== "") {
        try {
            await fetch(`/dev-items/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: newText })
            });

            loadDevItems(); // Refresh list

        } catch (error) {
            console.error("❌ Error editing dev item:", error);
        }
    }
}

// ✅ Mark Dev Item as Complete (Moves to Completed Section)
async function markDevItemComplete(id) {
    try {
        await fetch(`/dev-items/${id}/complete`, { method: "PUT" });
        loadDevItems();
        loadCompletedDevItems();
    } catch (error) {
        console.error("❌ Error marking dev item complete:", error);
    }
}

// ✅ Delete Dev Item (Both Active & Completed)
async function deleteDevItem(id) {
    try {
        await fetch(`/dev-items/${id}`, { method: "DELETE" });
        loadDevItems();
        loadCompletedDevItems();
    } catch (error) {
        console.error("❌ Error deleting dev item:", error);
    }
}









// =====================================================
//  📌 FILTERING & SEARCH
// =====================================================

async function filterContent() {
    const searchQuery = document.getElementById("search").value.toLowerCase();
    const selectedCategory = document.getElementById("categoryFilter").value;
    const selectedTags = getSelectedTags(); // ✅ Get selected tags

    console.log("🔍 Filtering with Tags:", selectedTags);

    try {
        const response = await fetch("/content");
        let contentData = await response.json(); // ✅ Fetch latest content

        console.log("📝 Raw Content Data:", contentData); // ✅ Log fetched data

        contentData = contentData.filter(item => {
            const title = item.title ? item.title.toLowerCase() : "";
            const answer = item.answer ? item.answer.toLowerCase() : ""; 
            const tags = Array.isArray(item.tags) ? item.tags.map(tag => tag.toLowerCase()) : []; 

            console.log(`🔍 Checking Item: ${item.title} | Tags:`, tags); // ✅ Log each item's tags

            const matchesSearch = (
                title.includes(searchQuery) || 
                answer.includes(searchQuery) || 
                tags.some(tag => tag.includes(searchQuery))
            );

            const matchesCategory = (selectedCategory === "All Categories" || item.category === selectedCategory);

            // ✅ NEW: Ensure the content matches **ALL selected tags**
            const matchesSelectedTags = selectedTags.length === 0 || selectedTags.every(tag => tags.includes(tag));

            console.log(`✅ Search: ${matchesSearch} | Category: ${matchesCategory} | Tags Match: ${matchesSelectedTags}`);

            return matchesSearch && matchesCategory && matchesSelectedTags;
        });

        console.log("✅ Filtered Content:", contentData); // ✅ Log filtered content

        displayContent(contentData); // ✅ Display filtered content
    } catch (error) {
        console.error("❌ Error filtering content:", error);
    }
}






