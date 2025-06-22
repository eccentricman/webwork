// 社交功能模块
class SocialManager {
    constructor() {
        this.messageData = this.loadMessageData();
        this.collectData = this.loadCollectData();
        this.shareData = this.loadShareData();
        this.setupEventListeners();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 关注/取消关注按钮
        document.addEventListener('click', (e) => {
            if (e.target.matches('.follow-btn') || e.target.closest('.follow-btn')) {
                const btn = e.target.matches('.follow-btn') ? e.target : e.target.closest('.follow-btn');
                const userId = btn.dataset.userId;
                if (userId) {
                    this.toggleFollow(userId);
                }
            }
            
            // 私信按钮
            if (e.target.matches('.message-btn') || e.target.closest('.message-btn')) {
                const btn = e.target.matches('.message-btn') ? e.target : e.target.closest('.message-btn');
                const userId = btn.dataset.userId;
                if (userId) {
                    this.openMessageModal(userId);
                }
            }
            
            // 分享按钮
            if (e.target.matches('.share-btn') || e.target.closest('.share-btn')) {
                const btn = e.target.matches('.share-btn') ? e.target : e.target.closest('.share-btn');
                const postId = btn.dataset.postId;
                if (postId) {
                    this.openShareModal(postId);
                }
            }
            
            // 收藏按钮
            if (e.target.matches('.collect-btn') || e.target.closest('.collect-btn')) {
                const btn = e.target.matches('.collect-btn') ? e.target : e.target.closest('.collect-btn');
                const postId = btn.dataset.postId;
                if (postId) {
                    this.toggleCollect(postId);
                }
            }
        });
    }

    // 获取当前用户
    getCurrentUser() {
        const currentUserData = localStorage.getItem('currentUser');
        return currentUserData ? JSON.parse(currentUserData) : null;
    }

    // 通过ID获取用户
    getUserById(userId) {
        if (!window.authManager) return null;
        return window.authManager.users.find(u => u.id === parseInt(userId));
    }

    // 加载消息数据
    loadMessageData() {
        return JSON.parse(localStorage.getItem('messageData')) || {};
    }

    // 保存消息数据
    saveMessageData() {
        localStorage.setItem('messageData', JSON.stringify(this.messageData));
    }

    // 加载收藏数据
    loadCollectData() {
        return JSON.parse(localStorage.getItem('collectData')) || [];
    }

    // 保存收藏数据
    saveCollectData() {
        localStorage.setItem('collectData', JSON.stringify(this.collectData));
    }

    // 加载分享数据
    loadShareData() {
        return JSON.parse(localStorage.getItem('shareData')) || {};
    }

    // 保存分享数据
    saveShareData() {
        localStorage.setItem('shareData', JSON.stringify(this.shareData));
    }

    // 切换关注状态
    toggleFollow(userId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            this.showNotification('请先登录', 'warning');
            return;
        }

        const targetUserId = parseInt(userId);
        if (currentUser.id === targetUserId) {
            this.showNotification('不能关注自己', 'warning');
            return;
        }

        if (!window.authManager) {
            this.showNotification('系统错误', 'error');
            return;
        }

        // 获取当前用户和目标用户在users数组中的引用
        const currentUserInUsers = window.authManager.users.find(u => u.id === currentUser.id);
        const targetUser = window.authManager.users.find(u => u.id === targetUserId);

        if (!currentUserInUsers || !targetUser) {
            this.showNotification('用户不存在', 'error');
            return;
        }

        // 确保followers和following数组存在
        if (!currentUserInUsers.following) currentUserInUsers.following = [];
        if (!targetUser.followers) targetUser.followers = [];

        const isFollowing = currentUserInUsers.following.includes(targetUserId);

        if (isFollowing) {
            // 取消关注：从我的关注列表中移除，从对方的粉丝列表中移除
            currentUserInUsers.following = currentUserInUsers.following.filter(id => id !== targetUserId);
            targetUser.followers = targetUser.followers.filter(id => id !== currentUser.id);
            this.showNotification('已取消关注', 'success');
        } else {
            // 关注：添加到我的关注列表，添加到对方的粉丝列表
            currentUserInUsers.following.push(targetUserId);
            targetUser.followers.push(currentUser.id);
            this.showNotification('关注成功', 'success');
        }

        // 保存到localStorage
        window.authManager.saveUsers();
        
        // 更新当前用户数据
        localStorage.setItem('currentUser', JSON.stringify(currentUserInUsers));

