import { Router } from 'express';

const router = Router();

router.get('/me', (req, res) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }
  res.json(req.user);
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
      return;
    }
    req.session.destroy(() => res.sendStatus(200));
  });
});

export default router;
