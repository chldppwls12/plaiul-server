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
  storyUpload.array('images', 3),
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    body('title').exists({ checkFalsy: true }),
    body('content').exists({ checkFalsy: true }),
    body('tags').optional()
  ],
  validator,
  authJwt,
  storyController.createStory
);

router.get(
  '/',
  [
    query('sort').exists({ checkFalsy: true }).isIn(['popular', 'recently']),
    query('cursor').optional()
  ],
  validator,
  authJwt,
  storyController.getStories
);

router.get(
  '/:storyIdx',
  [param('storyIdx').exists({ checkFalsy: true })],
  validator,
  authJwt,
  storyController.getStory
);

router.patch(
  '/:storyIdx',
  storyUpload.array('images', 3),
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('storyIdx').exists({ checkFalsy: true }),
    body('title').optional(),
    body('content').optional(),
    body('tags').optional()
  ],
  validator,
  authJwt,
  storyController.updateStory
);

router.delete(
  '/:storyIdx',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('storyIdx').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  storyController.deleteStory
);

router.post(
  '/:storyIdx/report',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('storyIdx').exists({ checkFalsy: true }),
    body('reasonIdx').exists({ checkFalsy: true }).isIn([1, 2, 3, 4, 5, 6, 7]),
    body('reason').optional()
  ],
  validator,
  authJwt,
  storyController.reportStory
);

router.patch(
  '/:storyIdx/like',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('storyIdx').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  storyController.changeStoryLike
);

export default router;
