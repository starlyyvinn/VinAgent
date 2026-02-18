// app.js - VinAgents dengan Chat History, Auto Title, Codeblocks, Copy Button, dan Responsive Sidebar

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 VinAgents starting...');
    
    // ============= DOM ELEMENTS =============
    const loginContainer = document.getElementById('loginContainer');
    const chatContainer = document.getElementById('chatContainer');
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMe = document.getElementById('rememberMe');
    const loginBtn = document.getElementById('loginBtn');
    const googleBtn = document.getElementById('googleBtn');
    const githubBtn = document.getElementById('githubBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    const chatUserEmail = document.getElementById('chatUserEmail');
    const themeToggle = document.getElementById('themeToggle');
    const modelSelector = document.getElementById('modelSelector');
    const modelIcon = document.getElementById('modelIcon');
    const modelName = document.getElementById('modelName');
    const modelContext = document.getElementById('modelContext');
    const modelProvider = document.getElementById('modelProvider');
    const currentModelBadge = document.getElementById('currentModelBadge');
    const messageDiv = document.getElementById('message');
    
    // Sidebar elements
    const sidebarToggle = document.getElementById('sidebarToggle');
    const chatSidebar = document.getElementById('chatSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const newChatBtn = document.getElementById('newChatBtn');
    const historyList = document.getElementById('historyList');
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    const logoutSidebarBtn = document.getElementById('logoutSidebarBtn');

    // ============= STATE =============
    let currentModel = 'llama-70b';
    let chatHistory = []; // For API context
    let isLoading = false;
    let isDarkMode = false;
    
    // Chat sessions
    let chatSessions = [];
    let currentSessionId = null;
    let currentUserId = null;

    // Model details
    const modelDetails = {
        'llama-70b': { 
            icon: '🦙', 
            name: 'Llama 3.3 70B', 
            context: '128K ctx',
            provider: 'Groq'
        },
        'llama-8b': { 
            icon: '⚡', 
            name: 'Llama 3.1 8B', 
            context: '128K ctx',
            provider: 'Groq'
        }
    };

    const API_URL = "192.168.56.1:3000"

    // ============= SIDEBAR FUNCTIONS =============
    
    // Toggle sidebar function
    function toggleSidebar() {
        if (!chatSidebar || !sidebarOverlay) return;
        
        chatSidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
        
        // Prevent body scroll when sidebar open on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = chatSidebar.classList.contains('open') ? 'hidden' : '';
        }
    }

    // Close sidebar function
    function closeSidebar() {
        if (!chatSidebar || !sidebarOverlay) return;
        
        chatSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Toggle sidebar di mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Close sidebar saat klik overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            closeSidebar();
        });
    }

    // Close sidebar saat pilih chat di mobile
    document.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.history-item');
        if (historyItem && window.innerWidth <= 768) {
            setTimeout(closeSidebar, 100); // Delay biar load session dulu
        }
    });

    // Handle resize window
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            // Desktop: pastikan sidebar visible dan overlay hidden
            if (chatSidebar) chatSidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close sidebar with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.innerWidth <= 768) {
            closeSidebar();
        }
    });

    // ============= AUTH STATE =============
    auth.onAuthStateChange((user) => {
        console.log('🔥 Auth state:', user ? 'Logged in' : 'Logged out');
        
        if (user) {
            currentUserId = user.uid;
            
            // Hide login, show chat
            if (loginContainer) loginContainer.style.display = 'none';
            if (chatContainer) chatContainer.style.display = 'flex';
            
            // Update user info
            if (chatUserEmail) chatUserEmail.textContent = user.email;
            if (sidebarUserEmail) sidebarUserEmail.textContent = user.email;
            
            // Update model info
            updateModelInfo(currentModel);
            
            // Load saved sessions from localStorage
            loadSessionsFromStorage();
            
            // Create first session if none
            if (chatSessions.length === 0) {
                createNewChat();
            } else {
                // Load most recent session
                loadSession(chatSessions[0].id);
            }
        } else {
            currentUserId = null;
            // Show login, hide chat
            if (loginContainer) loginContainer.style.display = 'flex';
            if (chatContainer) chatContainer.style.display = 'none';
        }
    });

    // ============= SESSION STORAGE =============
    function saveSessionsToStorage() {
        if (!currentUserId) return;
        try {
            localStorage.setItem(`vinagents_sessions_${currentUserId}`, JSON.stringify(chatSessions));
            console.log('💾 Sessions saved:', chatSessions.length);
        } catch (e) {
            console.error('Failed to save sessions:', e);
        }
    }

    function loadSessionsFromStorage() {
        if (!currentUserId) return;
        try {
            const saved = localStorage.getItem(`vinagents_sessions_${currentUserId}`);
            if (saved) {
                chatSessions = JSON.parse(saved);
                console.log('📂 Sessions loaded:', chatSessions.length);
            } else {
                chatSessions = [];
            }
        } catch (e) {
            console.error('Failed to load sessions:', e);
            chatSessions = [];
        }
    }

    // ============= GENERATE TITLE WITH GROQ =============
    async function generateTitleFromMessage(message) {
        try {
            console.log('🎯 Generating title for:', message.substring(0, 30));
            
            const response = await fetch('http://localhost:3000/api/generate-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            if (data.success && data.title) {
                return data.title;
            }
        } catch (error) {
            console.error('Title generation failed:', error);
        }
        
        // Fallback: generate simple title from first words
        const words = message.split(' ').slice(0, 5).join(' ');
        return words + (message.split(' ').length > 5 ? '...' : '');
    }

    // ============= SIDEBAR FUNCTIONS (LANJUTAN) =============

    // New chat button
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            createNewChat();
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    }

    // Logout dari sidebar
    if (logoutSidebarBtn) {
        logoutSidebarBtn.addEventListener('click', async () => {
            await auth.logout();
            chatSessions = [];
            chatHistory = [];
            closeSidebar();
        });
    }

    // Create new chat session
    function createNewChat() {
        if (!currentUserId) return;
        
        const newSession = {
            id: Date.now().toString(),
            title: 'Percakapan Baru',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: currentUserId
        };
        
        // Add welcome message
        const welcomeMsg = {
            role: 'assistant',
            content: '👋 Halo! Ada yang bisa dibantu?',
            timestamp: new Date().toISOString()
        };
        newSession.messages.push(welcomeMsg);
        
        chatSessions.unshift(newSession);
        currentSessionId = newSession.id;
        
        // Clear current messages and show welcome
        if (chatMessages) {
            chatMessages.innerHTML = '';
            displayMessage(welcomeMsg.content, 'ai');
        }
        
        // Update history list
        updateHistoryList();
        
        // Reset chat history for API
        chatHistory = [{ role: 'assistant', content: welcomeMsg.content }];
        
        // Save to storage
        saveSessionsToStorage();
        
        console.log('🆕 New chat created:', newSession.id);
    }

    // Update history list in sidebar
    function updateHistoryList() {
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (chatSessions.length === 0) {
            historyList.innerHTML = '<div class="empty-history">Belum ada percakapan</div>';
            return;
        }
        
        // Sort by updatedAt descending
        const sorted = [...chatSessions].sort((a, b) => 
            new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
        
        sorted.forEach(session => {
            // Get title
            const title = session.title || 'Percakapan';
            
            const date = new Date(session.updatedAt || session.createdAt).toLocaleDateString('id-ID', {
                month: 'short',
                day: 'numeric'
            });
            
            const item = document.createElement('div');
            item.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;
            item.dataset.sessionId = session.id;
            item.innerHTML = `
                <span class="history-item-icon">💬</span>
                <span class="history-item-title">${title}</span>
                <span class="history-item-date">${date}</span>
            `;
            
            item.addEventListener('click', () => {
                loadSession(session.id);
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
            
            historyList.appendChild(item);
        });
    }

    // Load a chat session
    function loadSession(sessionId) {
        const session = chatSessions.find(s => s.id === sessionId);
        if (!session) return;
        
        console.log('📖 Loading session:', sessionId, session.title);
        
        currentSessionId = sessionId;
        
        // Clear messages
        if (chatMessages) {
            chatMessages.innerHTML = '';
            
            // Display all messages
            session.messages.forEach(msg => {
                displayMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
            });
        }
        
        // Update chat history for API
        chatHistory = session.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        // Update active state in sidebar
        updateHistoryList();
    }

    // Escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ============= DISPLAY MESSAGE WITH CODEBLOCKS =============
    function displayMessage(text, sender) {
        if (!chatMessages) return;
        
        const container = document.createElement('div');
        container.className = 'message-container';
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Escape HTML dulu
        let escaped = escapeHtml(text);
        
        // Simpan codeblocks dalam array
        const codeBlocks = [];
        let codeIndex = 0;
        
        // Replace codeblocks dengan placeholder
        escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || 'text';
            const blockId = `code_${Date.now()}_${codeIndex++}`;
            
            // Simpan code
            codeBlocks.push({
                id: blockId,
                lang: lang,
                code: code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
            });
            
            return `<div class="code-placeholder" data-block-id="${blockId}"></div>`;
        });
        
        // Inline code
        escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Line breaks
        escaped = escaped.replace(/\n/g, '<br>');
        
        // Set innerHTML
        container.innerHTML = `
            <div class="message-row ${sender}">
                <div class="avatar ${sender}-avatar">${sender === 'ai' ? 'AI' : 'U'}</div>
                <div class="message-content">
                    <div class="message-bubble">${escaped}</div>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(container);
        
        // Replace placeholders dengan codeblocks yang sebenarnya
        codeBlocks.forEach(block => {
            const placeholder = container.querySelector(`[data-block-id="${block.id}"]`);
            if (placeholder) {
                const codeHTML = `
                    <div class="code-block-wrapper">
                        <div class="code-header">
                            <span class="code-language">${block.lang}</span>
                            <button class="copy-code-btn" data-code='${encodeURIComponent(block.code)}'>📋 Copy</button>
                        </div>
                        <pre><code class="language-${block.lang}">${escapeHtml(block.code)}</code></pre>
                    </div>
                `;
                placeholder.outerHTML = codeHTML;
            }
        });
        
        scrollToBottom();
    }

    // ============= ADD MESSAGE AND SAVE =============
    async function addMessage(text, sender) {
        displayMessage(text, sender);
        
        // Save to current session
        if (currentSessionId) {
            const session = chatSessions.find(s => s.id === currentSessionId);
            if (session) {
                // Add message
                session.messages.push({
                    role: sender === 'user' ? 'user' : 'assistant',
                    content: text,
                    timestamp: new Date().toISOString()
                });
                
                // Update timestamp
                session.updatedAt = new Date().toISOString();
                
                // Generate title if this is first user message and title is still default
                if (sender === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
                    console.log('🎯 First user message, generating title...');
                    
                    // Generate title from this message
                    const generatedTitle = await generateTitleFromMessage(text);
                    session.title = generatedTitle;
                    console.log('✅ Title generated:', generatedTitle);
                }
                
                // Update history list
                updateHistoryList();
                
                // Save to storage
                saveSessionsToStorage();
            }
        }
    }

    // ============= SETUP COPY BUTTONS WITH EVENT DELEGATION =============
    function setupCopyButtons() {
        // Remove old listener if exists
        if (window.copyListener) {
            document.removeEventListener('click', window.copyListener);
        }
        
        // Create new listener
        window.copyListener = function(e) {
            const copyBtn = e.target.closest('.copy-code-btn');
            if (!copyBtn) return;
            
            e.preventDefault();
            
            // Get encoded code
            const encodedCode = copyBtn.getAttribute('data-code');
            if (!encodedCode) {
                console.error('No code found');
                return;
            }
            
            // Decode code
            let code;
            try {
                code = decodeURIComponent(encodedCode);
            } catch (e) {
                code = encodedCode;
            }
            
            console.log('Copying code...');
            
            // Copy to clipboard
            navigator.clipboard.writeText(code).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ Copied!';
                copyBtn.style.background = '#34c759';
                copyBtn.style.color = 'white';
                
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copy';
                    copyBtn.style.background = '';
                    copyBtn.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
                
                // Fallback
                try {
                    const textarea = document.createElement('textarea');
                    textarea.value = code;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    
                    copyBtn.textContent = '✅ Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy';
                    }, 2000);
                } catch (fallbackErr) {
                    console.error('Fallback copy failed:', fallbackErr);
                    copyBtn.textContent = '❌ Failed';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy';
                    }, 2000);
                }
            });
        };
        
        // Attach listener to document
        document.addEventListener('click', window.copyListener);
        console.log('📋 Copy buttons setup complete');
    }

    // ============= MODEL SELECTOR =============
    if (modelSelector) {
        document.querySelectorAll('.model-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentModel = btn.dataset.model;
                updateModelInfo(currentModel);
            });
        });
    }

    function updateModelInfo(modelId) {
        const m = modelDetails[modelId];
        if (!m) return;
        if (modelIcon) modelIcon.textContent = m.icon;
        if (modelName) modelName.textContent = m.name;
        if (modelContext) modelContext.textContent = m.context;
        if (modelProvider) modelProvider.textContent = m.provider;
        if (currentModelBadge) currentModelBadge.textContent = 'Groq';
    }

    // ============= THEME TOGGLE =============
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            chatContainer.classList.toggle('dark-mode', isDarkMode);
            themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
            localStorage.setItem('darkMode', isDarkMode);
        });

        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'true') {
            isDarkMode = true;
            chatContainer.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        }
    }

    // ============= CHAT FUNCTIONS =============
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    window.quickAction = (action) => {
        const prompts = {
            'python': 'Ajarin aku Python dasar dengan contoh kode',
            'javascript': 'Jelasin JavaScript modern dengan contoh',
            'react': 'Cara bikin custom hook React dengan contoh',
            'debug': 'Bantu debug error ini: [tempel error disini]',
            'explain': 'Jelaskan kode ini: [tempel kode disini]'
        };
        
        if (chatInput) {
            chatInput.value = prompts[action] || action;
            chatInput.style.height = 'auto';
            chatInput.focus();
        }
    };

    async function sendMessage() {
        if (!chatInput) return;
        
        const message = chatInput.value.trim();
        if (!message || isLoading) return;

        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Add user message
        await addMessage(message, 'user');
        chatHistory.push({ role: 'user', content: message });

        showTypingIndicator();
        isLoading = true;

        try {
            const res = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message, 
                    model: currentModel, 
                    history: chatHistory.slice(-10)
                })
            });

            const data = await res.json();
            removeTypingIndicator();

            if (data.success) {
                await addMessage(data.message, 'ai');
                chatHistory.push({ role: 'assistant', content: data.message });
            } else {
                await addMessage(`❌ Error: ${data.error}`, 'ai');
            }

        } catch (error) {
            removeTypingIndicator();
            await addMessage('❌ Connection error. Pastikan server jalan di port 3000.', 'ai');
        } finally {
            isLoading = false;
        }
    }

    function showTypingIndicator() {
        if (!chatMessages) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'message-container';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="message-row ai">
                <div class="avatar ai-avatar">AI</div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        chatMessages.appendChild(indicator);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        if (!chatMessages) return;
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    // ============= LOGIN HANDLERS =============
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput?.value.trim();
            const password = passwordInput?.value.trim();
            
            if (!email || !password) {
                showMessage('Email dan password harus diisi', 'error');
                return;
            }

            setLoading(loginBtn, true);
            const result = await auth.loginManual(email, password, rememberMe?.checked);
            
            if (!result.success) {
                showMessage(result.error, 'error');
                setLoading(loginBtn, false);
            }
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            setLoading(googleBtn, true);
            const result = await auth.loginWithGoogle(rememberMe?.checked);
            
            if (!result.success) {
                showMessage(result.error, 'error');
                setLoading(googleBtn, false);
            }
        });
    }

    if (githubBtn) {
        githubBtn.addEventListener('click', async () => {
            setLoading(githubBtn, true);
            const result = await auth.loginWithGitHub(rememberMe?.checked);
            
            if (!result.success) {
                showMessage(result.error, 'error');
                setLoading(githubBtn, false);
            }
        });
    }

    // ============= FORGOT PASSWORD =============
    const forgotLink = document.getElementById('forgotPassword');
    const forgotForm = document.getElementById('forgotForm');
    const backToLogin = document.getElementById('backToLoginBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resetEmail = document.getElementById('resetEmail');
    const toggleLink = document.getElementById('toggleLink');
    const toggleText = document.getElementById('toggleText');
    const subtitle = document.querySelector('.subtitle');

    if (forgotLink && forgotForm && backToLogin) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.style.display = 'none';
            forgotLink.style.display = 'none';
            if (googleBtn) googleBtn.style.display = 'none';
            if (githubBtn) githubBtn.style.display = 'none';
            if (toggleText) toggleText.style.display = 'none';
            forgotForm.style.display = 'block';
            if (subtitle) subtitle.textContent = 'Reset your password';
        });

        backToLogin.addEventListener('click', () => {
            if (loginForm) loginForm.style.display = 'block';
            forgotLink.style.display = 'block';
            if (googleBtn) googleBtn.style.display = 'flex';
            if (githubBtn) githubBtn.style.display = 'flex';
            if (toggleText) toggleText.style.display = 'block';
            forgotForm.style.display = 'none';
            if (subtitle) subtitle.textContent = 'Sign in to VinAgents';
            if (resetEmail) resetEmail.value = '';
        });
    }

    if (resetBtn && resetEmail) {
        resetBtn.addEventListener('click', async () => {
            const email = resetEmail.value.trim();
            if (!email) {
                showMessage('Email harus diisi', 'error');
                return;
            }
            
            setLoading(resetBtn, true);
            const result = await auth.resetPassword(email);
            setLoading(resetBtn, false);
            
            if (result.success) {
                showMessage('✅ Email reset terkirim!', 'success');
                setTimeout(() => {
                    backToLogin?.click();
                }, 2000);
            } else {
                showMessage(result.error, 'error');
            }
        });
    }

    if (toggleLink && loginBtn && subtitle) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const isLogin = loginBtn.querySelector('span').textContent === 'Sign In';
            
            if (isLogin) {
                toggleLink.textContent = 'Sign in';
                if (toggleText) {
                    toggleText.innerHTML = `Already have an account? <a href="#" id="toggleLink">Sign in</a>`;
                }
                loginBtn.querySelector('span').textContent = 'Sign Up';
                subtitle.textContent = 'Create account to start coding';
                if (forgotLink) forgotLink.style.display = 'none';
            } else {
                toggleLink.textContent = 'Sign up';
                if (toggleText) {
                    toggleText.innerHTML = `Don't have an account? <a href="#" id="toggleLink">Sign up</a>`;
                }
                loginBtn.querySelector('span').textContent = 'Sign In';
                subtitle.textContent = 'Sign in to VinAgents';
                if (forgotLink) forgotLink.style.display = 'block';
            }
        });
    }

    // ============= HELPER FUNCTIONS =============
    function showMessage(text, type) {
        if (!messageDiv) return;
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    function setLoading(btn, isLoading) {
        if (!btn) return;
        if (isLoading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    // ============= INITIALIZE =============
    // Setup copy buttons dengan event delegation
    setupCopyButtons();
    
    console.log('✅ app.js initialized dengan semua fitur:');
    console.log('   - Responsive sidebar dengan hamburger menu');
    console.log('   - Chat history tersimpan');
    console.log('   - Auto title dari Groq');
    console.log('   - Codeblocks dengan copy WORKING');
    console.log('   - Dark mode');
    console.log('   - Google & GitHub login');
});
