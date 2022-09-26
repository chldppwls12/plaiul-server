import { User, Tip, TipLike } from '@entities/index';
import { itemsPerPage } from '@utils/constants';

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

export default {
  getMyPage,
  getLikedTips,
  getLikedTipsMetaData
};
