# Implementation Guide - Study Group Application

## Project Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB 6.0+
- Redis 6.0+
- Git

### Environment Setup

#### 1. Clone and Initialize Project
```bash
# Create project directory
mkdir study-group-app
cd study-group-app

# Initialize git repository
git init

# Create backend directory
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express socket.io mongoose redis jsonwebtoken bcryptjs multer sharp cors helmet morgan
npm install -D jest supertest nodemon typescript @types/node @types/express @types/socket.io

# Create frontend directory
cd ..
mkdir frontend
cd frontend

# Initialize React app
npx create-react-app . --template typescript
npm install socket.io-client webrtc pdfjs-dist yjs @mui/material @emotion/react @emotion/styled
npm install -D @types/socket.io-client
```

#### 2. Environment Configuration
Create `.env` files for different environments:

**Backend .env:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/studygroup
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

**Frontend .env:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

### Project Structure
```
study-group-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── groupController.ts
│   │   │   ├── meetingController.ts
│   │   │   ├── chatController.ts
│   │   │   ├── pdfController.ts
│   │   │   └── aiController.ts
│   │   ├── services/
│   │   │   ├── userService.ts
│   │   │   ├── groupService.ts
│   │   │   ├── meetingService.ts
│   │   │   ├── chatService.ts
│   │   │   ├── pdfService.ts
│   │   │   ├── aiService.ts
│   │   │   └── notificationService.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── StudyGroup.ts
│   │   │   ├── Meeting.ts
│   │   │   ├── ChatMessage.ts
│   │   │   ├── PDFDocument.ts
│   │   │   ├── PDFAnnotation.ts
│   │   │   └── AIQuery.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── rateLimiting.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── groups.ts
│   │   │   ├── meetings.ts
│   │   │   ├── chat.ts
│   │   │   ├── pdf.ts
│   │   │   └── ai.ts
│   │   ├── utils/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── encryption.ts
│   │   │   └── fileUpload.ts
│   │   ├── socket/
│   │   │   ├── chatSocket.ts
│   │   │   ├── videoSocket.ts
│   │   │   └── pdfSocket.ts
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── groups/
│   │   │   ├── meetings/
│   │   │   ├── chat/
│   │   │   ├── pdf/
│   │   │   └── ai/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Group.tsx
│   │   │   ├── Meeting.tsx
│   │   │   └── PDFViewer.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── socket.ts
│   │   │   └── webrtc.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   └── useWebRTC.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── validation.ts
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── group.ts
│   │   │   ├── meeting.ts
│   │   │   └── pdf.ts
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── .env
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## Backend Implementation

### 1. Database Connection Setup

**src/utils/database.ts:**
```typescript
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
```

**src/utils/redis.ts:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export default redis;
```

### 2. Authentication Middleware

**src/middleware/auth.ts:**
```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user as any;
    next();
  });
};
```

### 3. User Model

**src/models/User.ts:**
```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
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
  lastLogin?: Date;
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: String,
    timezone: { type: String, default: 'UTC' }
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, default: 'en' }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<IUser>('User', userSchema);
```

### 4. Express App Setup

**src/app.ts:**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './utils/database';
import redis from './utils/redis';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import meetingRoutes from './routes/meetings';
import chatRoutes from './routes/chat';
import pdfRoutes from './routes/pdf';
import aiRoutes from './routes/ai';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/ai', aiRoutes);

// Socket.io setup
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT token
  next();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
```

## Frontend Implementation

### 1. API Service Setup

**src/services/api.ts:**
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          return api.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Socket Service

**src/services/socket.ts:**
```typescript
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();
```

### 3. Authentication Hook

**src/hooks/useAuth.ts:**
```typescript
import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

interface User {
  _id: string;
  email: string;
  username: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Verify token and get user data
      api.get('/users/profile')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser(response.data.user);
  };

  const register = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: studygroup-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    networks:
      - studygroup-network

  redis:
    image: redis:6.0-alpine
    container_name: studygroup-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - studygroup-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: studygroup-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/studygroup?authSource=admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-production-jwt-secret
      - CLIENT_URL=http://localhost:3000
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - studygroup-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: studygroup-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
      - REACT_APP_WS_URL=http://localhost:5000
    depends_on:
      - backend
    networks:
      - studygroup-network

volumes:
  mongodb_data:
  redis_data:

networks:
  studygroup-network:
    driver: bridge
```

### Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

## Testing Setup

### Backend Testing
```bash
# Install testing dependencies
npm install -D jest supertest @types/jest

# Create test configuration
# jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};
```

### Frontend Testing
```bash
# Install testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Create test setup
# src/setupTests.ts
import '@testing-library/jest-dom';
```

## Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-mongodb-connection-string
REDIS_URL=redis://your-redis-connection-string
JWT_SECRET=your-production-secret-key
CLIENT_URL=https://your-domain.com
OPENAI_API_KEY=your-openai-api-key
```

### Deployment Commands
```bash
# Build and start with Docker
docker-compose up -d

# Run migrations
npm run migrate

# Start production server
npm start
```

## Development Workflow

### 1. Start Development Environment
```bash
# Start databases
docker-compose up mongodb redis -d

# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm start
```

### 2. Code Quality Tools
```bash
# Install linting and formatting
npm install -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Add to package.json scripts
"lint": "eslint src --ext .ts,.tsx",
"lint:fix": "eslint src --ext .ts,.tsx --fix",
"format": "prettier --write src/**/*.{ts,tsx,json,css,md}"
```

### 3. Git Hooks
```bash
# Install husky for git hooks
npm install -D husky lint-staged

# Add to package.json
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"
  }
},
"lint-staged": {
  "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

This implementation guide provides a complete foundation for building the Study Group application with proper structure, testing, and deployment considerations.
