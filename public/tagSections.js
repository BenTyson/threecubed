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

        const sectionContainer = document.getElementById("sectionContainer");
        const sectionSelect = document.getElementById("sectionSelect"); // ✅ Get the dropdown

        sectionContainer.innerHTML = ""; // ✅ Clear existing sections
        sectionSelect.innerHTML = '<option value="">Select a Section</option>'; // ✅ Clear & Reset dropdown

        sections.forEach(section => {
            // ✅ Populate the dropdown
            const option = document.createElement("option");
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);

            // ✅ Populate the visualized section list
            const sectionDiv = document.createElement("div");
            sectionDiv.classList.add("section-item", "d-flex", "justify-content-between", "align-items-center", "mb-2");

            sectionDiv.innerHTML = `
                <span>${section}</span>
                <div>
                    <button class="btn btn-sm btn-warning" onclick="editSection('${section}')">✏️ Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSection('${section}')">🗑 Delete</button>
                </div>
            `;

            sectionContainer.appendChild(sectionDiv);
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




// ✅ Fetch assigned tags and display them under their section
async function fetchAssignedTags() {
    try {
        const response = await fetch("/tag-sections");
        const assignedTags = await response.json();
        const assignedTagsContainer = document.getElementById("assignedTagsContainer");

        assignedTagsContainer.innerHTML = ""; // ✅ Clear previous entries

        // ✅ Group by section
        const sectionMap = {};
        assignedTags.forEach(({ tag, section }) => {
            if (!sectionMap[section]) {
                sectionMap[section] = [];
            }
            sectionMap[section].push(tag);
        });

        // ✅ Display each section with its assigned tags
        for (const [section, tags] of Object.entries(sectionMap)) {
            const sectionDiv = document.createElement("div");
            sectionDiv.classList.add("mb-3");

            sectionDiv.innerHTML = `
                <h5 class="text-primary">${section}</h5>
                <p>${tags.map(tag => `<span class="badge bg-info text-white me-1">${tag}</span>`).join(" ")}</p>
            `;

            assignedTagsContainer.appendChild(sectionDiv);
        }

        console.log("✅ Assigned Tags Loaded:", sectionMap);
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

