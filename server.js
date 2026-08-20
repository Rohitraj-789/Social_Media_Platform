const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const multer = require('multer');

const { initDB, run, get, all } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'pulse_social_super_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        req.user = null;
        return next();
    }

    jsonwebtoken.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
            return next();
        }
        req.user = user;
        next();
    });
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    next();
}

app.use(authenticateToken);

// ==========================================
// AUTHENTICATION API ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, full_name, bio, avatar_url } = req.body;

        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ error: 'Username, email, password, and full name are required.' });
        }

        const existingUser = await get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already taken.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultAvatar = avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
        const defaultCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

        const result = await run(
            `INSERT INTO users (username, email, password, full_name, bio, avatar_url, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username.toLowerCase().trim(), email.toLowerCase().trim(), hashedPassword, full_name, bio || '', defaultAvatar, defaultCover]
        );

        const token = jsonwebtoken.sign({ id: result.lastID, username: username.toLowerCase().trim() }, JWT_SECRET, { expiresIn: '7d' });

        const newUser = await get('SELECT id, username, email, full_name, bio, avatar_url, cover_url, created_at FROM users WHERE id = ?', [result.lastID]);

        res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: newUser
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ error: 'Please enter username/email and password.' });
        }

        const user = await get('SELECT * FROM users WHERE username = ? OR email = ?', [login.toLowerCase().trim(), login.toLowerCase().trim()]);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials. User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials. Incorrect password.' });
        }

        const token = jsonwebtoken.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful!',
            token,
            user: userWithoutPassword
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// Get Demo Accounts for quick 1-click test login
app.get('/api/auth/demo-users', async (req, res) => {
    try {
        const users = await all('SELECT id, username, email, full_name, bio, avatar_url FROM users LIMIT 4');
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch demo users.' });
    }
});

// Current User Info (/api/auth/me)
app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
        const user = await get('SELECT id, username, email, full_name, bio, avatar_url, cover_url, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const postsCount = (await get('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [user.id])).count;
        const followersCount = (await get('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [user.id])).count;
        const followingCount = (await get('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [user.id])).count;
        const unreadNotifications = (await get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [user.id])).count;

        res.json({
            user: {
                ...user,
                posts_count: postsCount,
                followers_count: followersCount,
                following_count: followingCount,
                unread_notifications: unreadNotifications
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user data.' });
    }
});

// Upload endpoint
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
});

// ==========================================
// USER PROFILES & FOLLOW SYSTEM
// ==========================================

// Get user profile by username
app.get('/api/users/profile/:username', async (req, res) => {
    try {
        const targetUsername = req.params.username.toLowerCase();
        const profileUser = await get('SELECT id, username, email, full_name, bio, avatar_url, cover_url, created_at FROM users WHERE username = ?', [targetUsername]);
        
        if (!profileUser) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        const postsCount = (await get('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [profileUser.id])).count;
        const followersCount = (await get('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [profileUser.id])).count;
        const followingCount = (await get('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [profileUser.id])).count;

        let isFollowing = false;
        if (req.user) {
            const followCheck = await get('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, profileUser.id]);
            isFollowing = !!followCheck;
        }

        res.json({
            profile: {
                ...profileUser,
                posts_count: postsCount,
                followers_count: followersCount,
                following_count: followingCount,
                is_following: isFollowing,
                is_self: req.user ? req.user.id === profileUser.id : false
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

// Update Profile
app.put('/api/users/profile', requireAuth, async (req, res) => {
    try {
        const { full_name, bio, avatar_url, cover_url } = req.body;
        
        await run(
            `UPDATE users SET full_name = ?, bio = ?, avatar_url = ?, cover_url = ? WHERE id = ?`,
            [full_name, bio, avatar_url, cover_url, req.user.id]
        );

        const updatedUser = await get('SELECT id, username, email, full_name, bio, avatar_url, cover_url, created_at FROM users WHERE id = ?', [req.user.id]);
        res.json({ message: 'Profile updated successfully!', user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// Follow / Unfollow User
app.post('/api/users/:id/follow', requireAuth, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);
        if (targetUserId === req.user.id) {
            return res.status(400).json({ error: 'You cannot follow yourself.' });
        }

        const targetUser = await get('SELECT id, username FROM users WHERE id = ?', [targetUserId]);
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found.' });
        }

        const existingFollow = await get('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, targetUserId]);

        let isFollowing = false;

        if (existingFollow) {
            // Unfollow
            await run('DELETE FROM follows WHERE id = ?', [existingFollow.id]);
            isFollowing = false;
        } else {
            // Follow
            await run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, targetUserId]);
            isFollowing = true;

            // Notification
            await run(
                'INSERT INTO notifications (user_id, sender_id, type) VALUES (?, ?, ?)',
                [targetUserId, req.user.id, 'follow']
            );
        }

        const followersCount = (await get('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [targetUserId])).count;

        res.json({
            is_following: isFollowing,
            followers_count: followersCount,
            message: isFollowing ? `Now following @${targetUser.username}` : `Unfollowed @${targetUser.username}`
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process follow toggle.' });
    }
});

// Suggested Users to follow
app.get('/api/users/suggested/people', async (req, res) => {
    try {
        let suggested;
        if (req.user) {
            suggested = await all(`
                SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
                FROM users u
                WHERE u.id != ? AND is_following = 0
                ORDER BY followers_count DESC
                LIMIT 5
            `, [req.user.id, req.user.id]);
        } else {
            suggested = await all(`
                SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                0 as is_following
                FROM users u
                ORDER BY followers_count DESC
                LIMIT 5
            `);
        }
        res.json({ users: suggested });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch suggested users.' });
    }
});

// ==========================================
// POSTS & FEED SYSTEM
// ==========================================

// Get Posts Feed
app.get('/api/posts', async (req, res) => {
    try {
        const feedType = req.query.feed || 'explore'; // 'home', 'explore', 'saved', 'profile'
        const username = req.query.username;
        const searchQuery = req.query.search;
        const currentUserId = req.user ? req.user.id : 0;

        let sql = `
            SELECT 
                p.id, p.content, p.media_url, p.created_at,
                u.id as user_id, u.username, u.full_name, u.avatar_url,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
                EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked,
                EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_author_followed
            FROM posts p
            JOIN users u ON p.user_id = u.id
        `;

        const params = [currentUserId, currentUserId, currentUserId];

        if (feedType === 'home' && currentUserId) {
            sql += ` WHERE (p.user_id = ? OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?))`;
            params.push(currentUserId, currentUserId);
        } else if (feedType === 'saved' && currentUserId) {
            sql += ` WHERE p.id IN (SELECT post_id FROM bookmarks WHERE user_id = ?)`;
            params.push(currentUserId);
        } else if (username) {
            sql += ` WHERE u.username = ?`;
            params.push(username.toLowerCase());
        } else if (searchQuery) {
            sql += ` WHERE p.content LIKE ? OR u.username LIKE ? OR u.full_name LIKE ?`;
            const term = `%${searchQuery}%`;
            params.push(term, term, term);
        }

        sql += ` ORDER BY p.created_at DESC LIMIT 50`;

        const posts = await all(sql, params);
        res.json({ posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch posts.' });
    }
});

// Create Post
app.post('/api/posts', requireAuth, async (req, res) => {
    try {
        const { content, media_url } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Post content cannot be empty.' });
        }

        const result = await run(
            `INSERT INTO posts (user_id, content, media_url) VALUES (?, ?, ?)`,
            [req.user.id, content.trim(), media_url || '']
        );

        const newPost = await get(`
            SELECT 
                p.id, p.content, p.media_url, p.created_at,
                u.id as user_id, u.username, u.full_name, u.avatar_url,
                0 as likes_count, 0 as comments_count, 0 as is_liked, 0 as is_bookmarked
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [result.lastID]);

        res.status(201).json({ message: 'Post created successfully!', post: newPost });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create post.' });
    }
});

