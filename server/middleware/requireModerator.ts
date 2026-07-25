import { type Request, type Response, type NextFunction } from 'express';

function requireModerator(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { role } = req.user;
  if (role !== 'MODERATOR' && role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}

export default requireModerator;
