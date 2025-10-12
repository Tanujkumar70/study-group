# Real-time Communication Module - Low-Level Design

## Overview
Handles real-time chat, voice/video calls, screen sharing, and WebRTC signaling.

## Class Structure (TypeScript)

```typescript
interface ChatMessage {
  _id: ObjectId;
  meetingId: ObjectId;
  senderId: ObjectId;
  content: string;
  type: 'text' | 'file' | 'system' | 'announcement';
  timestamp: Date;
  editedAt?: Date;
  replyTo?: ObjectId;
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;
}

interface VideoCall {
  callId: string;
  meetingId: ObjectId;
  participants: Array<{
    userId: ObjectId;
    streamId: string;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    joinedAt: Date;
  }>;
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  settings: {
    maxParticipants: number;
    allowScreenShare: boolean;
    recordingEnabled: boolean;
  };
}

interface ScreenShare {
  shareId: string;
  meetingId: ObjectId;
  sharerId: ObjectId;
  streamId: string;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
}

class CommunicationService {
  // Chat Methods
  async sendMessage(meetingId: string, senderId: string, content: string, type: string): Promise<ChatMessage>;
  async getMessages(meetingId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
  async editMessage(messageId: string, userId: string, newContent: string): Promise<ChatMessage>;
  async deleteMessage(messageId: string, userId: string): Promise<boolean>;
  async sendFile(meetingId: string, senderId: string, file: Buffer, filename: string): Promise<ChatMessage>;
  
  // Video Call Methods
  async startVideoCall(meetingId: string, initiatorId: string): Promise<VideoCall>;
  async joinVideoCall(callId: string, userId: string): Promise<VideoCall>;
  async leaveVideoCall(callId: string, userId: string): Promise<boolean>;
  async endVideoCall(callId: string, userId: string): Promise<boolean>;
  async toggleVideo(callId: string, userId: string, enabled: boolean): Promise<boolean>;
  async toggleAudio(callId: string, userId: string, enabled: boolean): Promise<boolean>;
  
  // Screen Share Methods
  async startScreenShare(meetingId: string, userId: string): Promise<ScreenShare>;
  async stopScreenShare(shareId: string, userId: string): Promise<boolean>;
  async getActiveScreenShare(meetingId: string): Promise<ScreenShare>;
}
```

## Database Schema (MongoDB)

```javascript
// ChatMessages Collection
{
  _id: ObjectId,
  meetingId: ObjectId (ref: 'Meetings', required),
  senderId: ObjectId (ref: 'Users', required),
  content: String (required),
  type: String (enum: ['text', 'file', 'system', 'announcement']),
  timestamp: Date (required, indexed),
  editedAt: Date,
  replyTo: ObjectId (ref: 'ChatMessages'),
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }],
  isDeleted: Boolean (default: false)
}

// VideoCalls Collection
{
  _id: ObjectId,
  callId: String (unique, indexed),
  meetingId: ObjectId (ref: 'Meetings', required),
  participants: [{
    userId: ObjectId (ref: 'Users'),
    streamId: String,
    isVideoEnabled: Boolean,
    isAudioEnabled: Boolean,
    joinedAt: Date
  }],
  status: String (enum: ['active', 'ended']),
  startedAt: Date,
  endedAt: Date,
  settings: {
    maxParticipants: Number,
    allowScreenShare: Boolean,
    recordingEnabled: Boolean
  }
}

// ScreenShares Collection
{
  _id: ObjectId,
  shareId: String (unique, indexed),
  meetingId: ObjectId (ref: 'Meetings', required),
  sharerId: ObjectId (ref: 'Users', required),
  streamId: String,
  isActive: Boolean,
  startedAt: Date,
  endedAt: Date
}
```

## API Endpoints

### Chat Management
```typescript
// Send Message
POST /api/chat/messages
Headers: { Authorization: "Bearer <token>" }
Request: {
  meetingId: string;
  content: string;
  type: 'text' | 'file' | 'announcement';
  replyTo?: string;
}
Response: {
  message: ChatMessage;
}

// Get Messages
GET /api/chat/messages/:meetingId
Headers: { Authorization: "Bearer <token>" }
Query: { 
  limit?: number;
  offset?: number;
}
Response: {
  messages: ChatMessage[];
  total: number;
}

// Edit Message
PUT /api/chat/messages/:id
Headers: { Authorization: "Bearer <token>" }
Request: {
  content: string;
}
Response: {
  message: ChatMessage;
}

// Delete Message
DELETE /api/chat/messages/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Upload File
POST /api/chat/upload
Headers: { Authorization: "Bearer <token>" }
Request: FormData with file
Response: {
  message: ChatMessage;
}
```

