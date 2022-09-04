import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { ErrorType, CustomError } from '@utils/error';
import redisClient from '@config/redis';
import { Tokens } from '@interfaces/common/tokenInfo';
import { VerifyTokenResult } from '@interfaces/common/tokenInfo';
import httpStatusCode from './httpStatusCode';

const jwtSecret = process.env.JWT_SECRET as string;

/**
 *
 * @param userIdx
 * @desc accessToken, refreshToken 발급
 */
const signTokens = async (userIdx: number): Promise<Tokens> => {
  const payload = {
    userIdx
  };

  const accessToken = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '2h'
  });

  const refreshToken = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '14d'
  });

  await redisClient.setEx(`${userIdx}_refreshToken`, 14 * 24 * 60 * 60, refreshToken);

  return {
    accessToken,
    refreshToken
  };
};

/**
 *
 * @param token
 * @desc accessToken or refreshToken 유효 여부 확인
 */
const verifyToken = (token: string): VerifyTokenResult => {
  let result: VerifyTokenResult = {
    valid: true
  };

  try {
    const decoded: any = jwt.verify(token, jwtSecret);
    result = {
      valid: true,
      userIdx: decoded.userIdx
    };
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      result = {
        valid: false,
        errCode: ErrorType.EXPIRED_TOKEN.code
      };
    } else {
      result = {
        valid: false,
        errCode: ErrorType.INVALID_TOKEN.code
      };
    }
  }
  return result;
};

/**
 *
 * @param accessToken
 * @param refreshToken
 * @desc 토큰 재발급
 * 1. accessToken 검증 실패 => 유효하지 않은 토큰
 * 2. accessToken 만료 여부 확인
 * 2.1 유효할 경우 에러 처리
 * 2.2 만료된 경우, refreshToken 만료 => 새로 로그인 필요
 * 2.3 만료된 경우, refreshToken 유효 => 토큰 재발급
 */
const tokenRefreshUtil = async (accessToken: string, refreshToken: string): Promise<Tokens> => {
  const verifyAccessTokenResult: VerifyTokenResult = verifyToken(accessToken);

  //검증 실패
  if (
    !verifyAccessTokenResult.valid &&
    verifyAccessTokenResult.errCode === ErrorType.INVALID_TOKEN.code
  ) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_TOKEN.message,
      ErrorType.INVALID_TOKEN.code,
      []
    );
  }
  //accessToken 기간 유효
  else if (verifyAccessTokenResult.valid) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.VALID_TOKEN.message,
      ErrorType.VALID_TOKEN.code,
      []
    );
  }

  //accessToken 만료 이후
  const verifyRefreshTokenResult: VerifyTokenResult = verifyToken(refreshToken);

  if (!verifyRefreshTokenResult.valid) {
    //refreshToken 검증 실패
    if (verifyRefreshTokenResult.errCode === ErrorType.INVALID_TOKEN.code) {
      throw new CustomError(
        httpStatusCode.BAD_REQUEST,
        ErrorType.INVALID_TOKEN.message,
        ErrorType.INVALID_TOKEN.code,
        []
      );
    }
    //refreshToken 만료
    else if (verifyRefreshTokenResult.errCode === ErrorType.EXPIRED_REFRESH_TOKEN.code) {
      throw new CustomError(
        httpStatusCode.BAD_REQUEST,
        ErrorType.EXPIRED_REFRESH_TOKEN.message,
        ErrorType.EXPIRED_REFRESH_TOKEN.code,
        []
      );
    }
  }

  const userIdx = verifyRefreshTokenResult.userIdx as number;

  const result = await signTokens(userIdx);
  return result;
};

export { signTokens, tokenRefreshUtil };
