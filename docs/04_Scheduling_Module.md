# Scheduling System Module - Low-Level Design

## Overview
Handles meeting creation, calendar integration, notifications, and meeting room management.

## Class Structure (TypeScript)

```typescript
interface Meeting {
  _id: ObjectId;
  groupId: ObjectId;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  attendees: Array<{
    userId: ObjectId;
    status: 'invited' | 'accepted' | 'declined' | 'attended';
    joinedAt?: Date;
    leftAt?: Date;
  }>;
  meetingRoom: {
    roomId: string;
    password?: string;
    settings: {
      allowVideo: boolean;
      allowScreenShare: boolean;
      allowChat: boolean;
      recordingEnabled: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CreateMeetingDto {
  groupId: string;
  title: string;
  description: string;
  startTime: Date;
  duration: number;
  attendees: string[]; // user IDs
  settings: {
    allowVideo: boolean;
    allowScreenShare: boolean;
    allowChat: boolean;
    recordingEnabled: boolean;
  };
}

interface MeetingRoom {
  roomId: string;
  meetingId: string;
  participants: Array<{
    userId: string;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    joinedAt: Date;
  }>;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
}

class SchedulingService {
  async createMeeting(groupId: string, meetingData: CreateMeetingDto, creatorId: string): Promise<Meeting>;
  async updateMeeting(meetingId: string, updates: UpdateMeetingDto, userId: string): Promise<Meeting>;
  async cancelMeeting(meetingId: string, userId: string): Promise<boolean>;
  async joinMeeting(meetingId: string, userId: string): Promise<MeetingRoom>;
  async leaveMeeting(meetingId: string, userId: string): Promise<boolean>;
  async getUpcomingMeetings(userId: string): Promise<Meeting[]>;
  async getMeetingHistory(groupId: string): Promise<Meeting[]>;
  async respondToInvitation(meetingId: string, userId: string, response: 'accepted' | 'declined'): Promise<boolean>;
  async startMeeting(meetingId: string, userId: string): Promise<MeetingRoom>;
  async endMeeting(meetingId: string, userId: string): Promise<boolean>;
}
```

## Database Schema (MongoDB)

```javascript
// Meetings Collection
{
  _id: ObjectId,
  groupId: ObjectId (ref: 'StudyGroups', required),
  title: String (required),
  description: String,
  startTime: Date (required, indexed),
  endTime: Date (required),
  duration: Number (required), // minutes
  status: String (enum: ['scheduled', 'active', 'completed', 'cancelled']),
  attendees: [{
    userId: ObjectId (ref: 'Users'),
    status: String (enum: ['invited', 'accepted', 'declined', 'attended']),
    joinedAt: Date,
    leftAt: Date
  }],
  meetingRoom: {
    roomId: String (unique, indexed),
    password: String,
    settings: {
      allowVideo: Boolean,
      allowScreenShare: Boolean,
      allowChat: Boolean,
      recordingEnabled: Boolean
    }
  },
  createdBy: ObjectId (ref: 'Users'),
  createdAt: Date,
  updatedAt: Date
}

// Meeting Rooms Collection (Redis)
{
  roomId: String,
  meetingId: ObjectId,
  participants: [{
    userId: ObjectId,
    isVideoEnabled: Boolean,
    isAudioEnabled: Boolean,
    joinedAt: Date
  }],
  isActive: Boolean,
  startedAt: Date,
  endedAt: Date
}
```

## API Endpoints

### Meeting Management
```typescript
// Get User's Meetings
GET /api/meetings
Headers: { Authorization: "Bearer <token>" }
Query: { 
  status?: string;
  groupId?: string;
  startDate?: string;
  endDate?: string;
}
Response: {
  meetings: Meeting[];
}

// Create Meeting
POST /api/meetings
Headers: { Authorization: "Bearer <token>" }
Request: {
  groupId: string;
  title: string;
  description: string;
  startTime: string; // ISO date string
  duration: number;
  attendees: string[];
  settings: {
    allowVideo: boolean;
    allowScreenShare: boolean;
    allowChat: boolean;
    recordingEnabled: boolean;
  };
}
Response: {
  meeting: Meeting;
}

// Get Meeting Details
GET /api/meetings/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  meeting: Meeting;
}

// Update Meeting
PUT /api/meetings/:id
Headers: { Authorization: "Bearer <token>" }
Request: {
  title?: string;
  description?: string;
  startTime?: string;
  duration?: number;
  attendees?: string[];
  settings?: {
    allowVideo?: boolean;
    allowScreenShare?: boolean;
    allowChat?: boolean;
    recordingEnabled?: boolean;
  };
}
Response: {
  meeting: Meeting;
}

// Cancel Meeting
DELETE /api/meetings/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}
```

