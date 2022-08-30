import { SignTokenInfo } from '@interfaces/common/tokenInfo';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET as string;

/**
 *
 * @param userIdx
 * @desc accessToken, refreshToken 발급
 */
const signTokens = (userIdx: number): SignTokenInfo => {
  const payload = {
    userIdx
  };

  const accessToken = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });

  const refreshToken = jwt.sign({}, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '14d'
  });

  return {
    accessToken,
    refreshToken
  };
};

export { signTokens };
