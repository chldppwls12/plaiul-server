import { Request, Response } from 'express';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { successRes, failRes, successResWithMeta } from '@utils/response';
import { myPageService } from '@services/index';

/**
 *
 * @route GET /api/my-page
 * @desc 마이페이지 조회
 * @access private
 */
const getMyPage = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  try {
    const result = await myPageService.getMyPage(userIdx);

    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    } else {
      return res
        .status(httpStatusCode.INTERAL_SERVER_ERROR)
        .json(
          failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
        );
    }
  }
};

/**
 *
 * @route GET /api/my-page/liked/tips
 * @desc 좋아요한 grower's tip 조회
 * @access private
 */
const getLikedTips = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const cursor = req.query?.cursor as string;

  try {
    const result = await myPageService.getLikedTips(userIdx, cursor);
    const meta = await myPageService.getLikedTipsMetaData(userIdx, cursor);
    return res.status(httpStatusCode.OK).json(successResWithMeta(result, meta));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    } else {
      return res
        .status(httpStatusCode.INTERAL_SERVER_ERROR)
        .json(
          failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
        );
    }
  }
};

export default { getMyPage, getLikedTips };