### Meeting Room Management
```typescript
// Join Meeting
POST /api/meetings/:id/join
Headers: { Authorization: "Bearer <token>" }
Response: {
  meetingRoom: MeetingRoom;
  accessToken: string; // For WebRTC
}

// Leave Meeting
POST /api/meetings/:id/leave
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Start Meeting (Host only)
POST /api/meetings/:id/start
Headers: { Authorization: "Bearer <token>" }
Response: {
  meetingRoom: MeetingRoom;
}

// End Meeting (Host only)
POST /api/meetings/:id/end
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Respond to Invitation
POST /api/meetings/:id/respond
Headers: { Authorization: "Bearer <token>" }
Request: {
  response: 'accepted' | 'declined';
}
Response: {
  message: string;
}
```

### Calendar Integration
```typescript
// Get Upcoming Meetings
GET /api/meetings/upcoming
Headers: { Authorization: "Bearer <token>" }
Query: { 
  days?: number; // default 7
}
Response: {
  meetings: Meeting[];
}

// Get Meeting History
GET /api/meetings/history/:groupId
Headers: { Authorization: "Bearer <token>" }
Query: { 
  limit?: number;
  offset?: number;
}
Response: {
  meetings: Meeting[];
  total: number;
}

// Export to Calendar
GET /api/meetings/:id/calendar
Headers: { Authorization: "Bearer <token>" }
Response: {
  ics: string; // iCalendar format
}
```

## Real-time Events (Socket.io)

```typescript
// Meeting Events
socket.emit('meeting:created', { meeting, groupId });
socket.emit('meeting:updated', { meetingId, updates });
socket.emit('meeting:cancelled', { meetingId, reason });

// Meeting Room Events
socket.emit('meeting:room:joined', { meetingId, userId, roomId });
socket.emit('meeting:room:left', { meetingId, userId });
socket.emit('meeting:room:started', { meetingId, roomId });
socket.emit('meeting:room:ended', { meetingId, roomId });

// Invitation Events
socket.emit('meeting:invitation:sent', { meetingId, attendees });
socket.emit('meeting:invitation:accepted', { meetingId, userId });
socket.emit('meeting:invitation:declined', { meetingId, userId });

// Listeners
socket.on('meeting:reminder', (meeting) => { 
  // Handle meeting reminder
});
socket.on('meeting:starting', (meeting) => { 
  // Handle meeting starting notification
});
```

## Implementation Notes

### Meeting Room ID Generation
```typescript
// Generate unique meeting room ID
const generateRoomId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `room_${timestamp}_${random}`;
};

// Validate meeting room access
const validateRoomAccess = async (roomId: string, userId: string): Promise<boolean> => {
  const meeting = await Meeting.findOne({ 
    'meetingRoom.roomId': roomId,
    'attendees.userId': userId,
    status: { $in: ['scheduled', 'active'] }
  });
  return !!meeting;
};
```

### Notification System Integration
```typescript
// Meeting reminder service
class MeetingReminderService {
  async scheduleReminder(meeting: Meeting): Promise<void> {
    const reminderTime = new Date(meeting.startTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    
    // Schedule notification
    await NotificationService.schedule({
      type: 'meeting_reminder',
      userId: meeting.attendees.map(a => a.userId),
      data: {
        meetingId: meeting._id,
        title: meeting.title,
        startTime: meeting.startTime
      },
      scheduledFor: reminderTime
    });
  }
}
```

### Calendar Integration
```typescript
// iCalendar generation
const generateICS = (meeting: Meeting): string => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Study Group App//EN',
    'BEGIN:VEVENT',
    `UID:${meeting._id}@studygroup.app`,
    `DTSTART:${formatDate(meeting.startTime)}`,
    `DTEND:${formatDate(meeting.endTime)}`,
    `SUMMARY:${meeting.title}`,
    `DESCRIPTION:${meeting.description}`,
    `LOCATION:${meeting.meetingRoom.roomId}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return ics;
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
  "error": "Invalid meeting time",
  "message": "Meeting time must be in the future"
}

{
  "error": "Meeting conflict",
  "message": "You have a conflicting meeting at this time"
}

{
  "error": "Meeting room full",
  "message": "Maximum participants reached"
}
```

### Testing Strategy
- Unit tests for SchedulingService methods
- Integration tests for API endpoints
- Meeting room access validation testing
- Calendar integration testing
- Real-time event testing
- Notification scheduling testing
