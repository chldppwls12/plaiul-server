import { Router } from 'express';
import validator from '@middlewares/validator';
import { header } from 'express-validator';
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

export default router;
