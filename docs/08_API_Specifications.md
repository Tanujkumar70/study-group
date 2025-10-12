# API Specifications - Study Group Application

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.studygroup.app/api
```

## Authentication
All API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human readable error message",
  "details": { ... }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## User Management API

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "username": "johndoe",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "timezone": "America/New_York"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Management Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "timezone": "America/Los_Angeles",
  "preferences": {
    "notifications": true,
    "theme": "dark",
    "language": "en"
  }
}
```

## Group Management API

### Group Endpoints

#### Get User's Groups
```http
GET /api/groups
Authorization: Bearer <token>
```

#### Create Group
```http
POST /api/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Study Group Alpha",
  "description": "Advanced mathematics study group",
  "settings": {
    "maxMembers": 4,
    "isPrivate": false,
    "allowInvites": true,
    "meetingDuration": 90
  }
}
```

#### Join Group
```http
POST /api/groups/64a1b2c3d4e5f6789012345/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "inviteCode": "ABC12345"
}
```

#### Get Group Members
```http
GET /api/groups/64a1b2c3d4e5f6789012345/members
Authorization: Bearer <token>
```

## Scheduling API

### Meeting Endpoints

#### Get User's Meetings
```http
GET /api/meetings
Authorization: Bearer <token>
Query Parameters:
- status: scheduled|active|completed|cancelled
- groupId: string
- startDate: ISO date string
- endDate: string
```

#### Create Meeting
```http
POST /api/meetings
Authorization: Bearer <token>
Content-Type: application/json

{
  "groupId": "64a1b2c3d4e5f6789012345",
  "title": "Calculus Review Session",
  "description": "Review of derivatives and integrals",
  "startTime": "2024-01-15T14:00:00Z",
  "duration": 120,
  "attendees": ["64a1b2c3d4e5f6789012346", "64a1b2c3d4e5f6789012347"],
  "settings": {
    "allowVideo": true,
    "allowScreenShare": true,
    "allowChat": true,
    "recordingEnabled": false
  }
}
```

#### Join Meeting
```http
POST /api/meetings/64a1b2c3d4e5f6789012345/join
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingRoom": {
      "roomId": "room_1705320000_abc123",
      "meetingId": "64a1b2c3d4e5f6789012345",
      "accessToken": "webrtc_token_123",
      "settings": {
        "allowVideo": true,
        "allowScreenShare": true,
        "allowChat": true
      }
    }
  }
}
```

## Real-time Communication API

### Chat Endpoints

#### Send Message
```http
POST /api/chat/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "meetingId": "64a1b2c3d4e5f6789012345",
  "content": "Hello everyone!",
  "type": "text"
}
```

#### Get Messages
```http
GET /api/chat/messages/64a1b2c3d4e5f6789012345
Authorization: Bearer <token>
Query Parameters:
- limit: number (default: 50)
- offset: number (default: 0)
```

### Video Call Endpoints

#### Start Video Call
```http
POST /api/calls/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "meetingId": "64a1b2c3d4e5f6789012345"
}
```

#### Join Video Call
```http
POST /api/calls/room_1705320000_abc123/join
Authorization: Bearer <token>
```

## PDF Collaboration API

### Document Endpoints

#### Upload PDF
```http
POST /api/pdf/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- file: PDF file
- groupId: string
- meetingId: string (optional)
```

#### Get PDF Pages
```http
GET /api/pdf/64a1b2c3d4e5f6789012345/pages
Authorization: Bearer <token>
Query Parameters:
- pageNumbers: "1,2,3" (comma-separated)
- includeAnnotations: boolean
```

### Annotation Endpoints

#### Add Annotation
```http
POST /api/pdf/64a1b2c3d4e5f6789012345/annotations
Authorization: Bearer <token>
Content-Type: application/json

{
  "pageNumber": 1,
  "type": "highlight",
  "content": "Important concept",
  "coordinates": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 50
  },
  "color": "#ffff00",
  "opacity": 0.5
}
```

#### Get Annotations
```http
GET /api/pdf/64a1b2c3d4e5f6789012345/annotations
Authorization: Bearer <token>
Query Parameters:
- pageNumber: number
- type: highlight|note|drawing|text
```

## AI Assistant API

### Query Endpoints

#### Process Text Query
```http
POST /api/ai/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "meetingId": "64a1b2c3d4e5f6789012345",
  "query": "What is the derivative of x^2?",
  "context": {
    "documentId": "64a1b2c3d4e5f6789012345",
    "pageNumber": 15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": {
      "_id": "64a1b2c3d4e5f6789012345",
      "query": "What is the derivative of x^2?",
      "response": "The derivative of x^2 is 2x. This follows from the power rule...",
      "confidence": 0.95,
      "sources": [
        {
          "documentId": "64a1b2c3d4e5f6789012345",
          "pageNumber": 15,
          "excerpt": "The power rule states that...",
          "relevance": 0.9
        }
      ]
    },
    "suggestions": [
      "Can you explain the chain rule?",
      "What about the product rule?",
      "Show me more examples"
    ]
  }
}
```

#### Process Voice Query
```http
POST /api/ai/voice-query
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- audio: Audio file (WAV, MP3, M4A)
- meetingId: string
```

### PDF Analysis Endpoints

#### Analyze PDF
```http
POST /api/ai/analyze-pdf
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "64a1b2c3d4e5f6789012345"
}
```

#### Generate Questions
```http
POST /api/ai/generate-questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "64a1b2c3d4e5f6789012345",
  "difficulty": "intermediate",
  "count": 5
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:5000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Chat Events
```javascript
// Send message
socket.emit('chat:message', {
  meetingId: '64a1b2c3d4e5f6789012345',
  content: 'Hello everyone!',
  type: 'text'
});

// Listen for messages
socket.on('chat:message', (message) => {
  console.log('New message:', message);
});

// Typing indicator
socket.emit('chat:typing', {
  meetingId: '64a1b2c3d4e5f6789012345',
  isTyping: true
});
```

### Video Call Events
```javascript
// Start call
socket.emit('call:start', {
  meetingId: '64a1b2c3d4e5f6789012345'
});

// WebRTC signaling
socket.emit('call:offer', {
  callId: 'room_123',
  targetUserId: 'user_456',
  offer: rtcOffer
});

socket.on('call:offer', (data) => {
  // Handle incoming offer
});
```

### PDF Collaboration Events
```javascript
// Add annotation
socket.emit('pdf:annotation:add', {
  documentId: '64a1b2c3d4e5f6789012345',
  annotation: {
    pageNumber: 1,
    type: 'highlight',
    content: 'Important',
    coordinates: { x: 100, y: 200, width: 300, height: 50 }
  }
});

// Listen for annotations
socket.on('pdf:annotation:added', (annotation) => {
  console.log('New annotation:', annotation);
});
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - AI service down |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Authentication | 5 requests/minute |
| General API | 100 requests/minute |
| AI Queries | 10 requests/minute |
| File Upload | 5 requests/minute |
| WebSocket | 1000 events/minute |

## Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-Request-ID: req_123456789
X-Response-Time: 45ms
```
