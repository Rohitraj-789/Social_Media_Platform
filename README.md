# ⚡ Pulse — Social Media Platform

A full-stack, feature-rich social media web application built with **Node.js + Express**, **SQLite**, and a **vanilla HTML/CSS/JS** frontend.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 👤 **User Profiles** | Avatar, cover banner, bio, post/follower/following counts |
| 📝 **Posts** | Create text posts with optional image attachments |
| ❤️ **Like System** | Like / unlike posts with animated heart effect |
| 💬 **Comments** | Thread comments on any post in real-time |
| 🔔 **Notifications** | Like, comment, and follow notifications with badge counter |
| 👥 **Follow System** | Follow / unfollow users; home feed filters by following |
| 🔖 **Bookmarks** | Save posts to a personal bookmarks collection |
| 🔍 **Search** | Full-text search across posts, hashtags, and users |
| #️⃣ **Trending Hashtags** | Dynamically computed trending topics widget |
| 🌗 **Dark / Light Mode** | System-wide theme toggle with local storage persistence |
| 🎭 **Demo Accounts** | 4 pre-seeded accounts for instant 1-click testing |
| 📱 **Responsive Design** | Mobile bottom nav bar, tablet & desktop layouts |
| 🖼️ **Image Upload** | Upload images from your device to attach to posts |

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js 5
- **Database:** SQLite3 (file-based, zero setup)
- **Authentication:** JWT (JSON Web Tokens) + bcryptjs
- **File Upload:** Multer
- **Frontend:** HTML5, Vanilla CSS (Glassmorphic design), Vanilla JavaScript (SPA)
- **Icons:** FontAwesome 6
- **Fonts:** Google Fonts (Outfit + Plus Jakarta Sans)

---

## 📦 Project Structure

```
Social_Media_Platform/
├── server.js          # Express REST API server
├── database.js        # SQLite schema + seed data
├── package.json       # Project metadata & dependencies
├── social_platform.db # Auto-generated SQLite database
├── uploads/           # Uploaded images folder
└── public/
    ├── index.html     # Single Page Application shell
    ├── css/
    │   └── style.css  # Full design system (dark/light themes)
    └── js/
        ├── api.js     # HTTP client + toast utility
        ├── auth.js    # Auth session manager
        └── app.js     # SPA controller & UI logic
```

---

## ⚙️ Setup & Running

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```

### 3. Open in browser
```
http://localhost:5000
```

The database is **auto-created and seeded** on first run — no configuration needed!

---

## 🎭 Demo Accounts (Password: `password123`)

| User | Username | Role |
|---|---|---|
| Alex Rivers | `alexrivers` | Product Designer |
| Sophia Chen | `sophiachen` | AI Researcher |
| Marcus Vance | `marcusvance` | Photographer |
| Elena Rostova | `elenarostova` | Fullstack Dev |

Click any account in the **⚡ Quick Test Login** panel on the right to instantly switch users.

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user info |
| GET | `/api/auth/demo-users` | Get demo accounts |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/posts?feed=explore` | Get posts feed |
| POST | `/api/posts` | Create new post |
| DELETE | `/api/posts/:id` | Delete own post |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/bookmark` | Toggle bookmark |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/posts/:id/comments` | Get comments |
| POST | `/api/posts/:id/comments` | Add comment |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/profile/:username` | Get user profile |
| PUT | `/api/users/profile` | Update own profile |
| POST | `/api/users/:id/follow` | Follow/unfollow user |
| GET | `/api/users/suggested/people` | Get suggested users |

### Explore
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/explore/trending` | Get trending hashtags |
| GET | `/api/posts?search=query` | Search posts |

---

## 📸 Screenshots

Open `http://localhost:5000` in your browser to see the full UI.

---

## 📄 License

MIT — Built by **ROHIT** as a CodeAlpha Project Task 2.
