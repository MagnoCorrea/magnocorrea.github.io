class P2PChat {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.roomCode = null;
        this.isHost = false;
        
        // Configuração STUN para conexão P2P
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        this.initializeElements();
        this.bindEvents();
        this.initializePeer();
    }
    
    initializeElements() {
        // Elementos da interface
        this.statusEl = document.getElementById('status');
        this.connectionSection = document.getElementById('connectionSection');
        this.chatSection = document.getElementById('chatSection');
        this.createRoomBtn = document.getElementById('createRoom');
        this.joinRoomBtn = document.getElementById('joinRoom');
        this.leaveRoomBtn = document.getElementById('leaveRoom');
        this.roomInfoEl = document.getElementById('roomInfo');
        this.roomCodeEl = document.getElementById('roomCode');
        this.joinRoomCodeEl = document.getElementById('joinRoomCode');
        this.copyCodeBtn = document.getElementById('copyCode');
        this.chatRoomCodeEl = document.getElementById('chatRoomCode');
        this.chatMessagesEl = document.getElementById('chatMessages');
        this.messageInputEl = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessage');
    }
    
    bindEvents() {
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.copyCodeBtn.addEventListener('click', () => this.copyRoomCode());
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter para enviar mensagem
        this.messageInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Enter para entrar na sala
        this.joinRoomCodeEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });
    }
    
    initializePeer() {
        // Importa PeerJS dinamicamente
        if (typeof Peer === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js';
            script.onload = () => this.createPeer();
            document.head.appendChild(script);
        } else {
            this.createPeer();
        }
    }
    
    createPeer() {
        this.peer = new Peer({
            config: this.config
        });
        
        this.peer.on('open', (id) => {
            console.log('Peer conectado com ID:', id);
            this.updateStatus('Pronto para conectar', 'ready');
        });
        
        this.peer.on('connection', (conn) => {
            console.log('Conexão recebida de:', conn.peer);
            this.handleConnection(conn);
        });
        
        this.peer.on('error', (err) => {
            console.error('Erro no peer:', err);
            this.updateStatus('Erro de conexão', 'error');
            this.showSystemMessage('Erro de conexão: ' + err.message);
        });
    }
    
    generateRoomCode() {
        // Gera um código de sala de 6 caracteres
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    createRoom() {
        if (!this.peer) {
            this.showSystemMessage('Aguarde a inicialização...');
            return;
        }
        
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        
        this.roomCodeEl.value = this.roomCode;
        this.roomInfoEl.classList.remove('hidden');
        this.createRoomBtn.disabled = true;
        
        this.updateStatus('Aguardando conexão...', 'waiting');
        this.showSystemMessage('Sala criada! Compartilhe o código: ' + this.roomCode);
        
        // Escuta conexões com o código da sala
        this.peer.on('connection', (conn) => {
            if (conn.metadata && conn.metadata.roomCode === this.roomCode) {
                this.handleConnection(conn);
            }
        });
    }
    
    joinRoom() {
        const roomCode = this.joinRoomCodeEl.value.trim().toUpperCase();
        
        if (!roomCode) {
            alert('Digite o código da sala');
            return;
        }
        
        if (!this.peer) {
            this.showSystemMessage('Aguarde a inicialização...');
            return;
        }
        
        this.roomCode = roomCode;
        this.isHost = false;
        
        this.updateStatus('Conectando...', 'connecting');
        
        // Tenta conectar usando o código da sala como ID do peer
        // Como não temos um servidor de signaling personalizado, 
        // usaremos uma abordagem diferente
        this.connectToPeer(roomCode);
    }
    
    connectToPeer(roomCode) {
        // Gera um ID baseado no código da sala para tentar conectar
        const targetPeerId = 'room_' + roomCode + '_host';
        
        const conn = this.peer.connect(targetPeerId, {
            metadata: { roomCode: roomCode }
        });
        
        conn.on('open', () => {
            this.handleConnection(conn);
        });
        
        conn.on('error', (err) => {
            console.error('Erro ao conectar:', err);
            this.updateStatus('Falha na conexão', 'error');
            this.showSystemMessage('Não foi possível conectar à sala. Verifique o código.');
        });
    }
    
    handleConnection(conn) {
        this.conn = conn;
        
        conn.on('open', () => {
            console.log('Conexão estabelecida!');
            this.updateStatus('Conectado', 'connected');
            this.showChatInterface();
            this.showSystemMessage('Conectado! Agora você pode conversar.');
        });
        
        conn.on('data', (data) => {
            this.handleMessage(data);
        });
        
        conn.on('close', () => {
            console.log('Conexão fechada');
            this.updateStatus('Desconectado', 'disconnected');
            this.showSystemMessage('Conexão perdida.');
            this.resetInterface();
        });
        
        conn.on('error', (err) => {
            console.error('Erro na conexão:', err);
            this.showSystemMessage('Erro na conexão: ' + err.message);
        });
    }
    
    showChatInterface() {
        this.connectionSection.classList.add('hidden');
        this.chatSection.classList.remove('hidden');
        this.chatRoomCodeEl.textContent = 'Sala: ' + this.roomCode;
        this.messageInputEl.focus();
    }
    
    sendMessage() {
        const message = this.messageInputEl.value.trim();
        
        if (!message) return;
        
        if (!this.conn || this.conn.open !== true) {
            this.showSystemMessage('Não conectado. Não é possível enviar mensagem.');
            return;
        }
        
        const messageData = {
            type: 'message',
            content: message,
            timestamp: new Date().toISOString(),
            sender: 'own'
        };
        
        // Envia a mensagem
        this.conn.send(messageData);
        
        // Adiciona a mensagem na interface
        this.addMessageToChat(messageData);
        
        // Limpa o input
        this.messageInputEl.value = '';
    }
    
    handleMessage(data) {
        if (data.type === 'message') {
            const messageData = {
                ...data,
                sender: 'other'
            };
            this.addMessageToChat(messageData);
        }
    }
    
    addMessageToChat(messageData) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${messageData.sender}`;
        
        const time = new Date(messageData.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageEl.innerHTML = `
            <div class="message-content">
                ${this.escapeHtml(messageData.content)}
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.chatMessagesEl.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    showSystemMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'system-message';
        messageEl.textContent = message;
        this.chatMessagesEl.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    copyRoomCode() {
        this.roomCodeEl.select();
        this.roomCodeEl.setSelectionRange(0, 99999); // Para móveis
        
        try {
            document.execCommand('copy');
            this.copyCodeBtn.textContent = 'Copiado!';
            setTimeout(() => {
                this.copyCodeBtn.textContent = 'Copiar';
            }, 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    }
    
    leaveRoom() {
        if (this.conn) {
            this.conn.close();
        }
        this.resetInterface();
    }
    
    resetInterface() {
        this.connectionSection.classList.remove('hidden');
        this.chatSection.classList.add('hidden');
        this.roomInfoEl.classList.add('hidden');
        this.createRoomBtn.disabled = false;
        this.joinRoomCodeEl.value = '';
        this.chatMessagesEl.innerHTML = '';
        this.messageInputEl.value = '';
        this.roomCode = null;
        this.conn = null;
        this.isHost = false;
        this.updateStatus('Pronto para conectar', 'ready');
    }
    
    updateStatus(text, className) {
        this.statusEl.textContent = text;
        this.statusEl.className = 'status ' + className;
    }
}

// Versão simplificada usando WebRTC com signaling manual
class SimpleP2PChat {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.isInitiator = false;
        this.roomCode = null;
        
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.statusEl = document.getElementById('status');
        this.connectionSection = document.getElementById('connectionSection');
        this.chatSection = document.getElementById('chatSection');
        this.createRoomBtn = document.getElementById('createRoom');
        this.joinRoomBtn = document.getElementById('joinRoom');
        this.leaveRoomBtn = document.getElementById('leaveRoom');
        this.roomInfoEl = document.getElementById('roomInfo');
        this.roomCodeEl = document.getElementById('roomCode');
        this.joinRoomCodeEl = document.getElementById('joinRoomCode');
        this.copyCodeBtn = document.getElementById('copyCode');
        this.chatRoomCodeEl = document.getElementById('chatRoomCode');
        this.chatMessagesEl = document.getElementById('chatMessages');
        this.messageInputEl = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessage');
    }
    
    bindEvents() {
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.copyCodeBtn.addEventListener('click', () => this.copyRoomCode());
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        
        this.messageInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        this.joinRoomCodeEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });
    }
    
    async createRoom() {
        this.isInitiator = true;
        this.roomCode = this.generateRoomCode();
        
        await this.initializePeerConnection();
        
        this.roomCodeEl.value = this.roomCode;
        this.roomInfoEl.classList.remove('hidden');
        this.createRoomBtn.disabled = true;
        
        this.updateStatus('Aguardando conexão...', 'waiting');
        this.showSystemMessage('Sala criada! Compartilhe o código: ' + this.roomCode);
        
        // Mostra instruções para o segundo usuário
        this.showSystemMessage('Aguardando alguém entrar na sala...');
    }
    
    async joinRoom() {
        const roomCode = this.joinRoomCodeEl.value.trim().toUpperCase();
        
        if (!roomCode) {
            alert('Digite o código da sala');
            return;
        }
        
        this.roomCode = roomCode;
        this.isInitiator = false;
        
        this.updateStatus('Conectando...', 'connecting');
        
        // Para simplicidade, vamos usar localStorage para simular signaling
        await this.initializePeerConnection();
        this.checkForOffer();
    }
    
    async initializePeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.config);
        
        // Criar data channel se for o iniciador
        if (this.isInitiator) {
            this.dataChannel = this.peerConnection.createDataChannel('messages');
            this.setupDataChannel(this.dataChannel);
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.setupDataChannel(event.channel);
            };
        }
        
        // ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.saveIceCandidate(event.candidate);
            }
        };
        
        // Monitorar estado da conexão
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                this.updateStatus('Conectado', 'connected');
                this.showChatInterface();
                this.showSystemMessage('Conectado! Agora você pode conversar.');
            } else if (this.peerConnection.connectionState === 'disconnected') {
                this.updateStatus('Desconectado', 'disconnected');
                this.showSystemMessage('Conexão perdida.');
            }
        };
        
        if (this.isInitiator) {
            await this.createOffer();
        }
    }
    
    setupDataChannel(channel) {
        this.dataChannel = channel;
        
        channel.onopen = () => {
            console.log('Data channel aberto');
        };
        
        channel.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
        
        channel.onclose = () => {
            console.log('Data channel fechado');
        };
    }
    
    async createOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.saveOffer(offer);
        
        // Simula signaling server
        this.showSystemMessage('Oferta criada. Aguardando resposta...');
    }
    
    async checkForOffer() {
        // Simula verificação de oferta no signaling server
        this.showSystemMessage('Procurando por oferta de conexão...');
        this.showSystemMessage('ATENÇÃO: Este é um chat P2P simplificado.');
        this.showSystemMessage('Para uma conexão real, ambos os usuários precisam estar na mesma rede local ou usar um servidor de signaling.');
        this.showSystemMessage('Como demonstração, você pode simular uma conversa abrindo duas abas do navegador.');
    }
    
    saveOffer(offer) {
        localStorage.setItem(`chat_offer_${this.roomCode}`, JSON.stringify(offer));
    }
    
    saveIceCandidate(candidate) {
        const key = `chat_ice_${this.roomCode}_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(candidate));
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    showChatInterface() {
        this.connectionSection.classList.add('hidden');
        this.chatSection.classList.remove('hidden');
        this.chatRoomCodeEl.textContent = 'Sala: ' + this.roomCode;
        this.messageInputEl.focus();
    }
    
    sendMessage() {
        const message = this.messageInputEl.value.trim();
        
        if (!message) return;
        
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            this.showSystemMessage('Não conectado. Não é possível enviar mensagem.');
            return;
        }
        
        const messageData = {
            type: 'message',
            content: message,
            timestamp: new Date().toISOString(),
            sender: 'own'
        };
        
        this.dataChannel.send(JSON.stringify({
            ...messageData,
            sender: 'other' // Para o destinatário, será uma mensagem do outro
        }));
        
        this.addMessageToChat(messageData);
        this.messageInputEl.value = '';
    }
    
    handleMessage(data) {
        if (data.type === 'message') {
            this.addMessageToChat(data);
        }
    }
    
    addMessageToChat(messageData) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${messageData.sender}`;
        
        const time = new Date(messageData.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageEl.innerHTML = `
            <div class="message-content">
                ${this.escapeHtml(messageData.content)}
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.chatMessagesEl.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    showSystemMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'system-message';
        messageEl.textContent = message;
        this.chatMessagesEl.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    copyRoomCode() {
        this.roomCodeEl.select();
        this.roomCodeEl.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.copyCodeBtn.textContent = 'Copiado!';
            setTimeout(() => {
                this.copyCodeBtn.textContent = 'Copiar';
            }, 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    }
    
    leaveRoom() {
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.resetInterface();
    }
    
    resetInterface() {
        this.connectionSection.classList.remove('hidden');
        this.chatSection.classList.add('hidden');
        this.roomInfoEl.classList.add('hidden');
        this.createRoomBtn.disabled = false;
        this.joinRoomCodeEl.value = '';
        this.chatMessagesEl.innerHTML = '';
        this.messageInputEl.value = '';
        this.roomCode = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.isInitiator = false;
        this.updateStatus('Pronto para conectar', 'ready');
    }
    
    updateStatus(text, className) {
        this.statusEl.textContent = text;
        this.statusEl.className = 'status ' + className;
    }
}

// Inicializar o chat quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Usar a versão simplificada para demonstração
    new SimpleP2PChat();
    
    // Mensagem inicial
    setTimeout(() => {
        const chatMessages = document.getElementById('chatMessages');
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'system-message';
        welcomeMsg.innerHTML = `
            <strong>Bem-vindo ao Chat P2P!</strong><br>
            Este chat funciona com conexão direta entre navegadores (WebRTC).<br>
            <br>
            <strong>Como usar:</strong><br>
            1. Uma pessoa cria uma sala e compartilha o código<br>
            2. A outra pessoa cola o código e entra na sala<br>
            3. Conversem diretamente sem servidor!<br>
            <br>
            <em>Nota: Para teste local, abra duas abas do navegador.</em>
        `;
        chatMessages.appendChild(welcomeMsg);
    }, 500);
});
