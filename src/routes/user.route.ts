import { sortTypes } from '@utils/constants';
import { Router } from 'express';
import { authJwt } from '@middlewares/token';
import { body, header, query } from 'express-validator';
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

router.get(
  '/:userIdx/tips',
  [
    header('authorization').optional().custom(isValidJwt),
    query('sort').exists({ checkFalsy: true }).isIn([sortTypes.RECENTLY, sortTypes.POPULAR]),
    query('cursor').optional().isString()
  ],
  validator,
  authJwt,
  userController.getTipsByUser
);

router.get(
  '/:userIdx',
  [header('authorization').optional().custom(isValidJwt)],
  validator,
  authJwt,
  userController.getUserInfo
);

export default router;
