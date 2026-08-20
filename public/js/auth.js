/* ==========================================================================
   PULSE SOCIAL - AUTH & SESSION MANAGER
   ========================================================================== */

const Auth = {
    currentUser: null,

    async init() {
        const token = API.getToken();
        if (token) {
            try {
                const res = await API.request('/auth/me');
                this.currentUser = res.user;
            } catch (err) {
                console.warn('Session expired or invalid token.');
                API.removeToken();
                this.currentUser = null;
            }
        }
        this.updateAuthUI();
    },

    async login(login, password) {
        const res = await API.request('/auth/login', {
            method: 'POST',
            body: { login, password }
        });
        API.setToken(res.token);
        this.currentUser = res.user;
        API.showToast(`Welcome back, @${res.user.username}!`, 'success');
        this.updateAuthUI();
        if (window.App) window.App.updateNotifBadge();
        return res;
    },

    async register(userData) {
        const res = await API.request('/auth/register', {
            method: 'POST',
            body: userData
        });
        API.setToken(res.token);
        this.currentUser = res.user;
        API.showToast(`Account created! Welcome to Pulse, @${res.user.username}`, 'success');
        this.updateAuthUI();
        if (window.App) window.App.updateNotifBadge();
        return res;
    },

    async loginAsDemo(username) {
        try {
            // Password for demo users is 'password123'
            const res = await this.login(username, 'password123');
            if (window.App) window.App.refreshFeed();
            return res;
        } catch (err) {
            API.showToast('Failed demo login: ' + err.message, 'error');
        }
    },

    logout() {
        API.removeToken();
        this.currentUser = null;
        API.showToast('Logged out successfully.', 'info');
        this.updateAuthUI();
        if (window.App) window.App.refreshFeed();
    },

    updateAuthUI() {
        const userSummary = document.getElementById('sidebar-user-summary');
        const loginBtn = document.getElementById('nav-login-btn');
        const logoutBtn = document.getElementById('nav-logout-btn');
        const createPostBox = document.getElementById('create-post-card');

        if (this.currentUser) {
            if (userSummary) {
                userSummary.style.display = 'flex';
                userSummary.querySelector('.name').textContent = this.currentUser.full_name;
                userSummary.querySelector('.handle').textContent = `@${this.currentUser.username}`;
                userSummary.querySelector('.avatar').src = this.currentUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user';
            }
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'flex';
            if (createPostBox) createPostBox.style.display = 'block';

            // Update user avatar in post creator
            const creatorAvatar = document.getElementById('creator-avatar');
            if (creatorAvatar) creatorAvatar.src = this.currentUser.avatar_url;
        } else {
            if (userSummary) userSummary.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (createPostBox) createPostBox.style.display = 'block'; // show preview or login hint
        }
    }
};
