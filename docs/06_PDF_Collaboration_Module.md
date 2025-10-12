# PDF Collaboration Module - Low-Level Design

## Overview
Handles PDF upload, rendering, collaborative annotations, and real-time synchronization using Yjs.

## Class Structure (TypeScript)

```typescript
interface PDFDocument {
  _id: ObjectId;
  groupId: ObjectId;
  meetingId?: ObjectId;
  filename: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  uploadedBy: ObjectId;
  uploadedAt: Date;
  version: number;
  isActive: boolean;
  metadata: {
    title: string;
    author: string;
    subject: string;
    keywords: string[];
  };
  permissions: {
    canView: ObjectId[];
    canAnnotate: ObjectId[];
    canEdit: ObjectId[];
  };
}

interface PDFAnnotation {
  _id: ObjectId;
  documentId: ObjectId;
  pageNumber: number;
  type: 'highlight' | 'note' | 'drawing' | 'text' | 'arrow' | 'rectangle';
  content: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  authorId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isVisible: boolean;
  color: string;
  opacity: number;
  style: {
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
  };
}

interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  imageUrl: string;
  thumbnailUrl: string;
  annotations: PDFAnnotation[];
}

class PDFService {
  // Document Management
  async uploadPDF(groupId: string, file: Buffer, filename: string, uploaderId: string): Promise<PDFDocument>;
  async getPDFPages(documentId: string, pageNumbers: number[]): Promise<PDFPage[]>;
  async getPDFThumbnail(documentId: string, pageNumber: number): Promise<string>;
  async deletePDF(documentId: string, userId: string): Promise<boolean>;
  async updatePDFPermissions(documentId: string, permissions: PDFPermissions, userId: string): Promise<boolean>;
  
  // Annotation Management
  async addAnnotation(documentId: string, annotation: CreateAnnotationDto): Promise<PDFAnnotation>;
  async updateAnnotation(annotationId: string, updates: UpdateAnnotationDto, userId: string): Promise<PDFAnnotation>;
  async deleteAnnotation(annotationId: string, userId: string): Promise<boolean>;
  async getAnnotations(documentId: string, pageNumber?: number): Promise<PDFAnnotation[]>;
  async getAnnotationById(annotationId: string): Promise<PDFAnnotation>;
  
  // Collaboration
  async syncAnnotations(documentId: string, pageNumber: number): Promise<PDFAnnotation[]>;
  async getCollaborativeState(documentId: string): Promise<CollaborativeState>;
  async resolveConflict(annotationId: string, resolution: ConflictResolution): Promise<boolean>;
}
```

## Database Schema (MongoDB)

```javascript
// PDFDocuments Collection
{
  _id: ObjectId,
  groupId: ObjectId (ref: 'StudyGroups', required),
  meetingId: ObjectId (ref: 'Meetings'),
  filename: String (required),
  originalName: String (required),
  fileSize: Number (required),
  pageCount: Number (required),
  uploadedBy: ObjectId (ref: 'Users', required),
  uploadedAt: Date (required),
  version: Number (default: 1),
  isActive: Boolean (default: true),
  metadata: {
    title: String,
    author: String,
    subject: String,
    keywords: [String]
  },
  permissions: {
    canView: [ObjectId (ref: 'Users')],
    canAnnotate: [ObjectId (ref: 'Users')],
    canEdit: [ObjectId (ref: 'Users')]
  },
  gridFSId: ObjectId (ref: 'fs.files')
}

// PDFAnnotations Collection
{
  _id: ObjectId,
  documentId: ObjectId (ref: 'PDFDocuments', required),
  pageNumber: Number (required),
  type: String (enum: ['highlight', 'note', 'drawing', 'text', 'arrow', 'rectangle']),
  content: String,
  coordinates: {
    x: Number (required),
    y: Number (required),
    width: Number (required),
    height: Number (required)
  },
  authorId: ObjectId (ref: 'Users', required),
  createdAt: Date (required),
  updatedAt: Date (required),
  isVisible: Boolean (default: true),
  color: String (default: '#ffff00'),
  opacity: Number (default: 0.5),
  style: {
    strokeWidth: Number,
    fontSize: Number,
    fontFamily: String
  },
  version: Number (default: 1),
  isDeleted: Boolean (default: false)
}

// PDFCollaborativeState Collection (Redis)
{
  documentId: String,
  pageNumber: Number,
  activeUsers: [{
    userId: String,
    cursorPosition: {
      x: Number,
      y: Number
    },
    lastSeen: Date
  }],
  lastModified: Date,
  version: Number
}
```