// Delete Post
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await get('SELECT * FROM posts WHERE id = ?', [postId]);

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        if (post.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to delete this post.' });
        }

        await run('DELETE FROM posts WHERE id = ?', [postId]);
        res.json({ message: 'Post deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete post.' });
    }
});

// Like / Unlike Post
app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await get('SELECT id, user_id FROM posts WHERE id = ?', [postId]);

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const existingLike = await get('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);

        let isLiked = false;

        if (existingLike) {
            await run('DELETE FROM likes WHERE id = ?', [existingLike.id]);
            isLiked = false;
        } else {
            await run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, postId]);
            isLiked = true;

            // Notification (if not liking own post)
            if (post.user_id !== req.user.id) {
                await run(
                    'INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (?, ?, ?, ?)',
                    [post.user_id, req.user.id, 'like', postId]
                );
            }
        }

        const likesCount = (await get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId])).count;

        res.json({ is_liked: isLiked, likes_count: likesCount });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle like.' });
    }
});

// Bookmark / Save Post
app.post('/api/posts/:id/bookmark', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const existing = await get('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);

        let isBookmarked = false;
        if (existing) {
            await run('DELETE FROM bookmarks WHERE id = ?', [existing.id]);
            isBookmarked = false;
        } else {
            await run('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)', [req.user.id, postId]);
            isBookmarked = true;
        }

        res.json({ is_bookmarked: isBookmarked, message: isBookmarked ? 'Post saved to bookmarks!' : 'Post removed from bookmarks.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle bookmark.' });
    }
});

