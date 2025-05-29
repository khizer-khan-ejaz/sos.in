(function () {
    function loadScript(src, type = 'module') {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            if (type) script.type = type;
            script.onload = () => resolve();
            script.onerror = (err) => reject(new Error(`Failed to load script: ${src} - ${err}`));
            document.head.appendChild(script);
        });
    }

    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => resolve();
            link.onerror = (err) => reject(new Error(`Failed to load CSS: ${href} - ${err}`));
            document.head.appendChild(link);
        });
    }

    Promise.all([
        loadCSS("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"),
        loadScript('https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js', null),
        // Ensure Firebase App is loaded before other Firebase modules
        loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js', 'module').then(() =>
            Promise.all([
                loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js', 'module'),
                loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js', 'module')
            ])
        )
    ]).then(async () => {
      // Dynamically get Firebase SDK modules after they are loaded
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
      const { getStorage, ref: storageRef, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js');
      const { getDatabase, ref: dbRef, push, set, onValue, remove, query, orderByChild, equalTo, get, update } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');

      const firebaseConfig = {
        apiKey: "AIzaSyCjKIymYNh1jzc_kndRxRFxb2ElXoWM3fs", // Replace with your actual API key if this is a placeholder
        authDomain: "sos-shop-15157.firebaseapp.com",
        projectId: "sos-shop-15157",
        storageBucket: "sos-shop-15157.firebasestorage.app",
        messagingSenderId: "498447116137",
        appId: "1:498447116137:web:94f6a1c3fe7052bff0bff8",
        measurementId: "G-95MX22FQSZ",
        databaseURL: "https://sos-shop-15157-default-rtdb.firebaseio.com/"
    }

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const storage = getStorage(app); // storageRef is already imported if needed for specific paths

        const getBrowserId = () => {
            let browserId = localStorage.getItem('chatbot_browser_id');
            if (!browserId) {
                browserId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('chatbot_browser_id', browserId);
            }
            return browserId;
        };

        const currentBrowserId = getBrowserId();

        const chatbotHTML = `
            <button id="chatbot-toggler" aria-label="Toggle Chatbot">
                <span aria-hidden="true"><i class="fas fa-comments"></i></span>
                <span aria-hidden="true"><i class="fas fa-times"></i></span>
            </button>
            <div class="chatbot-popup">
                <div class="floating-element floating-1"></div>
                <div class="floating-element floating-2"></div>
                <div class="chat-interface">
                    <header class="chat-header">
                        <div class="header-info">
                            <div class="chatbot-logo">
                                <img src="https://sos-shop.ch/storage/logo/favicon.ico?v=1748514631" alt="Khadar Groups Logo" style="width: 100%; height: 100%; border-radius: inherit; object-fit: cover;">
                            </div>
                            <div class="header-text">
                                <h2 class="logo-text">Sos-Shop</h2>
                                <span class="status-indicator">Online</span>
                            </div>
                        </div>
                        <div class="chat-actions">
                            <button type="button" class="chat-action" id="dark-mode-toggle" title="Toggle Dark Mode" aria-label="Toggle Dark Mode">
                                <i class="fas fa-moon"></i>
                            </button>
                            <button type="button" class="chat-action" id="resetChatHistoryBtn" title="Reset Chat" aria-label="Reset Chat">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button type="button" class="chat-action" id="closeChatbotBtn" title="Close Chat" aria-label="Close Chat">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </header>
                    <div class="chat-body" id="chat-body" aria-live="polite"></div>
                    <div class="chat-footer">
                        <form class="chat-form" id="chat-form">
                            <div class="file-upload-wrapper" id="file-upload-wrapper">
                                <button type="button" id="file-upload-button" class="chat-control-btn" title="Attach File" aria-label="Attach File">
                                    <i class="fas fa-paperclip"></i>
                                </button>
                                <input type="file" id="file-input" accept="image/*,.pdf,.doc,.docx,.txt" hidden>
                                <div id="file-preview" class="file-preview"></div>
                                <button type="button" id="file-cancel-button" style="display:none;" title="Cancel File" aria-label="Cancel File">
                                    <i class="fas fa-times-circle"></i>
                                </button>
                            </div>
                            <textarea class="message-input" id="message-input" placeholder="Type your message..." rows="1" required aria-label="Message input"></textarea>
                            <div class="chat-controls">
                                
                                <button type="submit" id="send-message-btn" title="Send" aria-label="Send Message" disabled>
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div id="chatbot-toast" class="chatbot-toast"></div>
        `;
        
        const style = document.createElement('style');
        style.innerHTML = `
            /* --- Paste the full CSS from your existing setup here --- */
            /* For brevity, I'm only including the crucial CSS parts related to potential issues and the toast */
            :root {
                --primary-gradient: linear-gradient(135deg, #EF4444 0%, #F87171 100%); /* Red primary gradient */
                --secondary-gradient: linear-gradient(135deg, #FCA5A5 0%, #DC2626 100%); /* Red secondary gradient */
                --text-dark: #1F2937;
                --text-medium: #EF4444; /* Red accent for text */
                --text-light: #FFFFFF;
                --background:rgb(255, 254, 254); /* Light red-tinted background */
                --background-alt: rgba(255, 246, 246, 0.95);
                --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                --message-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
                --success: #10B981;
                --danger: #B91C1C; /* Darker red for errors */
                --border: #FEE2E2; /* Light red border */
                --user-bubble: #EF4444; /* Red for user messages */
                --bot-bubble: rgba(241, 245, 249, 0.9); 
            }

            body.dark-mode {
                --background: #1F2937;
                --background-alt: rgba(31, 41, 55, 0.95);
                --text-dark: #F3F4F6;
                --bot-bubble: rgba(55, 65, 81, 0.9); 
                --border: #4B5563;
                --primary-gradient: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
                --secondary-gradient: linear-gradient(135deg, #F87171 0%, #EF4444 100%);
                --text-medium: #F87171;
            }

            * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif; }
            
            
            
            #chatbot-toggler { 
                position: fixed; bottom: 30px; right: 30px; border: none; height: 64px; width: 64px; 
                display: flex; cursor: pointer; align-items: center; justify-content: center; 
                border-radius: 50%; background: var(--primary-gradient); 
                box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4); 
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                z-index: 10000; color: var(--text-light); font-size: 1.5rem; 
            }
            #chatbot-toggler:hover { transform: scale(1.1) rotate(10deg); box-shadow: 0 12px 30px rgba(239, 68, 68, 0.5); }
            #chatbot-toggler span:last-child { display: none; }
            body.show-chatbot #chatbot-toggler span:first-child { display: none; }
            body.show-chatbot #chatbot-toggler span:last-child { display: inline; }
            
            .chatbot-popup {
                position: fixed; right: 30px; bottom: 30px; width: 390px; height: 620px;
                overflow: hidden; background: rgba(255, 255, 255, 0.1); 
                border-radius: 20px; opacity: 0; pointer-events: none; 
                transform: scale(0.9) translateY(10px); transform-origin: bottom right; 
                box-shadow: var(--card-shadow); 
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
                z-index: 2220000; border: 1px solid rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(12px);
            }
            body.show-chatbot .chatbot-popup { opacity: 1; pointer-events: auto; transform: scale(1) translateY(0); }
            .chat-interface { display: flex; flex-direction: column; height: 100%; background: var(--background-alt); border-radius: 20px; overflow: hidden; }
            .chat-header { 
                display: flex; align-items: center; padding: 18px 22px; 
                background: var(--primary-gradient); justify-content: space-between;
                position: relative; z-index: 10;
            }
            .chat-header::after {
                content: ''; position: absolute; bottom: -10px; left: 0; right: 0;
                height: 20px; background: var(--background-alt); 
                border-radius: 20px 20px 0 0; z-index: -1;
            }
            .header-info { display: flex; gap: 12px; align-items: center; }
            .header-text { display: flex; flex-direction: column; gap: 4px; }
            .header-info .chatbot-logo { 
                width: 40px; height: 40px; 
                flex-shrink: 0; background: rgb(255, 253, 253); 
                border-radius: 12px; display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(5px); border: 1px solid rgba(255, 255, 255, 0.15);
                overflow: hidden; 
            }
            .header-info .logo-text { color: var(--text-light); font-weight: 600; font-size: 1.2rem; letter-spacing: -0.3px; }
            .status-indicator { font-size: 0.8rem; color: var(--text-light); opacity: 0.8; }
            .status-indicator::before {
                content: ''; display: inline-block; width: 8px; height: 8px;
                background: var(--success); border-radius: 50%; margin-right: 6px;
            }
            .chat-header .chat-actions { display: flex; gap: 10px; }
            .chat-header .chat-action { 
                border: none; color: var(--text-light); height: 36px; width: 36px; 
                font-size: 1rem; cursor: pointer; border-radius: 10px; 
                background: rgba(255, 255, 255, 0.15); transition: all 0.2s ease; 
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(5px); border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .chat-header .chat-action:hover { background: rgba(255, 255, 255, 0.25); transform: rotate(15deg); }
            
            .chat-body { 
                padding: 22px; gap: 18px; display: flex; flex-grow: 1; 
                overflow-y: auto; flex-direction: column; scrollbar-width: thin;
                background: var(--background-alt); 
                scrollbar-color: #FEE2E2 var(--background-alt); 
            }
            .chat-body::-webkit-scrollbar { width: 8px; }
            .chat-body::-webkit-scrollbar-track { background: var(--background-alt); border-radius: 4px; }
            .chat-body::-webkit-scrollbar-thumb { background: #FEE2E2; border-radius: 4px; }
            .chat-body::-webkit-scrollbar-thumb:hover { background: #FCA5A5; }
            
            .chat-body .message { 
                display: flex; gap: 12px; align-items: flex-end; 
                margin-bottom: 18px; max-width: 88%; position: relative;
            }
            .chat-body .bot-message { align-self: flex-start; }
            .chat-body .user-message { align-self: flex-end; flex-direction: row-reverse; }

            .chat-body .message .bot-avatar, 
            .chat-body .message .patient-avatar {
                width: 30px; height: 30px; border-radius: 12px; flex-shrink: 0;
                display: flex; align-items: center; justify-content: center;
                color: var(--text-light); font-size: 0.9rem; 
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                position: relative; z-index: 2; overflow: hidden;
            }
            .chat-body .message .bot-avatar img,
            .chat-body .message .patient-avatar img {
                width: 100%; height: 100%; object-fit: cover;
            }
            .chat-body .message .bot-avatar { background: white; }
            .chat-body .message .patient-avatar { background: var(--secondary-gradient); }
            
            .message-text { 
                padding: 12px 16px; font-size: 0.95rem; line-height: 1.6; 
                transition: all 0.2s ease; position: relative; z-index: 1;
                border-radius: 16px; border: 1px solid rgba(0,0,0,0.05);
                word-wrap: break-word; overflow-wrap: break-word;
            }
            .chat-body .bot-message .message-text { 
                background: var(--bot-bubble); border-radius: 16px 16px 16px 6px; 
                color: var(--text-dark); box-shadow: var(--message-shadow);
            }
            .chat-body .user-message .message-text { 
                color: var(--text-light); background: var(--user-bubble); 
                border-radius: 16px 16px 6px 16px; box-shadow: var(--message-shadow);
                border-color: rgba(239, 68, 68, 0.2); 
            }
            .message-text .copy-button {
                position: absolute; top: 8px; right: 8px; background: transparent;
                border: none; color: var(--text-medium); font-size: 0.8rem; 
                cursor: pointer; opacity: 0; transition: opacity 0.2s ease; z-index: 5;
            }
            .user-message .message-text .copy-button { color: rgba(255,255,255,0.7); }
            .message:hover .copy-button { opacity: 1; }
            
            .message-time { 
                font-size: 0.7rem; margin-top: 6px; opacity: 0.7; 
                display: block; font-weight: 500;
            }
            .chat-body .bot-message .message-text .message-time { color: var(--text-medium); text-align: left; }
            .chat-body .user-message .message-text .message-time { color: rgba(255, 255, 255, 0.8); text-align: right; }
            
            .chat-body .bot-message.thinking { max-width: fit-content; }
            .chat-body .bot-message .thinking-indicator { 
                display: flex; gap: 8px; padding: 14px 18px; 
                background: var(--bot-bubble); border-radius: 16px 16px 16px 6px; 
                box-shadow: var(--message-shadow);
            }
            .chat-body .bot-message .thinking-indicator .dot { 
                height: 8px; width: 8px; opacity: 0.7; border-radius: 50%; 
                background: var(--user-bubble); 
                animation: dotPulse 1.6s ease-in-out infinite; 
            }
            .dot:nth-child(1) { animation-delay: 0s; }
            .dot:nth-child(2) { animation-delay: 0.2s; }
            .dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes dotPulse { 0%, 60%, 100% { transform: translateY(0); opacity: 0.6; } 30% { opacity: 1; transform: translateY(-5px); } }
            
            .quick-replies { 
                display: flex; flex-wrap: wrap; gap: 10px; width: 100%; 
                margin: 15px 0 20px 0; animation: fadeInUp 0.5s ease-out;
                justify-content: center; 
            }
            .quick-reply { 
                background: rgba(239, 68, 68, 0.08); color: var(--user-bubble); 
                padding: 10px 18px; border-radius: 12px; cursor: pointer; 
                font-size: 0.88rem; font-weight: 500;
                transition: all 0.2s ease-in-out; display: flex; 
                align-items: center; justify-content: center; gap: 8px; 
                text-align: center; border: 1px solid rgba(239, 68, 68, 0.15); 
                backdrop-filter: blur(5px); 
            }
            .quick-reply:hover { 
                background: var(--primary-gradient); color: var(--text-light);
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(239, 68, 68, 0.25);
                border-color: transparent;
            }
            #welcome-message-container .message-text { 
                padding: 0; background: transparent; box-shadow: none; 
                border: none; border-radius: 20px; 
            }
            .welcome-panel {
                padding: 30px 25px; background: var(--background-alt); 
                border-radius: 20px; box-shadow: var(--card-shadow);
                max-width: 100%; margin: 0; text-align: center;
                border: 1px solid rgba(254, 226, 226, 0.6); 
                backdrop-filter: blur(10px); position: relative; overflow: hidden;
            }
            .welcome-panel::before { 
                content: ''; position: absolute; top: 0; left: 0; right: 0;
                height: 4px; background: var(--primary-gradient);
            }
            #welcome-message-container.bot-message .bot-avatar { display: none; } 
            #welcome-message-container.bot-message { justify-content: center; max-width: 100%; }

            .welcome-panel .welcome-heading {
                color: var(--text-dark); font-size: 1.4rem; font-weight: 700;
                margin-bottom: 12px; letter-spacing: -0.5px;
            }
            .welcome-panel .welcome-text {
                color: var(--text-medium); font-size: 0.95rem;
                line-height: 1.65; margin-bottom: 25px;
            }
            .welcome-panel .primary-button { 
                background: var(--primary-gradient); color: var(--text-light);
                padding: 14px 32px; border-radius: 14px; border: none;
                font-weight: 600; width: auto; min-width: 200px; 
                cursor: pointer; transition: all 0.3s ease;
                font-size: 1rem; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); 
                display: inline-flex; align-items: center; justify-content: center; 
                gap: 10px; position: relative; overflow: hidden; z-index: 1;
            }
            .welcome-panel .primary-button::before { 
                content: ''; position: absolute; top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(135deg, #DC2626 0%, #F87171 100%); 
                z-index: -1; opacity: 0; transition: opacity 0.3s ease;
            }
            .welcome-panel .primary-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 25px rgba(239, 68, 68, 0.4); 
            }
            .welcome-panel .primary-button:hover::before { opacity: 1; }
            
            .chat-footer { 
                background: var(--background-alt); padding: 12px 18px; 
                border-top: 1px solid var(--border); 
                box-shadow: 0 -5px 15px rgba(0,0,0,0.03);
                position: relative; z-index: 10; 
            }
            .chat-footer::before {
                content: ''; position: absolute; top: -15px; left: 0; right: 0;
                height: 20px; background: var(--background-alt); 
                border-radius: 0 0 20px 20px; z-index: -1; 
            }
            .chat-footer .chat-form { 
                display: flex; align-items: center; gap: 8px; 
                position: relative; background: var(--background); 
                border-radius: 18px; border: 1px solid var(--border);
                padding: 8px 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
            }
            .chat-form:focus-within { 
                border-color: var(--text-medium); 
                box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15); 
            }
            .chat-form .message-input { 
                flex-grow: 1; height: 44px; outline: none; resize: none; 
                border: none; max-height: 100px; font-size: 0.95rem; 
                padding: 10px 0; background: transparent; color: var(--text-dark);
                scrollbar-width: none; 
            }
            .chat-form .message-input::-webkit-scrollbar { display: none; }
            .chat-form .message-input::placeholder { color: #A0AEC0; }
            
            .chat-form .chat-controls { display: flex; align-items: center; gap: 8px; }
            .chat-form .chat-control-btn { /* Unified class for control buttons */
                height: 38px; width: 38px; border: none; cursor: pointer; 
                color: var(--text-medium); border-radius: 12px; 
                font-size: 1.1rem; background: transparent; 
                transition: all 0.2s ease; display: flex;
                align-items: center; justify-content: center;
            }
            .chat-form .chat-control-btn:hover { 
                color: #DC2626; background: rgba(239, 68, 68, 0.08); 
            }
            .chat-form .chat-controls #send-message-btn { 
                color: var(--text-light); background: var(--primary-gradient); 
                border-radius: 14px; height: 40px; width: 44px; 
                box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3); 
                font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
            }
            .chat-form .chat-controls #send-message-btn:hover { 
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4); 
            }
            .chat-form .chat-controls #send-message-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                box-shadow: none;
                transform: none;
            }
            
            .file-upload-wrapper { position: relative; display:flex; align-items:center; }
            .file-upload-wrapper #file-cancel-button {
                color: var(--danger); background: var(--background-alt); 
                position: absolute; top: -5px; right: -20px; /* Adjusted position */
                height: 20px; width: 20px; font-size: 0.8rem;
                border-radius: 50%; z-index: 10; line-height:1;
                border: none; cursor:pointer; padding:0;
            }
            .file-preview {
                display: none; position: absolute; bottom: 60px; left: 0px; /* Adjusted position */
                max-width: 150px; background: var(--background-alt);
                border-radius: 12px; padding: 8px;
                box-shadow: var(--message-shadow); border: 1px solid var(--border);
                z-index: 100;
            }
            .file-preview img { max-width: 100%; border-radius: 8px; display: block; }
            .file-preview span { font-size: 0.8em; color: var(--text-medium); word-break:break-all;}
            .file-upload-wrapper.file-uploaded #file-upload-button { color: var(--success); }
            
            em-emoji-picker { 
                position: absolute !important; 
                bottom: 70px !important; 
                right: 15px !important; 
                width: clamp(280px, 80vw, 350px) !important;
                z-index: 2220005 !important;
                visibility: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                border-radius: 10px;
            }
            body.show-emoji-picker em-emoji-picker { visibility: visible; }

            .user-info-form-container {
                padding: 15px; background: var(--bot-bubble); 
                border-radius: 15px; color: var(--text-dark);
            }
            .user-info-form-container h3 { font-size: 1.1em; margin-bottom: 10px; color: var(--text-dark); }
            .user-info-form-container p { font-size: 0.9em; margin-bottom: 15px; line-height: 1.5; }
            .user-info-form-container .form-field { margin-bottom: 10px; }
            .user-info-form-container label { display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.85em; }
            .user-info-form-container input[type="text"],
            .user-info-form-container input[type="tel"],
            .user-info-form-container input[type="number"] {
                width: 100%; padding: 10px; border: 1px solid var(--border);
                border-radius: 8px; background-color: var(--background);
                color: var(--text-dark); font-size: 0.9em;
            }
            .user-info-form-container input:focus {
                border-color: var(--text-medium); outline: none;
                box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
            }
            .user-info-form-container .submit-btn {
                display: block; width: 100%; padding: 12px;
                background: var(--primary-gradient); color: var(--text-light);
                border: none; border-radius: 8px; font-weight: 600;
                font-size: 0.95em; cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .user-info-form-container .submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(239, 68, 68, 0.3);
            }
            .user-info-form-container .submit-btn:disabled {
                background: #ccc; cursor: not-allowed; box-shadow: none; transform: none;
            }

            .chatbot-toast {
                position: fixed; bottom: 100px; left: 50%;
                transform: translateX(-50%);
                background-color: rgba(30,30,30,0.85); 
                color: white; padding: 12px 22px; border-radius: 25px;
                font-size: 0.9rem; z-index: 2220001; 
                opacity: 0; visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
                box-shadow: 0 3px 12px rgba(0,0,0,0.15);
                backdrop-filter: blur(3px);
            }
            .chatbot-toast.show {
                opacity: 1; visibility: visible;
                transform: translateX(-50%) translateY(-10px); 
            }
            /* Add other CSS rules from your setup */
             @media screen and (max-width: 480px) {
                .chatbot-toast { width: calc(100% - 40px); bottom: 80px; }
                .chatbot-popup { width: 100vw; height: 100%; right:0; bottom:0; border-radius:0;}
                .chat-body { height: calc(100% - 140px); /* Adjust if footer/header height changes */ }
            }

        `;
        document.head.appendChild(style);

        const chatbotContainer = document.createElement('div');
        chatbotContainer.innerHTML = chatbotHTML;
        document.body.appendChild(chatbotContainer);
        
        const CHATBOT_TOGGLER = document.getElementById('chatbot-toggler');
        const CHATBOT_POPUP = document.querySelector('.chatbot-popup');
        const CLOSE_CHATBOT_BTN = document.getElementById('closeChatbotBtn');
        const RESET_CHAT_HISTORY_BTN = document.getElementById('resetChatHistoryBtn');
        const CHAT_FORM = document.getElementById('chat-form');
        const MESSAGE_INPUT = document.getElementById('message-input');
        const CHAT_BODY = document.getElementById('chat-body');
        const SEND_MESSAGE_BTN = document.getElementById('send-message-btn');
        
        const FILE_UPLOAD_BTN = document.getElementById('file-upload-button');
        const FILE_INPUT = document.getElementById('file-input');
        const FILE_CANCEL_BTN = document.getElementById('file-cancel-button');
        const FILE_UPLOAD_WRAPPER = document.getElementById('file-upload-wrapper');
        const FILE_PREVIEW_CONTAINER = document.getElementById('file-preview');

        const DARK_MODE_TOGGLE_BTN = document.getElementById('dark-mode-toggle');
        const VOICE_INPUT_BTN = document.getElementById('voice-input-btn'); // Assuming you might add this ID later
        const EMOJI_PICKER_BTN = document.getElementById('emoji-picker-button'); // Assuming you might add this ID later
        const TOAST_NOTIFICATION = document.getElementById('chatbot-toast');

        const USER_AVATAR_DEFAULT = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        const BOT_AVATAR_DEFAULT = 'https://sos-shop.ch/storage/logo/favicon.ico?v=1748514631';

        let messageProcessing = false;
        let emojiPickerInstance = null;


        const userData = {
            message: null,
            file: null,
        };
        
        function sanitizeHTML(str) {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        }

        function showToast(message) {
            TOAST_NOTIFICATION.textContent = message;
            TOAST_NOTIFICATION.classList.add('show');
            setTimeout(() => {
                TOAST_NOTIFICATION.classList.remove('show');
            }, 3000);
        }
        
        function createAvatarHTML(sender, avatarSrc = null) {
            if (sender === 'bot-message') {
                return `<div class="bot-avatar"><img src="${avatarSrc || BOT_AVATAR_DEFAULT}" alt="Bot Avatar"></div>`;
            } else {
                return `<div class="patient-avatar"><img src="${avatarSrc || USER_AVATAR_DEFAULT}" alt="User Avatar"></div>`;
            }
        }

        CHATBOT_TOGGLER.addEventListener('click', () => {
            document.body.classList.toggle('show-chatbot');
            if (document.body.classList.contains('show-chatbot')) {
                setTimeout(() => MESSAGE_INPUT.focus(), 300);
                initializeChatInterface(); 
            }
        });

        CLOSE_CHATBOT_BTN.addEventListener('click', () => document.body.classList.remove('show-chatbot'));

        DARK_MODE_TOGGLE_BTN.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = DARK_MODE_TOGGLE_BTN.querySelector('i');
            const isDarkMode = document.body.classList.contains('dark-mode');
            icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('chatbot-theme', isDarkMode ? 'dark' : 'light');
            trackEvent('Dark Mode Toggled', { mode: isDarkMode ? 'dark' : 'light' });
            if (emojiPickerInstance && typeof emojiPickerInstance.update === 'function') {
                emojiPickerInstance.update({ theme: isDarkMode ? 'dark' : 'light' });
            }
        });
        if (localStorage.getItem('chatbot-theme') === 'dark') {
            document.body.classList.add('dark-mode');
            DARK_MODE_TOGGLE_BTN.querySelector('i').className = 'fas fa-sun';
        }

        MESSAGE_INPUT.addEventListener('input', function() {
            this.style.height = 'auto'; 
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            updateSendButtonActiveState();
        });
        
        CHAT_FORM.addEventListener('submit', (e) => {
            e.preventDefault();
            handleOutgoingMessage();
        });
        MESSAGE_INPUT.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleOutgoingMessage();
            }
        });

        function addMessageToUI(content, senderClass, timestampValue, avatarSrc = null) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${senderClass}`;
            
            let jsDate;
            if (timestampValue instanceof Date) {
                jsDate = timestampValue;
            } else if (timestampValue && typeof timestampValue.toDate === 'function') { 
                jsDate = timestampValue.toDate();
            } else if (timestampValue) { 
                jsDate = new Date(timestampValue);
            } else {
                jsDate = new Date();
            }

            const currentTime = jsDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const avatarHTML = createAvatarHTML(senderClass, avatarSrc);
            const messageTextHTML = `<div class="message-text">
                                        ${content} 
                                        <button type="button" class="copy-button" title="Copy Message" aria-label="Copy Message">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                        <div class="message-time">${currentTime}</div>
                                    </div>`;
            
            messageDiv.innerHTML = avatarHTML + messageTextHTML;
            CHAT_BODY.appendChild(messageDiv);
            smoothScrollToBottom();
            
            const copyButton = messageDiv.querySelector('.copy-button');
            if(copyButton) { // Check if copy button exists (e.g. not in form HTML)
              copyButton.addEventListener('click', () => {
                  // Create a temporary element to hold the HTML content
                  const tempEl = document.createElement('div');
                  tempEl.innerHTML = content; // Assign the HTML content

                  // Use textContent to get the plain text representation
                  const textToCopy = tempEl.textContent || tempEl.innerText || "";
                  
                  navigator.clipboard.writeText(textToCopy).then(() => {
                      showToast('Message copied!');
                  }).catch(err => console.error('Failed to copy: ', err));
                  trackEvent('Message Copied', {});
              });
            }
        }

        function showTypingIndicator() {
            hideTypingIndicator();
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot-message thinking'; 
            typingDiv.id = 'typing-indicator';
            typingDiv.innerHTML = `
                ${createAvatarHTML('bot-message')}
                <div class="thinking-indicator">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>`;
            CHAT_BODY.appendChild(typingDiv);
            smoothScrollToBottom();
        }
        function hideTypingIndicator() {
            document.getElementById('typing-indicator')?.remove();
        }
        
        // CORRECTED HERE:
        window.sendQuickReply = function(messageText) {
            // REMOVED: addMessageToUI(sanitizeHTML(messageText), 'user-message', new Date());
            trackEvent('Quick Reply Clicked', { message: messageText });
            MESSAGE_INPUT.value = messageText; 
            handleOutgoingMessage(); 
        };
        
        // CORRECTED HERE:
        window.startChat = function() {
            const liveChatMessage = "I'd like to start a live chat.";
            // REMOVED: addMessageToUI(sanitizeHTML(liveChatMessage), 'user-message', new Date());
            trackEvent('Live Chat Started', {});
            MESSAGE_INPUT.value = liveChatMessage;
            handleOutgoingMessage();
            MESSAGE_INPUT.focus();
        };

        function displayQuickReplies(repliesArray) {
            CHAT_BODY.querySelector('.quick-replies')?.remove();
            if (!repliesArray || repliesArray.length === 0) return;

            const container = document.createElement('div');
            container.className = 'quick-replies';
            repliesArray.forEach(reply => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'quick-reply';
                let iconClass = 'fa-comment-dots'; 
                if (reply.icon) iconClass = reply.icon;
                else {
                    if (reply.text.toLowerCase().includes('order')) iconClass = 'fa-truck';
                    if (reply.text.toLowerCase().includes('return')) iconClass = 'fa-undo-alt';
                    if (reply.text.toLowerCase().includes('info')) iconClass = 'fa-info-circle';
                }
                button.innerHTML = `<i class="fas ${iconClass}"></i> ${sanitizeHTML(reply.text)}`;
                button.onclick = () => sendQuickReply(reply.action || reply.text);
                container.appendChild(button);
            });
            CHAT_BODY.appendChild(container);
            smoothScrollToBottom();
        }
        
        FILE_UPLOAD_BTN.addEventListener('click', () => FILE_INPUT.click());
        FILE_INPUT.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            userData.file = file;
            FILE_UPLOAD_WRAPPER.classList.add('file-uploaded');
            FILE_CANCEL_BTN.style.display = 'inline-flex';
            FILE_PREVIEW_CONTAINER.innerHTML = ''; 
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => FILE_PREVIEW_CONTAINER.innerHTML = `<img src="${ev.target.result}" alt="${sanitizeHTML(file.name)}">`;
                reader.readAsDataURL(file);
            } else {
                FILE_PREVIEW_CONTAINER.innerHTML = `<span><i class="fas fa-file-alt"></i> ${sanitizeHTML(file.name)}</span>`;
            }
            FILE_PREVIEW_CONTAINER.style.display = 'block';
            trackEvent('File Selected', { fileName: file.name });
            updateSendButtonActiveState();
        });

        FILE_CANCEL_BTN.addEventListener('click', () => {
            FILE_INPUT.value = ''; 
            userData.file = null;
            FILE_UPLOAD_WRAPPER.classList.remove('file-uploaded');
            FILE_PREVIEW_CONTAINER.innerHTML = '';
            FILE_PREVIEW_CONTAINER.style.display = 'none';
            FILE_CANCEL_BTN.style.display = 'none';
            trackEvent('File Cancelled', {});
            updateSendButtonActiveState();
        });

        if ('webkitSpeechRecognition' in window && VOICE_INPUT_BTN) {
            VOICE_INPUT_BTN.style.display = 'inline-flex';
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US';
            VOICE_INPUT_BTN.addEventListener('click', () => {
                recognition.start(); VOICE_INPUT_BTN.classList.add('active'); trackEvent('Voice Input Started', {});
            });
            recognition.onresult = (event) => {
                MESSAGE_INPUT.value = event.results[0][0].transcript;
                MESSAGE_INPUT.dispatchEvent(new Event('input')); 
                handleOutgoingMessage();
            };
            recognition.onerror = (event) => { console.error('Speech recognition error', event.error); trackEvent('Voice Input Error', { error: event.error }); };
            recognition.onend = () => VOICE_INPUT_BTN.classList.remove('active');
        }

        if (window.EmojiMart && EMOJI_PICKER_BTN) {
            emojiPickerInstance = new EmojiMart.Picker({
                data: async () => fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data').then(res => res.json()),
                theme: document.body.classList.contains('dark-mode') ? "dark" : "light",
                onEmojiSelect: (emoji) => {
                    const { selectionStart: start, selectionEnd: end } = MESSAGE_INPUT;
                    MESSAGE_INPUT.value = MESSAGE_INPUT.value.substring(0, start) + emoji.native + MESSAGE_INPUT.value.substring(end);
                    MESSAGE_INPUT.focus(); MESSAGE_INPUT.selectionStart = MESSAGE_INPUT.selectionEnd = start + emoji.native.length;
                    MESSAGE_INPUT.dispatchEvent(new Event('input'));
                    trackEvent('Emoji Added', { emoji: emoji.native });
                },
                onClickOutside: (e) => {
                    if (emojiPickerInstance && !emojiPickerInstance.contains(e.target) && EMOJI_PICKER_BTN && !EMOJI_PICKER_BTN.contains(e.target)) {
                        document.body.classList.remove("show-emoji-picker");
                    }
                },
            });
            if (CHATBOT_POPUP.querySelector('.chat-interface')) {
                CHATBOT_POPUP.querySelector('.chat-interface').appendChild(emojiPickerInstance);
            }

            EMOJI_PICKER_BTN.addEventListener('click', (e) => {
                e.stopPropagation();
                if (emojiPickerInstance && typeof emojiPickerInstance.update === 'function') {
                     emojiPickerInstance.update({ theme: document.body.classList.contains('dark-mode') ? "dark" : "light" });
                }
                document.body.classList.toggle("show-emoji-picker");
                trackEvent('Emoji Picker Toggled', {});
            });
        }
        document.addEventListener('click', (e) => {
            if (document.body.classList.contains("show-emoji-picker") && emojiPickerInstance && !emojiPickerInstance.contains(e.target) && EMOJI_PICKER_BTN && e.target !== EMOJI_PICKER_BTN && !EMOJI_PICKER_BTN.contains(e.target)) {
                document.body.classList.remove("show-emoji-picker");
            }
        });

        RESET_CHAT_HISTORY_BTN.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the chat history? This will also reset your current session.')) {
                resetChatHistory(); 
                trackEvent('Chat Reset Confirmed', {});
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.body.classList.contains('show-chatbot')) {
                document.body.classList.remove('show-chatbot');
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && document.body.classList.contains('show-chatbot') && document.activeElement === MESSAGE_INPUT && (MESSAGE_INPUT.value.trim() !== "" || userData.file)) {
                e.preventDefault(); 
                handleOutgoingMessage();
            }
        });
        
        function smoothScrollToBottom() { CHAT_BODY.scrollTo({ top: CHAT_BODY.scrollHeight, behavior: 'smooth' }); }
        function trackEvent(eventName, details) { console.log(`Analytics: ${eventName}`, details); }

        // Token check - keep as is if used by your backend for rate limiting or features
        const storedToken = localStorage.getItem("chatbotToken");
        if (!storedToken || storedToken !== "1999") { // Replace "1999" if it's a placeholder
            console.warn("Chatbot Token is missing or invalid. Features may be limited.");
        } else {
            console.log("Token validated. Chatbot is active.");
        }

        function createWelcomePanelHTML() {
            return `
                <div class="message bot-message" id="welcome-message-container">
                    <div class="message-text">
                        <div class="welcome-panel">
                            <h3 class="welcome-heading">👋 Hello! How can we assist?</h3>
                            <p class="welcome-text">Our support team is ready to help. Ask questions or choose an option to get started quickly.</p>
                            <div class="quick-replies" id="welcome-quick-replies"></div>
                            <button type="button" class="primary-button" onclick="startChat()">
                                <i class="fas fa-comments"></i> Start Live Chat
                            </button>
                        </div>
                    </div>
                </div>`;
        }
        
        function populateWelcomeQuickReplies() {
            const container = document.getElementById('welcome-quick-replies');
            if (!container) return;
            container.innerHTML = '';
            const medicalReplies = [
        { text: 'Fruits & Légumes', action: 'fruits_legumes', icon: 'fa-apple-alt' },
        { text: 'Snacks & Friandises', action: 'snacks_friandises', icon: 'fa-cookie-bite' },
        { text: 'Pain & Viennoiseries', action: 'pain_viennoiseries', icon: 'fa-bread-slice' },
        { text: 'Boissons, Thé et Café', action: 'boissons_the_cafe', icon: 'fa-coffee' },
        { text: 'Cosmétiques & Santé', action: 'cosmetiques_sante', icon: 'fa-heart' },
        { text: 'Électroniques', action: 'electroniques', icon: 'fa-tv' },
        { text: 'Halal', action: 'halal', icon: 'fa-star-and-crescent' },
        { text: 'Autres', action: 'autres', icon: 'fa-ellipsis-h' }
    ];
            medicalReplies.forEach(reply => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'quick-reply';
                button.innerHTML = `<i class="fas ${reply.icon || 'fa-comment-dots'}"></i> ${sanitizeHTML(reply.text)}`;
                button.onclick = () => sendQuickReply(reply.action);
                container.appendChild(button);
            });
        }

        function createUserInfoFormHTML() { 
            return `
            <div class="user-info-form-container">
                <h3>Let's Get to Know You</h3>
                <p>Please provide some basic information to help us serve you better.</p>
                <form id="user-info-submit-form">
                    <div class="form-field"><label for="user-name">Full Name:</label><input type="text" id="user-name" name="name" required autocomplete="name"></div>
                    <div class="form-field"><label for="user-phone">Phone Number:</label><input type="tel" id="user-phone" name="phone" required autocomplete="tel"></div>
                    <div class="form-field"><label for="user-age">Age:</label><input type="number" id="user-age" name="age" required autocomplete="off"></div>
                    <button type="submit" class="submit-btn">Submit Information</button>
                </form>
            </div>`;
        }
    
        // CORRECTED: Uses Realtime Database SDK
        async function getUserNameFromDB() {
            try {
                const userId = localStorage.getItem('userId');
                if (userId) {
                    const userRef = dbRef(db, `users/${userId}`);
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        return snapshot.val().name || "User";
                    }
                }
                // Fallback to browserId query if userId method fails or not present
                const usersQueryRef = query(dbRef(db, "users"), orderByChild("browserId"), equalTo(currentBrowserId));
                const querySnapshot = await get(usersQueryRef);
                if (querySnapshot.exists()) {
                    const userDataVal = querySnapshot.val();
                    // snapshot.val() returns an object where keys are the unique IDs of matching children
                    const firstUserKey = Object.keys(userDataVal)[0];
                    return userDataVal[firstUserKey].name || "User";
                }
                return "User";
            } catch (error) {
                console.error("Error fetching user name from RTDB:", error);
                return "User";
            }
        }

        function updateSendButtonActiveState() {
            const hasMessage = MESSAGE_INPUT.value.trim() !== "";
            const hasFile = userData.file !== null;
            SEND_MESSAGE_BTN.disabled = !(hasMessage || hasFile) || messageProcessing;
        }
        
        async function initializeChatInterface() {
            CHAT_BODY.innerHTML = '';
            CHAT_FORM.style.display = 'flex';

            const userInfoSubmitted = await checkUserInfoSubmitted();
            const welcomePanelShown = localStorage.getItem('chatWelcomePanelShown') === 'true';

            if (!userInfoSubmitted && !localStorage.getItem('userInfoFormSkipped')) {
                showUserInfoForm();
            } else if (!welcomePanelShown) {
                showWelcomePanel();
            } else {
                await renderFullChatHistory();
            }
            updateSendButtonActiveState();
        }

        async function showUserInfoForm() {
            addMessageToUI(createUserInfoFormHTML(), 'bot-message', new Date());
            CHAT_FORM.style.display = 'none'; 

            setTimeout(() => {
                const form = document.getElementById("user-info-submit-form");
                if (form && !form.dataset.listenerAttached) {
                    form.addEventListener("submit", handleUserInfoFormSubmit);
                    form.dataset.listenerAttached = "true";
                } else if (!form) {
                    console.error("User info form (#user-info-submit-form) not found in DOM after timeout for event listener attachment.");
                }
            }, 100);
        }
        
        async function handleUserInfoFormSubmit(e) {
            e.preventDefault();
            const nameInput = document.getElementById("user-name");
            const phoneInput = document.getElementById("user-phone");
            const ageInput = document.getElementById("user-age");
            const submitButton = e.target.querySelector('.submit-btn');

            if (!nameInput || !phoneInput || !ageInput) {
                console.error("Form fields not found!");
                showToast("Error: Could not submit form. Please try again.");
                return;
            }

            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const age = ageInput.value.trim();
            
            if (name && phone && age) {
                try {
                    if(submitButton) {
                        submitButton.disabled = true;
                        submitButton.textContent = 'Submitting...';
                    }
                    await storeUserInfo(name, phone, age);
                    CHAT_FORM.style.display = 'flex';
                    localStorage.removeItem('chatWelcomePanelShown'); // Ensure welcome panel logic is re-evaluated
                    initializeChatInterface(); 
                } catch (error) {
                    console.error("Error submitting user info:", error);
                    showToast("Failed to submit user info. Please try again.");
                    if(submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Submit Information';
                    }
                }
            } else {
                showToast("Please fill in all fields.");
            }
        }

        function showWelcomePanel() {
            CHAT_BODY.innerHTML = createWelcomePanelHTML();
            populateWelcomeQuickReplies();
            localStorage.setItem('chatWelcomePanelShown', 'true');
            smoothScrollToBottom();
        }
        
        // CORRECTED: Uses Realtime Database SDK
        async function storeUserInfo(name, phone, age) {
            try {
                const usersRefNode = dbRef(db, "users");
                const q = query(usersRefNode, orderByChild('browserId'), equalTo(currentBrowserId));
                const snapshot = await get(q);

                let userId;
                const userInfo = { name, phone, age, browserId: currentBrowserId, timestamp: Date.now() };

                if (snapshot.exists()) {
                    const existingUserKey = Object.keys(snapshot.val())[0];
                    userId = existingUserKey;
                    const userToUpdateRef = dbRef(db, `users/${userId}`);
                    await update(userToUpdateRef, userInfo);
                    console.log("User info updated for ID:", userId);
                } else {
                    const newUserRef = push(usersRefNode);
                    await set(newUserRef, userInfo);
                    userId = newUserRef.key;
                    console.log("User info stored with ID:", userId);
                }
                localStorage.setItem('userId', userId);
                return userId;
            } catch (error) {
                console.error("Error storing/updating user info in RTDB:", error);
                throw error;
            }
        }

        // CORRECTED: Uses Realtime Database SDK
        async function checkUserInfoSubmitted() {
            const localUserId = localStorage.getItem('userId');
            if (localUserId) {
                console.log("User ID found in localStorage:", localUserId);
                // Optional: verify this userId exists in DB for added robustness
                // const userRefVerify = dbRef(db, `users/${localUserId}`);
                // const snapshotVerify = await get(userRefVerify);
                // if (snapshotVerify.exists()) return true;
                // else localStorage.removeItem('userId'); // Stale userId
                return true;
            }

            console.log("User ID not in localStorage, checking DB for browserId:", currentBrowserId);
            try {
                const usersRefNode = dbRef(db, 'users');
                const q = query(usersRefNode, orderByChild('browserId'), equalTo(currentBrowserId));
                const snapshot = await get(q);
                
                if (snapshot.exists()) {
                    const userDataVal = snapshot.val();
                    const userId = Object.keys(userDataVal)[0];
                    if (userId) { // Ensure a key was actually found
                        localStorage.setItem('userId', userId);
                        console.log("User ID found in DB and cached to localStorage:", userId);
                        return true;
                    }
                }
                console.log("No user info found in DB for this browserId.");
                return false;
            } catch (error) {
                console.error("Error checking user info in DB (RTDB):", error);
                return false;
            }
        }

        async function checkForPendingUploads() {
            const browserIdString = String(currentBrowserId);
            const pendingUploadKey = `pending_upload_${browserIdString}`;
            if (localStorage.getItem(pendingUploadKey) === 'true') {
                const botMessage = "I was waiting for a file. Please upload your report or skip.";
                let botResponseWithButtons = `${sanitizeHTML(botMessage)}
                    <div class="quick-replies upload-buttons-dynamic-container" style="margin-top: 10px;">
                        <button type="button" class="quick-reply upload-btn-dynamic"><i class="fas fa-upload"></i> Upload File</button>
                        <button type="button" class="quick-reply skip-btn-dynamic"><i class="fas fa-forward"></i> Skip</button>
                    </div>`;
                addMessageToUI(botResponseWithButtons, "bot-message", new Date());
            }
        }
        
        CHAT_BODY.addEventListener('click', function(e) { 
            const browserIdString = String(currentBrowserId);
            const pendingUploadKey = `pending_upload_${browserIdString}`;
            let targetButton = null;

            if (e.target.classList.contains('upload-btn-dynamic')) targetButton = e.target;
            else if (e.target.closest('.upload-btn-dynamic')) targetButton = e.target.closest('.upload-btn-dynamic');

            if (targetButton) {
                e.preventDefault();
                const dynamicFileInput = document.createElement('input');
                dynamicFileInput.type = 'file'; dynamicFileInput.style.display = 'none';
                document.body.appendChild(dynamicFileInput);
                dynamicFileInput.onchange = (ev) => {
                    if (ev.target.files.length > 0) {
                        userData.file = ev.target.files[0]; 
                        MESSAGE_INPUT.value = "Here is the report"; // Pre-fill message
                        handleOutgoingMessage(); // This will now include the file
                        document.body.removeChild(dynamicFileInput);
                        localStorage.removeItem(pendingUploadKey); // Clear pending state
                         // Remove the dynamic buttons after action
                        const dynamicButtonsContainer = CHAT_BODY.querySelector('.upload-buttons-dynamic-container');
                        if (dynamicButtonsContainer) dynamicButtonsContainer.remove();
                    }
                };
                dynamicFileInput.click();
                return;
            }

            let skipButton = null;
            if (e.target.classList.contains('skip-btn-dynamic')) skipButton = e.target;
            else if (e.target.closest('.skip-btn-dynamic')) skipButton = e.target.closest('.skip-btn-dynamic');

            if (skipButton) {
                e.preventDefault();
                MESSAGE_INPUT.value = "skip upload";
                handleOutgoingMessage();
                localStorage.removeItem(pendingUploadKey);
                 // Remove the dynamic buttons after action
                const dynamicButtonsContainer = CHAT_BODY.querySelector('.upload-buttons-dynamic-container');
                if (dynamicButtonsContainer) dynamicButtonsContainer.remove();
            }
        });

        async function handleOutgoingMessage() {
            if (messageProcessing) return;

            const userMessageText = MESSAGE_INPUT.value.trim();
            const userFile = userData.file; // Get file from userData object

            if (!userMessageText && !userFile) return;
            
            messageProcessing = true;
            updateSendButtonActiveState();

            let displayMessage = sanitizeHTML(userMessageText);
            if (userFile && !userMessageText) displayMessage = `Attached: ${sanitizeHTML(userFile.name)}`;
            else if (userFile && userMessageText) displayMessage += ` <br><small style='opacity:0.7; font-style:italic;'>File: ${sanitizeHTML(userFile.name)}</small>`;
            
            addMessageToUI(displayMessage, "user-message", new Date());
            await storeChatMessage(userMessageText || (userFile ? `File: ${userFile.name}` : "[empty message]"), "user");

            MESSAGE_INPUT.value = ""; 
            MESSAGE_INPUT.dispatchEvent(new Event("input")); 
            if (userFile) { 
                // Reset file input related UI elements
                FILE_INPUT.value = ''; // Clear the actual file input
                userData.file = null; // Clear file from userData
                FILE_UPLOAD_WRAPPER.classList.remove('file-uploaded');
                FILE_PREVIEW_CONTAINER.innerHTML = ''; 
                FILE_PREVIEW_CONTAINER.style.display = 'none';
                FILE_CANCEL_BTN.style.display = 'none';
            }
            
            showTypingIndicator();

            try {
                // Pass userFile to generateBotResponse
                const botResponseText = await generateBotResponse(userMessageText, userFile); 
                hideTypingIndicator();
                addMessageToUI(botResponseText, "bot-message", new Date()); 
                await storeChatMessage(botResponseText, "bot");
            } catch (error) {
                hideTypingIndicator();
                console.error("Error handling bot response:", error);
                const errorMessage = "Sorry, I couldn't connect. Please try again later.";
                addMessageToUI(errorMessage, "bot-message", new Date());
                await storeChatMessage(errorMessage, "bot");
            } finally {
                messageProcessing = false;
                updateSendButtonActiveState();
            }
        }

        async function generateBotResponse(query = null, file = null) {
            const userMessage = query || "";
            try {
                const browserIdString = String(currentBrowserId);
                const userName1 = await getUserNameFromDB(); // Ensure this uses RTDB
                const formData = new FormData();
                formData.append("query", userMessage);
                formData.append("session_id", browserIdString);
                formData.append("user_name", userName1);
                if (file) formData.append("file", file, file.name);

                const apiResponse = await fetch("https://khadargroups-ai-chatbot.vercel.app/chat", { method: "POST", body: formData });
                if (!apiResponse.ok) {
                    const errorData = await apiResponse.text().catch(() => "Unknown API error");
                    throw new Error(`API Error ${apiResponse.status}: ${errorData}`);
                }
                
                const data = await apiResponse.json();
                let botResponseText = data.message || "Sorry, I could not understand that.";
                
                const pendingUploadKey = `pending_upload_${browserIdString}`;
                if (data.show_upload_prompt === true) {
                    localStorage.setItem(pendingUploadKey, 'true');
                    botResponseText += `
                    <div class="quick-replies upload-buttons-dynamic-container" style="margin-top: 10px; display: flex; gap: 10px;">
                        <button type="button" class="quick-reply upload-btn-dynamic"><i class="fas fa-upload"></i> Upload File</button>
                        <button type="button" class="quick-reply skip-btn-dynamic"><i class="fas fa-forward"></i> Skip</button>
                    </div>`;
                } else {
                    // If no prompt to upload, ensure any pending state is cleared
                    localStorage.removeItem(pendingUploadKey);
                }

                if (data.quick_replies && data.quick_replies.length > 0) {
                    setTimeout(() => displayQuickReplies(data.quick_replies), 50);
                }
                return botResponseText;
            } catch (error) {
                console.error("Error in generateBotResponse:", error);
                return `I'm having trouble connecting to my services right now. Please try again in a moment. (Error: ${sanitizeHTML(error.message)})`;
            }
        }
        
        async function resetChatHistory() { 
            CHAT_BODY.innerHTML = ""; 
            try {
                await deleteChatHistoryFromDB();
                const browser = String(currentBrowserId);
                let response = await fetch("https://khadargroups-ai-chatbot.vercel.app/clear", {
                    method: "POST", headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: browser })
                });
                if (!response.ok) {
                    let formData = new FormData(); formData.append("session_id", browser);
                    response = await fetch("https://khadargroups-ai-chatbot.vercel.app/clear", { method: "POST", body: formData });
                }
                if (!response.ok) throw new Error(`API Clear Error: ${response.status}`);
                console.log("Chat reset successfully on backend.");
            } catch (error) {
                console.error("Error resetting chat:", error);
                addMessageToUI("Could not fully reset chat. Some history might remain.", "bot-message", new Date());
            } finally {
                localStorage.removeItem('chatWelcomePanelShown');
                // UNCOMMENTED to forget user identity on reset, potentially triggering re-registration.
                // If the user's record (with browserId) still exists in the `users` table,
                // checkUserInfoSubmitted() will find it and they won't have to re-type info.
                // If you want to force re-typing info, the user record in DB would also need deletion.
                localStorage.removeItem('userId'); 
                localStorage.removeItem(`pending_upload_${String(currentBrowserId)}`);
                localStorage.removeItem('userInfoFormSkipped'); // If you use this
                initializeChatInterface(); 
            }
        }

        // These functions use RTDB SDK and should be correct as per your original snippet if they worked before.
        async function storeChatMessage(message, sender) {
            try {
                const userIdOrBrowserId = localStorage.getItem('userId') || currentBrowserId;
                const path = `chats/${userIdOrBrowserId}`;
                const chatsRefNode = dbRef(db, path);
                const newMessageRef = push(chatsRefNode);
                await set(newMessageRef, {
                    message: typeof message === 'string' ? message : JSON.stringify(message), // Storing HTML as string
                    sender: sender,
                    timestamp: Date.now(),
                    userId: localStorage.getItem('userId') || null 
                });
            } catch (error) {
                console.error("Error storing chat message:", error);
                showToast("Failed to save message. Please try again.");
            }
        }

        async function renderFullChatHistory() {
            console.log("Rendering full chat history...");
            const userIdOrBrowserId = localStorage.getItem('userId') || currentBrowserId;
            const path = `chats/${userIdOrBrowserId}`;

            try {
                const chatsRefNode = dbRef(db, path);
                const queryRefNode = query(chatsRefNode, orderByChild('timestamp'));

                // Use 'get' for a one-time read if you don't need real-time updates after initial load
                const snapshot = await get(queryRefNode);
                CHAT_BODY.innerHTML = ""; // Clear before rendering
                
                if (!snapshot.exists()) {
                    // If no history, and user info is submitted, show welcome panel.
                    // If user info NOT submitted, initializeChatInterface will handle it.
                    if (await checkUserInfoSubmitted()) {
                         showWelcomePanel();
                    } else {
                        // This case should ideally be handled by initializeChatInterface's main logic
                        // which would call showUserInfoForm.
                        console.log("No chat history and user info not submitted, deferring to initializeChatInterface logic.");
                    }
                    return;
                }

                const messages = [];
                snapshot.forEach((childSnapshot) => {
                    messages.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });

                // Messages are already ordered by Firebase query (orderByChild('timestamp'))
                // If not, client-side sort: messages.sort((a, b) => a.timestamp - b.timestamp);

                messages.forEach(msg => {
                    addMessageToUI(
                        msg.message, // This is the stored HTML/text
                        msg.sender === "user" ? "user-message" : "bot-message",
                        new Date(msg.timestamp)
                    );
                });

                localStorage.setItem('chatWelcomePanelShown', 'true');
                checkForPendingUploads(); // Check after rendering history
                smoothScrollToBottom();
            
            } catch (error) {
                console.error("Error fetching chat history:", error);
                showToast("Could not load chat history");
                // Fallback to welcome panel if history load fails but user is known
                if (await checkUserInfoSubmitted()) {
                    showWelcomePanel();
                }
            }
        }

        async function deleteChatHistoryFromDB() {
            try {
                const userIdOrBrowserId = localStorage.getItem('userId') || currentBrowserId;
                const path = `chats/${userIdOrBrowserId}`;
                const chatsRefNode = dbRef(db, path);
                await remove(chatsRefNode);
                console.log("Chat history deleted successfully from DB for path:", path);
            } catch (error) {
                console.error("Error deleting chat history from DB:", error);
                throw error; // Re-throw to be caught by resetChatHistory
            }
        }
        
        // Initial load check
        if (document.body.classList.contains('show-chatbot')) {
            initializeChatInterface();
        }

    }).catch(error => {
        console.error("Failed to initialize chatbot scripts or styles:", error);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = "Chatbot failed to load. Please try refreshing the page or contact support.";
        errorDiv.style.cssText = "position:fixed; bottom:10px; left:10px; padding:10px; background:red; color:white; z-index:100000;";
        document.body.appendChild(errorDiv);
    });
})();