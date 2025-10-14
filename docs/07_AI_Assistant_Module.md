# AI Assistant Module - Low-Level Design

## Overview
Handles AI-powered chat bot, PDF analysis, intelligent Q&A, and document processing using OpenAI API and LangChain.

## Class Structure (TypeScript)

```typescript
interface AIQuery {
  _id: ObjectId;
  meetingId: ObjectId;
  userId: ObjectId;
  query: string;
  response: string;
  context: {
    documentId?: ObjectId;
    pageNumber?: number;
    section?: string;
    meetingContext?: string;
  };
  timestamp: Date;
  type: 'text' | 'voice';
  confidence: number;
  sources: Array<{
    documentId: ObjectId;
    pageNumber: number;
    excerpt: string;
    relevance: number;
  }>;
}

interface PDFAnalysis {
  _id: ObjectId;
  documentId: ObjectId;
  analysis: {
    summary: string;
    keyPoints: string[];
    topics: string[];
    questions: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentEmbedding {
  _id: ObjectId;
  documentId: ObjectId;
  pageNumber: number;
  content: string;
  embedding: number[];
  metadata: {
    section: string;
    wordCount: number;
    topics: string[];
  };
  createdAt: Date;
}

class AIService {
  // Query Processing
  async processQuery(meetingId: string, userId: string, query: string, context?: QueryContext): Promise<AIQuery>;
  async processVoiceQuery(meetingId: string, userId: string, audioData: Buffer): Promise<AIQuery>;
  async getQueryHistory(meetingId: string, userId?: string): Promise<AIQuery[]>;
  
  // PDF Analysis
  async analyzePDF(documentId: string): Promise<PDFAnalysis>;
  async extractKeyPoints(documentId: string, pageNumbers: number[]): Promise<string[]>;
  async generateQuestions(documentId: string, difficulty?: string): Promise<string[]>;
  async summarizeDocument(documentId: string): Promise<string>;
  
  // Document Processing
  async processDocument(documentId: string): Promise<DocumentEmbedding[]>;
  async searchDocuments(query: string, groupId: string): Promise<SearchResult[]>;
  async getRelevantContext(query: string, documentId: string): Promise<string[]>;
  
  // Meeting Assistance
  async generateMeetingSummary(meetingId: string): Promise<string>;
  async suggestQuestions(meetingId: string, context: string): Promise<string[]>;
  async provideStudyTips(meetingId: string, topic: string): Promise<string[]>;
}
```

## Database Schema (MongoDB)

```javascript
// AIQueries Collection
{
  _id: ObjectId,
  meetingId: ObjectId (ref: 'Meetings', required),
  userId: ObjectId (ref: 'Users', required),
  query: String (required),
  response: String (required),
  context: {
    documentId: ObjectId (ref: 'PDFDocuments'),
    pageNumber: Number,
    section: String,
    meetingContext: String
  },
  timestamp: Date (required, indexed),
  type: String (enum: ['text', 'voice']),
  confidence: Number (0-1),
  sources: [{
    documentId: ObjectId (ref: 'PDFDocuments'),
    pageNumber: Number,
    excerpt: String,
    relevance: Number (0-1)
  }],
  isHelpful: Boolean,
  feedback: String
}

// PDFAnalyses Collection
{
  _id: ObjectId,
  documentId: ObjectId (ref: 'PDFDocuments', required),
  analysis: {
    summary: String,
    keyPoints: [String],
    topics: [String],
    questions: [String],
    difficulty: String (enum: ['beginner', 'intermediate', 'advanced'])
  },
  createdAt: Date (required),
  updatedAt: Date (required),
  version: Number (default: 1)
}

// DocumentEmbeddings Collection
{
  _id: ObjectId,
  documentId: ObjectId (ref: 'PDFDocuments', required),
  pageNumber: Number (required),
  content: String (required),
  embedding: [Number] (required, indexed),
  metadata: {
    section: String,
    wordCount: Number,
    topics: [String]
  },
  createdAt: Date (required)
}

// AIFeedback Collection
{
  _id: ObjectId,
  queryId: ObjectId (ref: 'AIQueries', required),
  userId: ObjectId (ref: 'Users', required),
  rating: Number (1-5),
  feedback: String,
  createdAt: Date (required)
}
```

