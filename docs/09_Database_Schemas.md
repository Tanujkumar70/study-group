# Database Schemas - Study Group Application

## MongoDB Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  username: String (unique, indexed),
  passwordHash: String (required),
  profile: {
    firstName: String (required),
    lastName: String (required),
    avatar: String,
    timezone: String (default: "UTC")
  },
  preferences: {
    notifications: Boolean (default: true),
    theme: String (enum: ["light", "dark"], default: "light"),
    language: String (default: "en")
  },
  createdAt: Date (required, indexed),
  lastLogin: Date,
  isActive: Boolean (default: true),
  emailVerified: Boolean (default: false),
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}

// Indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "createdAt": 1 })
db.users.createIndex({ "isActive": 1 })
```

### StudyGroups Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  ownerId: ObjectId (ref: 'Users', required, indexed),
  members: [{
    userId: ObjectId (ref: 'Users', required),
    role: String (enum: ["owner", "admin", "member"], required),
    joinedAt: Date (required),
    permissions: [String] (default: ["view_group", "join_meetings"])
  }],
  settings: {
    maxMembers: Number (default: 4, max: 10),
    isPrivate: Boolean (default: false),
    allowInvites: Boolean (default: true),
    meetingDuration: Number (default: 60) // minutes
  },
  inviteCode: String (unique, indexed),
  createdAt: Date (required, indexed),
  updatedAt: Date (required),
  isActive: Boolean (default: true)
}

// Indexes
db.studygroups.createIndex({ "ownerId": 1 })
db.studygroups.createIndex({ "members.userId": 1 })
db.studygroups.createIndex({ "inviteCode": 1 }, { unique: true })
db.studygroups.createIndex({ "createdAt": 1 })
db.studygroups.createIndex({ "isActive": 1 })
```

### Meetings Collection
```javascript
{
  _id: ObjectId,
  groupId: ObjectId (ref: 'StudyGroups', required, indexed),
  title: String (required),
  description: String,
  startTime: Date (required, indexed),
  endTime: Date (required),
  duration: Number (required), // minutes
  status: String (enum: ["scheduled", "active", "completed", "cancelled"], default: "scheduled", indexed),
  attendees: [{
    userId: ObjectId (ref: 'Users', required),
    status: String (enum: ["invited", "accepted", "declined", "attended"], default: "invited"),
    joinedAt: Date,
    leftAt: Date
  }],
  meetingRoom: {
    roomId: String (unique, indexed),
    password: String,
    settings: {
      allowVideo: Boolean (default: true),
      allowScreenShare: Boolean (default: true),
      allowChat: Boolean (default: true),
      recordingEnabled: Boolean (default: false)
    }
  },
  createdBy: ObjectId (ref: 'Users', required),
  createdAt: Date (required, indexed),
  updatedAt: Date (required)
}

// Indexes
db.meetings.createIndex({ "groupId": 1 })
db.meetings.createIndex({ "startTime": 1 })
db.meetings.createIndex({ "status": 1 })
db.meetings.createIndex({ "attendees.userId": 1 })
db.meetings.createIndex({ "meetingRoom.roomId": 1 }, { unique: true })
db.meetings.createIndex({ "createdAt": 1 })
```

### ChatMessages Collection
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId (ref: 'Meetings', required, indexed),
  senderId: ObjectId (ref: 'Users', required),
  content: String (required),
  type: String (enum: ["text", "file", "system", "announcement"], default: "text"),
  timestamp: Date (required, indexed),
  editedAt: Date,
  replyTo: ObjectId (ref: 'ChatMessages'),
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }],
  isDeleted: Boolean (default: false),
  reactions: [{
    userId: ObjectId (ref: 'Users'),
    emoji: String,
    timestamp: Date
  }]
}

// Indexes
db.chatmessages.createIndex({ "meetingId": 1, "timestamp": 1 })
db.chatmessages.createIndex({ "senderId": 1 })
db.chatmessages.createIndex({ "type": 1 })
db.chatmessages.createIndex({ "isDeleted": 1 })
```

### PDFDocuments Collection
```javascript
{
  _id: ObjectId,
  groupId: ObjectId (ref: 'StudyGroups', required, indexed),
  meetingId: ObjectId (ref: 'Meetings'),
  filename: String (required),
  originalName: String (required),
  fileSize: Number (required),
  pageCount: Number (required),
  uploadedBy: ObjectId (ref: 'Users', required),
  uploadedAt: Date (required, indexed),
  version: Number (default: 1),
  isActive: Boolean (default: true),
  metadata: {
    title: String,
    author: String,
    subject: String,
    keywords: [String],
    creationDate: Date,
    modificationDate: Date
  },
  permissions: {
    canView: [ObjectId (ref: 'Users')],
    canAnnotate: [ObjectId (ref: 'Users')],
    canEdit: [ObjectId (ref: 'Users')]
  },
  gridFSId: ObjectId (ref: 'fs.files'),
  thumbnailUrl: String,
  processingStatus: String (enum: ["pending", "processing", "completed", "failed"], default: "pending")
}

