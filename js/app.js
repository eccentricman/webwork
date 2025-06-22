// 主应用程序逻辑
class CampusLifeApp {
    constructor() {
        this.currentUser = null;
        this.posts = [];
        this.currentPage = 'home';
        this.authManager = null;
        this.init();
    }

    init() {
        // 等待authManager初始化
        if (typeof AuthManager !== 'undefined') {
            this.authManager = new AuthManager();
        }
        
        this.loadUserData();
        this.loadPosts();
        this.setupEventListeners();
        this.updateUI();
        
        // 显示首页
        this.showPage('home');
        
        // 延迟更新关注数，确保社交管理器已初始化
        setTimeout(() => {
            this.updateFollowCounts();
        }, 100);
    }

    // 加载用户数据
    loadUserData() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            
            // 如果socialManager已初始化，刷新关注数据
            if (window.socialManager) {
                window.socialManager.refreshFollowData();
            }
        }
    }

    // 加载动态数据
    loadPosts() {
        const postsData = localStorage.getItem('posts');
        if (postsData) {
            this.posts = JSON.parse(postsData);
        } else {
            // 初始化示例数据
            this.posts = this.getInitialPosts();
            this.savePosts();
        }
    }

    // 获取初始示例数据
    getInitialPosts() {
        return [
            {
                id: 1,
                author: {
                    name: '张小明',
                    avatar: 'https://via.placeholder.com/50x50/667eea/ffffff?text=张',
                    id: 'user1'
                },
                content: '今天的校园生活真是充实！刚刚参加完社团活动，认识了很多志同道合的朋友。大学生活就是要多尝试，多体验！ #校园生活 #社团活动',
                images: ['https://via.placeholder.com/400x300/f093fb/ffffff?text=校园风景'],
                tags: ['校园生活', '社团活动'],
                timestamp: Date.now() - 3600000,
                likes: 15,
                comments: 3,
                shares: 2,
                privacy: 'public',
                likedBy: [],
                sharedBy: []
            },
            {
                id: 2,
                author: {
                    name: '李小红',
                    avatar: 'https://via.placeholder.com/50x50/764ba2/ffffff?text=李',
                    id: 'user2'
                },
                content: '图书馆学习打卡📚 期末考试加油！和室友一起复习，效率翻倍～',
                images: ['https://via.placeholder.com/400x300/667eea/ffffff?text=图书馆'],
                tags: ['学习', '期末考试'],
                timestamp: Date.now() - 7200000,
                likes: 8,
                comments: 1,
                shares: 0,
                privacy: 'public',
                likedBy: [],
                sharedBy: []
            },
            {
                id: 3,
                author: {
                    name: '王大华',
                    avatar: 'https://via.placeholder.com/50x50/f5576c/ffffff?text=王',
                    id: 'user3'
                },
                content: '食堂新推出的麻辣香锅太好吃了！强烈推荐给大家～价格实惠，分量足够！',
                images: [
                    'https://via.placeholder.com/200x200/4facfe/ffffff?text=美食1',
                    'https://via.placeholder.com/200x200/f093fb/ffffff?text=美食2'
                ],
                tags: ['美食', '食堂推荐'],
                timestamp: Date.now() - 10800000,
                likes: 22,
                comments: 5,
                shares: 3,
                privacy: 'public',
                likedBy: [],
                sharedBy: []
            }
        ];
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航事件
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page) {
                    this.showPage(page);
                }
            });
        });

        // 登录/注册按钮现在是链接，不需要事件监听器

        // 动态详情模态框关闭
        const postDetailModal = document.getElementById('postDetailModal');
        if (postDetailModal) {
            const closeBtn = postDetailModal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideModal('postDetailModal');
                });
            }
            
            // 点击模态框外部关闭
            postDetailModal.addEventListener('click', (e) => {
                if (e.target === postDetailModal) {
                    this.hideModal('postDetailModal');
                }
            });
        }

        // 动态交互事件
        document.addEventListener('click', (e) => {
            // 查找最近的按钮元素
            const button = e.target.closest('.action-btn');
            if (button) {
                const action = button.getAttribute('data-action');
                
                if (action === 'like') {
                    this.handleLike(button);
                } else if (action === 'comment') {
                    this.handleComment(button);
                } else if (action === 'share') {
                    this.handleShare(button);
                } else if (action === 'follow') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleFollow(button);
                }
            }
        });

        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const filter = e.target.getAttribute('data-filter');
                this.filterPosts(filter);
            });
        });

        // 发布表单
        const publishForm = document.getElementById('publishForm');
        if (publishForm) {
            publishForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePublish();
            });
        }

        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // 设置导航
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    // 显示页面
    showPage(pageName) {
        // 隐藏所有页面
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });

        // 显示指定页面
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) {
            targetPage.style.display = 'block';
            this.currentPage = pageName;
        }

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });

        // 页面特定逻辑
        if (pageName === 'home') {
            this.renderPosts();
        } else if (pageName === 'explore') {
            this.renderExplore();
        } else if (pageName === 'publish') {
            this.checkLoginForPublish();
        } else if (pageName === 'messages') {
            this.checkLoginForMessages();
        }
    }

    // 检查发布权限
    checkLoginForPublish() {
        if (!this.currentUser) {
            this.showNotification('请先登录后再发布动态', 'warning');
            window.location.href = 'login.html';
            return;
        }
    }

    // 检查消息权限
    checkLoginForMessages() {
        if (!this.currentUser) {
            this.showNotification('请先登录后查看消息', 'warning');
            window.location.href = 'login.html';
            return;
        }
    }

    // 显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('animate-fade-in');
            document.body.style.overflow = 'hidden';
        }
    }

    // 隐藏模态框
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('animate-fade-in');
            document.body.style.overflow = 'auto';
        }
    }

    // 渲染动态列表
    renderPosts(filter = 'all') {
        const feedContainer = document.getElementById('postsContainer');
        if (!feedContainer) return;

        let filteredPosts = [...this.posts]; // 创建副本避免修改原数组
        
        if (filter === 'following') {
            // 显示关注用户的动态
            if (!this.currentUser) {
                feedContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-user-friends" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                        <p>请先登录以查看关注的用户动态</p>
                        <a href="login.html" class="btn btn-primary" style="margin-top: 15px;">立即登录</a>
                    </div>
                `;
                return;
            }

            // 获取当前用户关注的用户列表
            let followingList = [];
            if (window.socialManager) {
                followingList = window.socialManager.followData.following || [];
            }

            if (followingList.length === 0) {
                feedContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-user-plus" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                        <p>你还没有关注任何用户</p>
                        <p style="font-size: 0.9rem; margin-top: 10px;">去探索页面发现更多有趣的用户吧！</p>
                        <button class="btn btn-primary" style="margin-top: 15px;" onclick="app.showPage('explore')">去探索</button>
                    </div>
                `;
                return;
            }

            // 筛选关注用户的动态
            filteredPosts = this.posts.filter(post => {
                return followingList.includes(parseInt(post.author.id)) || followingList.includes(post.author.id.toString());
            });

            if (filteredPosts.length === 0) {
                feedContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                        <p>你关注的用户还没有发布任何动态</p>
                        <p style="font-size: 0.9rem; margin-top: 10px;">鼓励他们分享更多精彩内容吧！</p>
                    </div>
                `;
                return;
            }

            // 按时间倒序排列
            filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
        } else if (filter === 'hot') {
            filteredPosts.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
        } else if (filter === 'latest') {
            filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            // all - 按时间倒序排列
            filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
        }

        feedContainer.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
        
        // 添加动画
        feedContainer.querySelectorAll('.post-item').forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('animate-fade-in-up');
        });
    }

    // 创建动态HTML
    createPostHTML(post) {
        const timeAgo = this.getTimeAgo(post.timestamp);
        const isLiked = this.currentUser && post.likedBy.includes(this.currentUser.id);
        const isShared = this.currentUser && post.sharedBy.includes(this.currentUser.id);
        const isFollowing = this.currentUser && window.socialManager && window.socialManager.isFollowing(post.author.id);
        const isOwnPost = this.currentUser && this.currentUser.id === post.author.id;
        
        const imagesHTML = post.images && post.images.length > 0 ? `
            <div class="post-images ${post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : 'multiple'}">
                ${post.images.map(img => `<img src="${img}" alt="动态图片" class="post-image" onclick="app.showImageModal('${img}')"/>`).join('')}
            </div>
        ` : '';

        const tagsHTML = post.tags && post.tags.length > 0 ? `
            <div class="post-tags">
                ${post.tags.map(tag => `<a href="#" class="post-tag" onclick="app.searchByTag('${tag}')">#${tag}</a>`).join('')}
            </div>
        ` : '';

        return `
            <div class="post-item" data-post-id="${post.id}" onclick="app.goToPostDetail(${post.id})" style="cursor: pointer;">
                <div class="post-header">
                    <img src="${post.author.avatar || 'assets/images/avatars/default.jpg'}" alt="${post.author.name}" class="post-avatar" onclick="event.stopPropagation(); app.goToUserProfile('${post.author.id}')" style="cursor: pointer;" onerror="this.src='assets/images/avatars/default.jpg'">
                    <div class="post-info">
                        <div class="post-author" onclick="event.stopPropagation(); app.goToUserProfile('${post.author.id}')" style="cursor: pointer;">${post.author.name}</div>
                        <div class="post-time">${timeAgo}</div>
                    </div>
                    <div class="post-menu">
                        <button class="post-menu-btn" onclick="event.stopPropagation(); app.showPostMenu(${post.id})">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                ${post.isRepost && post.originalPost ? `
                    <div class="repost-content" style="border: 1px solid #e1e8ed; border-radius: 8px; padding: 15px; margin-top: 10px; background: #f8f9fa; cursor: pointer;" onclick="event.stopPropagation(); app.showOriginalPost(${post.originalPost.id})">
                        <div class="repost-header" style="display: flex; align-items: center; margin-bottom: 10px;">
                            <img src="${post.originalPost.author.avatar || 'assets/images/avatars/default.jpg'}" alt="${post.originalPost.author.name}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" onclick="event.stopPropagation(); app.goToUserProfile('${post.originalPost.author.id}')" onerror="this.src='assets/images/avatars/default.jpg'">
                            <span style="font-weight: 600; color: #1da1f2;" onclick="event.stopPropagation(); app.goToUserProfile('${post.originalPost.author.id}')">@${post.originalPost.author.name}</span>
                            <span style="color: #657786; margin-left: 8px;">${this.getTimeAgo(post.originalPost.timestamp)}</span>
                        </div>
                        <div style="color: #14171a;">${post.originalPost.content}</div>
                        ${post.originalPost.images && post.originalPost.images.length > 0 ? `
                            <div style="margin-top: 10px;">
                                ${post.originalPost.images.slice(0, 1).map(img => `<img src="${img}" alt="图片" style="max-width: 100%; border-radius: 4px;" onclick="event.stopPropagation(); app.showImageModal('${img}')">`).join('')}
                                ${post.originalPost.images.length > 1 ? `<span style="color: #657786; font-size: 0.9rem;">+${post.originalPost.images.length - 1}张图片</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                ${!post.isRepost ? imagesHTML.replace(/onclick="app\.showImageModal\('/g, 'onclick="event.stopPropagation(); app.showImageModal(\'') : ''}
                ${tagsHTML}
                <div class="post-actions" onclick="event.stopPropagation();">
                    <div class="post-actions-left">
                        <button class="action-btn ${isLiked ? 'liked' : ''}" data-action="like" data-post-id="${post.id}">
                            <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                            <span>${post.likes}</span>
                        </button>
                        <button class="action-btn" onclick="app.goToPostDetail(${post.id})">
                            <i class="far fa-comment"></i>
                            <span>${post.comments}</span>
                        </button>
                        <button class="action-btn ${isShared ? 'shared' : ''}" data-action="share" data-post-id="${post.id}">
                            <i class="fas fa-share"></i>
                            <span>${post.shares}</span>
                        </button>
                    </div>
                    <div class="post-actions-right">
                        ${!isOwnPost ? `
                            <button class="action-btn follow-btn ${isFollowing ? 'following' : ''}" data-action="follow" data-user-id="${post.author.id}">
                                <i class="fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i>
                                <span>${isFollowing ? '已关注' : '关注'}</span>
                            </button>
                        ` : ''}
                        <button class="action-btn" data-action="collect" data-post-id="${post.id}">
                            <i class="far fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 处理点赞
    handleLike(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录', 'warning');
            window.location.href = 'login.html';
            return;
        }

        const postId = parseInt(button.getAttribute('data-post-id'));
        const post = this.posts.find(p => p.id === postId);
        
        if (post) {
            const userId = this.currentUser.id;
            const isLiked = post.likedBy.includes(userId);
            
            if (isLiked) {
                post.likes--;
                post.likedBy = post.likedBy.filter(id => id !== userId);
                button.classList.remove('liked');
                button.querySelector('i').className = 'far fa-heart';
            } else {
                post.likes++;
                post.likedBy.push(userId);
                button.classList.add('liked');
                button.querySelector('i').className = 'fas fa-heart';
                button.classList.add('animate-heartbeat');
                setTimeout(() => button.classList.remove('animate-heartbeat'), 600);
            }
            
            button.querySelector('span').textContent = post.likes;
            this.savePosts();
        }
    }

    // 处理评论
    handleComment(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录', 'warning');
            window.location.href = 'login.html';
            return;
        }

        const postId = parseInt(button.getAttribute('data-post-id'));
        this.goToPostDetail(postId);
    }

    // 处理分享
    handleShare(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录', 'warning');
            window.location.href = 'login.html';
            return;
        }

        const postId = parseInt(button.getAttribute('data-post-id'));
        this.showShareModal(postId);
    }



    // 显示分享模态框
    showShareModal(postId) {
        if (window.socialManager) {
            window.socialManager.openShareModal(postId);
        } else {
            this.showNotification('分享功能未加载', 'warning');
        }
    }

    // 处理关注
    handleFollow(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录', 'warning');
            window.location.href = 'login.html';
            return;
        }

        const userId = button.getAttribute('data-user-id');
        
        // 使用社交管理器处理关注逻辑
        if (window.socialManager) {
            window.socialManager.toggleFollow(userId);
            
            // 更新按钮状态
            const isFollowing = window.socialManager.isFollowing(userId);
            
            if (isFollowing) {
                button.classList.add('following');
                button.innerHTML = '<i class="fas fa-user-check"></i><span>已关注</span>';
            } else {
                button.classList.remove('following');
                button.innerHTML = '<i class="fas fa-user-plus"></i><span>关注</span>';
            }
            
            // 更新页面上的关注数显示
            this.updateFollowCounts();
            
            // 如果当前筛选是"关注"，重新渲染动态列表
            const activeFilter = document.querySelector('.filter-btn.active');
            if (activeFilter && activeFilter.getAttribute('data-filter') === 'following') {
                this.renderPosts('following');
            }
        } else {
            this.showNotification('关注功能暂时不可用', 'warning');
        }

        // 确保保存数据
        if (this.authManager) {
            this.authManager.saveUsers();
        }
    }

    // 更新关注数量显示
    updateFollowCounts() {
        if (!window.socialManager || !this.currentUser) return;
        
        // 更新侧边栏或其他地方的关注数显示
        const followingCountElements = document.querySelectorAll('.following-count, #followingCount');
        const followersCountElements = document.querySelectorAll('.followers-count, #followersCount');
        
        const currentUserFollowData = window.socialManager.getUserFollowData(this.currentUser.id);
        const followingCount = window.socialManager.followData.following.length;
        const followersCount = currentUserFollowData.followers.length;
        
        followingCountElements.forEach(element => {
            element.textContent = followingCount;
        });
        
        followersCountElements.forEach(element => {
            element.textContent = followersCount;
        });
        
        // 如果在个人资料页面，也要更新那里的数量
        const profileFollowingCount = document.getElementById('followingCount');
        const profileFollowersCount = document.getElementById('followersCount');
        
        if (profileFollowingCount) {
            profileFollowingCount.textContent = followingCount;
        }
        
        if (profileFollowersCount) {
            profileFollowersCount.textContent = followersCount;
        }
    }

    // 跳转到用户个人主页
    goToUserProfile(userId) {
        // 如果点击的是当前用户的头像，清除viewingUserId
        if (this.currentUser && userId === this.currentUser.id) {
            sessionStorage.removeItem('viewingUserId');
        } else {
            // 将用户ID存储到sessionStorage，然后跳转到个人主页
            sessionStorage.setItem('viewingUserId', userId);
        }
        window.location.href = 'profile.html';
    }

    // 跳转到帖子详情页
    goToPostDetail(postId) {
        window.location.href = `post-detail.html?id=${postId}`;
    }

    // 显示原帖详情
    showOriginalPost(postId) {
        const originalPost = this.posts.find(p => p.id === postId);
        if (!originalPost) {
            this.showNotification('原帖不存在', 'error');
            return;
        }
        
        // 创建原帖详情模态框
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>原帖详情</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="post-item">
                        <div class="post-header">
                            <img src="${originalPost.author.avatar || 'assets/images/avatars/default.jpg'}" alt="${originalPost.author.name}" class="post-avatar" onclick="app.goToUserProfile('${originalPost.author.id}')" style="cursor: pointer;" onerror="this.src='assets/images/avatars/default.jpg'">
                            <div class="post-info">
                                <div class="post-author" onclick="app.goToUserProfile('${originalPost.author.id}')" style="cursor: pointer;">${originalPost.author.name}</div>
                                <div class="post-time">${this.getTimeAgo(originalPost.timestamp)}</div>
                            </div>
                        </div>
                        <div class="post-content">${originalPost.content}</div>
                        ${originalPost.images && originalPost.images.length > 0 ? `
                            <div class="post-images">
                                ${originalPost.images.map(img => `<img src="${img}" alt="图片" onclick="app.showImageModal('${img}')" style="cursor: pointer;">`).join('')}
                            </div>
                        ` : ''}
                        <div class="post-actions">
                            <button class="action-btn" data-action="like" data-post-id="${originalPost.id}">
                                <i class="fas fa-heart"></i>
                                <span>${originalPost.likes}</span>
                            </button>
                            <button class="action-btn" data-action="comment" data-post-id="${originalPost.id}">
                                <i class="fas fa-comment"></i>
                                <span>${originalPost.comments}</span>
                            </button>
                            <button class="action-btn" data-action="share" data-post-id="${originalPost.id}">
                                <i class="fas fa-share"></i>
                                <span>${originalPost.shares}</span>
                            </button>
                        </div>
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

    // 显示图片模态框
    showImageModal(imageSrc) {
        // 创建图片查看模态框
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>查看图片</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <img src="${imageSrc}" alt="图片" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
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

    // 处理发布
    handlePublish() {
        if (!this.currentUser) {
            this.showNotification('请先登录', 'warning');
            return;
        }

        const content = document.getElementById('postContent').value.trim();
        const privacy = document.querySelector('input[name="privacy"]:checked').value;
        
        if (!content) {
            this.showNotification('请输入动态内容', 'warning');
            return;
        }

        // 提取标签
        const tags = this.extractTags(content);
        
        // 创建新动态
        const newPost = {
            id: Date.now(),
            author: {
                name: this.currentUser.username,
                avatar: this.currentUser.avatar || 'assets/images/avatars/default.jpg',
                id: this.currentUser.id
            },
            content: content,
            images: [], // 这里可以添加图片上传功能
            tags: tags,
            timestamp: Date.now(),
            likes: 0,
            comments: 0,
            shares: 0,
            privacy: privacy,
            likedBy: [],
            sharedBy: []
        };

        this.posts.unshift(newPost);
        this.savePosts();
        
        // 清空表单
        document.getElementById('publishForm').reset();
        
        // 显示成功消息并跳转到首页
        this.showNotification('动态发布成功！', 'success');
        this.showPage('home');
    }

    // 提取标签
    extractTags(content) {
        const tagRegex = /#([\u4e00-\u9fa5\w]+)/g;
        const tags = [];
        let match;
        
        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
        }
        
        return [...new Set(tags)]; // 去重
    }

    // 筛选动态
    filterPosts(filter) {
        this.renderPosts(filter);
    }

    // 按标签搜索
    searchByTag(tag) {
        const filteredPosts = this.posts.filter(post => 
            post.tags && post.tags.includes(tag)
        );
        
        const feedContainer = document.getElementById('postsContainer');
        if (!feedContainer) return;

        if (filteredPosts.length === 0) {
            feedContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>没有找到包含 #${tag} 标签的帖子</p>
                </div>
            `;
            return;
        }

        feedContainer.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
        
        // 添加动画
        feedContainer.querySelectorAll('.post-item').forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('animate-fade-in-up');
        });

        // 显示搜索结果提示
        this.showNotification(`找到 ${filteredPosts.length} 条包含 #${tag} 的帖子`, 'info');
    }

    // 渲染探索页面
    renderExplore() {
        // 这里可以实现探索页面的内容
        console.log('渲染探索页面');
    }

    // 显示动态菜单
    showPostMenu(postId) {
        // 这里可以实现动态菜单功能（编辑、删除等）
        this.showNotification('动态菜单功能开发中...', 'info');
    }

    // 退出登录
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
        this.showNotification('已退出登录', 'info');
        this.showPage('home');
    }

    // 更新UI
    updateUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        
        if (this.currentUser) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'block';
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) {
                    userAvatar.src = this.currentUser.avatar || 'assets/images/avatars/default.jpg';
                    userAvatar.onerror = function() {
                        this.src = 'assets/images/avatars/default.jpg';
                    };
                }
                
                // 显示或隐藏管理员链接
                const adminLink = document.getElementById('adminLink');
                if (adminLink) {
                    adminLink.style.display = this.currentUser.isAdmin ? 'block' : 'none';
                }
            }
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
        
        // 重新渲染动态列表
        this.renderPosts();
        
        // 更新热门话题
        this.updateTrendingTopics();
    }

    // 保存动态数据
    savePosts() {
        localStorage.setItem('posts', JSON.stringify(this.posts));
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon ${icons[type]}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 获取时间差
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;
        
        if (diff < minute) {
            return '刚刚';
        } else if (diff < hour) {
            return Math.floor(diff / minute) + '分钟前';
        } else if (diff < day) {
            return Math.floor(diff / hour) + '小时前';
        } else if (diff < week) {
            return Math.floor(diff / day) + '天前';
        } else if (diff < month) {
            return Math.floor(diff / week) + '周前';
        } else {
            return new Date(timestamp).toLocaleDateString();
        }
    }

    // 更新热门话题
    updateTrendingTopics() {
        const trendingContainer = document.querySelector('.trending-topics');
        if (!trendingContainer) return;

        // 统计所有帖子的标签
        const tagCounts = {};
        this.posts.forEach(post => {
            if (post.tags && post.tags.length > 0) {
                post.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // 按使用次数排序，取前4个
        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        // 如果没有标签，显示默认内容
        if (sortedTags.length === 0) {
            trendingContainer.innerHTML = `
                <div class="topic-item">
                    <span class="topic-tag">#学习日常</span>
                    <span class="topic-count">0</span>
                </div>
                <div class="topic-item">
                    <span class="topic-tag">#校园生活</span>
                    <span class="topic-count">0</span>
                </div>
                <div class="topic-item">
                    <span class="topic-tag">#考试周</span>
                    <span class="topic-count">0</span>
                </div>
                <div class="topic-item">
                    <span class="topic-tag">#社团活动</span>
                    <span class="topic-count">0</span>
                </div>
            `;
            return;
        }

        // 生成热门话题HTML
        trendingContainer.innerHTML = sortedTags.map(([tag, count]) => `
            <div class="topic-item" onclick="app.searchByTag('${tag}')" style="cursor: pointer;">
                <span class="topic-tag">#${tag}</span>
                <span class="topic-count">${count}</span>
            </div>
        `).join('');

        // 如果不足4个，用默认话题补充
        const defaultTopics = ['学习日常', '校园生活', '考试周', '社团活动'];
        while (sortedTags.length < 4) {
            const defaultTag = defaultTopics[sortedTags.length];
            if (!tagCounts[defaultTag]) {
                trendingContainer.innerHTML += `
                    <div class="topic-item" onclick="app.searchByTag('${defaultTag}')" style="cursor: pointer;">
                        <span class="topic-tag">#${defaultTag}</span>
                        <span class="topic-count">0</span>
                    </div>
                `;
            }
            sortedTags.push([defaultTag, 0]);
        }
    }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CampusLifeApp();
    window.app = app;
});

// 全局函数（供HTML调用，仅用于动态详情模态框）
function showModal(modalId) {
    if (app && modalId === 'postDetailModal') {
        app.showModal(modalId);
    }
}

function hideModal(modalId) {
    if (app && modalId === 'postDetailModal') {
        app.hideModal(modalId);
    }
}

function showPage(pageName) {
    if (app) app.showPage(pageName);
}

// 全局退出登录函数
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberUser');
        if (app) {
            app.currentUser = null;
            app.updateUI();
        }
        window.location.href = 'login.html';
    }
}