## API Endpoints

### Document Management
```typescript
// Upload PDF
POST /api/pdf/upload
Headers: { Authorization: "Bearer <token>" }
Request: FormData with file
Response: {
  document: PDFDocument;
  message: string;
}

// Get PDF Document
GET /api/pdf/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  document: PDFDocument;
}

// Get PDF Pages
GET /api/pdf/:id/pages
Headers: { Authorization: "Bearer <token>" }
Query: { 
  pageNumbers?: string; // comma-separated
  includeAnnotations?: boolean;
}
Response: {
  pages: PDFPage[];
}

// Get PDF Thumbnail
GET /api/pdf/:id/thumbnail/:pageNumber
Headers: { Authorization: "Bearer <token>" }
Response: {
  thumbnailUrl: string;
}

// Delete PDF
DELETE /api/pdf/:id
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Update Permissions
PUT /api/pdf/:id/permissions
Headers: { Authorization: "Bearer <token>" }
Request: {
  permissions: {
    canView: string[];
    canAnnotate: string[];
    canEdit: string[];
  };
}
Response: {
  message: string;
}
```

### Annotation Management
```typescript
// Add Annotation
POST /api/pdf/:id/annotations
Headers: { Authorization: "Bearer <token>" }
Request: {
  pageNumber: number;
  type: string;
  content: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color?: string;
  opacity?: number;
  style?: {
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
  };
}
Response: {
  annotation: PDFAnnotation;
}

// Update Annotation
PUT /api/pdf/annotations/:annotationId
Headers: { Authorization: "Bearer <token>" }
Request: {
  content?: string;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color?: string;
  opacity?: number;
  style?: {
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
  };
}
Response: {
  annotation: PDFAnnotation;
}

// Delete Annotation
DELETE /api/pdf/annotations/:annotationId
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
}

// Get Annotations
GET /api/pdf/:id/annotations
Headers: { Authorization: "Bearer <token>" }
Query: { 
  pageNumber?: number;
  type?: string;
}
Response: {
  annotations: PDFAnnotation[];
}

// Get Annotation by ID
GET /api/pdf/annotations/:annotationId
Headers: { Authorization: "Bearer <token>" }
Response: {
  annotation: PDFAnnotation;
}
```

### Collaboration
```typescript
// Sync Annotations
GET /api/pdf/:id/sync
Headers: { Authorization: "Bearer <token>" }
Query: { 
  pageNumber: number;
  lastSync?: string; // ISO date
}
Response: {
  annotations: PDFAnnotation[];
  lastModified: string;
  version: number;
}

// Get Collaborative State
GET /api/pdf/:id/collaborative-state
Headers: { Authorization: "Bearer <token>" }
Response: {
  activeUsers: Array<{
    userId: string;
    cursorPosition: {
      x: number;
      y: number;
    };
    lastSeen: string;
  }>;
  lastModified: string;
  version: number;
}
```

## Real-time Events (Socket.io)

### Document Events
```typescript
// Document Events
socket.emit('pdf:upload', { 
  groupId, 
  documentId, 
  filename 
});
socket.emit('pdf:delete', { 
  documentId 
});
socket.emit('pdf:permissions:update', { 
  documentId, 
  permissions 
});

// Listeners
socket.on('pdf:uploaded', (data) => { 
  // Handle PDF upload notification
});
socket.on('pdf:deleted', (data) => { 
  // Handle PDF deletion notification
});
```