        // 更新界面
        this.updateFollowButtons();
        this.updateFollowCounts();
    }

    // 检查是否已关注
    isFollowing(userId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !window.authManager) return false;

        const currentUserInUsers = window.authManager.users.find(u => u.id === currentUser.id);
        if (!currentUserInUsers || !currentUserInUsers.following) return false;

        return currentUserInUsers.following.includes(parseInt(userId));
    }

    // 更新关注按钮状态
    updateFollowButtons() {
        document.querySelectorAll('.follow-btn').forEach(btn => {
            const userId = btn.dataset.userId;
            if (userId) {
                const isFollowing = this.isFollowing(userId);
                btn.classList.toggle('following', isFollowing);
                btn.innerHTML = isFollowing ? 
                    '<i class="fas fa-user-check"></i> 已关注' : 
                    '<i class="fas fa-user-plus"></i> 关注';
            }
        });
    }

    // 获取用户的关注数据（从users数组中获取）
    getUserFollowData(userId) {
        if (!window.authManager) return { following: [], followers: [] };
        
        const user = window.authManager.users.find(u => u.id === parseInt(userId));
        if (!user) return { following: [], followers: [] };

        return {
            following: user.following || [],
            followers: user.followers || []
        };
    }

    // 更新关注数量
    updateFollowCounts() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        const userFollowData = this.getUserFollowData(currentUser.id);

        // 更新首页的关注数量
        const followingCount = document.querySelector('.following-count');
        const followersCount = document.querySelector('.followers-count');
        
        if (followingCount) {
            followingCount.textContent = userFollowData.following.length;
        }
        
        if (followersCount) {
            followersCount.textContent = userFollowData.followers.length;
        }

        // 更新个人主页的统计数据
        const profileFollowingCount = document.getElementById('followingCount');
        const profileFollowersCount = document.getElementById('followersCount');
        
        if (profileFollowingCount) {
            profileFollowingCount.textContent = userFollowData.following.length;
        }
        
        if (profileFollowersCount) {
            profileFollowersCount.textContent = userFollowData.followers.length;
        }
    }

    // 获取关注列表
    getFollowingList() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !window.authManager) return [];

        const userFollowData = this.getUserFollowData(currentUser.id);
        return userFollowData.following.map(userId => {
            return window.authManager.users.find(user => user.id === userId);
        }).filter(user => user);
    }

    // 获取粉丝列表
    getFollowersList() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !window.authManager) return [];
        
        const userFollowData = this.getUserFollowData(currentUser.id);
        
        return userFollowData.followers.map(userId => {
            const user = window.authManager.users.find(u => u.id === userId);
            if (user) {
                return {
                    ...user,
                    isFollowingBack: this.isFollowing(user.id)
                };
            }
            return null;
        }).filter(user => user);
    }

    // 打开私信模态框
    openMessageModal(userId) {
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) {
            this.showNotification('请先登录', 'warning');
            return;
        }

        const user = window.authManager ? window.authManager.users.find(u => u.id === parseInt(userId)) : null;
        if (!user) {
            this.showNotification('用户不存在', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal message-modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <div class="message-header">
                        <img src="${user.avatar || 'assets/images/avatars/default.jpg'}" alt="${user.username}" class="user-avatar" onerror="this.src='assets/images/avatars/default.jpg'">
                        <div>
                            <h3>${user.username}</h3>
                            <span class="user-status">在线</span>
                        </div>
                    </div>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="message-history" id="messageHistory">
                        ${this.renderMessageHistory(userId)}
                    </div>
                    <div class="message-input-area">
                        <div class="message-input">
                            <input type="text" id="messageInput" placeholder="输入消息..." maxlength="500">
                            <button class="send-btn" onclick="socialManager.sendMessage(${userId})">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // 聚焦输入框
        const messageInput = modal.querySelector('#messageInput');
        messageInput.focus();

        // 回车发送
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage(userId);
            }
        });

        // 关闭事件
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // 滚动到底部
        const messageHistory = modal.querySelector('#messageHistory');
        messageHistory.scrollTop = messageHistory.scrollHeight;
    }

    // 渲染消息历史
    renderMessageHistory(userId) {
        const conversationKey = this.getConversationKey(window.app.currentUser.id, userId);
        const messages = this.messageData[conversationKey] || [];

        if (messages.length === 0) {
            return '<div class="no-messages">还没有消息，开始聊天吧！</div>';
        }

        return messages.map(message => `
            <div class="message-item ${message.senderId === window.app.currentUser.id ? 'sent' : 'received'}">
                <div class="message-content">${message.content}</div>
                <div class="message-time">${utils.formatDate(message.timestamp)}</div>
            </div>
        `).join('');
    }

    // 获取对话键
    getConversationKey(userId1, userId2) {
        const ids = [userId1, userId2].sort((a, b) => a - b);
        return `${ids[0]}_${ids[1]}`;
    }

    // 发送消息
    sendMessage(userId) {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        const content = messageInput.value.trim();
        if (!content) {
            this.showNotification('请输入消息内容', 'warning');
            return;
        }

        const conversationKey = this.getConversationKey(window.app.currentUser.id, userId);
        
        if (!this.messageData[conversationKey]) {
            this.messageData[conversationKey] = [];
        }

        const message = {
            id: Date.now(),
            senderId: window.app.currentUser.id,
            receiverId: parseInt(userId),
            content: content,
            timestamp: Date.now(),
            read: false
        };

        this.messageData[conversationKey].push(message);
        this.saveMessageData();

        // 清空输入框
        messageInput.value = '';

        // 更新消息历史
        const messageHistory = document.getElementById('messageHistory');
        if (messageHistory) {
            messageHistory.innerHTML = this.renderMessageHistory(userId);
            messageHistory.scrollTop = messageHistory.scrollHeight;
        }

        this.showNotification('消息发送成功', 'success');
    }

    // 获取消息列表
    getMessageList() {
        if (!window.app || !window.app.currentUser) return [];

        const currentUserId = window.app.currentUser.id;
        const conversations = [];

        Object.keys(this.messageData).forEach(key => {
            const [userId1, userId2] = key.split('_').map(id => parseInt(id));
            const otherUserId = userId1 === currentUserId ? userId2 : userId1;
            
            if (userId1 === currentUserId || userId2 === currentUserId) {
                const messages = this.messageData[key];
                const lastMessage = messages[messages.length - 1];
                const otherUser = window.authManager ? window.authManager.users.find(u => u.id === otherUserId) : null;
                
                if (otherUser && lastMessage) {
                    conversations.push({
                        user: otherUser,
                        lastMessage: lastMessage,
                        unreadCount: messages.filter(m => m.receiverId === currentUserId && !m.read).length
                    });
                }
            }
        });

        return conversations.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
    }

    // 打开分享模态框
    openShareModal(postId) {
        const post = window.app ? window.app.posts.find(p => p.id === parseInt(postId)) : null;
        if (!post) {
            this.showNotification('动态不存在', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal share-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>分享动态</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="share-options">
                        <button class="share-option" onclick="socialManager.shareToWeChat(${postId})">
                            <i class="fab fa-weixin"></i>
                            <span>微信</span>
                        </button>
                        <button class="share-option" onclick="socialManager.shareToWeibo(${postId})">
                            <i class="fab fa-weibo"></i>
                            <span>微博</span>
                        </button>
                        <button class="share-option" onclick="socialManager.shareToQQ(${postId})">
                            <i class="fab fa-qq"></i>
                            <span>QQ</span>
                        </button>
                        <button class="share-option" onclick="socialManager.copyShareLink(${postId})">
                            <i class="fas fa-link"></i>
                            <span>复制链接</span>
                        </button>
                        <button class="share-option" onclick="socialManager.repost(${postId})">
                            <i class="fas fa-retweet"></i>
                            <span>转发</span>
                        </button>
                    </div>
                    <div class="post-preview">
                        <div class="post-author">
                            <img src="${post.author.avatar || 'assets/images/avatars/default.jpg'}" alt="${post.author.name}" class="user-avatar" onerror="this.src='assets/images/avatars/default.jpg'">
                            <span>${post.author.name}</span>
                        </div>
                        <div class="post-content">${utils.truncateText(post.content, 100)}</div>
                        ${post.images && post.images.length > 0 ? `
                            <div class="post-images">
                                <img src="${post.images[0]}" alt="图片" class="preview-image">
                                ${post.images.length > 1 ? `<span class="image-count">+${post.images.length - 1}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // 关闭事件
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 分享到微信
    shareToWeChat(postId) {
        this.showNotification('微信分享功能需要在微信环境中使用', 'info');
        this.recordShare(postId, 'wechat');
    }

    // 分享到微博
    shareToWeibo(postId) {
        const post = window.app.posts.find(p => p.id === parseInt(postId));
        if (post) {
            const text = encodeURIComponent(`${post.content} - 来自校园生活社交平台`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${text}`, '_blank');
            this.recordShare(postId, 'weibo');
        }
    }

    // 分享到QQ
    shareToQQ(postId) {
        const post = window.app.posts.find(p => p.id === parseInt(postId));
        if (post) {
            const text = encodeURIComponent(post.content);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${text}`, '_blank');
            this.recordShare(postId, 'qq');
        }
    }

    // 复制分享链接
    async copyShareLink(postId) {
        const shareUrl = `${window.location.origin}${window.location.pathname}#post-${postId}`;
        const success = await utils.copyToClipboard(shareUrl);
        
        if (success) {
            this.showNotification('链接已复制到剪贴板', 'success');
            this.recordShare(postId, 'link');
        } else {
            this.showNotification('复制失败，请手动复制', 'error');
        }
        
        // 关闭模态框
        const modal = document.querySelector('.share-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }

    // 转发动态
    repost(postId) {
        if (!window.app || !window.app.currentUser) {
            this.showNotification('请先登录', 'warning');
            return;
        }

        const post = window.app.posts.find(p => p.id === parseInt(postId));
        if (!post) {
            this.showNotification('动态不存在', 'error');
            return;
        }

        // 创建转发动态
        const repostContent = `转发了 @${post.author.name} 的动态`;
        const newPost = {
            id: Date.now(),
            author: {
                name: window.app.currentUser.username,
                                        avatar: window.app.currentUser.avatar || 'assets/images/avatars/default.jpg',
                id: window.app.currentUser.id
            },
            content: repostContent,
            originalPost: post,
            timestamp: Date.now(),
            likes: 0,
            comments: 0,
            shares: 0,
            privacy: 'public',
            likedBy: [],
            sharedBy: [],
            commentList: [],
            isRepost: true
        };

        window.app.posts.unshift(newPost);
        window.app.savePosts();
        window.app.renderPosts();

        this.recordShare(postId, 'repost');
        this.showNotification('转发成功', 'success');

        // 关闭模态框
        const modal = document.querySelector('.share-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }

    // 记录分享
    recordShare(postId, platform) {
        const key = `${postId}_${platform}`;
        if (!this.shareData[key]) {
            this.shareData[key] = 0;
        }
        this.shareData[key]++;
        this.saveShareData();

        // 更新动态分享数
        if (window.app) {
            const post = window.app.posts.find(p => p.id === parseInt(postId));
            if (post) {
                post.shares = (post.shares || 0) + 1;
                window.app.savePosts();
                window.app.renderPosts();
            }
        }
    }

    // 切换收藏状态
    toggleCollect(postId) {
        if (!window.app || !window.app.currentUser) {
            this.showNotification('请先登录', 'warning');
            return;
        }

        const postIdNum = parseInt(postId);
        const isCollected = this.collectData.includes(postIdNum);

        if (isCollected) {
            // 取消收藏
            this.collectData = this.collectData.filter(id => id !== postIdNum);
            this.showNotification('已取消收藏', 'success');
        } else {
            // 收藏
            this.collectData.push(postIdNum);
            this.showNotification('收藏成功', 'success');
        }

        this.saveCollectData();
        this.updateCollectButtons();
    }

    // 检查是否已收藏
    isCollected(postId) {
        return this.collectData.includes(parseInt(postId));
    }

    // 更新收藏按钮状态
    updateCollectButtons() {
        document.querySelectorAll('.collect-btn').forEach(btn => {
            const postId = btn.dataset.postId;
            if (postId) {
                const isCollected = this.isCollected(postId);
                btn.classList.toggle('collected', isCollected);
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isCollected ? 'fas fa-bookmark' : 'far fa-bookmark';
                }
            }
        });
    }

    // 获取收藏列表
    getCollectedPosts() {
        if (!window.app) return [];
        
        return this.collectData.map(postId => {
            return window.app.posts.find(post => post.id === postId);
        }).filter(post => post);
    }

    // 显示关注列表
    showFollowingList() {
        const followingList = this.getFollowingList();
        this.showUserListModal('关注列表', followingList, 'following');
    }

    // 显示粉丝列表
    showFollowersList() {
        const followersList = this.getFollowersList();
        this.showUserListModal('粉丝列表', followersList, 'followers');
    }

    // 显示用户列表模态框
    showUserListModal(title, users, type) {
        const modal = document.createElement('div');
        modal.className = 'modal user-list-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title} (${users.length})</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-list">
                        ${users.length > 0 ? users.map(user => `
                            <div class="user-item">
                                <img src="${user.avatar || 'assets/images/avatars/default.jpg'}" alt="${user.username}" class="user-avatar" onerror="this.src='assets/images/avatars/default.jpg'">
                                <div class="user-info">
                                    <div class="user-name">${user.username}</div>
                                    <div class="user-desc">${user.bio || '这个人很懒，什么都没写'}</div>
                                </div>
                                <div class="user-actions">
                                    ${type === 'following' ? `
                                        <button class="btn btn-outline follow-btn following" data-user-id="${user.id}">
                                            <i class="fas fa-user-check"></i> 已关注
                                        </button>
                                    ` : `
                                        <button class="btn btn-primary follow-btn ${this.isFollowing(user.id) ? 'following' : ''}" data-user-id="${user.id}">
                                            <i class="fas fa-user-${this.isFollowing(user.id) ? 'check' : 'plus'}"></i> 
                                            ${this.isFollowing(user.id) ? '已关注' : '关注'}
                                        </button>
                                    `}
                                    <button class="btn btn-outline message-btn" data-user-id="${user.id}">
                                        <i class="fas fa-comment"></i> 私信
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="no-data">暂无数据</div>'}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // 关闭事件
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 获取推荐用户
    getRecommendedUsers(limit = 5) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !window.authManager) return [];
        
        const userFollowData = this.getUserFollowData(currentUser.id);
        
        return window.authManager.users
            .filter(user => user.id !== currentUser.id && !userFollowData.following.includes(user.id))
            .slice(0, limit)
            .map(user => ({
                ...user,
                reason: this.getRecommendReason(user)
            }));
    }

    // 获取推荐理由
    getRecommendReason(user) {
        const reasons = [
            '可能认识的人',
            '同校用户',
            '热门用户',
            '活跃用户',
            '新用户'
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    // 渲染推荐用户
    renderRecommendedUsers() {
        const container = document.querySelector('.recommended-users');
        if (!container) return;

        const users = this.getRecommendedUsers();
        
        container.innerHTML = users.map(user => `
            <div class="recommended-user">
                <img src="${user.avatar || 'assets/images/avatars/default.jpg'}" alt="${user.username}" class="user-avatar" onerror="this.src='assets/images/avatars/default.jpg'">
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-reason">${user.reason}</div>
                </div>
                <button class="btn btn-sm btn-primary follow-btn" data-user-id="${user.id}">
                    <i class="fas fa-user-plus"></i> 关注
                </button>
            </div>
        `).join('');
    }

    // 获取社交统计
    getSocialStats() {
        return {
            following: this.followData.following.length,
            followers: this.getFollowersList().length,
            posts: window.app ? window.app.posts.filter(p => p.author.id === window.app.currentUser?.id).length : 0,
            collections: this.collectData.length,
            messages: Object.keys(this.messageData).length
        };
    }

    // 显示通知
    showNotification(message, type = 'info') {
        if (window.app) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // 初始化社交功能
    init() {
        this.updateFollowButtons();
        this.updateCollectButtons();
        this.updateFollowCounts();
        this.renderRecommendedUsers();
    }
}

// 初始化社交管理器
let socialManager;
document.addEventListener('DOMContentLoaded', () => {
    socialManager = new SocialManager();
    
    // 监听用户登录事件
    document.addEventListener('userLoggedIn', () => {
        socialManager.init();
    });
});

// 全局函数
function toggleFollow(userId) {
    if (socialManager) {
        socialManager.toggleFollow(userId);
    }
}

function openMessageModal(userId) {
    if (socialManager) {
        socialManager.openMessageModal(userId);
    }
}

function sendMessage(userId) {
    if (socialManager) {
        socialManager.sendMessage(userId);
    }
}

function openShareModal(postId) {
    if (socialManager) {
        socialManager.openShareModal(postId);
    }
}

function toggleCollect(postId) {
    if (socialManager) {
        socialManager.toggleCollect(postId);
    }
}

function showFollowingList() {
    if (socialManager) {
        socialManager.showFollowingList();
    }
}

function showFollowersList() {
    if (socialManager) {
        socialManager.showFollowersList();
    }
}