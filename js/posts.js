// 动态发布管理模块
class PostManager {
    constructor() {
        this.selectedImages = [];
        this.maxImages = 9;
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.setupEventListeners();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 图片上传 - 确保只绑定一次
        const imageInput = document.getElementById('imageInput');
        if (imageInput && !imageInput.hasAttribute('data-listener-bound')) {
            imageInput.addEventListener('change', (e) => {
                this.handleImageSelection(e.target.files);
                // 重置input值，允许重新选择同一文件
                e.target.value = '';
            });
            imageInput.setAttribute('data-listener-bound', 'true');
        }

        // 拖拽上传 - 确保只绑定一次
        const uploadArea = document.querySelector('.image-upload');
        if (uploadArea && !uploadArea.hasAttribute('data-listener-bound')) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleImageSelection(e.dataTransfer.files);
            });

            uploadArea.addEventListener('click', () => {
                if (imageInput) imageInput.click();
            });
            
            uploadArea.setAttribute('data-listener-bound', 'true');
        }

        // 内容输入
        const contentTextarea = document.getElementById('postContent');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', (e) => {
                this.handleContentInput(e.target);
            });

            contentTextarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.publishPost();
                }
            });
        }

        // 标签建议点击
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tag-suggestion')) {
                this.addTagToContent(e.target.textContent);
            }
        });

        // 隐私设置
        document.querySelectorAll('input[name="privacy"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updatePrivacyDescription(e.target.value);
            });
        });

        // 发布按钮 - 确保只绑定一次
        const publishBtn = document.getElementById('publishBtn');
        if (publishBtn && !publishBtn.hasAttribute('data-listener-bound')) {
            publishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.publishPost();
            });
            publishBtn.setAttribute('data-listener-bound', 'true');
        }

        // 清空按钮
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearForm();
            });
        }
    }

    // 处理图片选择
    handleImageSelection(files) {
        const fileArray = Array.from(files);
        
        for (const file of fileArray) {
            // 检查文件类型
            if (!this.allowedTypes.includes(file.type)) {
                this.showNotification(`文件 ${file.name} 格式不支持，请选择图片文件`, 'warning');
                continue;
            }

            // 检查文件大小
            if (file.size > this.maxImageSize) {
                this.showNotification(`文件 ${file.name} 过大，请选择小于5MB的图片`, 'warning');
                continue;
            }

            // 检查数量限制
            if (this.selectedImages.length >= this.maxImages) {
                this.showNotification(`最多只能上传${this.maxImages}张图片`, 'warning');
                break;
            }

            // 添加图片
            this.addImage(file);
        }
    }

    // 添加图片
    addImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                file: file,
                url: e.target.result,
                name: file.name
            };
            
            this.selectedImages.push(imageData);
            this.renderImagePreview();
        };
        reader.readAsDataURL(file);
    }

    // 渲染图片预览
    renderImagePreview() {
        const previewContainer = document.getElementById('imagePreview');
        if (!previewContainer) return;

        if (this.selectedImages.length === 0) {
            previewContainer.innerHTML = '';
            previewContainer.style.display = 'none';
            return;
        }

        previewContainer.style.display = 'grid';
        previewContainer.innerHTML = this.selectedImages.map(image => `
            <div class="preview-item">
                <img src="${image.url}" alt="${image.name}" class="preview-image">
                <button type="button" class="remove-image" onclick="postManager.removeImage('${image.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    // 移除图片
    removeImage(imageId) {
        this.selectedImages = this.selectedImages.filter(img => img.id !== imageId);
        this.renderImagePreview();
    }

    // 处理内容输入
    handleContentInput(textarea) {
        const content = textarea.value;
        const maxLength = 500;
        
        // 更新字符计数
        this.updateCharCount(content.length, maxLength);
        
        // 自动调整高度
        this.autoResizeTextarea(textarea);
        
        // 提取和显示标签建议
        this.updateTagSuggestions(content);
    }

    // 更新字符计数
    updateCharCount(current, max) {
        const charCount = document.querySelector('.char-count');
        if (charCount) {
            charCount.textContent = `${current}/${max}`;
            charCount.style.color = current > max ? 'var(--error-color)' : 'var(--text-muted)';
        }
    }

    // 自动调整文本域高度
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    }

    // 更新标签建议
    updateTagSuggestions(content) {
        const suggestionsContainer = document.querySelector('.tag-suggestions');
        if (!suggestionsContainer) return;

        // 提取已有标签
        const existingTags = this.extractTags(content);
        
        // 推荐标签
        const recommendedTags = [
            '校园生活', '学习', '美食', '运动', '社团活动',
            '图书馆', '宿舍', '课程', '考试', '实习',
            '毕业', '求职', '旅行', '摄影', '音乐',
            '电影', '读书', '游戏', '科技', '创业'
        ];

        // 过滤已使用的标签
        const availableTags = recommendedTags.filter(tag => !existingTags.includes(tag));
        
        // 显示建议标签（最多显示8个）
        suggestionsContainer.innerHTML = availableTags.slice(0, 8).map(tag => 
            `<span class="tag-suggestion">#${tag}</span>`
        ).join('');
    }

    // 提取标签
    extractTags(content) {
        const tagRegex = /#([\u4e00-\u9fa5\w]+)/g;
        const tags = [];
        let match;
        
        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
        }
        
        return [...new Set(tags)];
    }

    // 添加标签到内容
    addTagToContent(tag) {
        const textarea = document.getElementById('postContent');
        if (!textarea) return;

        const currentContent = textarea.value;
        const cursorPosition = textarea.selectionStart;
        
        // 在光标位置插入标签
        const beforeCursor = currentContent.substring(0, cursorPosition);
        const afterCursor = currentContent.substring(cursorPosition);
        
        // 确保标签前后有空格
        const needSpaceBefore = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
        const needSpaceAfter = afterCursor.length > 0 && !afterCursor.startsWith(' ');
        
        const tagText = (needSpaceBefore ? ' ' : '') + tag + (needSpaceAfter ? ' ' : '');
        
        textarea.value = beforeCursor + tagText + afterCursor;
        textarea.focus();
        
        // 设置光标位置
        const newPosition = cursorPosition + tagText.length;
        textarea.setSelectionRange(newPosition, newPosition);
        
        // 触发输入事件
        textarea.dispatchEvent(new Event('input'));
    }

    // 更新隐私设置描述
    updatePrivacyDescription(privacy) {
        const descriptions = {
            'public': '所有人都可以看到这条动态',
            'friends': '只有关注的人可以看到',
            'private': '只有自己可以看到'
        };
        
        const descElement = document.getElementById('privacyDescription');
        if (descElement) {
            descElement.textContent = descriptions[privacy] || '';
        }
    }

    // 发布动态
    async publishPost() {
        if (!window.app || !window.app.currentUser) {
            this.showNotification('请先登录', 'warning');
            return;
        }

        const content = document.getElementById('postContent').value.trim();
        const privacy = document.querySelector('input[name="privacy"]:checked')?.value || 'public';
        
        if (!content && this.selectedImages.length === 0) {
            this.showNotification('请输入内容或选择图片', 'warning');
            return;
        }

        if (content.length > 500) {
            this.showNotification('内容长度不能超过500字符', 'warning');
            return;
        }

        // 显示发布中状态
        this.setPublishingState(true);

        try {
            // 模拟图片上传
            const imageUrls = await this.uploadImages();
            
            // 提取标签
            const tags = this.extractTags(content);
            
            // 创建新动态
            const newPost = {
                id: Date.now(),
                author: {
                    name: window.app.currentUser.username,
                    avatar: window.app.currentUser.avatar || 'assets/images/avatars/default.jpg',
                    id: window.app.currentUser.id
                },
                content: content,
                images: imageUrls,
                tags: tags,
                timestamp: Date.now(),
                likes: 0,
                comments: 0,
                shares: 0,
                privacy: privacy,
                likedBy: [],
                sharedBy: [],
                commentList: []
            };

            // 添加到动态列表
            window.app.posts.unshift(newPost);
            window.app.savePosts();
            
            // 触发发布成功事件
            this.onPostPublished(newPost);
            
            // 清空表单
            this.clearForm();
            
            // 显示成功消息
            this.showNotification('动态发布成功！', 'success');
            
            // 跳转到首页
            window.app.showPage('home');
            
        } catch (error) {
            console.error('发布失败:', error);
            this.showNotification('发布失败，请重试', 'error');
        } finally {
            this.setPublishingState(false);
        }
    }

    // 模拟图片上传
    async uploadImages() {
        if (this.selectedImages.length === 0) return [];
        
        // 模拟上传延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 返回真实的本地图片URL
        return this.selectedImages.map(img => img.url);
    }

    // 设置发布状态
    setPublishingState(isPublishing) {
        const publishBtn = document.getElementById('publishBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        if (publishBtn) {
            publishBtn.disabled = isPublishing;
            publishBtn.innerHTML = isPublishing ? 
                '<i class="fas fa-spinner fa-spin"></i> 发布中...' : 
                '<i class="fas fa-paper-plane"></i> 发布动态';
        }
        
        if (clearBtn) {
            clearBtn.disabled = isPublishing;
        }
    }

    // 清空表单
    clearForm() {
        // 清空内容
        const contentTextarea = document.getElementById('postContent');
        if (contentTextarea) {
            contentTextarea.value = '';
            this.autoResizeTextarea(contentTextarea);
        }
        
        // 清空图片
        this.selectedImages = [];
        this.renderImagePreview();
        
        // 重置隐私设置
        const publicRadio = document.querySelector('input[name="privacy"][value="public"]');
        if (publicRadio) {
            publicRadio.checked = true;
            this.updatePrivacyDescription('public');
        }
        
        // 重置字符计数
        this.updateCharCount(0, 500);
        
        // 清空标签建议
        const suggestionsContainer = document.querySelector('.tag-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = '';
        }
        
        // 重置文件输入
        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.value = '';
        }
    }

    // 发布成功回调
    onPostPublished(post) {
        // 可以在这里添加发布成功后的逻辑
        console.log('动态发布成功:', post);
        
        // 触发自定义事件
        const event = new CustomEvent('postPublished', {
            detail: { post }
        });
        document.dispatchEvent(event);
    }

    // 编辑动态
    editPost(postId) {
        if (!window.app) return;
        
        const post = window.app.posts.find(p => p.id === postId);
        if (!post) {
            this.showNotification('动态不存在', 'error');
            return;
        }
        
        // 检查权限
        if (!window.app.currentUser || post.author.id !== window.app.currentUser.id) {
            this.showNotification('没有编辑权限', 'warning');
            return;
        }
        
        // 填充表单
        const contentTextarea = document.getElementById('postContent');
        if (contentTextarea) {
            contentTextarea.value = post.content;
            this.handleContentInput(contentTextarea);
        }
        
        // 设置隐私
        const privacyRadio = document.querySelector(`input[name="privacy"][value="${post.privacy}"]`);
        if (privacyRadio) {
            privacyRadio.checked = true;
            this.updatePrivacyDescription(post.privacy);
        }
        
        // 跳转到发布页面
        window.app.showPage('publish');
        
        this.showNotification('已加载动态内容，修改后重新发布即可', 'info');
    }

    // 删除动态
    deletePost(postId) {
        if (!window.app) return;
        
        const post = window.app.posts.find(p => p.id === postId);
        if (!post) {
            this.showNotification('动态不存在', 'error');
            return;
        }
        
        // 检查权限
        if (!window.app.currentUser || post.author.id !== window.app.currentUser.id) {
            this.showNotification('没有删除权限', 'warning');
            return;
        }
        
        if (confirm('确定要删除这条动态吗？删除后无法恢复。')) {
            window.app.posts = window.app.posts.filter(p => p.id !== postId);
            window.app.savePosts();
            window.app.renderPosts();
            this.showNotification('动态已删除', 'success');
        }
    }

    // 设置隐私
    setPrivacy(postId, privacy) {
        if (!window.app) return;
        
        const post = window.app.posts.find(p => p.id === postId);
        if (!post) return;
        
        // 检查权限
        if (!window.app.currentUser || post.author.id !== window.app.currentUser.id) {
            this.showNotification('没有修改权限', 'warning');
            return;
        }
        
        post.privacy = privacy;
        window.app.savePosts();
        window.app.renderPosts();
        
        const privacyNames = {
            'public': '公开',
            'friends': '仅关注',
            'private': '私密'
        };
        
        this.showNotification(`隐私设置已更改为：${privacyNames[privacy]}`, 'success');
    }

    // 显示隐私设置模态框
    showPrivacyModal(postId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>隐私设置</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="privacy-options">
                        <label class="radio-option">
                            <input type="radio" name="modalPrivacy" value="public">
                            <span class="radio-custom"></span>
                            <div>
                                <strong>公开</strong>
                                <p>所有人都可以看到这条动态</p>
                            </div>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="modalPrivacy" value="friends">
                            <span class="radio-custom"></span>
                            <div>
                                <strong>仅关注</strong>
                                <p>只有关注的人可以看到</p>
                            </div>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="modalPrivacy" value="private">
                            <span class="radio-custom"></span>
                            <div>
                                <strong>私密</strong>
                                <p>只有自己可以看到</p>
                            </div>
                        </label>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">取消</button>
                        <button class="btn btn-primary" onclick="postManager.confirmPrivacyChange(${postId}, this.closest('.modal'))">确认</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // 设置当前隐私选项
        const post = window.app.posts.find(p => p.id === postId);
        if (post) {
            const currentRadio = modal.querySelector(`input[value="${post.privacy}"]`);
            if (currentRadio) {
                currentRadio.checked = true;
            }
        }
        
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

    // 确认隐私更改
    confirmPrivacyChange(postId, modal) {
        const selectedPrivacy = modal.querySelector('input[name="modalPrivacy"]:checked')?.value;
        if (selectedPrivacy) {
            this.setPrivacy(postId, selectedPrivacy);
        }
        document.body.removeChild(modal);
    }

    // 获取动态统计
    getPostStats(postId) {
        if (!window.app) return null;
        
        const post = window.app.posts.find(p => p.id === postId);
        if (!post) return null;
        
        return {
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            views: post.views || 0,
            engagement: post.likes + post.comments + post.shares
        };
    }

    // 搜索动态
    searchPosts(query) {
        if (!window.app) return [];
        
        const lowercaseQuery = query.toLowerCase();
        return window.app.posts.filter(post => {
            return post.content.toLowerCase().includes(lowercaseQuery) ||
                   post.author.name.toLowerCase().includes(lowercaseQuery) ||
                   (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)));
        });
    }

    // 按标签筛选
    filterByTag(tag) {
        if (!window.app) return [];
        
        return window.app.posts.filter(post => 
            post.tags && post.tags.includes(tag)
        );
    }

    // 获取热门动态
    getHotPosts(limit = 10) {
        if (!window.app) return [];
        
        return window.app.posts
            .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
            .slice(0, limit);
    }

    // 获取最新动态
    getLatestPosts(limit = 10) {
        if (!window.app) return [];
        
        return window.app.posts
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        if (window.app) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// 初始化动态管理器
let postManager;
document.addEventListener('DOMContentLoaded', () => {
    postManager = new PostManager();
});

// 全局函数
function editPost(postId) {
    if (postManager) {
        postManager.editPost(postId);
    }
}

function deletePost(postId) {
    if (postManager) {
        postManager.deletePost(postId);
    }
}

function showPrivacyModal(postId) {
    if (postManager) {
        postManager.showPrivacyModal(postId);
    }
}