// 用户认证模块
class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.setupEventListeners();
    }

    // 加载用户数据
    loadUsers() {
        const usersData = localStorage.getItem('users');
        if (usersData) {
            return JSON.parse(usersData);
        } else {
            // 初始化为空用户列表
            const initialUsers = [];
            this.saveUsers(initialUsers);
            return initialUsers;
        }
    }

    // 保存用户数据
    saveUsers(users = this.users) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    // 设置事件监听器
    setupEventListeners() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // 密码可见性切换
        document.querySelectorAll('.password-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePasswordVisibility(btn);
            });
        });

        // 实时密码强度检测
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }

        // 确认密码验证
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', (e) => {
                this.validatePasswordConfirm(e.target.value);
            });
        }

        // 邮箱格式验证
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                this.validateEmail(e.target);
            });
        });

        // 用户名可用性检查
        const registerUsername = document.getElementById('registerNickname');
        if (registerUsername) {
            registerUsername.addEventListener('blur', (e) => {
                this.checkUsernameAvailability(e.target.value);
            });
        }
    }

    // 处理登录
    handleLogin() {
        const studentId = document.getElementById('loginStudentId').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // 清除之前的错误信息
        this.clearErrors();

        // 验证输入
        if (!studentId || !password) {
            this.showError('请填写完整的登录信息');
            return;
        }

        // 查找用户（支持学号或邮箱登录）
        const user = this.users.find(u => u.studentId === studentId || u.email === studentId);
        if (!user) {
            this.showError('用户不存在');
            return;
        }

        // 验证密码
        if (user.password !== password) {
            this.showError('密码错误');
            return;
        }

        // 检查账户是否被封禁
        if (user.isBanned) {
            this.showError('您的账户已被封禁，请联系管理员');
            return;
        }

        // 登录成功
        this.loginSuccess(user, rememberMe);
    }

    // 处理注册
    handleRegister() {
        const studentId = document.getElementById('registerStudentId').value.trim();
        const username = document.getElementById('registerNickname').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        const isAdmin = document.getElementById('isAdmin') ? document.getElementById('isAdmin').checked : false;

        // 清除之前的错误信息
        this.clearErrors();

        // 验证输入
        if (!username || !email || !password || !confirmPassword) {
            this.showError('请填写完整的注册信息');
            return;
        }

        if (!agreeTerms) {
            this.showError('请同意用户协议');
            return;
        }

        // 验证用户名
        if (username.length < 2 || username.length > 20) {
            this.showError('用户名长度应在2-20个字符之间');
            return;
        }

        // 验证邮箱格式
        if (!this.isValidEmail(email)) {
            this.showError('请输入有效的邮箱地址');
            return;
        }

        // 验证密码强度
        if (!this.isStrongPassword(password)) {
            this.showError('密码强度不够，请包含字母、数字，长度至少6位');
            return;
        }

        // 验证密码确认
        if (password !== confirmPassword) {
            this.showError('两次输入的密码不一致');
            return;
        }

        // 检查学号、用户名和邮箱是否已存在
        if (this.users.some(u => u.studentId === studentId)) {
            this.showError('学号已被注册');
            return;
        }

        if (this.users.some(u => u.username === username)) {
            this.showError('用户名已存在');
            return;
        }

        if (this.users.some(u => u.email === email)) {
            this.showError('邮箱已被注册');
            return;
        }

        // 创建新用户
        const newUser = {
            id: Date.now(),
            studentId: studentId,
            username: username,
            email: email,
            password: password,
            avatar: 'assets/images/avatars/default.jpg',
            bio: isAdmin ? '系统管理员' : '这个人很懒，什么都没有留下...',
            joinDate: Date.now(),
            followers: [],
            following: [],
            posts: [],
            bookmarks: [],
            isAdmin: isAdmin
        };

        this.users.push(newUser);
        this.saveUsers();

        // 注册成功，自动登录
        this.registerSuccess(newUser);
    }

    // 登录成功
    loginSuccess(user, rememberMe) {
        // 确保用户在users数组中（更新最新信息）
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            this.users[userIndex] = user;
        } else {
            this.users.push(user);
        }
        this.saveUsers();
        
        // 保存当前用户信息
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if (rememberMe) {
            localStorage.setItem('rememberUser', JSON.stringify({
                email: user.email,
                timestamp: Date.now()
            }));
        }

        // 更新应用状态
        if (window.app) {
            window.app.currentUser = user;
            window.app.updateUI();
            window.app.hideModal('loginModal');
            window.app.showNotification(`欢迎回来，${user.username}！`, 'success');
        }

        // 清空表单
        document.getElementById('loginForm').reset();
    }

    // 注册成功
    registerSuccess(user) {
        // 确保用户在users数组中
        if (!this.users.find(u => u.id === user.id)) {
            this.users.push(user);
            this.saveUsers();
        }
        
        // 保存当前用户信息
        localStorage.setItem('currentUser', JSON.stringify(user));

        // 更新应用状态
        if (window.app) {
            window.app.currentUser = user;
            window.app.updateUI();
            window.app.hideModal('registerModal');
            window.app.showNotification(`注册成功，欢迎加入校园生活平台，${user.username}！`, 'success');
        }

        // 清空表单
        document.getElementById('registerForm').reset();
    }

    // 切换密码可见性
    togglePasswordVisibility(button) {
        const passwordInput = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    // 检查密码强度
    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        if (!strengthIndicator) return;

        let strength = 0;
        let strengthText = '';
        let strengthClass = '';

        if (password.length >= 6) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^\w\s]/.test(password)) strength++;

        switch (strength) {
            case 0:
            case 1:
                strengthText = '密码强度：弱';
                strengthClass = 'weak';
                break;
            case 2:
            case 3:
                strengthText = '密码强度：中等';
                strengthClass = 'medium';
                break;
            case 4:
            case 5:
                strengthText = '密码强度：强';
                strengthClass = 'strong';
                break;
        }

        strengthIndicator.textContent = strengthText;
        strengthIndicator.className = `password-strength ${strengthClass}`;
    }

    // 验证密码确认
    validatePasswordConfirm(confirmPassword) {
        const password = document.getElementById('registerPassword').value;
        const confirmHint = document.getElementById('confirmPasswordHint');
        
        if (!confirmHint) return;

        if (confirmPassword && password !== confirmPassword) {
            confirmHint.textContent = '密码不一致';
            confirmHint.style.color = 'var(--error-color)';
        } else if (confirmPassword && password === confirmPassword) {
            confirmHint.textContent = '密码一致';
            confirmHint.style.color = 'var(--success-color)';
        } else {
            confirmHint.textContent = '';
        }
    }

    // 验证邮箱
    validateEmail(emailInput) {
        const email = emailInput.value.trim();
        const isValid = this.isValidEmail(email);
        
        if (email && !isValid) {
            this.showFieldError(emailInput, '请输入有效的邮箱地址');
        } else {
            this.clearFieldError(emailInput);
        }
    }

    // 检查用户名可用性
    checkUsernameAvailability(username) {
        const usernameInput = document.getElementById('registerNickname');
        if (!username || username.length < 2) return;

        const isAvailable = !this.users.some(u => u.username === username);
        
        if (!isAvailable) {
            this.showFieldError(usernameInput, '用户名已存在');
        } else {
            this.clearFieldError(usernameInput);
        }
    }

    // 验证邮箱格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 检查密码强度
    isStrongPassword(password) {
        return password.length >= 6 && 
               /[a-zA-Z]/.test(password) && 
               /[0-9]/.test(password);
    }

    // 显示错误信息
    showError(message) {
        const errorDiv = document.querySelector('.auth-error') || this.createErrorDiv();
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.classList.add('animate-shake');
        
        setTimeout(() => {
            errorDiv.classList.remove('animate-shake');
        }, 500);
    }

    // 创建错误信息容器
    createErrorDiv() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.style.cssText = `
            color: var(--error-color);
            background: rgba(255, 71, 87, 0.1);
            border: 1px solid var(--error-color);
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 14px;
            display: none;
        `;
        
        // 插入到表单顶部
        const activeModal = document.querySelector('.modal[style*="flex"]');
        if (activeModal) {
            const modalBody = activeModal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.insertBefore(errorDiv, modalBody.firstChild);
            }
        }
        
        return errorDiv;
    }

    // 显示字段错误
    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.textContent = message;
        errorSpan.style.cssText = `
            color: var(--error-color);
            font-size: 12px;
            margin-top: 5px;
            display: block;
        `;
        
        input.parentElement.appendChild(errorSpan);
        input.style.borderColor = 'var(--error-color)';
    }

    // 清除字段错误
    clearFieldError(input) {
        const existingError = input.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        input.style.borderColor = '';
    }

    // 清除所有错误信息
    clearErrors() {
        const errorDiv = document.querySelector('.auth-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        document.querySelectorAll('.field-error').forEach(error => {
            error.remove();
        });
        
        document.querySelectorAll('input').forEach(input => {
            input.style.borderColor = '';
        });
    }

    // 忘记密码
    forgotPassword() {
        const email = prompt('请输入您的邮箱地址：');
        if (email && this.isValidEmail(email)) {
            const user = this.users.find(u => u.email === email);
            if (user) {
                // 模拟发送重置邮件
                alert(`密码重置邮件已发送到 ${email}\n临时密码：123456\n请登录后及时修改密码。`);
                user.password = '123456';
                this.saveUsers();
            } else {
                alert('该邮箱未注册');
            }
        } else {
            alert('请输入有效的邮箱地址');
        }
    }

    // 获取用户信息
    getUserById(userId) {
        return this.users.find(u => u.id === userId);
    }

    // 更新用户信息
    updateUser(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveUsers();
            
            // 如果更新的是当前用户，同时更新localStorage
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser.id === userId) {
                localStorage.setItem('currentUser', JSON.stringify(this.users[userIndex]));
            }
            
            return this.users[userIndex];
        }
        return null;
    }

    // 管理员功能：封禁用户
    banUser(userId, reason = '') {
        const user = this.getUserById(userId);
        if (user) {
            user.banned = true;
            user.banReason = reason;
            user.banDate = Date.now();
            this.saveUsers();
            return true;
        }
        return false;
    }

    // 管理员功能：解封用户
    unbanUser(userId) {
        const user = this.getUserById(userId);
        if (user) {
            delete user.banned;
            delete user.banReason;
            delete user.banDate;
            this.saveUsers();
            return true;
        }
        return false;
    }

    // 管理员功能：重置用户资料
    resetUserProfile(userId) {
        const user = this.getUserById(userId);
        if (user) {
            user.bio = '这个人很懒，什么都没有留下...';
            user.avatar = `https://via.placeholder.com/50x50/667eea/ffffff?text=${user.username.charAt(0)}`;
            this.saveUsers();
            return true;
        }
        return false;
    }

    // 管理员功能：删除用户动态
    deleteUserPosts(userId) {
        const user = this.getUserById(userId);
        if (user) {
            user.posts = [];
            this.saveUsers();
            
            // 同时从全局动态列表中删除
            if (window.app) {
                window.app.posts = window.app.posts.filter(post => post.author.id !== userId);
                window.app.savePosts();
            }
            
            return true;
        }
        return false;
    }

    // 获取用户统计信息
    getUserStats(userId) {
        const user = this.getUserById(userId);
        if (!user) return null;
        
        const userPosts = window.app ? window.app.posts.filter(post => post.author.id === userId) : [];
        const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
        const totalComments = userPosts.reduce((sum, post) => sum + post.comments, 0);
        
        return {
            postsCount: userPosts.length,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            totalLikes: totalLikes,
            totalComments: totalComments,
            joinDate: user.joinDate
        };
    }
}

// 初始化认证管理器
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    
    // 检查记住登录
    const rememberUser = localStorage.getItem('rememberUser');
    if (rememberUser) {
        const { email, timestamp } = JSON.parse(rememberUser);
        // 记住登录有效期30天
        if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
            const loginEmail = document.getElementById('loginEmail');
            if (loginEmail) {
                loginEmail.value = email;
                document.getElementById('rememberMe').checked = true;
            }
        } else {
            localStorage.removeItem('rememberUser');
        }
    }
});

// 全局函数
function forgotPassword() {
    if (authManager) {
        authManager.forgotPassword();
    }
}

// switchToRegister 和 switchToLogin 函数已移除
// 现在使用独立的登录注册页面