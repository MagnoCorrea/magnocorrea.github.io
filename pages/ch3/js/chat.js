/**
 * WebRTCChatManager - Manages P2P chat functionality with WebRTC
 * Features: Real-time P2P messaging, connection management, fallback support
 */
class WebRTCChatManager {
    constructor() {
        this.messages = this.loadMessages();
        this.currentUser = this.generateUsername();
        this.remoteUser = null;
        this.maxMessageLength = 500;
        this.isTyping = false;
        
        // WebRTC Configuration
        this.peerConnection = null;
        this.dataChannel = null;
        this.isInitiator = false;
        this.connectionState = 'disconnected'; // disconnected, connecting, connected, failed
        
        // ICE servers for NAT traversal
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
        
        // Event callbacks
        this.onConnectionStateChange = null;
        this.onMessageReceived = null;
        this.onTypingStateChange = null;
        
        // Initialize WebRTC
        this.initializeWebRTC();
    }

    /**
     * Generates a random username for the user
     * @returns {string} Generated username
     */
    generateUsername() {
        const adjectives = ['Cool', 'Smart', 'Quick', 'Bright', 'Swift', 'Bold', 'Nice'];
        const nouns = ['User', 'Person', 'Chat', 'Friend', 'Buddy', 'Peer'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 1000);
        return `${adj}${noun}${num}`;
    }

    /**
     * Initializes WebRTC peer connection
     */
    initializeWebRTC() {
        try {
            this.peerConnection = new RTCPeerConnection(this.iceServers);
            
            // Set up event handlers
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.handleIceCandidate(event.candidate);
                }
            };
            
            this.peerConnection.onconnectionstatechange = () => {
                this.connectionState = this.peerConnection.connectionState;
                console.log('Connection state:', this.connectionState);
                
                if (this.onConnectionStateChange) {
                    this.onConnectionStateChange(this.connectionState);
                }
            };
            
