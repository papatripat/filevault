# 🗄️ FileVault — Personal File Manager & Dashboard

A sleek, web-based file manager with dashboard analytics, built with **React + Express**. Features a premium dark monochrome UI with glassmorphism effects.

![Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **📊 Dashboard Analytics** — Stat cards with animated counters, file distribution donut chart, drive usage bar chart
- **📁 File Explorer** — Grid/list views, breadcrumb navigation, context menu, file preview panel
- **🤖 AI File Assistant** — Chat with an intelligent assistant to search files, list directories, and manage your storage using natural language.
- **✨ AI Document Summarizer** — Generate instant summaries of text documents and code files in the preview panel.
- **🔍 Global Search** — Live search with debounced queries and instant navigation
- **🕐 Recent Files** — Grouped by date (Today, Yesterday, This Week, etc.)
- **⭐ Favorites** — Bookmark frequently accessed files and folders
- **📦 Large File Finder** — Configurable size threshold to find storage hogs
- **🔄 Duplicate Finder** — Detect duplicate files by name + size matching
- **🗑️ Safe Delete** — Files go to Recycle Bin by default, not permanent delete

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7, Recharts, Lucide Icons |
| Backend | Node.js, Express, Google Gen AI SDK (@google/genai) |
| Styling | Vanilla CSS (dark monochrome design system) |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/filevault.git
cd filevault

# Install dependencies
npm install
```

### Configuration
Create a `.env` file in the root directory and add your Google Gemini API key to enable the AI features:
```env
GEMINI_API_KEY=your_api_key_here
```

### Running

You need **two terminals**:

```bash
# Terminal 1 — Start the backend API server
npm run server

# Terminal 2 — Start the frontend dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

## 📁 Project Structure

```
filevault/
├── server/
│   ├── index.js              # Express entry point (port 3001)
│   ├── routes/
│   │   ├── files.js          # REST API endpoints for file management
│   │   └── ai.js             # API endpoints for Gemini AI integration
│   └── utils/
│       └── fileHelper.js     # File system utilities
├── src/
│   ├── App.jsx               # Root component with routing
│   ├── main.jsx              # React entry point
│   ├── index.css             # Dark monochrome design system
│   ├── components/
│   │   ├── AIAssistant.jsx   # Floating AI Chatbot interface
│   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   ├── TopBar.jsx        # Top bar with search
│   │   ├── StatCard.jsx      # Animated stat card
│   │   ├── FileCard.jsx      # File/folder card (grid & list)
│   │   ├── FilePreview.jsx   # File detail panel (with AI Summarizer)
│   │   ├── ContextMenu.jsx   # Right-click context menu
│   │   └── Modal.jsx         # Reusable modal dialog
│   ├── pages/
│   │   ├── Dashboard.jsx     # Analytics dashboard
│   │   ├── Explorer.jsx      # File explorer
│   │   ├── RecentFiles.jsx   # Recent files
│   │   ├── Favorites.jsx     # Bookmarked files
│   │   ├── LargeFiles.jsx    # Large file finder
│   │   └── Duplicates.jsx    # Duplicate file finder
│   └── utils/
│       ├── api.js            # API client
│       ├── formatters.js     # Byte/date/number formatters
│       └── fileIcons.js      # File category → icon mapping
├── package.json
├── vite.config.js
└── index.html
```

## ⚠️ Important Notes

- This app **directly accesses your file system**. Delete, rename, move, and copy operations are real.
- Delete operations use the **Windows Recycle Bin** by default.
- This app is designed for **local use only** (localhost). Do not expose it to a public network.
- Currently optimized for **Windows**. Drive detection uses `wmic`.

## 📄 License

MIT License — feel free to use and modify.
