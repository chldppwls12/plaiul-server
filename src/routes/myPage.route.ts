import { Router } from 'express';
import validator from '@middlewares/validator';
import { header, query, body } from 'express-validator';
import { authJwt } from '@middlewares/token';
import { isValidJwt } from '@middlewares/token';
import { myPageController } from '@controllers/index';
import { userUpload } from '@utils/multer';
import { communityType } from '@utils/constants';

const router: Router = Router();

router.get(
  '/',
  [header('authorization').exists({ checkFalsy: true }).custom(isValidJwt)],
  validator,
  authJwt,
  myPageController.getMyPage
);

router.get(
  '/liked/tips',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    query('cursor').optional().isString()
  ],
  validator,
  authJwt,
  myPageController.getLikedTips
);

router.get(
  '/tips',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    query('cursor').optional().isString()
  ],
  validator,
  authJwt,
  myPageController.getMyTips
);

router.patch(
  '/profile',
  userUpload.single('profile'),
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    body('defaultProfile').optional().isBoolean(),
    body('nickname').optional()
  ],
  validator,
  authJwt,
  myPageController.updateProfile
);

router.get(
  '/liked/community',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    query('type').exists({ checkFalsy: true }).isIn([communityType.STORY, communityType.QNA]),
    query('cursor').optional().isString()
  ],
  validator,
  authJwt,
  myPageController.getLikedCommunity
);

router.get(
  '/community/comments',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    query('type').exists({ checkFalsy: true }).isIn([communityType.STORY, communityType.QNA]),
    query('cursor').optional().isString()
  ],
  validator,
  authJwt,
  myPageController.getUserCommunityComment
);

router.get(
  '/community',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    query('type').exists({ checkFalsy: true }).isIn([communityType.STORY, communityType.QNA]),
    query('cursor').optional().isString()
  ],
  validator,
  authJwt,
  myPageController.getUserCommunity
);

export default router;
