import { Router } from 'express';
import { 
  createGroup, 
  getUserGroups, 
  getGroupById, 
  joinGroup, 
  leaveGroup, 
  getGroupMembers,
  updateGroupSettings 
} from '../controllers/groupController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/groups
 * @desc Create a new study group
 * @access Private
 */
router.post('/', authenticateToken, createGroup);

/**
 * @route GET /api/groups
 * @desc Get user's study groups
 * @access Private
 */
router.get('/', authenticateToken, getUserGroups);

/**
 * @route GET /api/groups/:id
 * @desc Get study group by ID
 * @access Private
 */
router.get('/:id', authenticateToken, getGroupById);

/**
 * @route POST /api/groups/:id/join
 * @desc Join a study group
 * @access Private
 */
router.post('/:id/join', authenticateToken, joinGroup);

/**
 * @route POST /api/groups/:id/leave
 * @desc Leave a study group
 * @access Private
 */
router.post('/:id/leave', authenticateToken, leaveGroup);

/**
 * @route GET /api/groups/:id/members
 * @desc Get study group members
 * @access Private
 */
router.get('/:id/members', authenticateToken, getGroupMembers);

/**
 * @route PUT /api/groups/:id
 * @desc Update study group settings
 * @access Private
 */
router.put('/:id', authenticateToken, updateGroupSettings);

export default router;
