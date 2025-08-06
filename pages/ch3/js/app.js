/**
 * WebRTC Chat Application - P2P real-time communication
 * Features: WebRTC data channels, connection management, signaling UI
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize WebRTC chat manager
    const chatManager = new WebRTCChatManager();
    
    // Cache DOM elements
    const elements = {
        messagesContainer: document.getElementById('messages'),
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendButton'),
        messageForm: document.getElementById('messageForm'),
        charCount: document.getElementById('charCount'),
        connectionStatus: document.getElementById('connectionStatus'),
        connectionControls: document.getElementById('connectionControls'),
        usernameInput: document.getElementById('usernameInput'),
        setUsernameBtn: document.getElementById('setUsernameBtn'),
        createOfferBtn: document.getElementById('createOfferBtn'),
        offerTextarea: document.getElementById('offerTextarea'),
        answerTextarea: document.getElementById('answerTextarea'),
        handleOfferBtn: document.getElementById('handleOfferBtn'),
        handleAnswerBtn: document.getElementById('handleAnswerBtn'),
        copyOfferBtn: document.getElementById('copyOfferBtn'),
        copyAnswerBtn: document.getElementById('copyAnswerBtn')
    };

    // Validate required elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Required element not found: ${key}`);
            // Don't return, some elements might be optional
        }
    }

    // State management
    let isProcessing = false;
    let typingTimeout = null;
    let remoteTypingTimeout = null;
    let remoteIsTyping = false;

    /**
     * Updates connection status display
     */
    function updateConnectionStatus() {
        const status = chatManager.getConnectionState();
        const statusElement = elements.connectionStatus;
        
        if (statusElement) {
            statusElement.textContent = `Status: ${status}`;
            statusElement.className = `connection-status ${status}`;
        }
        
        // Update chat header status
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (statusIndicator && statusText) {
            statusIndicator.className = `status-indicator ${status === 'connected' ? 'online' : 'offline'}`;
            statusText.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
        }
        
        // Enable/disable message input based on connection
        if (elements.messageInput) {
            elements.messageInput.disabled = status !== 'connected';
            elements.messageInput.placeholder = status === 'connected' ? 
                'Type a message...' : 'Connect to start chatting...';
        }
        
        updateSendButton();
    }

    /**
     * Displays a message in the chat with proper formatting
     * @param {Object} message - Message object
     */
    function displayMessage(message) {
        const messageElement = document.createElement('div');
        const isCurrentUser = message.user === chatManager.getCurrentUser();
        messageElement.className = `message ${isCurrentUser ? 'user-message' : 'remote-message'}`;
        messageElement.setAttribute('data-message-id', message.id);
        
        // Format timestamp
        const timestamp = new Date(message.timestamp);
        const timeString = timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        // Create message content with accessibility
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text" role="text">${message.text}</div>
                <div class="message-meta">
                    <span class="message-user">${message.user}</span>
                    <span class="message-time" title="${timestamp.toLocaleString()}">${timeString}</span>
                    ${message.isRemote ? '<span class="message-badge">Remote</span>' : ''}
                </div>
            </div>
        `;
        
        // Add to container
        elements.messagesContainer.appendChild(messageElement);
        
        // Smooth scroll to bottom
        requestAnimationFrame(() => {
            elements.messagesContainer.scrollTo({
                top: elements.messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        });

        // Announce new messages to screen readers (only remote messages)
        if (!isCurrentUser) {
            setTimeout(() => {
                messageElement.setAttribute('aria-live', 'polite');
            }, 100);
        }
    }

    /**
     * Shows typing indicator
     * @param {string} username - Username of typing user
     */
    function showTypingIndicator(username = 'Remote user') {
        const existingIndicator = elements.messagesContainer.querySelector('.typing-indicator');
        if (existingIndicator) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'message remote-message typing-indicator';
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-animation">
                    <span>${username} is typing</span>
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        elements.messagesContainer.appendChild(typingElement);
        elements.messagesContainer.scrollTo({
            top: elements.messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    /**
     * Hides typing indicator
     */
    function hideTypingIndicator() {
        const indicator = elements.messagesContainer.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Validates message input
     * @param {string} text - Input text
     * @returns {Object} Validation result
     */
    function validateMessage(text) {
        const trimmed = text.trim();
        
        if (!trimmed) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        
        if (trimmed.length > chatManager.maxMessageLength) {
            return { 
                valid: false, 
                error: `Message too long. Maximum ${chatManager.maxMessageLength} characters.` 
            };
        }
        
        return { valid: true, text: trimmed };
    }

    /**
     * Sends a message with error handling
     */
    async function sendMessage() {
        if (isProcessing) return;

        const validation = validateMessage(elements.messageInput.value);
        
        if (!validation.valid) {
            showError(validation.error);
            return;
        }

        // Check if connected
        if (!chatManager.isConnected()) {
            showError('Not connected to remote peer. Please establish connection first.');
            return;
        }

        isProcessing = true;
        updateSendButton();

        try {
            // Add user message (will be sent automatically via WebRTC)
            const userMessage = chatManager.addMessage(validation.text);
            displayMessage(userMessage);
            
            // Clear input
            elements.messageInput.value = '';
            updateCharCounter();
            
            isProcessing = false;
            updateSendButton();
            
            // Focus back to input for better UX
            elements.messageInput.focus();
            
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Failed to send message. Please try again.');
            isProcessing = false;
            updateSendButton();
        }
    }

    /**
     * Updates send button state
     */
    function updateSendButton() {
        const hasText = elements.messageInput.value.trim().length > 0;
        const isConnected = chatManager.isConnected();
        elements.sendButton.disabled = !hasText || isProcessing || !isConnected;
        
        let ariaLabel = 'Send message';
        if (isProcessing) {
            ariaLabel = 'Sending message...';
        } else if (!isConnected) {
            ariaLabel = 'Connect to send messages';
        }
        
        elements.sendButton.setAttribute('aria-label', ariaLabel);
    }

    /**
     * Updates character counter
     */
    function updateCharCounter() {
        const count = elements.messageInput.value.length;
        elements.charCount.textContent = count;
        
        // Visual feedback for character limit
        const percentage = count / chatManager.maxMessageLength;
        if (percentage > 0.9) {
            elements.charCount.style.color = '#e74c3c';
        } else if (percentage > 0.8) {
            elements.charCount.style.color = '#f39c12';
        } else {
            elements.charCount.style.color = '#7f8c8d';
        }
    }

    /**
     * Shows error message to user
     * @param {string} message - Error message
     */
    function showError(message) {
        // Create temporary error display
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        elements.messagesContainer.appendChild(errorElement);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 3000);
    }

    /**
     * Loads existing messages on startup
     */
    function loadExistingMessages() {
        const messages = chatManager.getMessages();
        messages.forEach(message => displayMessage(message));
        
        // Show welcome message if no existing messages
        if (messages.length === 0) {
            showSystemMessage("Welcome to WebRTC Chat! Set your username and create/handle an offer to connect.");
        }
    }

    /**
     * Shows system message
     * @param {string} text - System message text
     */
    function showSystemMessage(text) {
        const systemMessage = {
            id: Date.now(),
            text: text,
            user: 'System',
            timestamp: new Date().toISOString(),
            isRead: false,
            isRemote: false
        };
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message system-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${text}</div>
            </div>
        `;
        
        elements.messagesContainer.appendChild(messageElement);
        elements.messagesContainer.scrollTo({
            top: elements.messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    /**
     * Connection management functions
     */
    function setupConnectionHandlers() {
        // Set username
        if (elements.setUsernameBtn && elements.usernameInput) {
            elements.setUsernameBtn.addEventListener('click', () => {
                const username = elements.usernameInput.value.trim();
                if (username) {
                    chatManager.setCurrentUser(username);
                    showSystemMessage(`Username set to: ${username}`);
                    elements.usernameInput.disabled = true;
                    elements.setUsernameBtn.disabled = true;
                }
            });
        }

        // Create offer
        if (elements.createOfferBtn) {
            elements.createOfferBtn.addEventListener('click', async () => {
                try {
                    elements.createOfferBtn.disabled = true;
                    const offer = await chatManager.createOffer();
                    if (elements.offerTextarea) {
                        elements.offerTextarea.value = offer;
                        showSystemMessage("Offer created! Copy and send to the other person.");
                    }
                } catch (error) {
                    showError('Failed to create offer: ' + error.message);
                    elements.createOfferBtn.disabled = false;
                }
            });
        }

        // Handle offer
        if (elements.handleOfferBtn) {
            const offerInput = document.getElementById('offerInput');
            elements.handleOfferBtn.addEventListener('click', async () => {
                try {
                    const offerText = offerInput ? offerInput.value.trim() : '';
                    if (!offerText) {
                        showError('Please paste the offer first.');
                        return;
                    }
                    
                    const answer = await chatManager.handleOffer(offerText);
                    if (elements.answerTextarea) {
                        elements.answerTextarea.value = answer;
                    }
                    showSystemMessage("Answer created! Copy and send back to the other person.");
                } catch (error) {
                    showError('Failed to handle offer: ' + error.message);
                }
            });
        }

        // Handle answer
        if (elements.handleAnswerBtn) {
            const answerInput = document.getElementById('answerInput');
            elements.handleAnswerBtn.addEventListener('click', async () => {
                try {
                    const answerText = answerInput ? answerInput.value.trim() : '';
                    if (!answerText) {
                        showError('Please paste the answer first.');
                        return;
                    }
                    
                    await chatManager.handleAnswer(answerText);
                    showSystemMessage("Answer processed! Connection should be established shortly.");
                } catch (error) {
                    showError('Failed to handle answer: ' + error.message);
                }
            });
        }

        // Copy buttons
        if (elements.copyOfferBtn && elements.offerTextarea) {
            elements.copyOfferBtn.addEventListener('click', () => {
                elements.offerTextarea.select();
                document.execCommand('copy');
                showSystemMessage("Offer copied to clipboard!");
            });
        }

        if (elements.copyAnswerBtn && elements.answerTextarea) {
            elements.copyAnswerBtn.addEventListener('click', () => {
                elements.answerTextarea.select();
                document.execCommand('copy');
                showSystemMessage("Answer copied to clipboard!");
            });
        }
    }

    // Set up WebRTC event handlers
    chatManager.onConnectionStateChange = (state) => {
        updateConnectionStatus();
        if (state === 'connected') {
            showSystemMessage("🎉 Connected! You can now chat in real-time.");
        } else if (state === 'disconnected') {
            showSystemMessage("❌ Disconnected from remote peer.");
        } else if (state === 'failed') {
            showSystemMessage("⚠️ Connection failed. Please try again.");
        }
    };

    chatManager.onMessageReceived = (message) => {
        displayMessage(message);
    };

    chatManager.onTypingStateChange = (isTyping, username) => {
        if (isTyping) {
            remoteIsTyping = true;
            showTypingIndicator(username);
            
            // Clear existing timeout
            if (remoteTypingTimeout) {
                clearTimeout(remoteTypingTimeout);
            }
            
            // Hide typing indicator after 3 seconds of no activity
            remoteTypingTimeout = setTimeout(() => {
                remoteIsTyping = false;
                hideTypingIndicator();
            }, 3000);
        } else {
            remoteIsTyping = false;
            hideTypingIndicator();
            if (remoteTypingTimeout) {
                clearTimeout(remoteTypingTimeout);
            }
        }
    };

    // Event Listeners with debouncing and error handling
    if (elements.messageForm) {
        elements.messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });
    }

    if (elements.messageInput) {
        elements.messageInput.addEventListener('input', function() {
            updateCharCounter();
            updateSendButton();
            
            // Send typing indicator
            if (chatManager.isConnected()) {
                chatManager.setTyping(true);
                
                // Clear typing timeout
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                }
                
                // Stop typing indicator after 1 second of no activity
                typingTimeout = setTimeout(() => {
                    chatManager.setTyping(false);
                }, 1000);
            }
            
            // Auto-resize textarea effect (visual feedback)
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Keyboard shortcuts
        elements.messageInput.addEventListener('keydown', function(e) {
            // Send on Enter (but not Shift+Enter for potential multiline)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
            
            // Clear on Escape
            if (e.key === 'Escape') {
                this.value = '';
                updateCharCounter();
                updateSendButton();
            }
        });

        // Focus management for accessibility
        elements.messageInput.addEventListener('focus', function() {
            if (this.parentElement) {
                this.parentElement.classList.add('focused');
            }
        });

        elements.messageInput.addEventListener('blur', function() {
            if (this.parentElement) {
                this.parentElement.classList.remove('focused');
            }
            // Stop typing indicator when losing focus
            if (chatManager.isConnected()) {
                chatManager.setTyping(false);
            }
        });
    }

    // Initialize application
    setupConnectionHandlers();
    loadExistingMessages();
    updateConnectionStatus();
    updateSendButton();
    updateCharCounter();
    
    // Set focus to username input initially
    if (elements.usernameInput) {
        elements.usernameInput.focus();
    }
    
    // Add clear chat functionality (for development/testing)
    window.clearChat = function() {
        chatManager.clearMessages();
        elements.messagesContainer.innerHTML = '';
        console.log('Chat cleared');
    };
    
    // Add disconnect functionality
    window.disconnect = function() {
        chatManager.closeConnection();
        showSystemMessage("Connection closed.");
    };
    
    console.log('WebRTC Chat Application initialized successfully');
});