### Video Call Management
```typescript
// Start Video Call
POST /api/calls/start
Headers: { Authorization: "Bearer <token>" }
Request: {
  meetingId: string;
}
Response: {
  call: VideoCall;
  accessToken: string;
}

// Join Video Call
POST /api/calls/:callId/join
Headers: { Authorization: "Bearer <token>" }
Response: {
  call: VideoCall;
  accessToken: string;
}

// Leave Video Call
POST /api/calls/:callId/leave
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// End Video Call
POST /api/calls/:callId/end
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Toggle Video/Audio
PUT /api/calls/:callId/toggle
Headers: { Authorization: "Bearer <token>" }
Request: {
  video?: boolean;
  audio?: boolean;
}
Response: {
  message: string;
}
```

### Screen Share Management
```typescript
// Start Screen Share
POST /api/screen-share/start
Headers: { Authorization: "Bearer <token>" }
Request: {
  meetingId: string;
}
Response: {
  share: ScreenShare;
  accessToken: string;
}

// Stop Screen Share
POST /api/screen-share/:shareId/stop
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Get Active Screen Share
GET /api/screen-share/:meetingId/active
Headers: { Authorization: "Bearer <token>" }
Response: {
  share: ScreenShare;
}
```

## Real-time Events (Socket.io)

### Chat Events
```typescript
// Message Events
socket.emit('chat:message', { 
  meetingId, 
  content, 
  senderId, 
  type, 
  replyTo 
});
socket.on('chat:message', (message) => { 
  // Handle new message
});

// Typing Events
socket.emit('chat:typing', { 
  meetingId, 
  userId, 
  isTyping 
});
socket.on('chat:typing', (data) => { 
  // Handle typing indicator
});

// Message Edit/Delete Events
socket.emit('chat:message:edit', { 
  messageId, 
  newContent 
});
socket.emit('chat:message:delete', { 
  messageId 
});
socket.on('chat:message:updated', (message) => { 
  // Handle message update
});
```

### Video Call Events
```typescript
// Call Events
socket.emit('call:start', { 
  meetingId, 
  initiatorId 
});
socket.emit('call:join', { 
  callId, 
  userId 
});
socket.emit('call:leave', { 
  callId, 
  userId 
});
socket.emit('call:end', { 
  callId, 
  userId 
});

// WebRTC Signaling Events
socket.emit('call:offer', { 
  callId, 
  targetUserId, 
  offer 
});
socket.emit('call:answer', { 
  callId, 
  targetUserId, 
  answer 
});
socket.emit('call:ice-candidate', { 
  callId, 
  targetUserId, 
  candidate 
});

// Listeners
socket.on('call:offer', (data) => { 
  // Handle WebRTC offer
});
socket.on('call:answer', (data) => { 
  // Handle WebRTC answer
});
socket.on('call:ice-candidate', (data) => { 
  // Handle ICE candidate
});
```

### Screen Share Events
```typescript
// Screen Share Events
socket.emit('screen:start', { 
  meetingId, 
  userId 
});
socket.emit('screen:stop', { 
  meetingId, 
  userId 
});
socket.emit('screen:stream', { 
  meetingId, 
  streamId, 
  data 
});

// Listeners
socket.on('screen:started', (data) => { 
  // Handle screen share start
});
socket.on('screen:stopped', (data) => { 
  // Handle screen share stop
});
socket.on('screen:stream', (stream) => { 
  // Handle screen share stream
});
```

## Implementation Notes

### WebRTC Configuration
```typescript
// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ],
  iceCandidatePoolSize: 10
};

// Peer connection management
class PeerConnectionManager {
  private connections: Map<string, RTCPeerConnection> = new Map();
  
  createConnection(userId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(rtcConfig);
    this.connections.set(userId, pc);
    return pc;
  }
  
  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.connections.get(userId);
  }
  
  closeConnection(userId: string): void {
    const pc = this.connections.get(userId);
    if (pc) {
      pc.close();
      this.connections.delete(userId);
    }
  }
}
```

### File Upload Handling
```typescript
// File upload with validation
const uploadFile = async (file: Buffer, filename: string, meetingId: string): Promise<string> => {
  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  // Upload to GridFS
  const uploadStream = gfs.openUploadStream(filename);
  uploadStream.write(file);
  uploadStream.end();
  
  return uploadStream.id.toString();
};
```

### Message Encryption
```typescript
// End-to-end encryption for sensitive messages
import crypto from 'crypto';

const encryptMessage = (content: string, key: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decryptMessage = (encryptedContent: string, key: string): string => {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

### Error Handling
```typescript
// Common Error Responses
{
  "error": "Meeting not found",
  "message": "Meeting does not exist"
}

{
  "error": "Call not found",
  "message": "Video call does not exist"
}

{
  "error": "File too large",
  "message": "File size exceeds maximum limit"
}

{
  "error": "Invalid file type",
  "message": "File type not supported"
}
```

### Testing Strategy
- Unit tests for CommunicationService methods
- Integration tests for API endpoints
- WebRTC connection testing
- Real-time event testing
- File upload testing
- Message encryption testing
