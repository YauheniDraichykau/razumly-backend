import 'express';
import { JwtPayload } from '@/modules/auth/types/jwt-payload';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}
