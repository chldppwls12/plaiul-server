import { Router } from 'express';
import authRouter from '@routes/auth.route';
import storyRouter from '@routes/story.route';
import userRouter from '@routes/user.route';
import qnaRouter from '@routes/qna.route';
import tipRouter from '@routes/tip.route';
import myPageRouter from '@routes/myPage.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/stories', storyRouter);
router.use('/users', userRouter);
router.use('/qna', qnaRouter);
router.use('/tips', tipRouter);
router.use('/my-page', myPageRouter);

export default router;
