import StudyGroup, { IStudyGroup } from '../models/StudyGroup';
import User from '../models/User';

export interface CreateGroupDto {
  name: string;
  description: string;
  settings: {
    maxMembers: number;
    isPrivate: boolean;
    allowInvites: boolean;
    meetingDuration: number;
  };
}

export interface GroupMember {
  userId: string;
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

export class GroupService {
  async createGroup(ownerId: string, groupData: CreateGroupDto): Promise<IStudyGroup> {
    const { name, description, settings } = groupData;
    
    // Check if user exists
    const owner = await User.findById(ownerId);
    if (!owner) {
      throw new Error('Owner not found');
    }
    
    // Generate unique invite code
    const inviteCode = this.generateInviteCode();
    
    const group = new StudyGroup({
      name,
      description,
      ownerId,
      members: [{
        userId: ownerId,
        role: 'owner',
        joinedAt: new Date(),
        permissions: ['manage_group', 'manage_members', 'manage_meetings', 'manage_files']
      }],
      settings,
      inviteCode
    });
    
    return await group.save();
  }
  
  async joinGroup(userId: string, groupId: string, inviteCode?: string): Promise<IStudyGroup> {
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if user is already a member
    const existingMember = group.members.find(member => 
      member.userId.toString() === userId
    );
    
    if (existingMember) {
      throw new Error('User is already a member of this group');
    }
    
    // Check if group is private and invite code is required
    if (group.settings.isPrivate) {
      if (!inviteCode || group.inviteCode !== inviteCode) {
        throw new Error('Invalid invite code');
      }
    }
    
    // Check if group has reached maximum members
    if (group.members.length >= group.settings.maxMembers) {
      throw new Error('Group has reached maximum number of members');
    }
    
    // Add user to group
    group.members.push({
      userId,
      role: 'member',
      joinedAt: new Date(),
      permissions: ['view_group', 'join_meetings', 'upload_files']
    });
    
    return await group.save();
  }
  
  async leaveGroup(userId: string, groupId: string): Promise<boolean> {
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if user is a member
    const memberIndex = group.members.findIndex(member => 
      member.userId.toString() === userId
    );
    
    if (memberIndex === -1) {
      throw new Error('User is not a member of this group');
    }
    
    // Check if user is the owner
    if (group.members[memberIndex].role === 'owner') {
      throw new Error('Owner cannot leave the group. Transfer ownership or delete the group instead.');
    }
    
    // Remove user from group
    group.members.splice(memberIndex, 1);
    await group.save();
    
    return true;
  }
  
  async updateGroupSettings(groupId: string, settings: any, userId: string): Promise<IStudyGroup> {
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if user has permission to update settings
    const member = group.members.find(m => m.userId.toString() === userId);
    if (!member || !member.permissions.includes('manage_group')) {
      throw new Error('Insufficient permissions');
    }
    
    group.settings = { ...group.settings, ...settings };
    return await group.save();
  }
  
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const group = await StudyGroup.findById(groupId)
      .populate('members.userId', 'username email profile')
      .exec();
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    return group.members.map(member => ({
      userId: member.userId.toString(),
      user: {
        username: (member.userId as any).username,
        email: (member.userId as any).email,
        profile: (member.userId as any).profile
      },
      role: member.role,
      joinedAt: member.joinedAt,
      permissions: member.permissions
    }));
  }
  
  async removeMember(groupId: string, memberId: string, adminId: string): Promise<boolean> {
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if admin has permission
    const admin = group.members.find(m => m.userId.toString() === adminId);
    if (!admin || !admin.permissions.includes('manage_members')) {
      throw new Error('Insufficient permissions');
    }
    
    // Check if trying to remove owner
    const memberToRemove = group.members.find(m => m.userId.toString() === memberId);
    if (memberToRemove?.role === 'owner') {
      throw new Error('Cannot remove group owner');
    }
    
    // Remove member
    group.members = group.members.filter(member => 
      member.userId.toString() !== memberId
    );
    
    await group.save();
    return true;
  }
  
  async updateMemberRole(groupId: string, memberId: string, role: string, adminId: string): Promise<boolean> {
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if admin has permission
    const admin = group.members.find(m => m.userId.toString() === adminId);
    if (!admin || !admin.permissions.includes('manage_members')) {
      throw new Error('Insufficient permissions');
    }
    
    // Find member to update
    const member = group.members.find(m => m.userId.toString() === memberId);
    if (!member) {
      throw new Error('Member not found');
    }
    
    // Update role and permissions
    member.role = role as any;
    member.permissions = this.getPermissionsForRole(role);
    
    await group.save();
    return true;
  }
  
  async generateInviteCode(groupId: string, userId: string): Promise<string> {
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if user has permission
    const member = group.members.find(m => m.userId.toString() === userId);
    if (!member || !member.permissions.includes('manage_group')) {
      throw new Error('Insufficient permissions');
    }
    
    // Generate new invite code
    const newInviteCode = this.generateInviteCode();
    group.inviteCode = newInviteCode;
    await group.save();
    
    return newInviteCode;
  }
  
  async getGroupById(groupId: string): Promise<IStudyGroup> {
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }
  
  async getUserGroups(userId: string): Promise<IStudyGroup[]> {
    return await StudyGroup.find({
      'members.userId': userId
    }).sort({ updatedAt: -1 });
  }
  
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  private getPermissionsForRole(role: string): string[] {
    switch (role) {
      case 'owner':
        return ['manage_group', 'manage_members', 'manage_meetings', 'manage_files'];
      case 'admin':
        return ['manage_members', 'manage_meetings', 'manage_files'];
      case 'member':
        return ['view_group', 'join_meetings', 'upload_files'];
      default:
        return ['view_group'];
    }
  }
}
