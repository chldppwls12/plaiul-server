import { Request, Response } from 'express';
import { successRes, failRes } from '@utils/response';
import httpStatusCode from '@utils/httpStatusCode';
import { userService } from '@services/index';

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

export default {
  blockUser
};
