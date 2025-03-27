document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 tagSections.js Loaded!");

    fetchTags();      // ✅ Populate tag dropdown
    fetchSections();  // ✅ Populate section dropdown
});

// ✅ Fetch tags and separate them into "Unassigned" and "Assigned"
async function fetchTags() {
    try {
        const response = await fetch("/tags");
        const tags = await response.json();

        const assignedTagsResponse = await fetch("/tag-sections");
        const assignedTags = await assignedTagsResponse.json();
        const assignedTagSet = new Set(assignedTags.map(item => item.tag));

        const tagSelect = document.getElementById("tagSelect");
        tagSelect.innerHTML = "";

        // ✅ Create "UNASSIGNED" section
        const unassignedOptGroup = document.createElement("optgroup");
        unassignedOptGroup.label = "🔹 UNASSIGNED";

        // ✅ Create "ASSIGNED" section
        const assignedOptGroup = document.createElement("optgroup");
        assignedOptGroup.label = "🔸 ASSIGNED";

        tags.forEach(tag => {
            const option = document.createElement("option");
            option.value = tag.tag;
            option.textContent = tag.tag;

            if (assignedTagSet.has(tag.tag)) {
                assignedOptGroup.appendChild(option); // ✅ Add to "Assigned" section
            } else {
                unassignedOptGroup.appendChild(option); // ✅ Add to "Unassigned" section
            }
        });

        // ✅ Append sections to dropdown
        if (unassignedOptGroup.children.length) tagSelect.appendChild(unassignedOptGroup);
        if (assignedOptGroup.children.length) tagSelect.appendChild(assignedOptGroup);

        console.log("✅ Tags Loaded (Grouped):", { unassigned: unassignedOptGroup, assigned: assignedOptGroup });
    } catch (error) {
        console.error("❌ Error fetching tags:", error);
    }
}



async function fetchSections() {
    try {
        const response = await fetch("/sections");
        const sections = await response.json();

        const sectionSelect = document.getElementById("sectionSelect");

        sectionSelect.innerHTML = '<option value="">Select a Parent</option>'; // ✅ Reset dropdown

        sections.forEach(section => {
            const option = document.createElement("option");
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });

        console.log("✅ Sections Loaded & Dropdown Updated:", sections);
    } catch (error) {
        console.error("❌ Error fetching sections:", error);
    }
}






async function addNewSection() {
    const newSection = prompt("Enter a new section name:");
    if (!newSection) return;

    try {
        const response = await fetch("/sections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section: newSection })
        });

        if (response.ok) {
            console.log(`✅ Section "${newSection}" added successfully!`);
            
            fetchSections(); // ✅ Refresh BOTH the dropdown & visualization
        } else {
            console.error("❌ Failed to add section.");
        }
    } catch (error) {
        console.error("❌ Error adding section:", error);
    }
}


// ✅ Assign a tag to a section and refresh dropdown
async function assignTagToSection() {
    const tag = document.getElementById("tagSelect").value;
    const section = document.getElementById("sectionSelect").value;

    if (!tag || !section) {
        alert("Please select both a tag and a section.");
        return;
    }

    try {
        const response = await fetch("/tag-sections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag, section })
        });

        if (response.ok) {
            console.log(`✅ Assigned ${tag} to section ${section}`);
            alert("Tag assigned successfully!");
            fetchTags();  // ✅ Refresh tag dropdown (to update assignment status)
            fetchAssignedTags(); // ✅ Refresh assigned tags display
        } else {
            console.error("❌ Failed to assign tag.");
        }
    } catch (error) {
        console.error("❌ Error assigning tag:", error);
    }
}




