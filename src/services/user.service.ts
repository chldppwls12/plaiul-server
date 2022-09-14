import { Block, User } from '@entities/index';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import AppDataSource from '@config/data-source';

/**
 *
 * @param userIdx
 * @desc 존재하는 유저인지
 */
const isExistUser = async (userIdx: number) => {
  try {
    await User.createQueryBuilder()
      .select()
      .where('userIdx = :userIdx', { userIdx })
      .getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_USERIDX.message,
      ErrorType.INVALID_USERIDX.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param blockedUserIdx
 * @desc 차단 가능한 유저인지
 */
const canBlockUser = async (userIdx: number, blockedUserIdx: number) => {
  const blocked = await Block.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('blockedUserIdx = :blockedUserIdx', { blockedUserIdx })
    .getOne();

  if (blocked) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.ALREADY_BLOCK.message,
      ErrorType.ALREADY_BLOCK.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param blockedUserIdx
 * @desc 유저 차단
 */
const blockUser = async (userIdx: number, blockedUserIdx: number) => {
  try {
    await AppDataSource.transaction(async transactionalEntityManager => {
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(Block)
        .values({
          userIdx,
          blockedUserIdx
        })
        .execute();
    });
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      []
    );
  }
};

export default {
  isExistUser,
  canBlockUser,
  blockUser
};
