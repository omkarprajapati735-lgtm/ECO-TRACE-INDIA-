import { Router } from 'express';
import { pickupController } from '../controllers/pickup.controller';

export const categoryRouter = Router();

categoryRouter.get('/', pickupController.getCategories);
