import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { authRouter } from './auth.routes';
import { pickupRouter } from './pickup.routes';
import { categoryRouter } from './category.routes';
import { aiRouter } from './ai.routes';
import { paymentRouter } from './payment.routes';
import { walletRouter } from './wallet.routes';
import { hubRouter } from './hub.routes';
import { batchRouter } from './batch.routes';
import { recyclerRouter } from './recycler.routes';
import { eprRouter } from './epr.routes';
import { adminRouter } from './admin.routes';

export const apiRouter = Router();

apiRouter.get('/health', healthController.getHealth);

apiRouter.use('/auth', authRouter);
apiRouter.use('/pickups', pickupRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/wallets', walletRouter);
apiRouter.use('/hubs', hubRouter);
apiRouter.use('/batches', batchRouter);
apiRouter.use('/recyclers', recyclerRouter);
apiRouter.use('/epr', eprRouter);
apiRouter.use('/admin', adminRouter);
