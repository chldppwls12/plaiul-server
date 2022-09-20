import { Router } from 'express';
import { body, header, param, query } from 'express-validator';
import validator from '@middlewares/validator';
import { isValidJwt } from '@middlewares/token';
import { qnaController } from '@controllers/index';
import { authJwt } from '@middlewares/token';

const router: Router = Router();

router.get(
  '/',
  [
    header('authorization').optional().custom(isValidJwt),
    query('cursor').optional(),
    query('sort').exists({ checkFalsy: true }).isIn(['popular', 'recently'])
  ],
  validator,
  authJwt,
  qnaController.getQnas
);

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

router.get(
  '/:qnaIdx',
  [
    header('authorization').optional().custom(isValidJwt),
    param('qnaIdx').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  qnaController.getQna
);

router.patch(
  '/:qnaIdx',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    body('title').optional(),
    body('content').optional()
  ],
  validator,
  authJwt,
  qnaController.updateQna
);

router.delete(
  '/:qnaIdx',
  [header('authorization').exists({ checkFalsy: true }).custom(isValidJwt)],
  validator,
  authJwt,
  qnaController.deleteQna
);

export default router;
