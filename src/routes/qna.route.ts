import { Router } from 'express';
import { body, header } from 'express-validator';
import validator from '@middlewares/validator';
import { isValidJwt } from '@middlewares/token';
import { qnaController } from '@controllers/index';
import { authJwt } from '@middlewares/token';

const router: Router = Router();

router.post(
  '/',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    body('title').exists({ checkFalsy: true }),
    body('content').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  qnaController.createQna
);

export default router;
