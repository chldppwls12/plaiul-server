import { PasswordDTO } from '@interfaces/common/passwordInfo';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import AppDataSource from '@config/data-source';
import { User } from '@entities/index';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { signTokens } from '@utils/jwt';
import { checkIdPwdVaild, pwdEncrpyt } from '@utils/password';
import { getRandomCode } from '@utils/verificationCode';
import redisClient from '@config/redis';

/**
 *
 * @param email
 * @desc 회원가입-인증번호 발행
 */
const sendCode = async (email: string) => {
  //nodemailer 발송자 선언
  const transpoter = nodemailer.createTransport({
    service: 'GMail', //메일 서비스 이름
    port: 587, //메일 서버 포트 (보안을 위해 TLS를 지원하는 587 포트 사용 권장)
    host: 'smtp.gmail.com', //메일 서버 도메인 또는 IP
    secure: true, //TLS 사용 여부
    requireTLS: true, //TLS 연결 시도 여부
    auth: {
      user: process.env.MAILER_EMAIL,
      pass: process.env.MAILER_PASSWORD
    }
  });

  const code = await getRandomCode();

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.MAILER_EMAIL, //발송자 이메일 주소
    to: email, //수신자 이메일
    subject: '[플레울] 인증번호', //발송 이메일 제목
    html: `플레울 인증번호는 <b>${code}</b>입니다.` //발송 이메일 내용(html content)
  };

  try {
    await transpoter.sendMail(mailOptions);
    await redisClient.setEx(email, 3 * 60, code);
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      [err.message]
    );
  }

  return { sent: true };
};

/**
 *
 * @param email
 * @desc 존재하는 이메일인지 판별
 */
const isExistEmail = async (email: string) => {
  const result = await User.createQueryBuilder('user')
    .select(['user.email'])
    .where('user.email = :email', { email })
    .getOne();

  if (result) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.EXIST_EMAIL.message,
      ErrorType.EXIST_EMAIL.code,
      []
    );
  }
};

/**
 * @param nickname
 * @desc 존재하는 닉네임인지 판별
 */
const isExistNickname = async (nickname: string) => {
  const result = await User.createQueryBuilder('user')
    .select(['user.nickname'])
    .where('user.nickname = :nickname', { nickname })
    .getOne();

  if (result) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.EXIST_NICKNAME.message,
      ErrorType.EXIST_NICKNAME.code,
      []
    );
  }
};

/**
 *
 * @param email
 * @param code
 * @desc 인증번호 검증
 */
const verifyCode = async (email: string, code: string) => {
  const verifiedCode = await redisClient.get(email);
  if (!verifiedCode || verifiedCode !== code) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_AUTHCODE.message,
      ErrorType.INVALID_AUTHCODE.code,
      []
    );
  }
};

/**
 *
 * @param email
 * @param password
 * @param nickname
 * @desc 로컬 회원가입
 */
const register = async (email: string, password: string, nickname: string): Promise<any> => {
  try {
    const { encryptedPwd, iv, salt } = pwdEncrpyt(password);

    let createUser: any;
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      createUser = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            email,
            password: encryptedPwd,
            nickname,
            iv,
            salt
          }
        ])
        .execute();
    });

    const { userIdx } = createUser!.identifiers[0];

    return userIdx;
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      [err.message]
    );
  }
};

/**
 *
 * @param email
 * @param password
 * @desc 존재하는 회원정보인지
 * @returns userIdx
 */
const isExistUserInfo = async (email: string, inputPwd: string) => {
  //이메일 확인
  const isExistEmail = await User.findOneBy({ email });
  if (!isExistEmail) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_USER_INFO.message,
      ErrorType.INVALID_USER_INFO.code,
      []
    );
  }

  //패스워드 확인
  const user = await User.createQueryBuilder('user')
    .where('user.email = :email', { email })
    .getOne();
  const { iv, salt, password: encryptedPwd, userIdx } = user as User;
  const originPwd: PasswordDTO = { iv, salt, encryptedPwd };
  const result = checkIdPwdVaild(inputPwd, originPwd);

  if (!result) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_USER_INFO.message,
      ErrorType.INVALID_USER_INFO.code,
      []
    );
  }

  return userIdx;
};

export default {
  sendCode,
  isExistEmail,
  isExistNickname,
  verifyCode,
  register,
  isExistUserInfo
};