            this.peerConnection.ondatachannel = (event) => {
                this.setupDataChannel(event.channel);
            };
            
        } catch (error) {
            console.error('Failed to initialize WebRTC:', error);
            this.connectionState = 'failed';
        }
    }

    /**
     * Creates an offer to start connection
     * @returns {Promise<string>} Offer SDP
     */
    async createOffer() {
        try {
            this.isInitiator = true;
            
            // Create data channel
            this.dataChannel = this.peerConnection.createDataChannel('chat', {
                ordered: true
            });
            this.setupDataChannel(this.dataChannel);
            
            // Create offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            return JSON.stringify(offer);
        } catch (error) {
            console.error('Failed to create offer:', error);
            throw error;
        }
    }

    /**
     * Handles incoming offer
     * @param {string} offerSDP - Offer SDP string
     * @returns {Promise<string>} Answer SDP
     */
    async handleOffer(offerSDP) {
        try {
            const offer = JSON.parse(offerSDP);
            await this.peerConnection.setRemoteDescription(offer);
            
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            return JSON.stringify(answer);
        } catch (error) {
            console.error('Failed to handle offer:', error);
            throw error;
        }
    }

    /**
     * Handles incoming answer
     * @param {string} answerSDP - Answer SDP string
     */
    async handleAnswer(answerSDP) {
        try {
            const answer = JSON.parse(answerSDP);
            await this.peerConnection.setRemoteDescription(answer);
        } catch (error) {
            console.error('Failed to handle answer:', error);
            throw error;
        }
    }

    /**
     * Handles ICE candidate
     * @param {RTCIceCandidate} candidate - ICE candidate
     */
    handleIceCandidate(candidate) {
        // In a real application, you would send this to the remote peer
        // through a signaling server. For demo purposes, we'll store it.
        console.log('ICE Candidate:', candidate);
    }

    /**
     * Adds ICE candidate from remote peer
     * @param {string} candidateJSON - Candidate JSON string
     */
    async addIceCandidate(candidateJSON) {
        try {
            const candidate = JSON.parse(candidateJSON);
            await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('Failed to add ICE candidate:', error);
        }
    }

    /**
     * Sets up data channel event handlers
     * @param {RTCDataChannel} channel - Data channel
     */
    setupDataChannel(channel) {
        this.dataChannel = channel;
        
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            this.connectionState = 'connected';
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(this.connectionState);
            }
        };
        
        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
            this.connectionState = 'disconnected';
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(this.connectionState);
            }
        };
        
        this.dataChannel.onmessage = (event) => {
            this.handleIncomingMessage(event.data);
        };
        
        this.dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
    }

    /**
     * Handles incoming message from data channel
     * @param {string} data - Message data
     */
    handleIncomingMessage(data) {
        try {
            const messageData = JSON.parse(data);
            
            if (messageData.type === 'message') {
                const message = this.addMessage(messageData.text, messageData.user, false);
                if (this.onMessageReceived) {
                    this.onMessageReceived(message);
                }
            } else if (messageData.type === 'typing') {
                if (this.onTypingStateChange) {
                    this.onTypingStateChange(messageData.isTyping, messageData.user);
                }
            }
        } catch (error) {
            console.error('Failed to handle incoming message:', error);
        }
    }
    /**
     * Adds a new message to the chat
     * @param {string} text - Message text
     * @param {string} user - User name
     * @param {boolean} sendToRemote - Whether to send to remote peer
     * @returns {Object} Message object
     */
    addMessage(text, user = this.currentUser, sendToRemote = true) {
        // Validate input
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid message text');
        }

        if (text.length > this.maxMessageLength) {
            throw new Error(`Message too long. Maximum ${this.maxMessageLength} characters.`);
        }

        // Sanitize input to prevent XSS
        const sanitizedText = this.sanitizeText(text.trim());
        
        const message = {
            id: this.generateId(),
            text: sanitizedText,
            user: user,
            timestamp: new Date().toISOString(),
            isRead: false,
            isRemote: user !== this.currentUser
        };

        this.messages.push(message);
        this.saveMessages();
        
        // Send to remote peer if connected and it's our message
        if (sendToRemote && user === this.currentUser && this.isConnected()) {
            this.sendMessageToPeer(sanitizedText, user);
        }
        
        return message;
    }

    /**
     * Sends message to remote peer via data channel
     * @param {string} text - Message text
     * @param {string} user - User name
     */
    sendMessageToPeer(text, user) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const messageData = {
                type: 'message',
                text: text,
                user: user,
                timestamp: new Date().toISOString()
            };
            
            try {
                this.dataChannel.send(JSON.stringify(messageData));
            } catch (error) {
                console.error('Failed to send message to peer:', error);
            }
        }
    }

    /**
     * Sends typing indicator to remote peer
     * @param {boolean} isTyping - Whether user is typing
     */
    sendTypingIndicator(isTyping) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const typingData = {
                type: 'typing',
                isTyping: isTyping,
                user: this.currentUser,
                timestamp: new Date().toISOString()
            };
            
            try {
                this.dataChannel.send(JSON.stringify(typingData));
            } catch (error) {
                console.error('Failed to send typing indicator:', error);
            }
        }
    }

    /**
     * Checks if connected to remote peer
     * @returns {boolean} Connection status
     */
    isConnected() {
        return this.connectionState === 'connected' && 
               this.dataChannel && 
               this.dataChannel.readyState === 'open';
    }

    /**
     * Gets connection state
     * @returns {string} Connection state
     */
    getConnectionState() {
        return this.connectionState;
    }

    /**
     * Closes the connection
     */
    closeConnection() {
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        this.connectionState = 'disconnected';
    }

    /**
     * Sanitizes text to prevent XSS attacks
     * @param {string} text - Raw text
     * @returns {string} Sanitized text
     */
    sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Generates unique ID for messages
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Gets all messages
     * @returns {Array} Array of messages
     */
    getMessages() {
        return [...this.messages]; // Return copy to prevent mutation
    }

    /**
     * Gets current username
     * @returns {string} Current username
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Sets current username
     * @param {string} username - New username
     */
    setCurrentUser(username) {
        if (username && typeof username === 'string') {
            this.currentUser = username.trim();
            this.saveUserData();
        }
    }

    /**
     * Gets remote username
     * @returns {string} Remote username
     */
    getRemoteUser() {
        return this.remoteUser;
    }

    /**
     * Sets remote username
     * @param {string} username - Remote username
     */
    setRemoteUser(username) {
        this.remoteUser = username;
    }

    /**
     * Saves messages to localStorage
     */
    saveMessages() {
        try {
            localStorage.setItem('webrtc_chatMessages', JSON.stringify(this.messages));
        } catch (error) {
            console.warn('Could not save messages to localStorage:', error);
        }
    }

    /**
     * Loads messages from localStorage
     * @returns {Array} Array of messages
     */
    loadMessages() {
        try {
            const stored = localStorage.getItem('webrtc_chatMessages');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Could not load messages from localStorage:', error);
            return [];
        }
    }

    /**
     * Saves user data to localStorage
     */
    saveUserData() {
        try {
            localStorage.setItem('webrtc_userData', JSON.stringify({
                currentUser: this.currentUser,
                remoteUser: this.remoteUser
            }));
        } catch (error) {
            console.warn('Could not save user data to localStorage:', error);
        }
    }

    /**
     * Loads user data from localStorage
     */
    loadUserData() {
        try {
            const stored = localStorage.getItem('webrtc_userData');
            if (stored) {
                const data = JSON.parse(stored);
                this.currentUser = data.currentUser || this.currentUser;
                this.remoteUser = data.remoteUser || null;
            }
        } catch (error) {
            console.warn('Could not load user data from localStorage:', error);
        }
    }

    /**
     * Clears all messages
     */
    clearMessages() {
        this.messages = [];
        this.saveMessages();
    }

    /**
     * Sets typing indicator
     * @param {boolean} typing - Whether bot is typing
     */
    setTyping(typing) {
        this.isTyping = typing;
        // Send typing indicator to remote peer
        this.sendTypingIndicator(typing);
    }

    /**
     * Gets typing status
     * @returns {boolean} Whether bot is typing
     */
    getTyping() {
        return this.isTyping;
    }
}

// Make WebRTCChatManager available globally (no modules for simplicity)
window.WebRTCChatManager = WebRTCChatManager;
window.ChatManager = WebRTCChatManager; // Backward compatibility