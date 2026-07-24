import { type Request, type Response, type NextFunction } from 'express';

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export default requireAuth;