## API Endpoints

### AI Query Processing
```typescript
// Process Text Query
POST /api/ai/query
Headers: { Authorization: "Bearer <token>" }
Request: {
  meetingId: string;
  query: string;
  context?: {
    documentId?: string;
    pageNumber?: number;
    section?: string;
  };
}
Response: {
  query: AIQuery;
  suggestions: string[];
}

// Process Voice Query
POST /api/ai/voice-query
Headers: { Authorization: "Bearer <token>" }
Request: FormData with audio file
Response: {
  query: AIQuery;
  suggestions: string[];
}

// Get Query History
GET /api/ai/queries/:meetingId
Headers: { Authorization: "Bearer <token>" }
Query: { 
  userId?: string;
  limit?: number;
  offset?: number;
}
Response: {
  queries: AIQuery[];
  total: number;
}

// Provide Feedback
POST /api/ai/feedback
Headers: { Authorization: "Bearer <token>" }
Request: {
  queryId: string;
  rating: number;
  feedback?: string;
}
Response: {
  message: string;
}
```

### PDF Analysis
```typescript
// Analyze PDF
POST /api/ai/analyze-pdf
Headers: { Authorization: "Bearer <token>" }
Request: {
  documentId: string;
}
Response: {
  analysis: PDFAnalysis;
}

// Extract Key Points
POST /api/ai/extract-keypoints
Headers: { Authorization: "Bearer <token>" }
Request: {
  documentId: string;
  pageNumbers?: number[];
}
Response: {
  keyPoints: string[];
}

// Generate Questions
POST /api/ai/generate-questions
Headers: { Authorization: "Bearer <token>" }
Request: {
  documentId: string;
  difficulty?: string;
  count?: number;
}
Response: {
  questions: string[];
}

// Summarize Document
POST /api/ai/summarize
Headers: { Authorization: "Bearer <token>" }
Request: {
  documentId: string;
  maxLength?: number;
}
Response: {
  summary: string;
}
```

### Document Processing
```typescript
// Process Document
POST /api/ai/process-document
Headers: { Authorization: "Bearer <token>" }
Request: {
  documentId: string;
}
Response: {
  message: string;
  embeddingsCount: number;
}

// Search Documents
POST /api/ai/search
Headers: { Authorization: "Bearer <token>" }
Request: {
  query: string;
  groupId: string;
  limit?: number;
}
Response: {
  results: SearchResult[];
}

// Get Relevant Context
POST /api/ai/relevant-context
Headers: { Authorization: "Bearer <token>" }
Request: {
  query: string;
  documentId: string;
  maxResults?: number;
}
Response: {
  contexts: string[];
}
```

### Meeting Assistance
```typescript
// Generate Meeting Summary
POST /api/ai/meeting-summary
Headers: { Authorization: "Bearer <token>" }
Request: {
  meetingId: string;
}
Response: {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

// Suggest Questions
POST /api/ai/suggest-questions
Headers: { Authorization: "Bearer <token>" }
Request: {
  meetingId: string;
  context: string;
  count?: number;
}
Response: {
  questions: string[];
}

// Provide Study Tips
POST /api/ai/study-tips
Headers: { Authorization: "Bearer <token>" }
Request: {
  meetingId: string;
  topic: string;
}
Response: {
  tips: string[];
}
```

## Real-time Events (Socket.io)

### AI Assistant Events
```typescript
// Query Events
socket.emit('ai:query:start', { 
  meetingId, 
  userId, 
  query 
});
socket.emit('ai:query:complete', { 
  queryId, 
  response, 
  confidence 
});
socket.emit('ai:query:error', { 
  queryId, 
  error 
});

// Listeners
socket.on('ai:query:started', (data) => { 
  // Handle query start
});
socket.on('ai:query:completed', (data) => { 
  // Handle query completion
});
socket.on('ai:query:error', (data) => { 
  // Handle query error
});
```