// Indexes
db.pdfdocuments.createIndex({ "groupId": 1 })
db.pdfdocuments.createIndex({ "meetingId": 1 })
db.pdfdocuments.createIndex({ "uploadedBy": 1 })
db.pdfdocuments.createIndex({ "uploadedAt": 1 })
db.pdfdocuments.createIndex({ "isActive": 1 })
db.pdfdocuments.createIndex({ "processingStatus": 1 })
```

### PDFAnnotations Collection
```javascript
{
  _id: ObjectId,
  documentId: ObjectId (ref: 'PDFDocuments', required, indexed),
  pageNumber: Number (required, indexed),
  type: String (enum: ["highlight", "note", "drawing", "text", "arrow", "rectangle"], required),
  content: String,
  coordinates: {
    x: Number (required),
    y: Number (required),
    width: Number (required),
    height: Number (required)
  },
  authorId: ObjectId (ref: 'Users', required, indexed),
  createdAt: Date (required, indexed),
  updatedAt: Date (required),
  isVisible: Boolean (default: true),
  color: String (default: "#ffff00"),
  opacity: Number (default: 0.5),
  style: {
    strokeWidth: Number,
    fontSize: Number,
    fontFamily: String,
    fontWeight: String
  },
  version: Number (default: 1),
  isDeleted: Boolean (default: false),
  replies: [{
    authorId: ObjectId (ref: 'Users'),
    content: String,
    createdAt: Date
  }]
}

// Indexes
db.pdfannotations.createIndex({ "documentId": 1, "pageNumber": 1 })
db.pdfannotations.createIndex({ "authorId": 1 })
db.pdfannotations.createIndex({ "createdAt": 1 })
db.pdfannotations.createIndex({ "isDeleted": 1 })
db.pdfannotations.createIndex({ "type": 1 })
```

### AIQueries Collection
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId (ref: 'Meetings', required, indexed),
  userId: ObjectId (ref: 'Users', required, indexed),
  query: String (required),
  response: String (required),
  context: {
    documentId: ObjectId (ref: 'PDFDocuments'),
    pageNumber: Number,
    section: String,
    meetingContext: String
  },
  timestamp: Date (required, indexed),
  type: String (enum: ["text", "voice"], default: "text"),
  confidence: Number (0-1),
  sources: [{
    documentId: ObjectId (ref: 'PDFDocuments'),
    pageNumber: Number,
    excerpt: String,
    relevance: Number (0-1)
  }],
  isHelpful: Boolean,
  feedback: String,
  processingTime: Number, // milliseconds
  tokensUsed: Number
}

// Indexes
db.aiqueries.createIndex({ "meetingId": 1, "timestamp": 1 })
db.aiqueries.createIndex({ "userId": 1 })
db.aiqueries.createIndex({ "timestamp": 1 })
db.aiqueries.createIndex({ "type": 1 })
db.aiqueries.createIndex({ "isHelpful": 1 })
```

### PDFAnalyses Collection
```javascript
{
  _id: ObjectId,
  documentId: ObjectId (ref: 'PDFDocuments', required, indexed),
  analysis: {
    summary: String,
    keyPoints: [String],
    topics: [String],
    questions: [String],
    difficulty: String (enum: ["beginner", "intermediate", "advanced"]),
    estimatedReadingTime: Number, // minutes
    complexity: Number (1-10)
  },
  createdAt: Date (required, indexed),
  updatedAt: Date (required),
  version: Number (default: 1),
  processingStatus: String (enum: ["pending", "processing", "completed", "failed"]),
  aiModel: String (default: "gpt-4"),
  tokensUsed: Number
}

// Indexes
db.pdfanalyses.createIndex({ "documentId": 1 }, { unique: true })
db.pdfanalyses.createIndex({ "createdAt": 1 })
db.pdfanalyses.createIndex({ "processingStatus": 1 })
```

### DocumentEmbeddings Collection
```javascript
{
  _id: ObjectId,
  documentId: ObjectId (ref: 'PDFDocuments', required, indexed),
  pageNumber: Number (required, indexed),
  content: String (required),
  embedding: [Number] (required, indexed), // Vector embedding
  metadata: {
    section: String,
    wordCount: Number,
    topics: [String],
    language: String (default: "en")
  },
  createdAt: Date (required, indexed),
  version: Number (default: 1)
}

// Indexes
db.documentembeddings.createIndex({ "documentId": 1, "pageNumber": 1 })
db.documentembeddings.createIndex({ "embedding": "2dsphere" }) // For vector search
db.documentembeddings.createIndex({ "createdAt": 1 })
```

