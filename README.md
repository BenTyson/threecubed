# ThreeCubed - Content Organizer

## 📌 Overview
ThreeCubed is a **content management web app** that allows users to:
- Create **content blocks** with assigned **categories and tags**.
- Organize and filter content dynamically.
- Manage categories and tags efficiently.

## 🚀 Features Implemented
### ✅ **Core Functionality**
- **Content Blocks**: Users can add and categorize content.
- **Categories**: Assign and filter content by categories.
- **Tags**: Assign tags to content blocks for flexible organization.

### ✅ **Tag & Category Management**
- **Add Tags**: Users can create new tags dynamically.
- **Delete Tags**: Tags can be removed with a **confirmation popup**.
- **Add Categories**: Users can create and manage categories.

### ✅ **Frontend UI**
- **Two Views:**
  - **📌 Creator View:** Users can create content, add categories, and manage tags.
  - **🔍 Viewer View:** Users can filter and browse organized content.

### ✅ **Filtering System**
- **Sort content blocks by category and tags**.
- **Live search functionality** for quick content discovery.

### ✅ **Backend API (Express + MongoDB)**
- **MongoDB Atlas connection** for dynamic content storage.
- **REST API endpoints** for CRUD operations:
  - `GET /content` - Fetch all content blocks.
  - `POST /content` - Create a new content block.
  - `DELETE /tags/:id` - Delete a tag from the database.

### ✅ **Current Repository & Deployment**
- **GitHub Repo:** [ThreeCubed](https://github.com/BenTyson/threecubed)
- **Next Steps:**
  - Implement **delete content block** functionality.
  - Improve **filtering by multiple tags/categories**.
  - Deploy the app for live access.

---

## 🛠 **How to Run Locally**
### **1️⃣ Backend (Node.js + Express)**
```sh
cd backend
npm install
node server.js
