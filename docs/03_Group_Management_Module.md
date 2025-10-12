# Group Management Module - Low-Level Design

## Overview
Handles study group creation, membership management, roles, and group settings.

## Class Structure (TypeScript)

```typescript
interface StudyGroup {
  _id: ObjectId;
  name: string;
  description: string;
  ownerId: ObjectId;
  members: Array<{
    userId: ObjectId;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
    permissions: string[];
  }>;
  settings: {
    maxMembers: number;
    isPrivate: boolean;
    allowInvites: boolean;
    meetingDuration: number;
  };
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateGroupDto {
  name: string;
  description: string;
  settings: {
    maxMembers: number;
    isPrivate: boolean;
    allowInvites: boolean;
    meetingDuration: number;
  };
}

interface GroupMember {
  userId: ObjectId;
  user: {
    username: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  role: string;
  joinedAt: Date;
  permissions: string[];
}

class GroupService {
  async createGroup(ownerId: string, groupData: CreateGroupDto): Promise<StudyGroup>;
  async joinGroup(userId: string, groupId: string, inviteCode?: string): Promise<StudyGroup>;
  async leaveGroup(userId: string, groupId: string): Promise<boolean>;
  async updateGroupSettings(groupId: string, settings: GroupSettings, userId: string): Promise<StudyGroup>;
  async getGroupMembers(groupId: string): Promise<GroupMember[]>;
  async removeMember(groupId: string, memberId: string, adminId: string): Promise<boolean>;
  async updateMemberRole(groupId: string, memberId: string, role: string, adminId: string): Promise<boolean>;
  async generateInviteCode(groupId: string, userId: string): Promise<string>;
  async getGroupById(groupId: string): Promise<StudyGroup>;
  async getUserGroups(userId: string): Promise<StudyGroup[]>;
}
```

## Database Schema (MongoDB)

```javascript
// StudyGroups Collection
{
  _id: ObjectId,
  name: String (required),
  description: String,
  ownerId: ObjectId (ref: 'Users', required),
  members: [{
    userId: ObjectId (ref: 'Users'),
    role: String (enum: ['owner', 'admin', 'member']),
    joinedAt: Date,
    permissions: [String]
  }],
  settings: {
    maxMembers: Number (default: 4),
    isPrivate: Boolean (default: false),
    allowInvites: Boolean (default: true),
    meetingDuration: Number (default: 60) // minutes
  },
  inviteCode: String (unique, indexed),
  createdAt: Date,
  updatedAt: Date
}

// Group Invitations Collection
{
  _id: ObjectId,
  groupId: ObjectId (ref: 'StudyGroups'),
  invitedBy: ObjectId (ref: 'Users'),
  invitedUser: ObjectId (ref: 'Users'),
  status: String (enum: ['pending', 'accepted', 'declined']),
  expiresAt: Date,
  createdAt: Date
}
```

## API Endpoints

### Group Management
```typescript
// Get User's Groups
GET /api/groups
Headers: { Authorization: "Bearer <token>" }
Response: {
  groups: StudyGroup[];
}

// Create New Group
POST /api/groups
Headers: { Authorization: "Bearer <token>" }
Request: {
  name: string;
  description: string;
  settings: {
    maxMembers: number;
    isPrivate: boolean;
    allowInvites: boolean;
    meetingDuration: number;
  };
}
Response: {
  group: StudyGroup;
}

// Get Group Details
GET /api/groups/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  group: StudyGroup;
}

// Update Group Settings
PUT /api/groups/:id
Headers: { Authorization: "Bearer <token>" }
Request: {
  name?: string;
  description?: string;
  settings?: {
    maxMembers?: number;
    isPrivate?: boolean;
    allowInvites?: boolean;
    meetingDuration?: number;
  };
}
Response: {
  group: StudyGroup;
}

// Delete Group
DELETE /api/groups/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}
```

### Membership Management
```typescript
// Join Group
POST /api/groups/:id/join
Headers: { Authorization: "Bearer <token>" }
Request: {
  inviteCode?: string;
}
Response: {
  group: StudyGroup;
  message: string;
}

// Leave Group
POST /api/groups/:id/leave
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Get Group Members
GET /api/groups/:id/members
Headers: { Authorization: "Bearer <token>" }
Response: {
  members: GroupMember[];
}

// Remove Member
POST /api/groups/:id/members/:memberId/remove
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Update Member Role
PUT /api/groups/:id/members/:memberId/role
Headers: { Authorization: "Bearer <token>" }
Request: {
  role: string;
}
Response: {
  message: string;
}

// Generate Invite Code
POST /api/groups/:id/invite-code
Headers: { Authorization: "Bearer <token>" }
Response: {
  inviteCode: string;
  expiresAt: Date;
}
```

## Real-time Events (Socket.io)

```typescript
// Group Events
socket.emit('group:created', { groupId, group });
socket.emit('group:updated', { groupId, updates });
socket.emit('group:deleted', { groupId });

// Membership Events
socket.emit('group:member:joined', { groupId, member });
socket.emit('group:member:left', { groupId, userId });
socket.emit('group:member:role:updated', { groupId, memberId, newRole });
socket.emit('group:member:removed', { groupId, memberId });

// Invitation Events
socket.emit('group:invite:sent', { groupId, invitedUser });
socket.emit('group:invite:accepted', { groupId, userId });
socket.emit('group:invite:declined', { groupId, userId });

// Listeners
socket.on('group:member:joined', (data) => { 
  // Handle new member notification
});
socket.on('group:settings:updated', (data) => { 
  // Handle group settings update
});
```

## Implementation Notes

### Permission System
```typescript
interface GroupPermissions {
  owner: ['manage_group', 'manage_members', 'manage_meetings', 'manage_files'];
  admin: ['manage_members', 'manage_meetings', 'manage_files'];
  member: ['view_group', 'join_meetings', 'upload_files'];
}

// Permission checking middleware
const checkGroupPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    const userRole = await GroupService.getUserRole(groupId, userId);
    const permissions = GroupPermissions[userRole];
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

### Invite Code Generation
```typescript
// Generate unique invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validate invite code
const validateInviteCode = async (code: string, groupId: string): Promise<boolean> => {
  const group = await StudyGroup.findOne({ 
    _id: groupId, 
    inviteCode: code,
    'settings.allowInvites': true 
  });
  return !!group;
};
```

### Error Handling
```typescript
// Common Error Responses
{
  "error": "Group not found",
  "message": "Study group does not exist"
}

{
  "error": "Insufficient permissions",
  "message": "You don't have permission to perform this action"
}

{
  "error": "Group full",
  "message": "Maximum number of members reached"
}

{
  "error": "Invalid invite code",
  "message": "The provided invite code is invalid or expired"
}
```

### Testing Strategy
- Unit tests for GroupService methods
- Integration tests for API endpoints
- Permission system testing
- Invite code validation testing
- Real-time event testing
