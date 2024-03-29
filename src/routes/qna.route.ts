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

router.post(
  '/:qnaIdx/report',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('qnaIdx').exists({ checkFalsy: true }),
    body('reasonIdx').exists({ checkFalsy: true }).isIn([1, 2, 3, 4, 5, 6, 7]),
    body('reason').optional()
  ],
  validator,
  authJwt,
  qnaController.reportQna
);

router.post(
  '/:qnaIdx/comments',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('qnaIdx').exists({ checkFalsy: true }),
    body('parentCommentIdx').optional(),
    body('content').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  qnaController.createQnaComment
);

router.patch(
  '/:qnaIdx/comments/:commentIdx',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('qnaIdx').exists({ checkFalsy: true }),
    param('commentIdx').exists({ checkFalsy: true }),
    body('content').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  qnaController.updateQnaComment
);

router.delete(
  '/:qnaIdx/comments/:commentIdx',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('qnaIdx').exists({ checkFalsy: true }),
    param('commentIdx').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  qnaController.deleteQnaComment
);

router.patch(
  '/:qnaIdx/like',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('qnaIdx').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  qnaController.changeQnaLike
);

router.post(
  '/:qnaIdx/comments/:commentIdx/report',
  [
    header('authorization').exists({ checkFalsy: true }).custom(isValidJwt),
    param('qnaIdx').exists({ checkFalsy: true }),
    param('commentIdx').exists({ checkFalsy: true }),
    body('reasonIdx').exists({ checkFalsy: true }).isIn([1, 2, 3, 4, 5, 6, 7]),
    body('reason').optional()
  ],
  validator,
  authJwt,
  qnaController.reportQnaComment
);

router.get(
  '/:qnaIdx/comments',
  [
    header('authorization').optional().custom(isValidJwt),
    param('qnaIdx').exists({ checkFalsy: true })
  ],
  validator,
  authJwt,
  qnaController.getQnaComments
);

export default router;
