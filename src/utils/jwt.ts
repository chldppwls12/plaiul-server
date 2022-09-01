import redisClient from '@config/redis';
import { SignTokenInfo } from '@interfaces/common/tokenInfo';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET as string;

/**
 *
 * @param userIdx
 * @desc accessToken, refreshToken 발급
 */
const signTokens = async (userIdx: number): Promise<SignTokenInfo> => {
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

  await redisClient.setEx(`${userIdx}_refreshToken`, 14 * 24 * 60 * 60, refreshToken);

  return {
    accessToken,
    refreshToken
  };
};

export { signTokens };
