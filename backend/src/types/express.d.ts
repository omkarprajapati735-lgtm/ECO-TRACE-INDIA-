import { AuthUserPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      id?: string;
      requestId?: string;
    }
  }
}
