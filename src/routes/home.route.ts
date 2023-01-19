import { Router } from 'express';
import { header } from 'express-validator';
import validator from '@middlewares/validator';
import { isValidJwt } from '@middlewares/token';
import { homeController } from '@controllers/index';

const router: Router = Router();

router.get(
  '/',
  [header('authorization').optional().custom(isValidJwt)],
  validator,
  homeController.getHome
);

export default router;
