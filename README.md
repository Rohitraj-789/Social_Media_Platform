# ⚡ Pulse — Social Media Platform

<div align="center">

<!-- LIVE DEMO BUTTON -->
<a href="https://pulse-social-media.onrender.com" target="_blank">
  <img src="https://img.shields.io/badge/🚀%20Live%20Demo-View%20Project-6366f1?style=for-the-badge&logoColor=white" alt="Live Demo" height="40"/>
</a>
&nbsp;&nbsp;
<a href="https://github.com/Rohitraj-789/Social_Media_Platform" target="_blank">
  <img src="https://img.shields.io/badge/⭐%20Star%20on%20GitHub-Rohitraj--789-24292e?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" height="40"/>
</a>

<br/><br/>

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

**A full-stack social media web application**  
User profiles · Posts · Likes · Comments · Follow system · Notifications · Dark mode

</div>

---

## 🌐 Live Demo

> Click the button above or visit: **https://pulse-social-media.onrender.com**
>
> **Test Accounts** (password: `password123`):
> `alexrivers` · `sophiachen` · `marcusvance` · `elenarostova`
>
> ⚠️ *Hosted on Render free tier — may take ~30 seconds to wake up on first visit.*

---

## 📸 Features Overview

| Feature | Description |
|---|---|
| 👤 **User Profiles** | Avatar, cover banner, bio, follower/following counts |
| 📝 **Posts** | Create text posts with optional image attachments |
| ❤️ **Like System** | Like / unlike with animated heart bounce effect |
| 💬 **Comments** | Inline threaded comments on every post |
| 🔔 **Notifications** | Like, comment & follow alerts with live unread badge |
| 👥 **Follow System** | Follow / unfollow; home feed filters to following-only |
| 🔖 **Bookmarks** | Save posts to a personal collection |
| 🔍 **Search** | Search posts, hashtags, and usernames |
| #️⃣ **Trending Topics** | Dynamically computed hashtag trends widget |
| 🌗 **Dark / Light Mode** | Theme toggle persisted in localStorage |
| 🎭 **Demo Accounts** | 4 pre-seeded accounts — 1-click login panel |
| 📱 **Responsive** | Mobile bottom nav, tablet & desktop 3-column grid |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js v18+ |
| **Backend** | Express.js 5 |
| **Database** | SQLite3 (file-based, zero setup) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **File Upload** | Multer |
| **Frontend** | HTML5, Vanilla CSS, Vanilla JavaScript (SPA) |
| **Icons** | FontAwesome 6 |
| **Fonts** | Google Fonts — Outfit & Plus Jakarta Sans |

---

## 📁 Project Structure

```
Social_Media_Platform/
│
├── server.js              # Express REST API (all routes)
├── database.js            # SQLite schema + auto-seed data
├── package.json           # Dependencies & npm scripts
├── render.yaml            # Render.com deployment config
├── .gitignore
│
├── uploads/               # User-uploaded images (auto-created)
└── public/                # Static frontend (served by Express)
    ├── index.html         # SPA shell — navbar, sidebar, modals
    ├── css/style.css      # Glassmorphic design system (dark/light)
    └── js/
        ├── api.js         # HTTP client + JWT token + toast utility
        ├── auth.js        # Session manager (login/register/logout)
        └── app.js         # SPA controller — all views & interactions
```

---

## ⚙️ Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Rohitraj-789/Social_Media_Platform.git
cd Social_Media_Platform

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
# → http://localhost:5000
```

> ✅ Database auto-creates and seeds on first run — no config needed!

---

## ☁️ Deploy to Render (Free)

1. Go to **[render.com](https://render.com)** → Sign up with GitHub
2. Click **New → Web Service**
3. Connect your repo: `Rohitraj-789/Social_Media_Platform`
4. Render auto-detects `render.yaml` — click **Deploy**
5. Your live URL will be: `https://pulse-social-media.onrender.com`

---

## 🎭 Demo Accounts

All use password: **`password123`**

| Name | Username |
|---|---|
| Alex Rivers | `alexrivers` |
| Sophia Chen | `sophiachen` |
| Marcus Vance | `marcusvance` |
| Elena Rostova | `elenarostova` |

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login → receive JWT |
| `GET` | `/api/auth/me` | Get current user (JWT required) |
| `GET` | `/api/auth/demo-users` | List demo accounts |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts?feed=explore` | Explore feed |
| `GET` | `/api/posts?feed=home` | Following-only feed (JWT) |
| `GET` | `/api/posts?feed=saved` | Bookmarks (JWT) |
| `GET` | `/api/posts?search=query` | Search posts |
| `POST` | `/api/posts` | Create post (JWT) |
| `DELETE` | `/api/posts/:id` | Delete own post (JWT) |
| `POST` | `/api/posts/:id/like` | Toggle like (JWT) |
| `POST` | `/api/posts/:id/bookmark` | Toggle bookmark (JWT) |

### Comments & Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts/:id/comments` | Get comments |
| `POST` | `/api/posts/:id/comments` | Add comment (JWT) |
| `GET` | `/api/users/profile/:username` | Get profile |
| `PUT` | `/api/users/profile` | Update profile (JWT) |
| `POST` | `/api/users/:id/follow` | Follow/unfollow (JWT) |
| `GET` | `/api/users/suggested/people` | Suggested users |
| `GET` | `/api/notifications` | Notifications (JWT) |
| `GET` | `/api/explore/trending` | Trending hashtags |

---

## 🗄️ Database Schema

```sql
users         — id, username, email, password, full_name, bio, avatar_url, cover_url
posts         — id, user_id, content, media_url, created_at
likes         — id, user_id, post_id  (unique pair)
comments      — id, post_id, user_id, content, created_at
follows       — id, follower_id, following_id  (unique pair)
bookmarks     — id, user_id, post_id  (unique pair)
notifications — id, user_id, sender_id, type, post_id, is_read
```

---

## 🎨 UI Highlights

- **Glassmorphic cards** with `backdrop-filter: blur()` for a premium feel
- **Dark / Light theme** switchable, persisted across sessions
- **Animated heart** bounce on like via CSS keyframes
- **Shimmer skeleton** loading states
- **Toast notifications** with color-coded success / error / info types
- **Mobile bottom nav bar** on small screens
- **Debounced real-time search** — updates 400ms after typing

---

## 📄 License

MIT License © 2026 **ROHIT**  
Built for **CodeAlpha Internship — Task 2: Social Media Platform**
