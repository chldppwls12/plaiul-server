import { Router } from 'express';
import storyController from '@controllers/story.controller';
import validator from '@middlewares/validator';
import { body, header, query, param } from 'express-validator';
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

router.get(
  '/',
  authJwt,
  [
    query('sort').exists({ checkFalsy: true }).isIn(['popular', 'recently']),
    query('cursor').optional()
  ],
  validator,
  storyController.getStories
);

router.get(
  '/:storyIdx',
  authJwt,
  [param('storyIdx').exists({ checkFalsy: true })],
  validator,
  storyController.getStory
);

router.patch(
  '/:storyIdx',
  authJwt,
  storyUpload.array('images', 3),
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('storyIdx').exists({ checkFalsy: true }),
    body('title').optional(),
    body('content').optional(),
    body('tags').optional()
  ],
  validator,
  storyController.updateStory
);

export default router;
