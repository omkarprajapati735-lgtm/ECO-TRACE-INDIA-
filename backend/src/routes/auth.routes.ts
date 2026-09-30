import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import {
  otpLimiterMiddleware,
  authLimiterMiddleware,
} from '../middlewares/rate-limiter.middleware';

export const authRouter = Router();

authRouter.post('/send-otp', otpLimiterMiddleware, authController.sendOtp);
authRouter.post('/verify-otp', authLimiterMiddleware, authController.verifyOtp);
authRouter.post('/register', authLimiterMiddleware, authController.register);
authRouter.post('/login', authLimiterMiddleware, authController.login);
authRouter.post('/refresh', authController.refreshToken);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.getMe);
