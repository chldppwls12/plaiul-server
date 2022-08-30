import { Router } from 'express';
import { body, check } from 'express-validator';
import { authController } from '@controllers/index';
import validator from '@middlewares/validator';

const router: Router = Router();

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

export default router;
