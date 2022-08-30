import { SignTokenInfo } from '@interfaces/common/tokenInfo';
import httpStatusCode from '@utils/httpStatusCode';
import { Request, Response } from 'express';
import { authService } from '@services/index';
import { successRes, failRes } from '@utils/response';

/**
 *
 * @route POST /api/auth/sign-up
 * @desc 로컬 회원가입
 * @access public
 */
const register = async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body;

  try {
    await authService.isExistEmail(email);
    await authService.isExistNickname(nickname);

    const result: SignTokenInfo = await authService.register(email, password, nickname);

    return res.status(httpStatusCode.CREATED).json(successRes(result));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

export default {
  register
};
