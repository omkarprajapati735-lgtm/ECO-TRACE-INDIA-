import { Router } from 'express';
import { Role } from '@prisma/client';
import { aiController } from '../controllers/ai.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const aiRouter = Router();

// Advisory Gemini 1.5 Flash scrap image grading
aiRouter.post(
  '/classify-waste',
  authenticate,
  authorize(Role.COLLECTOR, Role.HUB_MANAGER, Role.ADMIN),
  aiController.classifyWaste
);
