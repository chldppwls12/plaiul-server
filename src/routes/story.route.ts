import { Router } from 'express';
import storyController from '@controllers/story.controller';
import validator from '@middlewares/validator';
import { body, header } from 'express-validator';
import { authJwt } from '@middlewares/token';
import { isValidJwt } from '@middlewares/token';
import { storyUpload } from '@utils/multer';

const router: Router = Router();

/**
 * @todo multer Errhandling
 */
router.post(
  '/',
  authJwt,
  storyUpload.array('images', 3),
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    body('title').exists({ checkFalsy: true }),
    body('content').exists({ checkFalsy: true }),
    body('tags').optional()
  ],
  validator,
  storyController.createStory
);

export default router;