### Annotation Events
```typescript
// Annotation Events
socket.emit('pdf:annotation:add', { 
  documentId, 
  annotation 
});
socket.emit('pdf:annotation:update', { 
  annotationId, 
  updates 
});
socket.emit('pdf:annotation:delete', { 
  annotationId 
});
socket.emit('pdf:annotation:sync', { 
  documentId, 
  pageNumber, 
  annotations 
});

// Listeners
socket.on('pdf:annotation:added', (annotation) => { 
  // Handle new annotation
});
socket.on('pdf:annotation:updated', (annotation) => { 
  // Handle annotation update
});
socket.on('pdf:annotation:deleted', (annotationId) => { 
  // Handle annotation deletion
});
```

### Collaboration Events
```typescript
// User Presence Events
socket.emit('pdf:user:join', { 
  documentId, 
  pageNumber, 
  userId 
});
socket.emit('pdf:user:leave', { 
  documentId, 
  pageNumber, 
  userId 
});
socket.emit('pdf:cursor:move', { 
  documentId, 
  pageNumber, 
  userId, 
  position 
});

// Listeners
socket.on('pdf:user:joined', (data) => { 
  // Handle user joining document
});
socket.on('pdf:user:left', (data) => { 
  // Handle user leaving document
});
socket.on('pdf:cursor:moved', (data) => { 
  // Handle cursor movement
});
```

## Implementation Notes

### PDF.js Integration
```typescript
// PDF.js configuration
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// PDF rendering service
class PDFRendererService {
  async renderPage(pdfDocument: any, pageNumber: number): Promise<string> {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    return canvas.toDataURL('image/png');
  }
  
  async generateThumbnail(pdfDocument: any, pageNumber: number): Promise<string> {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    return canvas.toDataURL('image/jpeg', 0.7);
  }
}
```

### Yjs Integration for Collaboration
```typescript
// Yjs document for collaborative editing
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

class CollaborativePDFService {
  private documents: Map<string, Y.Doc> = new Map();
  private providers: Map<string, WebsocketProvider> = new Map();
  
  async getDocument(documentId: string): Promise<Y.Doc> {
    if (!this.documents.has(documentId)) {
      const doc = new Y.Doc();
      this.documents.set(documentId, doc);
    }
    return this.documents.get(documentId)!;
  }
  
  async syncAnnotations(documentId: string, pageNumber: number): Promise<PDFAnnotation[]> {
    const doc = await this.getDocument(documentId);
    const annotations = doc.getArray(`annotations_${pageNumber}`);
    return annotations.toArray();
  }
  
  async addAnnotation(documentId: string, annotation: PDFAnnotation): Promise<void> {
    const doc = await this.getDocument(documentId);
    const annotations = doc.getArray(`annotations_${annotation.pageNumber}`);
    annotations.push([annotation]);
  }
}
```

### File Upload with GridFS
```typescript
// GridFS file upload
import { GridFSBucket } from 'mongodb';

class PDFUploadService {
  private bucket: GridFSBucket;
  
  constructor() {
    this.bucket = new GridFSBucket(db, { bucketName: 'pdfs' });
  }
  
  async uploadPDF(file: Buffer, filename: string): Promise<string> {
    const uploadStream = this.bucket.openUploadStream(filename);
    uploadStream.write(file);
    uploadStream.end();
    
    return new Promise((resolve, reject) => {
      uploadStream.on('finish', () => {
        resolve(uploadStream.id.toString());
      });
      uploadStream.on('error', reject);
    });
  }
  
  async getPDFFile(fileId: string): Promise<Buffer> {
    const downloadStream = this.bucket.openDownloadStream(new ObjectId(fileId));
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => chunks.push(chunk));
      downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
      downloadStream.on('error', reject);
    });
  }
}
```

### Error Handling
```typescript
// Common Error Responses
{
  "error": "PDF not found",
  "message": "PDF document does not exist"
}

{
  "error": "Invalid file format",
  "message": "Only PDF files are supported"
}

{
  "error": "File too large",
  "message": "PDF file exceeds maximum size limit"
}

{
  "error": "Permission denied",
  "message": "You don't have permission to access this PDF"
}

{
  "error": "Annotation not found",
  "message": "Annotation does not exist"
}
```

### Testing Strategy
- Unit tests for PDFService methods
- Integration tests for API endpoints
- PDF rendering testing
- Annotation synchronization testing
- Real-time collaboration testing
- File upload testing
- Permission system testing
