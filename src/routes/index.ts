import { Router } from 'express';
import authRouter from '@routes/auth.route';
import storyRouter from '@routes/story.route';
import userRouter from '@routes/user.route';
import qnaRouter from '@routes/qna.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/stories', storyRouter);
router.use('/users', userRouter);
router.use('/qna', qnaRouter);

export default router;
