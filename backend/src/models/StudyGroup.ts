import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyGroup extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  members: Array<{
    userId: mongoose.Types.ObjectId;
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

const studyGroupSchema = new Schema<IStudyGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: [{
      type: String,
      enum: [
        'manage_group',
        'manage_members',
        'manage_meetings',
        'manage_files',
        'view_group',
        'join_meetings',
        'upload_files'
      ]
    }]
  }],
  settings: {
    maxMembers: {
      type: Number,
      default: 4,
      min: 2,
      max: 50
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    meetingDuration: {
      type: Number,
      default: 60,
      min: 15,
      max: 480
    }
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
studyGroupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
studyGroupSchema.index({ ownerId: 1 });
studyGroupSchema.index({ 'members.userId': 1 });
studyGroupSchema.index({ inviteCode: 1 });

export default mongoose.model<IStudyGroup>('StudyGroup', studyGroupSchema);
