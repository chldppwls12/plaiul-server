import { failRes } from '@utils/response';
import httpStatusCode from '@utils/httpStatusCode';
import { ErrorType } from '@utils/error';
import { CustomValidator } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwt';

export const isValidJwt: CustomValidator = jwtFormat => {
  if (jwtFormat.split(' ').length !== 2 || jwtFormat.split(' ')[0] !== 'Bearer') {
    throw new Error('잘못된 JWT 포맷');
  }
  return true;
};

export const authJwt = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1] as string;
  if (accessToken) {
    const result = verifyToken('accessToken', accessToken);

    if (!result.valid) {
      if (result.errCode === ErrorType.EXPIRED_TOKEN.code) {
        return res
          .status(httpStatusCode.BAD_REQUEST)
          .json(failRes(ErrorType.EXPIRED_TOKEN.code, ErrorType.EXPIRED_TOKEN.message, []));
      } else if (result.errCode === ErrorType.INVALID_TOKEN.code) {
        return res
          .status(httpStatusCode.BAD_REQUEST)
          .json(failRes(ErrorType.INVALID_TOKEN.code, ErrorType.INVALID_TOKEN.message, []));
      }
    }

    req.userIdx = result.userIdx;
  }
  next();
};

export const setTokens = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  let refreshToken = req.headers.refreshtoken as string;
  refreshToken = refreshToken.split(' ')[1];

  req.headers.accessToken = accessToken;
  req.headers.refreshToken = refreshToken;

  next();
};
