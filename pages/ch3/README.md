# WebRTC P2P Chat Application

A real-time, peer-to-peer chat application using WebRTC technology. This application allows two users to communicate directly without the need for a server, ensuring privacy and low latency.

## 🚀 Features

### **Core Functionality**
- **Real-time P2P messaging** using WebRTC data channels
- **No server required** for actual communication
- **End-to-end encrypted** communication (WebRTC built-in)
- **Typing indicators** in real-time
- **Message persistence** using localStorage
- **Connection state management** with visual feedback

### **User Experience**
- **Responsive design** - works on desktop and mobile
- **Modern UI** with smooth animations
- **Accessibility support** - keyboard navigation and screen readers
- **Character counter** and message validation
### **Technical Features**
- **WebRTC DataChannels** for P2P communication
- **ICE servers** for NAT traversal
- **Connection state monitoring** and error handling
- **XSS protection** with input sanitization
- **Graceful degradation** if WebRTC is not supported

## 🛠️ How to Use

### **Setup**
1. Open two browser windows/tabs or use two different devices
2. Navigate to the application URL in both
3. Make sure both browsers support WebRTC (Chrome, Firefox, Safari, Edge)

### **Connection Process**

#### **Step 1: Set Username (Both Users)**
1. Enter a username in the "Your Username" field
2. Click "Set" to confirm

#### **Step 2: Create Connection (Host)**
**User A (Host):**
1. Click "Create Offer" button
2. Copy the generated offer text
3. Send this offer to User B via any method (email, messaging app, etc.)

#### **Step 3: Join Connection (Guest)**
**User B (Guest):**
1. Paste the received offer in the "Paste the offer you received" field
2. Click "Handle Offer"
3. Copy the generated answer text
4. Send this answer back to User A

#### **Step 4: Complete Connection (Host)**
**User A (Host):**
1. Paste the received answer in the "Paste the answer you received" field
2. Click "Complete Connection"
3. Connection should be established automatically

### **Start Chatting**
- Once connected, the status will show "Connected"
- Type messages in the input field
- Press Enter or click Send to send messages
- See real-time typing indicators when the other person is typing

## 📋 Technical Requirements

### **Browser Support**
- Chrome 56+
- Firefox 44+
- Safari 11+
- Edge 79+

### **Network Requirements**
- Internet connection (for initial STUN server communication)
- No special firewall configuration needed (STUN handles NAT traversal)

## 🔧 Development

### **Project Structure**
```
simple-chat-app/
├── index.html          # Main HTML file with WebRTC interface
├── css/
│   └── styles.css      # Modern CSS with responsive design
├── js/
│   ├── chat.js         # WebRTCChatManager class
│   └── app.js          # Main application logic
└── README.md           # This file
```

### **Local Development**
```bash
# Start local server
python -m http.server 8000

# Access at http://localhost:8000
```

## 🔐 Security Features

- **Input sanitization** prevents XSS attacks
- **Message validation** with length limits  
- **WebRTC encryption** built-in end-to-end encryption
- **No server storage** - messages only stored locally

## 🐛 Troubleshooting

### **Connection Issues**
- Ensure both browsers support WebRTC
- Try refreshing both browser windows
- Check browser console for detailed errors

**Happy Chatting! 🎉**