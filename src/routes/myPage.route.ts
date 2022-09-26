import { Router } from 'express';
import validator from '@middlewares/validator';
import { header, query } from 'express-validator';
import { authJwt } from '@middlewares/token';
import { isValidJwt } from '@middlewares/token';
import { myPageController } from '@controllers/index';

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

export default router;
