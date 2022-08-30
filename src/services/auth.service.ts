import AppDataSource from '@config/data-source';
import { User } from '@entities/index';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { signTokens } from '@utils/jwt';
import { pwdEncrpyt } from '@utils/password';
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

    return signTokens(userIdx);
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      [err.message]
    );
  }
};

export default {
  isExistEmail,
  isExistNickname,
  register
};
