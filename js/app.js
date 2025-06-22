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
            window.authManager = this.authManager; // 确保暴露到全局
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
            // 确保用户有bookmarks字段
            if (!this.currentUser.bookmarks) {
                this.currentUser.bookmarks = [];
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
        }
    }

    // 加载动态数据
    loadPosts() {
        const postsData = localStorage.getItem('posts');
        if (postsData) {
            this.posts = JSON.parse(postsData);
        } else {
            // 初始化为空数组
            this.posts = [];
            this.savePosts();
        }
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
                // 阻止事件冒泡，避免触发动态点击事件
                e.stopPropagation();
                e.preventDefault();
                
                const action = button.getAttribute('data-action');
                
                if (action === 'like') {
                    this.handleLike(button);
                } else if (action === 'comment') {
                    this.handleComment(button);
                } else if (action === 'collect') {
                    this.handleBookmark(button);
                } else if (action === 'follow') {
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
                // 移除重复的发布逻辑，使用postManager处理
                if (window.postManager) {
                    window.postManager.publishPost();
                }
            });
        }

        // 图片上传功能 - 移除重复绑定
        // const imageInput = document.getElementById('imageInput');
        // if (imageInput) {
        //     imageInput.addEventListener('change', (e) => {
        //         this.handleImageUpload(e);
        //     });
        // }

        // 发布按钮单独绑定 - 移除重复绑定
        // const publishBtn = document.getElementById('publishBtn');
        // if (publishBtn) {
        //     publishBtn.addEventListener('click', () => {
        //         this.handlePublish();
        //     });
        // }

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
        
        // 首先根据可见性过滤动态
        filteredPosts = filteredPosts.filter(post => {
            // 如果没有设置privacy字段，默认为公开
            const privacy = post.privacy || 'public';
            
            // 公开动态：所有人可见
            if (privacy === 'public') {
                return true;
            }
            
            // 如果未登录，只能看到公开动态
            if (!this.currentUser) {
                return false;
            }
            
            // 私有动态：只有作者自己可见
            if (privacy === 'private') {
                return String(post.author.id) === String(this.currentUser.id);
            }
            
            // 好友可见动态：只有互相关注的用户可见
            if (privacy === 'friends') {
                // 如果是作者自己，可以看到
                if (String(post.author.id) === String(this.currentUser.id)) {
                    return true;
                }
                
                // 检查是否互相关注（好友关系）
                if (window.socialManager) {
                    const currentUserFollowing = window.socialManager.getUserFollowData(this.currentUser.id).following || [];
                    const postAuthorFollowing = window.socialManager.getUserFollowData(post.author.id).following || [];
                    
                    // 互相关注才是好友
                    const isCurrentUserFollowingAuthor = currentUserFollowing.some(id => String(id) === String(post.author.id));
                    const isAuthorFollowingCurrentUser = postAuthorFollowing.some(id => String(id) === String(this.currentUser.id));
                    
                    return isCurrentUserFollowingAuthor && isAuthorFollowingCurrentUser;
                }
                
                return false;
            }
            
            return true;
        });
        
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
            if (window.socialManager && this.currentUser) {
                const userFollowData = window.socialManager.getUserFollowData(this.currentUser.id);
                followingList = userFollowData.following || [];
                console.log('关注列表:', followingList);
                console.log('所有动态作者ID:', this.posts.map(p => p.author.id));
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

            // 筛选关注用户的动态（使用字符串比较）
            filteredPosts = this.posts.filter(post => {
                const isFollowed = followingList.some(userId => String(userId) === String(post.author.id));
                console.log('检查动态:', post.author.id, '是否在关注列表中:', isFollowed);
                return isFollowed;
            });
            
            console.log('筛选后的动态数量:', filteredPosts.length);

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
        } else if (filter === 'bookmarked') {
            // 显示收藏的动态
            if (!this.currentUser) {
                feedContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-bookmark" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                        <p>请先登录以查看收藏的动态</p>
                        <a href="login.html" class="btn btn-primary" style="margin-top: 15px;">立即登录</a>
                    </div>
                `;
                return;
            }

            // 获取用户收藏的动态ID列表
            const bookmarkedIds = this.currentUser.bookmarks || [];
            
            if (bookmarkedIds.length === 0) {
                feedContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-bookmark" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                        <p>你还没有收藏任何动态</p>
                        <p style="font-size: 0.9rem; margin-top: 10px;">点击动态右下角的收藏按钮来收藏感兴趣的内容吧！</p>
                    </div>
                `;
                return;
            }

            // 筛选收藏的动态
            filteredPosts = this.posts.filter(post => bookmarkedIds.includes(post.id));
            
            if (filteredPosts.length === 0) {
                feedContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                        <p>你收藏的动态可能已被删除</p>
                        <p style="font-size: 0.9rem; margin-top: 10px;">去发现更多精彩内容吧！</p>
                    </div>
                `;
                return;
            }

            // 按收藏时间倒序排列（最近收藏的在前面）
            filteredPosts.sort((a, b) => {
                const aIndex = bookmarkedIds.indexOf(a.id);
                const bIndex = bookmarkedIds.indexOf(b.id);
                return aIndex - bIndex; // 数组中越靠前的（越早收藏的）排在后面
            });
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
        const isBookmarked = this.currentUser && this.currentUser.bookmarks && this.currentUser.bookmarks.includes(post.id);
        const isFollowing = this.currentUser && window.socialManager && window.socialManager.isFollowing(post.author.id);
        const isOwnPost = this.currentUser && String(this.currentUser.id) === String(post.author.id);
        
        // 获取作者的最新信息（包括头像）
        const authorInfo = this.authManager && this.authManager.users ? 
            this.authManager.users.find(u => String(u.id) === String(post.author.id)) || post.author :
            post.author;
        
        const imagesHTML = post.images && post.images.length > 0 ? `
            <div class="post-images ${post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : 'multiple'}">
                ${post.images.map(img => `<img src="${img}" alt="动态图片" class="post-image" onclick="app.showImageModal('${img}')" onerror="this.style.display='none'"/>`).join('')}
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
                    <img src="${authorInfo.avatar || 'assets/images/avatars/default.jpg'}" alt="${authorInfo.username || authorInfo.name}" class="post-avatar" onclick="event.stopPropagation(); app.goToUserProfile('${post.author.id}')" style="cursor: pointer;" onerror="this.src='assets/images/avatars/default.jpg'">
                    <div class="post-info">
                        <div class="post-author" onclick="event.stopPropagation(); app.goToUserProfile('${post.author.id}')" style="cursor: pointer;">${authorInfo.username || authorInfo.name}</div>
                        <div class="post-time">${timeAgo}</div>
                    </div>

                </div>
                <div class="post-content">${post.content}</div>
                ${post.isRepost && post.originalPost ? `
                    <div class="repost-content" style="border: 1px solid #e1e8ed; border-radius: 8px; padding: 15px; margin-top: 10px; background: #f8f9fa; cursor: pointer;" onclick="event.stopPropagation(); app.showOriginalPost(${post.originalPost.id})">
                        <div class="repost-header" style="display: flex; align-items: center; margin-bottom: 10px;">
                            <img src="${(this.authManager && this.authManager.users ? this.authManager.users.find(u => String(u.id) === String(post.originalPost.author.id))?.avatar : null) || post.originalPost.author.avatar || 'assets/images/avatars/default.jpg'}" alt="${post.originalPost.author.name}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" onclick="event.stopPropagation(); app.goToUserProfile('${post.originalPost.author.id}')" onerror="this.src='assets/images/avatars/default.jpg'">
                            <span style="font-weight: 600; color: #1da1f2;" onclick="event.stopPropagation(); app.goToUserProfile('${post.originalPost.author.id}')">@${post.originalPost.author.name}</span>
                            <span style="color: #657786; margin-left: 8px;">${this.getTimeAgo(post.originalPost.timestamp)}</span>
                        </div>
                        <div style="color: #14171a;">${post.originalPost.content}</div>
                        ${post.originalPost.images && post.originalPost.images.length > 0 ? `
                            <div style="margin-top: 10px;">
                                ${post.originalPost.images.slice(0, 1).map(img => `<img src="${img}" alt="图片" style="max-width: 100%; border-radius: 4px; object-fit: cover;" onclick="event.stopPropagation(); app.showImageModal('${img}')" onerror="this.style.display='none'">`).join('')}
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
                        <button class="action-btn" data-action="comment" data-post-id="${post.id}">
                            <i class="far fa-comment"></i>
                            <span>${post.comments}</span>
                        </button>
                        <button class="action-btn ${isBookmarked ? 'bookmarked' : ''}" data-action="collect" data-post-id="${post.id}">
                            <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
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

    // 处理收藏
    handleBookmark(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录', 'warning');
            window.location.href = 'login.html';
            return;
        }

        const postId = parseInt(button.getAttribute('data-post-id'));
        
        // 确保用户有bookmarks数组
        if (!this.currentUser.bookmarks) {
            this.currentUser.bookmarks = [];
        }
        
        const isBookmarked = this.currentUser.bookmarks.includes(postId);
        
        if (isBookmarked) {
            // 取消收藏
            this.currentUser.bookmarks = this.currentUser.bookmarks.filter(id => id !== postId);
            button.classList.remove('bookmarked');
            button.querySelector('i').className = 'far fa-bookmark';
            this.showNotification('已取消收藏', 'info');
        } else {
            // 添加收藏
            this.currentUser.bookmarks.push(postId);
            button.classList.add('bookmarked');
            button.querySelector('i').className = 'fas fa-bookmark';
            button.classList.add('animate-bounce');
            setTimeout(() => button.classList.remove('animate-bounce'), 600);
            this.showNotification('已添加到收藏', 'success');
        }
        
        // 更新本地存储
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // 更新users数组中的用户信息
        if (this.authManager) {
            const userIndex = this.authManager.users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                this.authManager.users[userIndex].bookmarks = this.currentUser.bookmarks;
                this.authManager.saveUsers();
            }
        }
        
        // 如果当前筛选是"收藏"，重新渲染动态列表
        const activeFilter = document.querySelector('.filter-btn.active');
        if (activeFilter && activeFilter.getAttribute('data-filter') === 'bookmarked') {
            this.renderPosts('bookmarked');
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
        
        // 使用社交管理器处理关注逻辑（socialManager内部已处理通知和按钮状态）
        if (window.socialManager) {
            window.socialManager.toggleFollow(userId);
            
            // 如果当前筛选是"关注"，重新渲染动态列表
            const activeFilter = document.querySelector('.filter-btn.active');
            if (activeFilter && activeFilter.getAttribute('data-filter') === 'following') {
                this.renderPosts('following');
            }
        } else {
            this.showNotification('关注功能暂时不可用', 'warning');
        }
    }

    // 更新关注数量显示
    updateFollowCounts() {
        if (!window.socialManager || !this.currentUser) return;
        
        // 直接使用socialManager的updateFollowCounts方法
        window.socialManager.updateFollowCounts();
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

    // 处理图片上传
    handleImageUpload(event) {
        const files = event.target.files;
        const previewContainer = document.getElementById('imagePreview');
        
        if (!previewContainer) return;
        
        // 清空之前的预览
        previewContainer.innerHTML = '';
        
        // 存储上传的图片
        this.uploadedImages = [];
        
        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = e.target.result;
                    this.uploadedImages.push(imageData);
                    
                    // 创建预览元素
                    const previewItem = document.createElement('div');
                    previewItem.className = 'image-preview-item';
                    previewItem.innerHTML = `
                        <img src="${imageData}" alt="预览图片" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                        <button type="button" class="remove-image" onclick="app.removeUploadedImage(${index})" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;">×</button>
                    `;
                    previewItem.style.position = 'relative';
                    previewItem.style.display = 'inline-block';
                    previewItem.style.margin = '5px';
                    
                    previewContainer.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 移除上传的图片
    removeUploadedImage(index) {
        if (this.uploadedImages) {
            this.uploadedImages.splice(index, 1);
            // 重新渲染预览
            const previewContainer = document.getElementById('imagePreview');
            if (previewContainer) {
                previewContainer.innerHTML = '';
                this.uploadedImages.forEach((imageData, i) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'image-preview-item';
                    previewItem.innerHTML = `
                        <img src="${imageData}" alt="预览图片" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                        <button type="button" class="remove-image" onclick="app.removeUploadedImage(${i})" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;">×</button>
                    `;
                    previewItem.style.position = 'relative';
                    previewItem.style.display = 'inline-block';
                    previewItem.style.margin = '5px';
                    previewContainer.appendChild(previewItem);
                });
            }
        }
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
        
        // 确保当前用户在users数组中
        if (this.authManager && !this.authManager.users.find(u => u.id === this.currentUser.id)) {
            this.authManager.users.push(this.currentUser);
            this.authManager.saveUsers();
        }
        
        // 创建新动态
        const newPost = {
            id: Date.now(),
            author: {
                name: this.currentUser.username,
                avatar: this.currentUser.avatar || 'assets/images/avatars/default.jpg',
                id: this.currentUser.id
            },
            content: content,
            images: this.uploadedImages || [], // 使用上传的图片
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
        
        // 清空表单和上传的图片
        const publishForm = document.getElementById('publishForm');
        if (publishForm) {
            publishForm.reset();
        }
        document.getElementById('postContent').value = '';
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
        this.uploadedImages = [];
        
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

    // 显示动态菜单（已移除）
    showPostMenu(postId) {
        // 功能已移除
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

        // 如果没有标签，显示提示信息
        if (sortedTags.length === 0) {
            trendingContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-hashtag"></i>
                    <p>暂无热门话题</p>
                    <small>发布带有标签的动态来创建话题吧！</small>
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

        // 只显示实际存在的话题，不补充默认话题
    }
}

// 初始化应用（已移至index.html中）

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

// 全局查看用户资料函数
function viewUserProfile(userId) {
    if (app) {
        app.goToUserProfile(userId);
    }
}