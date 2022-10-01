import { Qna } from './../entities/qna/Qna';
import { StoryImage } from './../entities/story/Image';
import {
  User,
  Tip,
  TipLike,
  StoryLike,
  StoryComment,
  QnaLike,
  QnaComment,
  Block,
  Story
} from '@entities/index';
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

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 좋아요한 스토리 조회
 */
const getLikedStory = async (userIdx: number, cursor: string | undefined) => {
  const blocked = await Block.createQueryBuilder()
    .select('blockedUserIdx')
    .where('userIdx = :userIdx', { userIdx })
    .getRawMany();

  let blockedUsers = blocked.map(item => item.blockedUserIdx);
  if (blockedUsers.length === 0) {
    blockedUsers = [-1];
  }

  let query = StoryLike.createQueryBuilder('storyLike')
    .select([
      'storyLike.storyLikeIdx AS storyLikeIdx',
      'story.storyIdx AS storyIdx',
      'story.title AS title',
      'CONVERT_TZ(story.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'story.content AS content',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('storyLike.story', 'story')
    .leftJoin('story.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['storyComment.storyIdx AS storyIdx', 'COUNT(*) AS commentCnt'])
          .from(StoryComment, 'storyComment')
          .groupBy('storyComment.storyIdx'),
      'getCommentCnt',
      'getCommentCnt.storyIdx = story.storyIdx'
    )
    .addSelect('IFNULL(commentCnt, 0) AS commentCnt')
    .where('storyLike.userIdx = :userIdx', { userIdx })
    .andWhere('story.userIdx NOT IN (:...blockedUsers)', { blockedUsers })
    .orderBy('storyLike.storyLikeIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_LIKED_STORY);

  if (cursor) {
    query = query.andWhere('storyLikeIdx < :cursor', { cursor });
  }

  const stories = await query.getRawMany();

  let result: any = [];
  for (let story of stories) {
    const { storyIdx } = story;
    const getThumbnail = await StoryImage.createQueryBuilder('storyImage')
      .select(['storyImage.url'])
      .where('storyImage.storyIdx = :storyIdx', { storyIdx })
      .getOne();

    const likeCnt = await StoryLike.createQueryBuilder()
      .select()
      .where('storyIdx = :storyIdx', { storyIdx })
      .getCount();

    result.push({
      storyIdx,
      title: story.title,
      thumbnail: getThumbnail?.url,
      createdAt: story.createdAt,
      content: story.content,
      isLiked: true,
      likeCnt,
      commentCnt: story.commentCnt,
      user: {
        userIdx: story.userIdx,
        nickname: story.nickname
      }
    });
  }
  return result;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @returns 좋아요한 스토리 meta data 조회
 */
const getLikedStoryMetaData = async (userIdx: number, cursor: string | undefined) => {
  const blocked = await Block.createQueryBuilder()
    .select('blockedUserIdx')
    .where('userIdx = :userIdx', { userIdx })
    .getRawMany();

  let blockedUsers = blocked.map(item => item.blockedUserIdx);
  if (blockedUsers.length === 0) {
    blockedUsers = [-1];
  }

  const nextCursor = await getLikedStoryNextCursor(userIdx, cursor, blockedUsers);

  return {
    nextCursor
  };
};

const getLikedStoryNextCursor = async (
  userIdx: number,
  cursor: string | undefined,
  blockedUsers: number[]
) => {
  let query = StoryLike.createQueryBuilder('storyLike')
    .select()
    .leftJoin('storyLike.story', 'story')
    .where('storyLike.userIdx = :userIdx', { userIdx })
    .andWhere('story.userIdx NOT IN (:...blockedUsers)', { blockedUsers })
    .orderBy('storyLike.storyLikeIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_LIKED_STORY);

  if (cursor) {
    query = query.andWhere('storyLikeIdx < :cursor', { cursor });
  }

  const curPageLikedStory = await query.getMany();
  const nextCursor = curPageLikedStory[curPageLikedStory.length - 1]?.storyLikeIdx;
  if (!nextCursor) return null;

  const nextLikedStory = await StoryLike.createQueryBuilder('storyLike')
    .select()
    .leftJoin('storyLike.story', 'story')
    .where('storyLike.userIdx = :userIdx', { userIdx })
    .andWhere('storyLikeIdx < :nextCursor', { nextCursor })
    .andWhere('story.userIdx NOT IN (:...blockedUsers)', { blockedUsers })
    .orderBy('storyLikeIdx', 'DESC')
    .getOne();

  return nextLikedStory ? String(nextCursor) : null;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 좋아요한 qna 조회
 */
const getLikedQna = async (userIdx: number, cursor: string | undefined) => {
  const blocked = await Block.createQueryBuilder()
    .select('blockedUserIdx')
    .where('userIdx = :userIdx', { userIdx })
    .getRawMany();

  let blockedUsers = blocked.map(item => item.blockedUserIdx);
  if (blockedUsers.length === 0) {
    blockedUsers = [-1];
  }

  let query = QnaLike.createQueryBuilder('qnaLike')
    .select([
      'qnaLike.qnaLikeIdx AS qnaLikeIdx',
      'qna.qnaIdx AS qnaIdx',
      'qna.title AS title',
      'CONVERT_TZ(qna.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'qna.content AS content',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('qnaLike.qna', 'qna')
    .leftJoin('qna.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['qnaComment.qnaIdx AS qnaIdx', 'COUNT(*) AS commentCnt'])
          .from(QnaComment, 'qnaComment')
          .groupBy('qnaComment.qnaIdx'),
      'getCommentCnt',
      'getCommentCnt.qnaIdx = qna.qnaIdx'
    )
    .addSelect('IFNULL(commentCnt, 0) AS commentCnt')
    .where('qnaLike.userIdx = :userIdx', { userIdx })
    .andWhere('qna.userIdx NOT IN (:...blockedUsers)', { blockedUsers })
    .orderBy('qnaLike.qnaLikeIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_LIKED_QNA);

  if (cursor) {
    query = query.andWhere('qnaLikeIdx < :cursor', { cursor });
  }

  const qnas = await query.getRawMany();

  let result: any = [];
  for (let qna of qnas) {
    const { qnaIdx } = qna;
    const likeCnt = await QnaLike.createQueryBuilder()
      .select()
      .where('qnaIdx = :qnaIdx', { qnaIdx })
      .getCount();

    result.push({
      qnaIdx,
      title: qna.title,
      content: qna.content,
      isLiked: true,
      likeCnt,
      commentCnt: qna.commentCnt,
      createdAt: qna.createdAt,
      user: {
        userIdx: qna.userIdx,
        nickname: qna.nickname
      }
    });
  }
  return result;
};

const getLikedQnaMetaData = async (userIdx: number, cursor: string | undefined) => {
  const blocked = await Block.createQueryBuilder()
    .select('blockedUserIdx')
    .where('userIdx = :userIdx', { userIdx })
    .getRawMany();

  let blockedUsers = blocked.map(item => item.blockedUserIdx);
  if (blockedUsers.length === 0) {
    blockedUsers = [-1];
  }

  const nextCursor = await getLikedQnaNextCursor(userIdx, cursor, blockedUsers);

  return {
    nextCursor
  };
};

const getLikedQnaNextCursor = async (
  userIdx: number,
  cursor: string | undefined,
  blockedUsers: number[]
) => {
  let query = QnaLike.createQueryBuilder('qnaLike')
    .select()
    .leftJoin('qnaLike.qna', 'qna')
    .where('qnaLike.userIdx = :userIdx', { userIdx })
    .andWhere('qna.userIdx NOT IN (:...blockedUsers)', { blockedUsers })
    .orderBy('qnaLikeIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_LIKED_QNA);

  if (cursor) {
    query = query.andWhere('qnaLikeIdx < :cursor', { cursor });
  }

  const curPageLikedQna = await query.getMany();
  const nextCursor = curPageLikedQna[curPageLikedQna.length - 1]?.qnaLikeIdx;
  if (!nextCursor) return null;

  const nextLikedQna = await QnaLike.createQueryBuilder('qnaLike')
    .select()
    .leftJoin('qnaLike.qna', 'qna')
    .where('qnaLike.userIdx = :userIdx', { userIdx })
    .andWhere('qna.userIdx NOT IN (:...blockedUsers)', { blockedUsers })
    .andWhere('qnaLikeIdx < :nextCursor', { nextCursor })
    .orderBy('qnaLikeIdx', 'DESC')
    .getOne();

  return nextLikedQna ? String(nextCursor) : null;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 내가 쓴 스토리 조회
 */
const getUserStory = async (userIdx: number, cursor: string | undefined) => {
  let query = Story.createQueryBuilder('story')
    .select([
      'story.storyIdx AS storyIdx',
      'story.title AS title',
      'CONVERT_TZ(story.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'story.content AS content',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('story.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['storyComment.storyIdx AS storyIdx', 'COUNT(*) AS commentCnt'])
          .from(StoryComment, 'storyComment')
          .groupBy('storyComment.storyIdx'),
      'getCommentCnt',
      'getCommentCnt.storyIdx = story.storyIdx'
    )
    .addSelect('IFNULL(commentCnt, 0) AS commentCnt')
    .where('story.userIdx = :userIdx', { userIdx })
    .orderBy('story.storyIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_USERS_STORY);

  if (cursor) {
    query = query.andWhere('story.storyIdx < :cursor', { cursor });
  }

  const stories = await query.getRawMany();

  let result = [];
  for (let story of stories) {
    const { storyIdx } = story;
    const getThumbnail = await StoryImage.createQueryBuilder()
      .select()
      .where('storyIdx = :storyIdx', { storyIdx })
      .getOne();

    const isLiked = await StoryLike.createQueryBuilder()
      .select()
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('storyIdx = :storyIdx', { storyIdx })
      .getOne();

    const likeCnt = await StoryLike.createQueryBuilder()
      .select()
      .where('storyIdx = :storyIdx', { storyIdx })
      .getCount();

    result.push({
      storyIdx,
      title: story.title,
      thumbnail: getThumbnail?.url,
      createdAt: story.createdAt,
      content: story.content,
      isLiked: isLiked ? true : false,
      likeCnt,
      commentCnt: story.commentCnt,
      user: {
        userIdx: story.userIdx,
        nickname: story.nickname
      }
    });
  }

  return result;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 내가 쓴 스토리 meta data
 */
const getUserStoryMetaData = async (userIdx: number, cursor: string | undefined) => {
  const nextCursor = await getUserStoryNextCursor(userIdx, cursor);

  return {
    nextCursor
  };
};

const getUserStoryNextCursor = async (userIdx: number, cursor: string | undefined) => {
  let query = Story.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .orderBy('storyIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_USERS_STORY);

  if (cursor) {
    query = query.andWhere('storyIdx < :cursor', { cursor });
  }

  const curPageUsersStory = await query.getMany();
  const nextCursor = curPageUsersStory[curPageUsersStory.length - 1]?.storyIdx;
  if (!nextCursor) return null;

  const nextUserStories = await Story.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('storyIdx < :nextCursor', { nextCursor })
    .orderBy('storyIdx', 'DESC')
    .getOne();

  return nextUserStories ? String(nextCursor) : null;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 내가 쓴 qna 조회
 */
const getUserQna = async (userIdx: number, cursor: string | undefined) => {
  let query = Qna.createQueryBuilder('qna')
    .select([
      'qna.qnaIdx AS qnaIdx',
      'qna.title AS title',
      'qna.content AS content',
      'CONVERT_TZ(qna.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('qna.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['qnaComment.qnaIdx AS qnaIdx', 'COUNT(*) AS commentCnt'])
          .from(QnaComment, 'qnaComment')
          .groupBy('qnaComment.qnaIdx'),
      'getCommentCnt',
      'getCommentCnt.qnaIdx = qna.qnaIdx'
    )
    .addSelect('IFNULL(commentCnt, 0) AS commentCnt')
    .where('qna.userIdx = :userIdx', { userIdx })
    .orderBy('qna.qnaIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_USERS_QNA);

  if (cursor) {
    query = query.andWhere('qna.qnaIdx < :cursor', { cursor });
  }

  const qnas = await query.getRawMany();

  let result = [];
  for (let qna of qnas) {
    const { qnaIdx } = qna;
    const isLiked = await QnaLike.createQueryBuilder()
      .select()
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('qnaIdx = :qnaIdx', { qnaIdx })
      .getOne();

    const likeCnt = await QnaLike.createQueryBuilder()
      .select()
      .where('qnaIdx = :qnaIdx', { qnaIdx })
      .getCount();

    result.push({
      qnaIdx,
      title: qna.title,
      content: qna.content,
      isLiked: isLiked ? true : false,
      likeCnt,
      commentCnt: qna.commentCnt,
      createdAt: qna.createdAt,
      user: {
        userIdx: qna.userIdx,
        nickname: qna.nickname
      }
    });
  }

  return result;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 내가 쓴 qna meta data 조회
 */
const getUserQnaMetaData = async (userIdx: number, cursor: string | undefined) => {
  const nextCursor = await getUserQnaNextCursor(userIdx, cursor);

  return {
    nextCursor
  };
};

const getUserQnaNextCursor = async (userIdx: number, cursor: string | undefined) => {
  let query = Qna.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .orderBy('qnaIdx', 'DESC')
    .limit(itemsPerPage.GET_ALL_USERS_QNA);

  if (cursor) {
    query = query.andWhere('qnaIdx < :cursor', { cursor });
  }

  const curPageUsersQna = await query.getMany();
  const nextCursor = curPageUsersQna[curPageUsersQna.length - 1]?.qnaIdx;
  if (!nextCursor) return null;

  const nextUserQnas = await Qna.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('qnaIdx < :nextCursor', { nextCursor })
    .orderBy('qnaIdx', 'DESC')
    .getOne();

  return nextUserQnas ? String(nextCursor) : null;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 댓글 단 story 조회
 */
const getUserCommentByStory = async (userIdx: number, cursor: string | undefined) => {
  let query = StoryComment.createQueryBuilder('storyComment')
    .select([
      'MAX(storyComment.storyCommentIdx) AS storyCommentIdx',
      'storyComment.storyIdx AS storyIdx',
      'story.title AS title',
      'CONVERT_TZ(story.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'story.content AS content',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('storyComment.story', 'story')
    .leftJoin('story.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['storyIdx AS storyIdx', 'COUNT(*) AS likeCnt'])
          .from(StoryLike, 'storyLike')
          .groupBy('storyLike.storyIdx'),
      'getLikeCnt',
      'getLikeCnt.storyIdx = storyComment.storyIdx'
    )
    .addSelect('IFNULL(getLikeCnt.likeCnt, 0) AS likeCnt')
    .where('storyComment.userIdx = :userIdx', {
      userIdx
    })
    .leftJoin(
      qb =>
        qb
          .select(['sc.storyIdx AS storyIdx', 'COUNT(*) AS commentCnt'])
          .from(StoryComment, 'sc')
          .groupBy('sc.storyIdx'),
      'getCommentCnt',
      'getCommentCnt.storyIdx = story.storyIdx'
    )
    .addSelect('IFNULL(getCommentCnt.commentCnt, 0) AS commentCnt')
    .groupBy('storyComment.storyIdx')
    .limit(itemsPerPage.GET_ALL_USERS_STORY_COMMENT)
    .orderBy('MAX(storyComment.storyCommentIdx)', 'DESC');

  if (cursor) {
    query = query.having('storyCommentIdx < :cursor', { cursor });
  }

  const stories = await query.getRawMany();

  let result: any = [];
  for (let story of stories) {
    const { storyIdx } = story;
    const isLiked = await StoryLike.createQueryBuilder()
      .select()
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('storyIdx = :storyIdx', { storyIdx })
      .getOne();

    const getThumbnail = await StoryImage.createQueryBuilder('storyImage')
      .select(['storyImage.url'])
      .where('storyImage.storyIdx = :storyIdx', { storyIdx })
      .getOne();

    result.push({
      storyIdx,
      title: story.title,
      thumbnail: getThumbnail?.url,
      createdAt: story.createdAt,
      content: story.content,
      isLiked: isLiked ? true : false,
      likeCnt: story.likeCnt,
      commentCnt: story.commentCnt,
      user: {
        userIdx: story.userIdx,
        nickname: story.nickname
      }
    });
  }
  return result;
};

/**
 *
 * @param userIdx
 * @param cursor
 * @desc 댓글 단 story medat data 조회
 */
const getUserCommentByStoryMetaData = async (userIdx: number, cursor: string | undefined) => {
  const nextCursor = await getUserCommentByStoryNextCursor(userIdx, cursor);

  return {
    nextCursor
  };
};

const getUserCommentByStoryNextCursor = async (userIdx: number, cursor: string | undefined) => {
  let query = StoryComment.createQueryBuilder('storyComment')
    .select([
      'MAX(storyComment.storyCommentIdx) AS storyCommentIdx',
      'storyComment.storyIdx AS storyIdx',
      'story.title AS title',
      'CONVERT_TZ(story.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'story.content AS content',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('storyComment.story', 'story')
    .leftJoin('story.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['storyIdx AS storyIdx', 'COUNT(*) AS likeCnt'])
          .from(StoryLike, 'storyLike')
          .groupBy('storyLike.storyIdx'),
      'getLikeCnt',
      'getLikeCnt.storyIdx = storyComment.storyIdx'
    )
    .addSelect('IFNULL(getLikeCnt.likeCnt, 0) AS likeCnt')
    .where('storyComment.userIdx = :userIdx', {
      userIdx
    })
    .leftJoin(
      qb =>
        qb
          .select(['sc.storyIdx AS storyIdx', 'COUNT(*) AS commentCnt'])
          .from(StoryComment, 'sc')
          .groupBy('sc.storyIdx'),
      'getCommentCnt',
      'getCommentCnt.storyIdx = story.storyIdx'
    )
    .addSelect('IFNULL(getCommentCnt.commentCnt, 0) AS commentCnt')
    .groupBy('storyComment.storyIdx')
    .limit(itemsPerPage.GET_ALL_USERS_STORY_COMMENT)
    .orderBy('MAX(storyComment.storyCommentIdx)', 'DESC');

  if (cursor) {
    query = query.having('storyCommentIdx < :cursor', { cursor });
  }

  const curPageUsersCommentByStory = await query.getRawMany();
  const nextCursor =
    curPageUsersCommentByStory[curPageUsersCommentByStory.length - 1]?.storyCommentIdx;
  if (!nextCursor) return null;

  const nextPageUsersCommentByStory = await StoryComment.createQueryBuilder()
    .select(['MAX(storyCommentIdx) AS storyCommentIdx'])
    .where('userIdx = :userIdx', {
      userIdx
    })
    .groupBy('storyIdx')
    .having('storyCommentIdx < :nextCursor', { nextCursor })
    .getRawOne();

  return nextPageUsersCommentByStory ? String(nextCursor) : null;
};

export default {
  getMyPage,
  getLikedTips,
  getLikedTipsMetaData,
  getMyTips,
  getMyTipsMetaData,
  updateProfile,
  getLikedStory,
  getLikedStoryMetaData,
  getLikedQna,
  getLikedQnaMetaData,
  getUserStory,
  getUserStoryMetaData,
  getUserQna,
  getUserQnaMetaData,
  getUserCommentByStory,
  getUserCommentByStoryMetaData
};