### Notifications Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'Users', required, indexed),
  type: String (enum: ["meeting_reminder", "meeting_starting", "new_message", "group_invite", "ai_response"], required),
  title: String (required),
  message: String (required),
  data: {
    meetingId: ObjectId (ref: 'Meetings'),
    groupId: ObjectId (ref: 'StudyGroups'),
    messageId: ObjectId (ref: 'ChatMessages'),
    // ... other relevant data
  },
  isRead: Boolean (default: false, indexed),
  createdAt: Date (required, indexed),
  scheduledFor: Date, // For scheduled notifications
  expiresAt: Date
}

// Indexes
db.notifications.createIndex({ "userId": 1, "isRead": 1 })
db.notifications.createIndex({ "createdAt": 1 })
db.notifications.createIndex({ "scheduledFor": 1 })
db.notifications.createIndex({ "type": 1 })
```

## Redis Data Structures

### Session Management
```javascript
// User sessions
Key: "session:{sessionId}"
Value: {
  userId: String,
  email: String,
  username: String,
  loginTime: Number,
  lastActivity: Number,
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String
  }
}
TTL: 7 days

// Active meetings
Key: "meeting:{meetingId}"
Value: {
  roomId: String,
  participants: [String], // userIds
  startedAt: Number,
  settings: Object
}
TTL: 24 hours
```

### Real-time Data
```javascript
// Online users
Key: "online_users"
Type: Set
Members: [userId1, userId2, ...]

// Meeting participants
Key: "meeting:{meetingId}:participants"
Type: Set
Members: [userId1, userId2, ...]

// Chat typing indicators
Key: "chat:{meetingId}:typing"
Type: Hash
Fields: {
  [userId]: timestamp
}
TTL: 30 seconds
```

### Caching
```javascript
// User profile cache
Key: "user:{userId}:profile"
Value: {
  username: String,
  firstName: String,
  lastName: String,
  avatar: String
}
TTL: 1 hour

// Group members cache
Key: "group:{groupId}:members"
Value: [{
  userId: String,
  username: String,
  role: String,
  joinedAt: String
}]
TTL: 30 minutes

// PDF thumbnails
Key: "pdf:{documentId}:thumbnail:{pageNumber}"
Value: base64_encoded_image
TTL: 24 hours
```

## GridFS Collections

### Files Collection (fs.files)
```javascript
{
  _id: ObjectId,
  filename: String,
  contentType: String,
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  metadata: {
    originalName: String,
    uploadedBy: ObjectId (ref: 'Users'),
    groupId: ObjectId (ref: 'StudyGroups'),
    meetingId: ObjectId (ref: 'Meetings'),
    fileType: String, // "pdf", "image", "document"
    processingStatus: String
  }
}
```

### Chunks Collection (fs.chunks)
```javascript
{
  _id: ObjectId,
  files_id: ObjectId (ref: 'fs.files'),
  n: Number, // chunk number
  data: BinData // file chunk data
}
```

## Database Indexes Summary

### Performance Indexes
```javascript
// Compound indexes for common queries
db.meetings.createIndex({ "groupId": 1, "startTime": 1 })
db.chatmessages.createIndex({ "meetingId": 1, "timestamp": -1 })
db.pdfannotations.createIndex({ "documentId": 1, "pageNumber": 1, "createdAt": 1 })
db.aiqueries.createIndex({ "meetingId": 1, "userId": 1, "timestamp": -1 })

// Text search indexes
db.pdfdocuments.createIndex({ "metadata.title": "text", "metadata.keywords": "text" })
db.chatmessages.createIndex({ "content": "text" })

// TTL indexes for automatic cleanup
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.notifications.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

### Security Indexes
```javascript
// Unique constraints
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.studygroups.createIndex({ "inviteCode": 1 }, { unique: true })
db.meetings.createIndex({ "meetingRoom.roomId": 1 }, { unique: true })
```

## Data Validation Rules

### User Validation
```javascript
// Email validation
email: {
  type: String,
  required: true,
  unique: true,
  match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}

// Password validation
passwordHash: {
  type: String,
  required: true,
  minlength: 8
}
```

### Meeting Validation
```javascript
// Start time validation
startTime: {
  type: Date,
  required: true,
  validate: {
    validator: function(value) {
      return value > new Date();
    },
    message: 'Meeting must be scheduled in the future'
  }
}

// Duration validation
duration: {
  type: Number,
  required: true,
  min: 15,
  max: 480 // 8 hours
}
```

### PDF Validation
```javascript
// File size validation
fileSize: {
  type: Number,
  required: true,
  max: 50 * 1024 * 1024 // 50MB
}

// Page count validation
pageCount: {
  type: Number,
  required: true,
  min: 1,
  max: 1000
}
```

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profile: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: null
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  createdAt: {
    type: Date,
    required: true,
    index: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ createdAt: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'profile.timezone': 1 }); // Optional, remove if not needed

module.exports = mongoose.model('User', userSchema);

