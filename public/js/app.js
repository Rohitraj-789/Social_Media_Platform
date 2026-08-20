/* ==========================================================================
   PULSE SOCIAL - MAIN SPA APPLICATION LOGIC
   ========================================================================== */

const App = {
    currentView: 'explore',
    currentProfileUser: null,
    selectedImageFile: null,

    async init() {
        await Auth.init();
        this.bindEvents();
        this.loadDemoUsers();
        this.loadSuggestedPeople();
        this.loadTrendingHashtags();
        this.switchView('explore');
        this.initTheme();
        this.updateNotifBadge();
    },

    async updateNotifBadge() {
        if (!Auth.currentUser) return;
        try {
            const res = await API.request('/auth/me');
            const count = res.user.unread_notifications || 0;
            const badge = document.getElementById('unread-notif-badge');
            if (badge) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        } catch (e) {}
    },

    initTheme() {
        const savedTheme = localStorage.getItem('pulse_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const icon = document.querySelector('#theme-toggle-btn i');
        if (icon) {
            icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('pulse_theme', next);

        const icon = document.querySelector('#theme-toggle-btn i');
        if (icon) {
            icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        API.showToast(`Switched to ${next} mode`, 'info');
    },

    bindEvents() {
        // Theme Switcher
        document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

        // Nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.getAttribute('data-view');
                if (view) {
                    this.switchView(view);
                }
            });
        });

        // Tab Buttons in Home Feed
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const feed = tab.getAttribute('data-feed');
                this.loadPosts(feed);
            });
        });

        // Search Input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const query = e.target.value.trim();
                    if (query.length > 0) {
                        this.switchView('search', query);
                    } else {
                        this.switchView('home');
                    }
                }, 400);
            });
        }

        // Post Creator Media Input & Buttons
        const mediaBtn = document.getElementById('post-media-btn');
        const mediaInput = document.getElementById('post-media-input');
        if (mediaBtn && mediaInput) {
            mediaBtn.addEventListener('click', () => mediaInput.click());
            mediaInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.selectedImageFile = file;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const preview = document.getElementById('image-preview-container');
                        const img = document.getElementById('preview-img');
                        img.src = event.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        document.getElementById('remove-img-btn')?.addEventListener('click', () => {
            this.selectedImageFile = null;
            const mediaInput = document.getElementById('post-media-input');
            if (mediaInput) mediaInput.value = '';
            document.getElementById('image-preview-container').style.display = 'none';
        });

        // Submit Post
        document.getElementById('publish-post-btn')?.addEventListener('click', () => this.submitPost());

        // Auth Form Submits
        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginVal = document.getElementById('login-identifier').value;
            const passVal = document.getElementById('login-password').value;
            try {
                await Auth.login(loginVal, passVal);
                this.closeModal('auth-modal');
                this.refreshFeed();
            } catch (err) {
                API.showToast(err.message, 'error');
            }
        });

        document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                full_name: document.getElementById('signup-name').value,
                username: document.getElementById('signup-username').value,
                email: document.getElementById('signup-email').value,
                password: document.getElementById('signup-password').value,
                bio: document.getElementById('signup-bio').value
            };
            try {
                await Auth.register(userData);
                this.closeModal('auth-modal');
                this.refreshFeed();
            } catch (err) {
                API.showToast(err.message, 'error');
            }
        });

        // Edit Profile Form Submit
        document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const updated = {
                    full_name: document.getElementById('edit-fullname').value,
                    bio: document.getElementById('edit-bio').value,
                    avatar_url: document.getElementById('edit-avatar').value,
                    cover_url: document.getElementById('edit-cover').value
                };
                const res = await API.request('/users/profile', {
                    method: 'PUT',
                    body: updated
                });
                Auth.currentUser = res.user;
                Auth.updateAuthUI();
                this.closeModal('edit-profile-modal');
                API.showToast('Profile updated!', 'success');
                if (this.currentProfileUser && this.currentProfileUser.id === Auth.currentUser.id) {
                    this.loadProfile(Auth.currentUser.username);
                }
            } catch (err) {
                API.showToast(err.message, 'error');
            }
        });
    },

    switchView(viewName, param = null) {
        this.currentView = viewName;
        
        // Update Nav UI
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-view') === viewName);
        });

        const feedContainer = document.getElementById('posts-stream-container');
        const profileHeader = document.getElementById('profile-header-container');
        const notificationsContainer = document.getElementById('notifications-container');
        const feedTabs = document.getElementById('feed-tabs');

        // Hide special sections by default
        if (profileHeader) profileHeader.style.display = 'none';
        if (notificationsContainer) notificationsContainer.style.display = 'none';
        if (feedTabs) feedTabs.style.display = 'none';
        if (feedContainer) feedContainer.style.display = 'block';

        if (viewName === 'home') {
            if (feedTabs) feedTabs.style.display = 'flex';
            const activeFeed = document.querySelector('#feed-tabs .tab-btn.active')?.getAttribute('data-feed') || 'home';
            this.loadPosts(activeFeed);
        } else if (viewName === 'explore') {
            this.loadPosts('explore');
        } else if (viewName === 'saved') {
            this.loadPosts('saved');
        } else if (viewName === 'notifications') {
            if (feedContainer) feedContainer.style.display = 'none';
            if (notificationsContainer) notificationsContainer.style.display = 'block';
            this.loadNotifications();
        } else if (viewName === 'profile') {
            const username = param || (Auth.currentUser ? Auth.currentUser.username : 'alexrivers');
            if (profileHeader) profileHeader.style.display = 'block';
            this.loadProfile(username);
        } else if (viewName === 'search') {
            this.loadPosts('explore', null, param);
        }
    },

    refreshFeed() {
        this.switchView(this.currentView);
    },

    // ==========================================
    // POSTS RENDERING & INTERACTIONS
    // ==========================================

    async loadPosts(feedType = 'explore', username = null, searchQuery = null) {
        const container = document.getElementById('posts-stream-container');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-circle-notch fa-spin fa-2x"></i>
                <p style="margin-top: 10px;">Loading Pulse feed...</p>
            </div>
        `;

        try {
            let endpoint = `/posts?feed=${feedType}`;
            if (username) endpoint += `&username=${encodeURIComponent(username)}`;
            if (searchQuery) endpoint += `&search=${encodeURIComponent(searchQuery)}`;

            const data = await API.request(endpoint);

            if (!data.posts || data.posts.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 50px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                        <i class="fas fa-stream fa-3x" style="color: var(--text-muted); margin-bottom: 12px;"></i>
                        <h3>No posts found</h3>
                        <p style="color: var(--text-muted); margin-top: 6px;">Be the first to share something with the Pulse network!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            data.posts.forEach(post => {
                container.appendChild(this.renderPostCard(post));
            });
        } catch (err) {
            container.innerHTML = `<div style="color: var(--accent-pink); padding: 20px;">Error loading posts: ${err.message}</div>`;
        }
    },

    renderPostCard(post) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.setAttribute('data-post-id', post.id);

        const isSelf = Auth.currentUser && Auth.currentUser.id === post.user_id;
        const formattedContent = this.formatContent(post.content);
        const timeAgo = this.formatTimeAgo(post.created_at);

        card.innerHTML = `
            <div class="post-header">
                <div class="post-author" onclick="App.switchView('profile', '${post.username}')" style="cursor: pointer;">
                    <img src="${post.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.username}" class="avatar" alt="${post.username}">
                    <div class="author-meta">
                        <span class="name">${post.full_name}</span>
                        <span class="time">@${post.username} • ${timeAgo}</span>
                    </div>
                </div>
                ${!isSelf ? `
                    <button class="btn-follow-sm ${post.is_author_followed ? 'following' : ''}" onclick="App.handleFollow(${post.user_id}, this)">
                        ${post.is_author_followed ? 'Following' : '<i class="fas fa-user-plus"></i> Follow'}
                    </button>
                ` : `
                    <button onclick="App.deletePost(${post.id})" style="color: var(--text-muted);" title="Delete Post"><i class="fas fa-trash"></i></button>
                `}
            </div>

            <div class="post-content">${formattedContent}</div>

            ${post.media_url ? `
                <div class="post-media">
                    <img src="${post.media_url}" alt="Post attachment" loading="lazy">
                </div>
            ` : ''}

            <div class="post-actions">
                <button class="action-item ${post.is_liked ? 'liked' : ''}" onclick="App.handleLike(${post.id}, this)">
                    <i class="${post.is_liked ? 'fas' : 'far'} fa-heart"></i>
                    <span class="like-count">${post.likes_count}</span>
                </button>
                
                <button class="action-item" onclick="App.toggleComments(${post.id})">
                    <i class="far fa-comment"></i>
                    <span class="comment-count">${post.comments_count}</span>
                </button>

                <button class="action-item ${post.is_bookmarked ? 'bookmarked' : ''}" onclick="App.handleBookmark(${post.id}, this)">
                    <i class="${post.is_bookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                </button>

                <button class="action-item" onclick="App.sharePost('${post.id}')">
                    <i class="far fa-paper-plane"></i>
                </button>
            </div>

            <div class="comments-section" id="comments-section-${post.id}">
                <div class="comment-input-box">
                    <input type="text" class="comment-input" id="comment-input-${post.id}" placeholder="Write a comment..." onkeypress="if(event.key === 'Enter') App.submitComment(${post.id})">
                    <button class="btn-primary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="App.submitComment(${post.id})">Post</button>
                </div>
                <div class="comments-list" id="comments-list-${post.id}">
                    <div style="color: var(--text-muted); font-size: 0.8rem;">Loading comments...</div>
                </div>
            </div>
        `;

        return card;
    },

    formatContent(content) {
        if (!content) return '';
        // Escape HTML
        let safe = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        // Highlight Hashtags
        safe = safe.replace(/#([a-zA-Z0-9_]+)/g, '<span class="hashtag" onclick="App.switchView(\'search\', \'$1\')">#$1</span>');
        return safe;
    },

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    },

    async submitPost() {
        if (!Auth.currentUser) {
            this.openModal('auth-modal');
            return;
        }

        const textarea = document.getElementById('post-textarea');
        const content = textarea.value.trim();
        let mediaUrl = '';

        if (!content && !this.selectedImageFile) {
            API.showToast('Please add text or select an image for your post.', 'error');
            return;
        }

        try {
            // Upload image if selected
            if (this.selectedImageFile) {
                const formData = new FormData();
                formData.append('image', this.selectedImageFile);
                const uploadRes = await API.request('/upload', {
                    method: 'POST',
                    body: formData
                });
                mediaUrl = uploadRes.url;
            }

            await API.request('/posts', {
                method: 'POST',
                body: { content, media_url: mediaUrl }
            });

            textarea.value = '';
            this.selectedImageFile = null;
            const mediaInput = document.getElementById('post-media-input');
            if (mediaInput) mediaInput.value = '';
            document.getElementById('image-preview-container').style.display = 'none';

            API.showToast('Post published to Pulse!', 'success');
            this.refreshFeed();
            this.loadTrendingHashtags();
        } catch (err) {
            API.showToast(err.message, 'error');
        }
    },

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await API.request(`/posts/${postId}`, { method: 'DELETE' });
            API.showToast('Post deleted.', 'info');
            const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (card) card.remove();
        } catch (err) {
            API.showToast(err.message, 'error');
        }
    },

    async handleLike(postId, btnElement) {
        if (!Auth.currentUser) {
            this.openModal('auth-modal');
            return;
        }

        try {
            const res = await API.request(`/posts/${postId}/like`, { method: 'POST' });
            btnElement.classList.toggle('liked', res.is_liked);
            const icon = btnElement.querySelector('i');
            icon.className = res.is_liked ? 'fas fa-heart' : 'far fa-heart';
            btnElement.querySelector('.like-count').textContent = res.likes_count;
        } catch (err) {
            API.showToast(err.message, 'error');
        }
    },

    async handleBookmark(postId, btnElement) {
        if (!Auth.currentUser) {
            this.openModal('auth-modal');
            return;
        }

        try {
            const res = await API.request(`/posts/${postId}/bookmark`, { method: 'POST' });
            btnElement.classList.toggle('bookmarked', res.is_bookmarked);
            const icon = btnElement.querySelector('i');
            icon.className = res.is_bookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
            API.showToast(res.message, 'info');
        } catch (err) {
            API.showToast(err.message, 'error');
        }
    },

    async handleFollow(userId, btnElement) {
        if (!Auth.currentUser) {
            this.openModal('auth-modal');
            return;
        }

        try {
            const res = await API.request(`/users/${userId}/follow`, { method: 'POST' });
            btnElement.classList.toggle('following', res.is_following);
            btnElement.innerHTML = res.is_following ? 'Following' : '<i class="fas fa-user-plus"></i> Follow';
            API.showToast(res.message, 'success');
            this.loadSuggestedPeople();
        } catch (err) {
            API.showToast(err.message, 'error');
        }
    },

    async toggleComments(postId) {
        const section = document.getElementById(`comments-section-${postId}`);
        if (!section) return;

        if (section.style.display === 'block') {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            await this.loadComments(postId);
        }
    },

    async loadComments(postId) {
        const list = document.getElementById(`comments-list-${postId}`);
        if (!list) return;

        try {
            const data = await API.request(`/posts/${postId}/comments`);
            if (data.comments.length === 0) {
                list.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 4px 0;">No comments yet. Start the conversation!</div>`;
                return;
            }

            list.innerHTML = data.comments.map(c => `
                <div class="comment-card">
                    <img src="${c.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + c.username}" class="avatar avatar-sm" alt="${c.username}">
                    <div style="flex: 1;">
                        <span class="comment-author" onclick="App.switchView('profile', '${c.username}')" style="cursor: pointer;">${c.full_name}</span>
                        <span class="comment-time">${this.formatTimeAgo(c.created_at)}</span>
                        <p style="color: var(--text-primary); margin-top: 2px;">${c.content}</p>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            list.innerHTML = `<div style="color: var(--accent-pink);">Failed to load comments.</div>`;
        }
    },

    async submitComment(postId) {
        if (!Auth.currentUser) {
            this.openModal('auth-modal');
            return;
        }

        const input = document.getElementById(`comment-input-${postId}`);
        const content = input.value.trim();
        if (!content) return;

        try {
            const res = await API.request(`/posts/${postId}/comments`, {
                method: 'POST',
                body: { content }
            });
            input.value = '';
            
            // Update Comment Counter in post card
            const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (card) {
                card.querySelector('.comment-count').textContent = res.comments_count;
            }

            await this.loadComments(postId);
            API.showToast('Comment posted!', 'success');
        } catch (err) {
            API.showToast(err.message, 'error');
        }
    },

    sharePost(postId) {
        const url = `${window.location.origin}/#post-${postId}`;
        navigator.clipboard.writeText(url);
        API.showToast('Post link copied to clipboard!', 'info');
    },

    // ==========================================
    // PROFILE VIEW LOGIC
    // ==========================================

    async loadProfile(username) {
        const container = document.getElementById('profile-header-container');
        if (!container) return;

        try {
            const data = await API.request(`/users/profile/${username}`);
            const profile = data.profile;
            this.currentProfileUser = profile;

            container.innerHTML = `
                <div class="profile-card">
                    <div class="profile-cover" style="background-image: url('${profile.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'}');"></div>
                    <div class="profile-header-content">
                        <div class="profile-avatar-row">
                            <img src="${profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.username}" class="profile-avatar" alt="${profile.username}">
                            ${profile.is_self ? `
                                <button class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem;" onclick="App.openEditProfileModal()">
                                    <i class="fas fa-edit"></i> Edit Profile
                                </button>
                            ` : `
                                <button class="btn-primary ${profile.is_following ? 'following' : ''}" style="padding: 8px 20px; font-size: 0.85rem;" onclick="App.handleFollow(${profile.id}, this)">
                                    ${profile.is_following ? 'Following' : '<i class="fas fa-user-plus"></i> Follow'}
                                </button>
                            `}
                        </div>
                        <div class="profile-name-row">
                            <h2 class="profile-fullname">${profile.full_name}</h2>
                            <span class="profile-username">@${profile.username}</span>
                        </div>
                        <p class="profile-bio">${profile.bio || 'No bio specified yet.'}</p>

                        <div class="profile-stats-row">
                            <div class="stat-box">
                                <span class="stat-value">${profile.posts_count}</span>
                                <span class="stat-label">Posts</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-value">${profile.followers_count}</span>
                                <span class="stat-label">Followers</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-value">${profile.following_count}</span>
                                <span class="stat-label">Following</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Load user's posts
            this.loadPosts('explore', username);
        } catch (err) {
            container.innerHTML = `<div style="color: var(--accent-pink); padding: 20px;">Failed to load user profile.</div>`;
        }
    },

    openEditProfileModal() {
        if (!Auth.currentUser) return;
        document.getElementById('edit-fullname').value = Auth.currentUser.full_name || '';
        document.getElementById('edit-bio').value = Auth.currentUser.bio || '';
        document.getElementById('edit-avatar').value = Auth.currentUser.avatar_url || '';
        document.getElementById('edit-cover').value = Auth.currentUser.cover_url || '';
        this.openModal('edit-profile-modal');
    },

    // ==========================================
    // NOTIFICATIONS VIEW
    // ==========================================

    async loadNotifications() {
        const container = document.getElementById('notifications-container');
        if (!container) return;

        if (!Auth.currentUser) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-lg);">
                    <p>Please log in to view your notifications.</p>
                </div>
            `;
            return;
        }

        try {
            const data = await API.request('/notifications');
            await API.request('/notifications/read', { method: 'PUT' });
            
            // Clear unread badge
            const badge = document.getElementById('unread-notif-badge');
            if (badge) badge.style.display = 'none';

            if (data.notifications.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-lg);">
                        <i class="far fa-bell-slash fa-2x" style="color: var(--text-muted); margin-bottom: 10px;"></i>
                        <p style="color: var(--text-muted);">You have no notifications yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <h2 style="margin-bottom: 16px;">Notifications</h2>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${data.notifications.map(n => {
                        let text = '';
                        let icon = '';
                        if (n.type === 'like') {
                            text = 'liked your post.';
                            icon = '<i class="fas fa-heart" style="color: var(--accent-pink);"></i>';
                        } else if (n.type === 'comment') {
                            text = 'commented on your post.';
                            icon = '<i class="fas fa-comment" style="color: var(--primary-color);"></i>';
                        } else if (n.type === 'follow') {
                            text = 'started following you.';
                            icon = '<i class="fas fa-user-plus" style="color: var(--accent-cyan);"></i>';
                        }

                        return `
                            <div class="post-card" style="padding: 14px; display: flex; align-items: center; gap: 14px;">
                                <div style="font-size: 1.2rem;">${icon}</div>
                                <img src="${n.sender_avatar}" class="avatar avatar-sm" alt="${n.sender_username}">
                                <div style="flex: 1;">
                                    <strong>${n.sender_name}</strong> @${n.sender_username} ${text}
                                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${this.formatTimeAgo(n.created_at)}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--accent-pink);">Error loading notifications.</div>`;
        }
    },

    // ==========================================
    // RIGHT SIDEBAR DATA & DEMO USERS
    // ==========================================

    async loadDemoUsers() {
        const container = document.getElementById('demo-users-list');
        if (!container) return;

        try {
            const data = await API.request('/auth/demo-users');
            container.innerHTML = data.users.map(u => `
                <div class="demo-user-pill" onclick="Auth.loginAsDemo('${u.username}')">
                    <img src="${u.avatar_url}" class="avatar avatar-sm" alt="${u.username}">
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-weight: 700; font-size: 0.85rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${u.full_name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">@${u.username}</div>
                    </div>
                    <i class="fas fa-sign-in-alt" style="color: var(--primary-color); font-size: 0.85rem;"></i>
                </div>
            `).join('');
        } catch (err) {
            console.warn('Demo users unavailable');
        }
    },

    async loadSuggestedPeople() {
        const container = document.getElementById('suggested-users-widget');
        if (!container) return;

        try {
            const data = await API.request('/users/suggested/people');
            if (data.users.length === 0) {
                container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No suggestions at the moment.</div>`;
                return;
            }

            container.innerHTML = data.users.map(u => `
                <div class="suggested-user-item">
                    <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="App.switchView('profile', '${u.username}')">
                        <img src="${u.avatar_url}" class="avatar avatar-sm" alt="${u.username}">
                        <div>
                            <div style="font-weight: 700; font-size: 0.85rem;">${u.full_name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">@${u.username}</div>
                        </div>
                    </div>
                    <button class="btn-follow-sm" onclick="App.handleFollow(${u.id}, this)">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = `<div style="color: var(--text-muted);">Could not load suggestions.</div>`;
        }
    },

    async loadTrendingHashtags() {
        const container = document.getElementById('trending-hashtags-widget');
        if (!container) return;

        try {
            const data = await API.request('/explore/trending');
            container.innerHTML = data.hashtags.map(item => `
                <div class="trending-item" onclick="App.switchView('search', '${item.tag.replace('#', '')}')">
                    <span class="trending-tag">${item.tag}</span>
                    <span class="trending-count">${item.count} posts</span>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = `<div style="color: var(--text-muted);">Could not load trends.</div>`;
        }
    },

    // Modal Helpers
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }
};

// Start application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init());