### Analysis Events
```typescript
// Analysis Events
socket.emit('ai:analysis:start', { 
  documentId, 
  type 
});
socket.emit('ai:analysis:complete', { 
  documentId, 
  analysis 
});
socket.emit('ai:analysis:progress', { 
  documentId, 
  progress 
});

// Listeners
socket.on('ai:analysis:started', (data) => { 
  // Handle analysis start
});
socket.on('ai:analysis:completed', (data) => { 
  // Handle analysis completion
});
socket.on('ai:analysis:progress', (data) => { 
  // Handle analysis progress
});
```

## Implementation Notes

### OpenAI Integration
```typescript
// OpenAI service configuration
import OpenAI from 'openai';

class OpenAIService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async processQuery(query: string, context: string[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant for a study group application. Help students with their questions and provide educational support.'
        },
        {
          role: 'user',
          content: `Context: ${context.join('\n')}\n\nQuestion: ${query}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  }
  
  async analyzePDF(content: string): Promise<PDFAnalysis> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Analyze the provided PDF content and extract key information, topics, and generate relevant questions.'
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 2000,
      temperature: 0.5
    });
    
    return this.parseAnalysisResponse(response.choices[0].message.content);
  }
}
```

### LangChain Integration
```typescript
// LangChain document processing
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { VectorStore } from 'langchain/vectorstores';

class DocumentProcessor {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: VectorStore;
  
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async processDocument(documentId: string, content: string): Promise<DocumentEmbedding[]> {
    const documents = this.splitContent(content);
    const embeddings = await this.embeddings.embedDocuments(documents);
    
    const embeddingDocs = documents.map((doc, index) => ({
      documentId: new ObjectId(documentId),
      content: doc,
      embedding: embeddings[index],
      metadata: {
        section: this.extractSection(doc),
        wordCount: doc.split(' ').length,
        topics: this.extractTopics(doc)
      }
    }));
    
    return embeddingDocs;
  }
  
  async searchSimilar(query: string, groupId: string): Promise<SearchResult[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const results = await this.vectorStore.similaritySearchWithScore(
      queryEmbedding,
      5,
      { groupId }
    );
    
    return results.map(([doc, score]) => ({
      documentId: doc.metadata.documentId,
      pageNumber: doc.metadata.pageNumber,
      content: doc.pageContent,
      relevance: score
    }));
  }
}
```

### Voice Processing
```typescript
// Voice query processing
import { OpenAI } from 'openai';

class VoiceProcessor {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    const response = await this.openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.wav'),
      model: 'whisper-1',
      language: 'en'
    });
    
    return response.text;
  }
  
  async generateSpeech(text: string): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text
    });
    
    return Buffer.from(await response.arrayBuffer());
  }
}
```

### Error Handling
```typescript
// Common Error Responses
{
  "error": "AI service unavailable",
  "message": "AI assistant is temporarily unavailable"
}

{
  "error": "Invalid query",
  "message": "Query is too short or contains invalid content"
}

{
  "error": "Document not processed",
  "message": "Document must be processed before AI analysis"
}

