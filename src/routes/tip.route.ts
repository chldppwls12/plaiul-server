import { Router } from 'express';
import { authJwt } from '@middlewares/token';
import { body, header } from 'express-validator';
import validator from '@middlewares/validator';
import { isValidJwt } from '@middlewares/token';
import { tipUpload } from '@utils/multer';
import { tipController } from '@controllers/index';

const router: Router = Router();

router.post(
  '/',
  tipUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'imageList', maxCount: 10 }
  ]),
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    body('title').exists({ checkFalsy: true }),
    body('textList').exists(),
    body('orderList').exists()
  ],
  validator,
  authJwt,
  tipController.createTip
);

router.get(
  '/:tipIdx',
  [header('authorization').optional().custom(isValidJwt)],
  validator,
  authJwt,
  tipController.getTip
);

router.patch(
  '/:tipIdx',
  tipUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'imageList', maxCount: 10 }
  ]),
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    body('title').optional(),
    body('textList').optional(),
    body('orderList').optional().isArray()
  ],
  validator,
  authJwt,
  tipController.updateTip
);

export default router;
