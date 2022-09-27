import { User, Tip, TipLike } from '@entities/index';
import { itemsPerPage } from '@utils/constants';
import AppDataSource from '@config/data-source';

/**
 *
 * @param userIdx
 * @desc 마이페이지 조회
 */
const getMyPage = async (userIdx: number) => {
  const result = await User.createQueryBuilder()
    .select(['userIdx', 'nickname', 'IF(profile = "", NULL, profile) AS profile'])
    .where('userIdx = :userIdx', { userIdx })
    .getRawOne();

  return result;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 좋아요한 tip 조회
 */
const getLikedTips = async (userIdx: number, cursor: string | undefined) => {
  let query = TipLike.createQueryBuilder('tipLike')
    .select([
      'tipLike.tipIdx AS tipIdx',
      'tip.title AS title',
      'tip.thumbnail AS thumbnail',
      'tip.createdAt AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('tipLike.tip', 'tip')
    .leftJoin('tip.user', 'user')
    .where('tipLike.userIdx = :userIdx', { userIdx })
    .orderBy('tipLikeIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_LIKE_TIP);

  if (cursor) {
    query = query.andWhere('tipLikeIdx < :cursor', { cursor });
  }

  const tips = await query.getRawMany();

  let result = [];
  for (let tip of tips) {
    const { tipIdx } = tip;
    const likeCnt = await TipLike.createQueryBuilder()
      .select()
      .where('tipIdx = :tipIdx', { tipIdx })
      .getCount();

    result.push({
      tipIdx,
      title: tip.title,
      thumbnail: tip.thumbnail,
      createdAt: tip.createdAt,
      isLiked: true,
      likeCnt,
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
 * @param cursor
 * @desc 좋아요한 tip meta data
 */
const getLikedTipsMetaData = async (userIdx: number, cursor: string | undefined) => {
  const nextCursor = await getLikedTipNextCursor(userIdx, cursor);

  return {
    nextCursor
  };
};

const getLikedTipNextCursor = async (userIdx: number, cursor: string | undefined) => {
  let query = TipLike.createQueryBuilder()
    .select()
    .limit(itemsPerPage.GET_ALL_LIKE_TIP)
    .where('userIdx = :userIdx', { userIdx })
    .orderBy('tipLikeIdx', 'DESC');

  if (cursor) {
    query = query.andWhere('tipLikeIdx < :cursor', { cursor });
  }

  const curPageLikedTips = await query.getMany();
  const nextCursor = curPageLikedTips[curPageLikedTips.length - 1]?.tipLikeIdx;
  if (!nextCursor) return null;

  const nextLikedTips = await TipLike.createQueryBuilder()
    .select()
    .orderBy('tipLikeidx', 'DESC')
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('tipLikeIdx < :nextCursor', { nextCursor })
    .getOne();

  return nextLikedTips ? String(nextCursor) : null;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 내가 쓴 tip 조회
 */
const getMyTips = async (userIdx: number, cursor: string | undefined) => {
  let query = Tip.createQueryBuilder('tip')
    .select([
      'tip.tipIdx AS tipIdx',
      'tip.title AS title',
      'tip.thumbnail AS thumbnail',
      'tip.createdAt AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('tip.user', 'user')
    .where('tip.userIdx = :userIdx', { userIdx })
    .orderBy('tip.tipIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_MY_TIP);

  if (cursor) {
    query = query.andWhere('tipIdx < :cursor', { cursor });
  }

  const tips = await query.getRawMany();

  let result = [];
  for (let tip of tips) {
    const { tipIdx } = tip;
    const isLiked = await TipLike.createQueryBuilder()
      .select()
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('tipIdx = :tipIdx', { tipIdx })
      .getOne();

    const likeCnt = await TipLike.createQueryBuilder()
      .select()
      .where('tipIdx = :tipIdx', { tipIdx })
      .getCount();

    result.push({
      tipIdx,
      title: tip.title,
      thumbnail: tip.thumbnail,
      createdAt: tip.createdAt,
      isLiked: isLiked ? true : false,
      likeCnt,
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
 * @param userIdx
 * @param cursor
 * @desc 내가 쓴 tip meta data
 */
const getMyTipsMetaData = async (userIdx: number, cursor: string | undefined) => {
  const nextCursor = await getMyTipsNextCursor(userIdx, cursor);

  return {
    nextCursor
  };
};

const getMyTipsNextCursor = async (userIdx: number, cursor: string | undefined) => {
  let query = Tip.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .limit(itemsPerPage.GET_ALL_MY_TIP)
    .orderBy('tipIdx', 'DESC');

  if (cursor) {
    query = query.andWhere('tipIdx < :cursor', { cursor });
  }

  const curPageMyTips = await query.getMany();
  const nextCursor = curPageMyTips[curPageMyTips.length - 1]?.tipIdx;
  if (!nextCursor) return null;

  const nextMyTips = await Tip.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('tipIdx < :nextCursor', { nextCursor })
    .orderBy('tipIdx', 'DESC')
    .getOne();

  return nextMyTips ? String(nextCursor) : null;
};

/**
 *
 * @param userIdx
 * @param profile
 * @param defaultProfile
 * @param nickname
 * @desc 프로필 수정
 */
const updateProfile = async (
  userIdx: number,
  profile: string | undefined,
  defaultProfile: boolean,
  nickname: string | undefined
) => {
  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    await transactionalEntityManager.query(
      `UPDATE user SET nickname = IFNULL(?, nickname), profile = IFNULL(?, profile)
        WHERE userIdx = ?`,
      [nickname, profile, userIdx]
    );

    if (defaultProfile) {
      await transactionalEntityManager.query(
        `UPDATE user SET profile = NULL
        WHERE userIdx = ?`,
        [userIdx]
      );
    }
  });
};

export default {
  getMyPage,
  getLikedTips,
  getLikedTipsMetaData,
  getMyTips,
  getMyTipsMetaData,
  updateProfile
};
