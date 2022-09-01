import { SignTokenInfo } from '@interfaces/common/tokenInfo';
import httpStatusCode from '@utils/httpStatusCode';
import { Request, Response } from 'express';
import { authService } from '@services/index';
import { successRes, failRes } from '@utils/response';

/**
 *
 * @routes POST /api/auth
 * @desc 회원가입-인증번호 발행
 * @access public
 */
const sendCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    await authService.isExistEmail(email);

    const result = await authService.sendCode(email);
    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes GET /api/auth/
 * @desc 회원가입-인증번호 검증 or 회원가입-닉네임 검증
 * @access public
 */
const verifyCodeOrNickname = async (req: Request, res: Response) => {
  const email = req.query?.email as string;
  const code = req.query?.code as string;
  const nickname = req.query?.nickname as string;

  try {
    //회원가입-인증번호 검증
    if (email && code) {
      await authService.isExistEmail(email);
      await authService.verifyCode(email, code);
    }
    //회원가입-닉네임 검증
    else if (nickname) {
      await authService.isExistNickname(nickname);
    }
    return res.status(httpStatusCode.OK).json(successRes({ verified: true }));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

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
  sendCode,
  verifyCodeOrNickname,
  register
};