async function fetchAssignedTags() {
    try {
        const response = await fetch("/tag-sections");
        const assignedTags = await response.json();
        const assignedTagsContainer = document.getElementById("assignedTagsContainer");

        assignedTagsContainer.innerHTML = ""; // ✅ Clear previous entries

        // ✅ Group by section
        const sectionMap = {};
        assignedTags.forEach(({ tag, section, _id }) => {
            if (!sectionMap[section]) {
                sectionMap[section] = [];
            }
            sectionMap[section].push({ tag, _id });
        });

        // ✅ Display each section with its assigned tags
        for (const [section, tags] of Object.entries(sectionMap)) {
            const card = document.createElement("div");
            card.classList.add("card", "mb-3", "shadow-sm");

            // 🔧 Header with section name + actions
            const header = document.createElement("div");
            header.classList.add("card-header", "d-flex", "justify-content-between", "align-items-center", "bg-light");

            const sectionTitle = document.createElement("span");
            sectionTitle.classList.add("head2", "text-dark", "text-uppercase");
            sectionTitle.textContent = section;

            const buttonGroup = document.createElement("div");
            buttonGroup.innerHTML = `
                <button class="btn btn-sm btn-edit me-2" onclick="editSection('${section}')">
                    <span class="material-icons icon-small">edit</span>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSection('${section}')">
                    <span class="material-icons icon-small">delete</span>
                </button>
            `;

            header.appendChild(sectionTitle);
            header.appendChild(buttonGroup);

            // ✅ Tag pills (now clickable!)
            const body = document.createElement("div");
            body.classList.add("card-body", "d-flex", "flex-wrap", "gap-2");

            tags.forEach(({ tag, _id }) => {
                const tagBadge = document.createElement("span");
                tagBadge.classList.add("tag-pill", "bg-primary", "text-white", "px-2", "py-1", "rounded");
                tagBadge.style.cursor = "pointer";
                tagBadge.title = "Click to edit";
                tagBadge.textContent = tag;
                tagBadge.onclick = () => openEditTagModal(_id, tag); // ✅ Trigger edit modal
                body.appendChild(tagBadge);
            });

            card.appendChild(header);
            card.appendChild(body);
            assignedTagsContainer.appendChild(card);
        }

        console.log("✅ Assigned Tags Loaded (Clickable Tags):", sectionMap);
    } catch (error) {
        console.error("❌ Error fetching assigned tags:", error);
    }
}




// ✅ Call on page load
document.addEventListener("DOMContentLoaded", () => {
    fetchAssignedTags();
});


async function editSection(oldName) {
    const newName = prompt(`Rename section "${oldName}" to:`);
    if (!newName || newName === oldName) return;

    try {
        const response = await fetch(`/sections/${encodeURIComponent(oldName)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section: newName })
        });

        if (response.ok) {
            console.log(`✅ Section "${oldName}" renamed to "${newName}"`);
            fetchSections(); // ✅ Refresh section list
            fetchTags(); // ✅ Update tag assignments
        } else {
            console.error("❌ Failed to edit section.");
        }
    } catch (error) {
        console.error("❌ Error editing section:", error);
    }
}




async function deleteSection(section) {
    const confirmDelete = confirm(`Are you sure you want to delete section "${section}"? This will remove all tag assignments.`);
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/sections/${encodeURIComponent(section)}`, { method: "DELETE" });

        if (response.ok) {
            console.log(`✅ Section "${section}" deleted.`);
            
            // ✅ Remove the deleted section from the dropdown
            fetchSections(); 

            // ✅ Also refresh the assigned tags view
            fetchAssignedTags();
            
            // ✅ Find and remove the section from the interface
            removeSectionFromUI(section);

        } else {
            console.error("❌ Failed to delete section.");
        }
    } catch (error) {
        console.error("❌ Error deleting section:", error);
    }
}


function removeSectionFromUI(section) {
    const assignedTagsContainer = document.getElementById("assignedTagsContainer");

    // ✅ Find the section's div in the UI
    const sectionDivs = assignedTagsContainer.querySelectorAll("div");
    
    sectionDivs.forEach(div => {
        if (div.querySelector("h5")?.textContent === section) {
            div.remove(); // ✅ Remove the entire section block
        }
    });

    console.log(`✅ Section "${section}" removed from UI.`);
}








app.get("/debug/sections", async (req, res) => {
    try {
        const sections = await Section.find({});
        console.log("🔍 DEBUG: Sections in DB:", sections); // ✅ Log sections to console
        res.json(sections);
    } catch (error) {
        console.error("❌ Error fetching sections:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});












window.addNewSection = addNewSection; // ✅ Make function accessible globally

