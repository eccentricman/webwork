// 工具函数模块
class Utils {
    constructor() {
        this.init();
    }

    // 初始化
    init() {
        this.setupScrollReveal();
        this.setupLazyLoading();
        this.setupThemeToggle();
        this.setupKeyboardShortcuts();
    }

    // 滚动显示动画
    setupScrollReveal() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal');
                }
            });
        }, observerOptions);

        // 观察所有需要动画的元素
        document.querySelectorAll('.post-item, .category-card, .sidebar-section').forEach(el => {
            observer.observe(el);
        });
    }

    // 图片懒加载
    setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        // 观察所有懒加载图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // 主题切换
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        // 从本地存储加载主题
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    }

    // 设置主题
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    // 键盘快捷键
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: 打开搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // Esc: 关闭模态框
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
            
            // Ctrl/Cmd + Enter: 发布动态（在发布页面）
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const publishBtn = document.getElementById('publishBtn');
                if (publishBtn && !publishBtn.disabled) {
                    publishBtn.click();
                }
            }
        });
    }

    // 聚焦搜索框
    focusSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    // 关闭顶层模态框
    closeTopModal() {
        const modals = document.querySelectorAll('.modal');
        const topModal = Array.from(modals).pop();
        if (topModal) {
            topModal.style.display = 'none';
            document.body.removeChild(topModal);
        }
    }

    // 搜索功能
    search(query, type = 'all') {
        if (!window.app) return { posts: [], users: [] };
        
        const lowercaseQuery = query.toLowerCase();
        const results = { posts: [], users: [] };
        
        if (type === 'all' || type === 'posts') {
            results.posts = window.app.posts.filter(post => {
                return post.content.toLowerCase().includes(lowercaseQuery) ||
                       post.author.name.toLowerCase().includes(lowercaseQuery) ||
                       (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)));
            });
        }
        
        if (type === 'all' || type === 'users') {
            results.users = window.authManager ? 
                window.authManager.users.filter(user => 
                    user.username.toLowerCase().includes(lowercaseQuery) ||
                    user.email.toLowerCase().includes(lowercaseQuery)
                ) : [];
        }
        
        return results;
    }

    // 文本截断
    truncateText(text, maxLength = 100, suffix = '...') {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    // 格式化日期
    formatDate(timestamp, format = 'relative') {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (format === 'relative') {
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (seconds < 60) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 7) return `${days}天前`;
            
            return this.formatDate(timestamp, 'short');
        }
        
        if (format === 'short') {
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        }
        
        if (format === 'full') {
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        return date.toLocaleString();
    }

    // 防抖函数
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 生成唯一ID
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 深拷贝
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // 验证邮箱
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 验证手机号
    validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 生成随机颜色
    randomColor() {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
            '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea',
            '#fed6e3', '#d299c2', '#fef9d7', '#d69e2e', '#9f7aea'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }

    // 下载文件
    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 压缩图片
    compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // 计算新尺寸
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制并压缩
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, file.type, quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 获取设备信息
    getDeviceInfo() {
        const ua = navigator.userAgent;
        return {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            isTablet: /iPad|Android(?!.*Mobile)/i.test(ua),
            isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            browser: this.getBrowserName(),
            os: this.getOSName(),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };
    }

    // 获取浏览器名称
    getBrowserName() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('Opera')) return 'Opera';
        return 'Unknown';
    }

    // 获取操作系统名称
    getOSName() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Unknown';
    }

    // 本地存储管理
    storage = {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('存储失败:', e);
                return false;
            }
        },
        
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('读取失败:', e);
                return defaultValue;
            }
        },
        
        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('删除失败:', e);
                return false;
            }
        },
        
        clear: () => {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('清空失败:', e);
                return false;
            }
        }
    };

    // 网络状态检测
    networkStatus = {
        isOnline: () => navigator.onLine,
        
        onStatusChange: (callback) => {
            window.addEventListener('online', () => callback(true));
            window.addEventListener('offline', () => callback(false));
        },
        
        checkConnection: async () => {
            try {
                const response = await fetch('/favicon.ico', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                return response.ok;
            } catch {
                return false;
            }
        }
    };

    // 性能监控
    performance = {
        mark: (name) => {
            if (window.performance && window.performance.mark) {
                window.performance.mark(name);
            }
        },
        
        measure: (name, startMark, endMark) => {
            if (window.performance && window.performance.measure) {
                window.performance.measure(name, startMark, endMark);
                const measure = window.performance.getEntriesByName(name)[0];
                return measure ? measure.duration : 0;
            }
            return 0;
        },
        
        getPageLoadTime: () => {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                return timing.loadEventEnd - timing.navigationStart;
            }
            return 0;
        }
    };

    // 错误处理
    errorHandler = {
        setup: () => {
            window.addEventListener('error', (e) => {
                console.error('JavaScript错误:', e.error);
                this.logError('JavaScript Error', e.error);
            });
            
            window.addEventListener('unhandledrejection', (e) => {
                console.error('未处理的Promise拒绝:', e.reason);
                this.logError('Unhandled Promise Rejection', e.reason);
            });
        },
        
        logError: (type, error) => {
            const errorLog = {
                type,
                message: error.message || error,
                stack: error.stack,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            // 存储错误日志
            const errors = this.storage.get('errorLogs', []);
            errors.push(errorLog);
            
            // 只保留最近100条错误
            if (errors.length > 100) {
                errors.splice(0, errors.length - 100);
            }
            
            this.storage.set('errorLogs', errors);
        },
        
        getErrorLogs: () => {
            return this.storage.get('errorLogs', []);
        },
        
        clearErrorLogs: () => {
            this.storage.remove('errorLogs');
        }
    };

    // 动画工具
    animation = {
        fadeIn: (element, duration = 300) => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            const start = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        },
        
        fadeOut: (element, duration = 300) => {
            const start = performance.now();
            const initialOpacity = parseFloat(getComputedStyle(element).opacity);
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = initialOpacity * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                }
            };
            
            requestAnimationFrame(animate);
        },
        
        slideDown: (element, duration = 300) => {
            element.style.height = '0';
            element.style.overflow = 'hidden';
            element.style.display = 'block';
            
            const targetHeight = element.scrollHeight;
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (targetHeight * progress) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.height = 'auto';
                    element.style.overflow = 'visible';
                }
            };
            
            requestAnimationFrame(animate);
        }
    };
}

// 初始化工具类
const utils = new Utils();

// 导出到全局
window.utils = utils;

// 数据清理工具
function clearAllData() {
    if (confirm('确定要清空所有数据吗？这将删除所有用户、动态和关注关系数据。')) {
        // 清空所有localStorage数据
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('users') || 
                key.startsWith('posts') || 
                key.startsWith('currentUser') || 
                key.startsWith('followData') ||
                key.startsWith('rememberUser')
            )) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // 清空sessionStorage
        sessionStorage.clear();
        
        alert('数据已清空！页面将刷新。');
        window.location.reload();
    }
}

// 在控制台中暴露清理函数
window.clearAllData = clearAllData;