import { Router } from 'express';
import authRouter from '@routes/auth.route';
import storyRouter from '@routes/story.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/stories', storyRouter);

export default router;
