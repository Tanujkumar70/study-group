# User Management Module - Low-Level Design

## Overview
Handles user authentication, authorization, profile management, and user preferences.

## Class Structure (TypeScript)

```typescript
interface User {
  _id: ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    timezone: string;
  };
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
  };
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
}

interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone: string;
}

interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

class UserService {
  async createUser(userData: CreateUserDto): Promise<User>;
  async authenticateUser(email: string, password: string): Promise<AuthResult>;
  async refreshToken(refreshToken: string): Promise<AuthResult>;
  async updateProfile(userId: string, updates: Partial<User>): Promise<User>;
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
  async deactivateUser(userId: string): Promise<boolean>;
  async getUserById(userId: string): Promise<User>;
  async getUserByEmail(email: string): Promise<User>;
}
```

## Database Schema (MongoDB)

```javascript
// Users Collection
{
  _id: ObjectId,
  email: String (unique, indexed),
  username: String (unique, indexed),
  passwordHash: String,
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    timezone: String
  },
  preferences: {
    notifications: Boolean,
    theme: String,
    language: String
  },
  createdAt: Date,
  lastLogin: Date,
  isActive: Boolean
}

// Sessions Collection (Redis)
{
  sessionId: String,
  userId: String,
  expiresAt: Date,
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String
  }
}
```

## API Endpoints

### Authentication
```typescript
// User Registration
POST /api/auth/register
Request: {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone: string;
}
Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// User Login
POST /api/auth/login
Request: {
  email: string;
  password: string;
}
Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Token Refresh
POST /api/auth/refresh
Request: {
  refreshToken: string;
}
Response: {
  accessToken: string;
  refreshToken: string;
}

// Logout
POST /api/auth/logout
Request: {
  refreshToken: string;
}
Response: {
  message: string;
}

// Password Reset
POST /api/auth/forgot-password
Request: {
  email: string;
}
Response: {
  message: string;
}

POST /api/auth/reset-password
Request: {
  token: string;
  newPassword: string;
}
Response: {
  message: string;
}
```

### User Management
```typescript
// Get User Profile
GET /api/users/profile
Headers: { Authorization: "Bearer <token>" }
Response: {
  user: User;
}

// Update User Profile
PUT /api/users/profile
Headers: { Authorization: "Bearer <token>" }
Request: {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone?: string;
  preferences?: {
    notifications?: boolean;
    theme?: string;
    language?: string;
  };
}
Response: {
  user: User;
}

// Change Password
PUT /api/users/password
Headers: { Authorization: "Bearer <token>" }
Request: {
  currentPassword: string;
  newPassword: string;
}
Response: {
  message: string;
}

// Deactivate Account
DELETE /api/users/account
Headers: { Authorization: "Bearer <token>" }
Request: {
  password: string;
}
Response: {
  message: string;
}
```

## Real-time Events (Socket.io)

```typescript
// User Status Events
socket.emit('user:online', { userId, timestamp });
socket.emit('user:offline', { userId, timestamp });
socket.on('user:status', (status) => { 
  // Handle user status updates
});

// Profile Update Events
socket.emit('user:profile:update', { userId, updates });
socket.on('user:profile:updated', (user) => { 
  // Handle profile updates
});
```

## Implementation Notes

### Security Considerations
- Password hashing using bcrypt with salt rounds of 12
- JWT tokens with 15-minute expiration for access tokens
- Refresh tokens with 7-day expiration
- Rate limiting on authentication endpoints
- Input validation and sanitization

### Key Libraries
```typescript
// Backend Dependencies
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Schema, model } from 'mongoose';
import { Request, Response } from 'express';

// Frontend Dependencies
import axios from 'axios';
import { io } from 'socket.io-client';
```

### Error Handling
```typescript
// Common Error Responses
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}

{
  "error": "Authentication failed",
  "message": "Invalid credentials"
}

{
  "error": "User not found",
  "message": "User with this email does not exist"
}
```

### Testing Strategy
- Unit tests for UserService methods
- Integration tests for API endpoints
- Authentication flow testing
- Password security testing
- Session management testing