{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later"
}
```

### Testing Strategy
- Unit tests for AIService methods
- Integration tests for API endpoints
- OpenAI API testing with mocks
- Document processing testing
- Voice processing testing
- Real-time event testing
- Performance testing for AI operations







TypeScript Interfaces
typescript
import { ObjectId } from 'mongodb';

export interface QueryContext {
  documentId?: ObjectId;
  pageNumber?: number;
  section?: string;
  meetingContext?: string;
}

export interface Source {
  documentId: ObjectId;
  pageNumber: number;
  excerpt: string;
  relevance: number;
}

export interface AIQuery {
  _id: ObjectId;
  meetingId: ObjectId;
  userId: ObjectId;
  query: string;
  response: string;
  context: QueryContext;
  timestamp: Date;
  type: 'text' | 'voice';
  confidence: number;
  sources: Source[];
  isHelpful?: boolean;
  feedback?: string;
}

export interface PDFAnalysis {
  _id: ObjectId;
  documentId: ObjectId;
  analysis: {
    summary: string;
    keyPoints: string[];
    topics: string[];
    questions: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

export interface DocumentEmbedding {
  _id: ObjectId;
  documentId: ObjectId;
  pageNumber: number;
  content: string;
  embedding: number[];
  metadata: {
    section: string;
    wordCount: number;
    topics: string[];
  };
  createdAt: Date;
}

export interface AIFeedback {
  _id: ObjectId;
  queryId: ObjectId;
  userId: ObjectId;
  rating: number;
  feedback?: string;
  createdAt: Date;
}
Mongoose Schemas (models/AIAssistant.ts)
typescript
import mongoose, { Schema } from 'mongoose';

const SourceSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'PDFDocuments' },
  pageNumber: Number,
  excerpt: String,
  relevance: Number
});

const AIQuerySchema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: 'Meetings', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  query: { type: String, required: true },
  response: { type: String, required: true },
  context: {
    documentId: { type: Schema.Types.ObjectId, ref: 'PDFDocuments' },
    pageNumber: Number,
    section: String,
    meetingContext: String
  },
  timestamp: { type: Date, required: true, index: true },
  type: { type: String, enum: ['text', 'voice'] },
  confidence: Number,
  sources: [SourceSchema],
  isHelpful: Boolean,
  feedback: String
});

const PDFAnalysisSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'PDFDocuments', required: true },
  analysis: {
    summary: String,
    keyPoints: [String],
    topics: [String],
    questions: [String],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
  },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  version: { type: Number, default: 1 }
});

const DocumentEmbeddingSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'PDFDocuments', required: true },
  pageNumber: { type: Number, required: true },
  content: { type: String, required: true },
  embedding: { type: [Number], required: true, index: true },
  metadata: {
    section: String,
    wordCount: Number,
    topics: [String]
  },
  createdAt: { type: Date, required: true }
});

const AIFeedbackSchema = new Schema({
  queryId: { type: Schema.Types.ObjectId, ref: 'AIQueries', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  rating: { type: Number, min: 1, max: 5 },
  feedback: String,
  createdAt: { type: Date, required: true }
});

// Export models
export const AIQueryModel = mongoose.model('AIQueries', AIQuerySchema);
export const PDFAnalysisModel = mongoose.model('PDFAnalyses', PDFAnalysisSchema);
export const DocumentEmbeddingModel = mongoose.model('DocumentEmbeddings', DocumentEmbeddingSchema);
export const AIFeedbackModel = mongoose.model('AIFeedback', AIFeedbackSchema);
AI Service Class Example (TypeScript)
typescript
export class AIService {
  // Query Processing
  async processQuery(meetingId: string, userId: string, query: string, context?: QueryContext): Promise<AIQuery> { /* ... */ }
  async processVoiceQuery(meetingId: string, userId: string, audioData: Buffer): Promise<AIQuery> { /* ... */ }
  async getQueryHistory(meetingId: string, userId?: string): Promise<AIQuery[]> { /* ... */ }
  
  // PDF Analysis
  async analyzePDF(documentId: string): Promise<PDFAnalysis> { /* ... */ }
  async extractKeyPoints(documentId: string, pageNumbers: number[]): Promise<string[]> { /* ... */ }
  async generateQuestions(documentId: string, difficulty?: string): Promise<string[]> { /* ... */ }
  async summarizeDocument(documentId: string): Promise<string> { /* ... */ }
  
  // Document Processing
  async processDocument(documentId: string): Promise<DocumentEmbedding[]> { /* ... */ }
  async searchDocuments(query: string, groupId: string): Promise<SearchResult[]> { /* ... */ }
  async getRelevantContext(query: string, documentId: string): Promise<string[]> { /* ... */ }
  
  // Meeting Assistance
  async generateMeetingSummary(meetingId: string): Promise<string> { /* ... */ }
  async suggestQuestions(meetingId: string, context: string): Promise<string[]> { /* ... */ }
  async provideStudyTips(meetingId: string, topic: string): Promise<string[]> { /* ... */ }
}
Indexes
Make sure to create these for efficiency:

javascript
AIQuerySchema.index({ meetingId: 1 });
AIQuerySchema.index({ userId: 1 });
AIQuerySchema.index({ timestamp: 1 });

PDFAnalysisSchema.index({ documentId: 1 });

DocumentEmbeddingSchema.index({ documentId: 1, pageNumber: 1 });
DocumentEmbeddingSchema.index({ embedding: 1 });
