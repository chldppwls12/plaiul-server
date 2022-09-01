import { Router } from 'express';
import { body, query } from 'express-validator';
import { authController } from '@controllers/index';
import validator from '@middlewares/validator';

const router: Router = Router();

router.post(
  '/',
  [body('email').exists({ checkFalsy: true }).isEmail()],
  validator,
  authController.sendCode
);

router.get(
  '/',
  [query('email').optional().isEmail(), query('code').optional(), query('nickname').optional()],
  validator,
  authController.verifyCodeOrNickname
);

router.post(
  '/sign-up',
  [
    body('email').exists({ checkFalsy: true }).isEmail(),
    body('password').exists({ checkFalsy: true }),
    body('nickname').exists({ checkFalsy: true })
  ],
  validator,
  authController.register
);

router.post(
  '/login',
  [
    body('email').exists({ checkFalsy: true }).isEmail(),
    body('password').exists({ checkFalsy: true })
  ],
  validator,
  authController.login
);

export default router;