// ==========================================
// COMMENTS SYSTEM
// ==========================================

// Get Comments for a Post
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        const comments = await all(`
            SELECT 
                c.id, c.content, c.created_at,
                u.id as user_id, u.username, u.full_name, u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `, [postId]);

        res.json({ comments });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});

// Add Comment
app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment cannot be empty.' });
        }

        const post = await get('SELECT id, user_id FROM posts WHERE id = ?', [postId]);
        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const result = await run(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, req.user.id, content.trim()]
        );

        // Notification (if not commenting on own post)
        if (post.user_id !== req.user.id) {
            await run(
                'INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (?, ?, ?, ?)',
                [post.user_id, req.user.id, 'comment', postId]
            );
        }

        const newComment = await get(`
            SELECT 
                c.id, c.content, c.created_at,
                u.id as user_id, u.username, u.full_name, u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.lastID]);

        const commentsCount = (await get('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [postId])).count;

        res.status(201).json({ message: 'Comment added!', comment: newComment, comments_count: commentsCount });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add comment.' });
    }
});

// ==========================================
// NOTIFICATIONS API
// ==========================================

app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
        const notifications = await all(`
            SELECT 
                n.id, n.type, n.is_read, n.created_at, n.post_id,
                u.id as sender_id, u.username as sender_username, u.full_name as sender_name, u.avatar_url as sender_avatar
            FROM notifications n
            JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 30
        `, [req.user.id]);

        res.json({ notifications });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

app.put('/api/notifications/read', requireAuth, async (req, res) => {
    try {
        await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'Notifications marked as read.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notifications.' });
    }
});

// ==========================================
// TRENDING HASHTAGS API
// ==========================================

app.get('/api/explore/trending', async (req, res) => {
    try {
        const posts = await all('SELECT content FROM posts');
        const hashtagMap = {};

        posts.forEach(p => {
            const matches = p.content.match(/#[a-zA-Z0-9_]+/g);
            if (matches) {
                matches.forEach(tag => {
                    const clean = tag.trim();
                    hashtagMap[clean] = (hashtagMap[clean] || 0) + 1;
                });
            }
        });

        const sorted = Object.entries(hashtagMap)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        // Fallbacks if no hashtags
        if (sorted.length === 0) {
            sorted.push(
                { tag: '#WebDesign', count: 14 },
                { tag: '#AI', count: 11 },
                { tag: '#Tokyo', count: 9 },
                { tag: '#JavaScript', count: 8 },
                { tag: '#Coding', count: 6 }
            );
        }

        res.json({ hashtags: sorted });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch trending hashtags.' });
    }
});

// Catch-all route to serve SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server after initializing DB
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`================================================`);
        console.log(`🚀 Pulse Social Media Server running on http://localhost:${PORT}`);
        console.log(`================================================`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
