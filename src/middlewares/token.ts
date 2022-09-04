import { CustomValidator } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const isValidJwt: CustomValidator = jwtFormat => {
  if (jwtFormat.split(' ').length !== 2 || jwtFormat.split(' ')[0] !== 'Bearer') {
    throw new Error('잘못된 JWT 포맷');
  }
  return true;
};

export const setTokens = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  let refreshToken = req.headers.refreshtoken as string;
  refreshToken = refreshToken.split(' ')[1];

  req.headers.accessToken = accessToken;
  req.headers.refreshToken = refreshToken;

  next();
};
