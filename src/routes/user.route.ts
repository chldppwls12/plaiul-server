import { Router } from 'express';
import { authJwt } from '@middlewares/token';
import { body, header } from 'express-validator';
import validator from '@middlewares/validator';
import { userController } from '@controllers/index';
import { isValidJwt } from '@middlewares/token';

const router: Router = Router();

router.post(
  '/block',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    body('userIdx').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  userController.blockUser
);

export default router;
