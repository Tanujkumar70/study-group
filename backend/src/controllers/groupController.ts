import { Request, Response } from 'express';
import { GroupService } from '../services/groupService';

const groupService = new GroupService();

export const createGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, description, settings } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Group name is required'
      });
    }
    
    // Validate settings
    const defaultSettings = {
      maxMembers: 4,
      isPrivate: false,
      allowInvites: true,
      meetingDuration: 60,
      ...settings
    };
    
    const group = await groupService.createGroup(userId, {
      name,
      description,
      settings: defaultSettings
    });
    
    res.status(201).json({
      message: 'Group created successfully',
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        ownerId: group.ownerId,
        members: group.members,
        settings: group.settings,
        inviteCode: group.inviteCode,
        createdAt: group.createdAt
      }
    });
  } catch (error: any) {
    console.error('Create group error:', error);
    
    res.status(500).json({
      error: 'Group creation failed',
      message: error.message
    });
  }
};

export const getUserGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const groups = await groupService.getUserGroups(userId);
    
    res.json({
      message: 'Groups retrieved successfully',
      groups: groups.map(group => ({
        _id: group._id,
        name: group.name,
        description: group.description,
        ownerId: group.ownerId,
        memberCount: group.members.length,
        settings: group.settings,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }))
    });
  } catch (error: any) {
    console.error('Get user groups error:', error);
    
    res.status(500).json({
      error: 'Failed to retrieve groups',
      message: error.message
    });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    
    const group = await groupService.getGroupById(id);
    
    // Check if user is a member
    const isMember = group.members.some(member => 
      member.userId.toString() === userId
    );
    
    if (!isMember) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this group'
      });
    }
    
    res.json({
      message: 'Group retrieved successfully',
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        ownerId: group.ownerId,
        members: group.members,
        settings: group.settings,
        inviteCode: group.inviteCode,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Get group error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Group not found',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to retrieve group',
      message: error.message
    });
  }
};

export const joinGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { inviteCode } = req.body;
    
    const group = await groupService.joinGroup(userId, id, inviteCode);
    
    res.json({
      message: 'Successfully joined group',
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        memberCount: group.members.length,
        settings: group.settings
      }
    });
  } catch (error: any) {
    console.error('Join group error:', error);
    
    if (error.message.includes('already a member')) {
      return res.status(409).json({
        error: 'Already a member',
        message: error.message
      });
    }
    
    if (error.message.includes('Invalid invite code')) {
      return res.status(400).json({
        error: 'Invalid invite code',
        message: error.message
      });
    }
    
    if (error.message.includes('maximum number of members')) {
      return res.status(400).json({
        error: 'Group full',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to join group',
      message: error.message
    });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    
    await groupService.leaveGroup(userId, id);
    
    res.json({
      message: 'Successfully left group'
    });
  } catch (error: any) {
    console.error('Leave group error:', error);
    
    if (error.message.includes('not a member')) {
      return res.status(400).json({
        error: 'Not a member',
        message: error.message
      });
    }
    
    if (error.message.includes('Owner cannot leave')) {
      return res.status(400).json({
        error: 'Cannot leave as owner',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to leave group',
      message: error.message
    });
  }
};

export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    
    // Check if user is a member
    const group = await groupService.getGroupById(id);
    const isMember = group.members.some(member => 
      member.userId.toString() === userId
    );
    
    if (!isMember) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this group'
      });
    }
    
    const members = await groupService.getGroupMembers(id);
    
    res.json({
      message: 'Group members retrieved successfully',
      members
    });
  } catch (error: any) {
    console.error('Get group members error:', error);
    
    res.status(500).json({
      error: 'Failed to retrieve group members',
      message: error.message
    });
  }
};

export const updateGroupSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const settings = req.body;
    
    const group = await groupService.updateGroupSettings(id, settings, userId);
    
    res.json({
      message: 'Group settings updated successfully',
      group: {
        _id: group._id,
        name: group.name,
        settings: group.settings,
        updatedAt: group.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Update group settings error:', error);
    
    if (error.message.includes('Insufficient permissions')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to update group settings',
      message: error.message
    });
  }
};
