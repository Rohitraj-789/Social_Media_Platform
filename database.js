const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'social_platform.db');
const db = new sqlite3.Database(dbPath);

// Helper function to convert callback db.run to Promise
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

// Helper function to convert callback db.get to Promise
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Helper function to convert callback db.all to Promise
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function initDB() {
    // Enable foreign keys
    await run('PRAGMA foreign_keys = ON');

    // Create Users table
    await run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            bio TEXT DEFAULT '',
            avatar_url TEXT DEFAULT '',
            cover_url TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create Posts table
    await run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            media_url TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create Likes table
    await run(`
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    `);

    // Create Comments table
    await run(`
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create Follows table
    await run(`
        CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            follower_id INTEGER NOT NULL,
            following_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id),
            FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create Bookmarks table
    await run(`
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    `);

    // Create Notifications table
    await run(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            post_id INTEGER,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Check if demo users exist, if not seed them
    const userCount = await get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
        await seedDatabase();
    }
}

async function seedDatabase() {
    console.log('Seeding initial demo data...');

    const defaultPassword = await bcrypt.hash('password123', 10);

    // Sample users with Unsplash portraits and covers
    const usersData = [
        {
            username: 'alexrivers',
            email: 'alex@pulse.io',
            password: defaultPassword,
            full_name: 'Alex Rivers',
            bio: 'Senior Product Designer & Creative Dev 🚀 ✨ | Building next-gen Web Interfaces',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
        },
        {
            username: 'sophiachen',
            email: 'sophia@pulse.io',
            password: defaultPassword,
            full_name: 'Sophia Chen',
            bio: 'AI Researcher & Tech Explorer 🤖 | Speaker, Tech Writer & Open Source advocate',
            avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
            cover_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
        },
        {
            username: 'marcusvance',
            email: 'marcus@pulse.io',
            password: defaultPassword,
            full_name: 'Marcus Vance',
            bio: 'Urban Photographer & Visual Storyteller 📸✈️ | Capturing cityscapes and quiet moments',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
            cover_url: 'https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?auto=format&fit=crop&w=1200&q=80'
        },
        {
            username: 'elenarostova',
            email: 'elena@pulse.io',
            password: defaultPassword,
            full_name: 'Elena Rostova',
            bio: 'Fullstack Dev 💻☕ | JavaScript, Express & SQLite enthusiast | Coffee driven code',
            avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
            cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
        }
    ];

    const uIds = {};
    for (const u of usersData) {
        const res = await run(
            `INSERT INTO users (username, email, password, full_name, bio, avatar_url, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [u.username, u.email, u.password, u.full_name, u.bio, u.avatar_url, u.cover_url]
        );
        uIds[u.username] = res.lastID;
    }

    // Sample posts
    const postsData = [
        {
            user_id: uIds['alexrivers'],
            content: 'Just launched our new glassmorphic UI design system! Minimalist aesthetics with glowing interactive components. What do you think of this aesthetic? 🎨✨ #DesignSystem #WebDesign #UIUX',
            media_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80'
        },
        {
            user_id: uIds['sophiachen'],
            content: 'Deep diving into local LLM optimizations today. The capability to run high-performance models locally on edge devices is evolving rapidly! 🧠⚡ #AI #MachineLearning #TechTrends',
            media_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80'
        },
        {
            user_id: uIds['marcusvance'],
            content: 'Late night golden hour vibes in Tokyo downtown. There is something truly mesmerizing about city neon lights reflecting off wet streets. 🏙️🌧️ #Photography #Tokyo #Urban',
            media_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80'
        },
        {
            user_id: uIds['elenarostova'],
            content: 'Built a clean full-stack social media application using Express.js and SQLite! Fast, responsive, zero heavy external DB setup. Coding brings ideas to life! 🚀💻 #NodeJS #WebDev #Coding',
            media_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80'
        }
    ];

    const pIds = [];
    for (const p of postsData) {
        const res = await run(
            `INSERT INTO posts (user_id, content, media_url) VALUES (?, ?, ?)`,
            [p.user_id, p.content, p.media_url]
        );
        pIds.push(res.lastID);
    }

    // Sample Follows
    // Alex follows Sophia & Marcus
    await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [uIds['alexrivers'], uIds['sophiachen']]);
    await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [uIds['alexrivers'], uIds['marcusvance']]);
    // Sophia follows Alex & Elena
    await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [uIds['sophiachen'], uIds['alexrivers']]);
    await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [uIds['sophiachen'], uIds['elenarostova']]);
    // Marcus follows Alex
    await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [uIds['marcusvance'], uIds['alexrivers']]);
    // Elena follows all
    await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [uIds['elenarostova'], uIds['alexrivers']]);
    await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [uIds['elenarostova'], uIds['sophiachen']]);

    // Sample Likes
    await run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [uIds['sophiachen'], pIds[0]]);
    await run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [uIds['marcusvance'], pIds[0]]);
    await run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [uIds['elenarostova'], pIds[0]]);
    await run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [uIds['alexrivers'], pIds[1]]);
    await run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [uIds['elenarostova'], pIds[1]]);
    await run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [uIds['alexrivers'], pIds[2]]);

    // Sample Comments
    await run(`INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`, [pIds[0], uIds['sophiachen'], 'This glassmorphic look is sleek! Love the subtle border glows and backdrop filters. 😍']);
    await run(`INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`, [pIds[0], uIds['elenarostova'], 'Super clean! Are you using CSS custom variables for the dark mode theme toggles?']);
    await run(`INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`, [pIds[1], uIds['alexrivers'], 'Edge computing with local LLMs is absolute magic. Great insights Sophia!']);
    await run(`INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`, [pIds[2], uIds['elenarostova'], 'Stunning visual composition! Tokyo looks so atmospheric here.']);

    // Sample Notifications
    await run(`INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (?, ?, ?, ?)`, [uIds['alexrivers'], uIds['sophiachen'], 'like', pIds[0]]);
    await run(`INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (?, ?, ?, ?)`, [uIds['alexrivers'], uIds['sophiachen'], 'comment', pIds[0]]);
    await run(`INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (?, ?, ?, ?)`, [uIds['alexrivers'], uIds['marcusvance'], 'follow', null]);

    console.log('Demo database successfully populated!');
}

module.exports = {
    db,
    run,
    get,
    all,
    initDB
};
