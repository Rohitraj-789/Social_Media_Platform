# ⚡ Pulse — Social Media Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

**A full-stack, feature-rich social media web application**  
Built with Express.js, SQLite, JWT Auth, and a Glassmorphic Vanilla JS SPA frontend.

[🚀 Live Demo](#setup--running) · [📖 API Docs](#-api-endpoints) · [🎭 Demo Accounts](#-demo-accounts)

</div>

---

## 📸 Features Overview

| Feature | Description |
|---|---|
| 👤 **User Profiles** | Avatar, cover banner, bio, post/follower/following counts |
| 📝 **Posts** | Create text posts with optional image attachments (file upload) |
| ❤️ **Like System** | Like / unlike posts with animated heart bounce effect |
| 💬 **Comments** | Inline threaded comments on every post |
| 🔔 **Notifications** | Like, comment & follow notifications with live unread badge |
| 👥 **Follow System** | Follow / unfollow users; home feed filters to following-only |
| 🔖 **Bookmarks** | Save posts to a personal bookmarks collection |
| 🔍 **Search** | Full-text search across posts, hashtags, and usernames |
| #️⃣ **Trending Topics** | Dynamically computed hashtag trends widget |
| 🌗 **Dark / Light Mode** | Theme toggle persisted in localStorage |
| 🎭 **Demo Accounts** | 4 pre-seeded accounts — 1-click login for instant testing |
| 📱 **Responsive Design** | Mobile bottom nav, tablet & desktop 3-column grid layout |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js v18+ |
| **Backend** | Express.js 5 |
| **Database** | SQLite3 (file-based, zero setup) |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **File Upload** | Multer |
| **Frontend** | HTML5, Vanilla CSS, Vanilla JavaScript (SPA) |
| **Icons** | FontAwesome 6 |
| **Fonts** | Google Fonts — Outfit & Plus Jakarta Sans |

---

## 📁 Project Structure

```
Social_Media_Platform/
│
├── server.js              # Express REST API server (all routes)
├── database.js            # SQLite schema + automatic seed data
├── package.json           # Dependencies & npm scripts
├── .gitignore             # Excludes node_modules, DB, uploads
│
├── uploads/               # User-uploaded images (auto-created)
│   └── .gitkeep
│
└── public/                # Static frontend (served by Express)
    ├── index.html         # SPA shell — navbar, sidebar, modals
    ├── css/
    │   └── style.css      # Glassmorphic design system (dark/light)
    └── js/
        ├── api.js         # HTTP client + JWT token + toast utility
        ├── auth.js        # Session manager (login/register/logout)
        └── app.js         # SPA controller — views, feeds, interactions
```

---

## ⚙️ Setup & Running

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### 1. Clone the repository
```bash
git clone https://github.com/Rohitraj-789/Social_Media_Platform.git
cd Social_Media_Platform
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
npm start
```

### 4. Open in your browser
```
http://localhost:5000
```

> ✅ The **SQLite database is auto-created and seeded** with demo data on first run — no configuration or external database setup needed!

---

## 🎭 Demo Accounts

All demo accounts use the password: **`password123`**

| Full Name | Username | Bio |
|---|---|---|
| Alex Rivers | `alexrivers` | Senior Product Designer & Creative Dev |
| Sophia Chen | `sophiachen` | AI Researcher & Tech Explorer |
| Marcus Vance | `marcusvance` | Urban Photographer & Visual Storyteller |
| Elena Rostova | `elenarostova` | Fullstack Dev — JavaScript & SQLite |

> **Tip:** Use the **⚡ Quick Test Login** widget on the right panel to switch between users in one click!

---

## 🔌 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT |
| `GET` | `/api/auth/me` | ✅ | Get current session user |
| `GET` | `/api/auth/demo-users` | ❌ | List demo accounts |

### 📝 Posts
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/posts?feed=explore` | ❌ | Get explore feed |
| `GET` | `/api/posts?feed=home` | ✅ | Get following-only feed |
| `GET` | `/api/posts?feed=saved` | ✅ | Get bookmarked posts |
| `GET` | `/api/posts?search=query` | ❌ | Search posts |
| `POST` | `/api/posts` | ✅ | Create new post |
| `DELETE` | `/api/posts/:id` | ✅ | Delete own post |
| `POST` | `/api/posts/:id/like` | ✅ | Toggle like/unlike |
| `POST` | `/api/posts/:id/bookmark` | ✅ | Toggle bookmark/unsave |

### 💬 Comments
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/posts/:id/comments` | ❌ | Get comments for a post |
| `POST` | `/api/posts/:id/comments` | ✅ | Add a comment |

### 👥 Users & Follow
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/users/profile/:username` | ❌ | Get public profile |
| `PUT` | `/api/users/profile` | ✅ | Update own profile |
| `POST` | `/api/users/:id/follow` | ✅ | Follow / unfollow user |
| `GET` | `/api/users/suggested/people` | ❌ | Get suggested users |

### 🔔 Notifications & Explore
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✅ | Get user notifications |
| `PUT` | `/api/notifications/read` | ✅ | Mark all as read |
| `GET` | `/api/explore/trending` | ❌ | Get trending hashtags |

### 📤 Upload
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/upload` | ✅ | Upload image (multipart/form-data) |

---

## 🗄️ Database Schema

```sql
users        — id, username, email, password, full_name, bio, avatar_url, cover_url
posts        — id, user_id, content, media_url, created_at
likes        — id, user_id, post_id (unique pair)
comments     — id, post_id, user_id, content, created_at
follows      — id, follower_id, following_id (unique pair)
bookmarks    — id, user_id, post_id (unique pair)
notifications— id, user_id, sender_id, type, post_id, is_read
```

---

## 🎨 UI Highlights

- **Glassmorphic cards** with `backdrop-filter: blur()` for a premium modern look
- **Dark / Light themes** switchable via a single toggle, persisted across sessions
- **Animated heart** bounce effect on like actions using CSS keyframes
- **Shimmer skeleton** loading states for better perceived performance
- **Toast notifications** with color-coded types (success/error/info)
- **Mobile-first bottom navigation bar** that replaces the sidebar on small screens
- **Debounced real-time search** — results update 400ms after typing

---

## 📄 License

MIT License © 2026 **ROHIT**  
Built as **CodeAlpha Internship — Task 2: Social Media Platform**
