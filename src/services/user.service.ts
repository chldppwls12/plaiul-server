import { sortTypes, itemsPerPage } from '@utils/constants';
import { Block, User, Tip, TipLike } from '@entities/index';
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

const getUserInfo = async (checkUserdx: number) => {
  const user = await User.createQueryBuilder('user')
    .select(['user.nickname AS nickname', 'user.profile AS profile'])
    .where('userIdx = :userIdx', { userIdx: checkUserdx })
    .getRawOne();

  return {
    nickname: user.nickname,
    profile: user.profile ? user.profile : null
  };
};

/**
 *
 * @param userIdx
 * @param ownerUserIdx
 * @param sort
 * @param cursor
 * @desc 사용자 별 tip 조회
 */
const getTipsByUser = async (
  userIdx: number,
  ownerUserIdx: number,
  sort: string,
  cursor: string | undefined
) => {
  let query = Tip.createQueryBuilder('tip')
    .select([
      'tip.tipIdx AS tipIdx',
      'tip.title AS title',
      'tip.thumbnail AS thumbnail',
      'CONVERT_TZ(tip.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('tip.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['tipIdx AS tipIdx', 'COUNT(*) AS likeCnt'])
          .from(TipLike, 'tipLike')
          .groupBy('tipLike.tipIdx'),
      'getLikeCnt',
      'getLikeCnt.tipIdx = tip.tipIdx'
    )
    .addSelect('IFNULL(likeCnt, 0) AS likeCnt')
    .addSelect(
      `CONCAT(LPAD(IFNULL(likeCnt, 0), 10, '0'), LPAD(IFNULL(tip.tipIdx, 0), 10, '0'))`,
      'customCursor'
    )
    .where('tip.userIdx = :ownerUserIdx', { ownerUserIdx })
    .limit(itemsPerPage.GET_ALL_TIP_BY_USER);

  if (sort === sortTypes.RECENTLY) {
    query = query.orderBy('tip.tipIdx', 'DESC');
    if (cursor) {
      query = query.andWhere('tip.tipIdx < :cursor', { cursor });
    }
  } else if (sort === sortTypes.POPULAR) {
    query = query.orderBy('likeCnt', 'DESC').addOrderBy('tip.tipIdx', 'DESC');
    if (cursor) {
      query = query.andWhere(
        `CONCAT(LPAD(IFNULL(likeCnt, 0), 10, '0'), LPAD(IFNULL(tip.tipIdx, 0), 10, '0')) < :cursor`,
        { cursor }
      );
    }
  }

  const tips = await query.getRawMany();

  let result: any = [];
  for (let tip of tips) {
    const { tipIdx } = tip;
    let isLiked: any = false;
    if (userIdx) {
      isLiked = await TipLike.createQueryBuilder()
        .select()
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('tipIdx = :tipIdx', { tipIdx })
        .getOne();
    }

    result.push({
      tipIdx,
      title: tip.title,
      thumbnail: tip.thumbnail,
      createdAt: tip.createdAt,
      isLiked: isLiked ? true : false,
      likeCnt: tip.likeCnt,
      user: {
        userIdx: tip.userIdx,
        nickname: tip.nickname
      }
    });
  }
  return result;
};

/**
 *
 * @param ownerUserIdx
 * @param sort
 * @param cursor
 * @desc 사용자 별 tip meta data 조회
 */
const getTipsByUserMetaData = async (
  ownerUserIdx: number,
  sort: string,
  cursor: string | undefined
) => {
  const count = await Tip.createQueryBuilder()
    .select()
    .where('userIdx = :ownerUserIdx', { ownerUserIdx })
    .getCount();

  const nextCursor = await getTipsByUserNextCursor(ownerUserIdx, sort, cursor);

  return {
    count,
    nextCursor
  };
};

const getTipsByUserNextCursor = async (
  ownerUserIdx: number,
  sort: string,
  cursor: string | undefined
) => {
  let query = Tip.createQueryBuilder('tip')
    .select([
      'tip.tipIdx AS tipIdx',
      'tip.title AS title',
      'CONVERT_TZ(tip.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('tip.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['tipIdx AS tipIdx', 'COUNT(*) AS likeCnt'])
          .from(TipLike, 'tipLike')
          .groupBy('tipLike.tipIdx'),
      'getLikeCnt',
      'getLikeCnt.tipIdx = tip.tipIdx'
    )
    .addSelect('IFNULL(likeCnt, 0) AS likeCnt')
    .addSelect(
      `CONCAT(LPAD(IFNULL(likeCnt, 0), 10, '0'), LPAD(IFNULL(tip.tipIdx, 0), 10, '0'))`,
      'customCursor'
    )
    .where('tip.userIdx = :ownerUserIdx', { ownerUserIdx })
    .limit(itemsPerPage.GET_ALL_TIP_BY_USER);

  if (sort === sortTypes.RECENTLY) {
    if (cursor) {
      query = query.andWhere('tip.tipIdx < :cursor', { cursor });
    }

    const curPageTips = await query.orderBy('tip.tipIdx', 'DESC').getRawMany();
    const nextCursor = curPageTips[curPageTips.length - 1]?.tipIdx;
    if (!nextCursor) return null;

    const nextTips = await Tip.createQueryBuilder()
      .where('userIdx = :ownerUserIdx', { ownerUserIdx })
      .andWhere('tipIdx < :nextCursor', { nextCursor })
      .getOne();

    return nextTips ? String(nextCursor) : null;
  } else if (sort === sortTypes.POPULAR) {
    if (cursor) {
      query = query.andWhere(
        `CONCAT(LPAD(IFNULL(likeCnt, 0), 10, '0'), LPAD(IFNULL(tip.tipIdx, 0), 10, '0')) < :cursor`,
        { cursor }
      );
    }

    const curPageTips = await query
      .orderBy('likeCnt', 'DESC')
      .addOrderBy('tip.tipIdx', 'DESC')
      .getRawMany();
    const nextCursor = curPageTips[curPageTips.length - 1]?.customCursor;
    if (!nextCursor) return null;

    const nextTips = await Tip.createQueryBuilder('tip')
      .select()
      .leftJoin(
        qb =>
          qb
            .select(['tipIdx AS tipIdx', 'COUNT(*) AS likeCnt'])
            .from(TipLike, 'tipLike')
            .groupBy('tipLike.tipIdx'),
        'getLikeCnt',
        'getLikeCnt.tipIdx = tip.tipIdx'
      )
      .addSelect('IFNULL(likeCnt, 0) AS likeCnt')
      .addSelect(
        `CONCAT(LPAD(IFNULL(likeCnt, 0), 10, '0'), LPAD(IFNULL(tip.tipIdx, 0), 10, '0'))`,
        'customCursor'
      )
      .where('tip.userIdx = :ownerUserIdx', { ownerUserIdx })
      .andWhere(
        `CONCAT(LPAD(IFNULL(likeCnt, 0), 10, '0'), LPAD(IFNULL(tip.tipIdx, 0), 10, '0')) < :nextCursor`,
        { nextCursor }
      )
      .getRawOne();

    return nextTips ? nextCursor : null;
  }
};

export default {
  isExistUser,
  canBlockUser,
  blockUser,
  getUserInfo,
  getTipsByUser,
  getTipsByUserMetaData
};
