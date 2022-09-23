import { Request, Response } from 'express';
import { successRes, failRes } from '@utils/response';
import httpStatusCode from '@utils/httpStatusCode';
import { userService } from '@services/index';
import { CustomError } from '@utils/error';
import { ErrorType } from '@utils/error';

/**
 *
 * @routes POST /api/users/block
 * @desc 사용자 차단
 * @access private
 */
const blockUser = async (req: Request, res: Response) => {
  const { userIdx: blockedUserIdx } = req.body;
  const userIdx = req.userIdx as number;
  try {
    await userService.isExistUser(blockedUserIdx);
    await userService.canBlockUser(userIdx, blockedUserIdx);
    await userService.blockUser(userIdx, blockedUserIdx);

    return res.status(httpStatusCode.OK).json(successRes({ blocked: true }));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes GET /api/users/:userIdx
 * @desc 사용자 별 프로필 조회
 * @access public
 */
const getUserInfo = async (req: Request, res: Response) => {
  const checkUserIdx = parseInt(req.params.userIdx);
  try {
    await userService.isExistUser(checkUserIdx);
    const result = await userService.getUserInfo(checkUserIdx);

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

export default {
  blockUser,
  getUserInfo
};
