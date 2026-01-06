import { Router } from 'express';
import { login, refreshToken, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', protect, getMe);

export default router;
