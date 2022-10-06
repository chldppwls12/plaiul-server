import { LikeResult } from '@interfaces/common/response';
import {
  Story,
  StoryTag,
  StoryImage,
  StoryLike,
  StoryComment,
  StoryReqReport,
  Block,
  CommentReqReport
} from '@entities/index';
import AppDataSource from '@config/data-source';
import { CustomError } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { ErrorType } from '@utils/error';
import { createStoryResult } from '@interfaces/story';
import { GetStoryDTO } from '@interfaces/story';
import { itemsPerPage, sortTypes } from '@utils/constants';
import { getReportReason } from '@utils/reason';
import { Brackets } from 'typeorm';

/**
 *
 * @param userIdx
 * @param title
 * @param content
 * @param tags
 * @param images
 * @desc 스토리 생성
 */
const createStory = async (
  userIdx: number,
  title: string,
  content: string,
  tags: string[],
  images: string[]
): Promise<createStoryResult | void> => {
  try {
    let storyIdx: number = 0;
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      const story = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(Story)
        .values({
          title,
          content,
          userIdx
        })
        .execute();

      storyIdx = story.identifiers[0].storyIdx;

      if (tags.length > 0) {
        tags.map(async tag => {
          await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(StoryTag)
            .values({
              name: tag,
              storyIdx
            })
            .execute();
        });
      }

      images.map(async image => {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(StoryImage)
          .values({
            url: image,
            storyIdx
          })
          .execute();
      });
    });

    return { storyIdx };
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
 * @param userIdx
 * @param sort
 * @param cursor
 * @desc 전제 스토리 조회
 */
const getStories = async (
  userIdx: number | undefined,
  sort: string,
  cursor: string | undefined
): Promise<GetStoryDTO[]> => {
  try {
    const blocked = await Block.createQueryBuilder()
      .select('blockedUserIdx')
      .where('userIdx = :userIdx', { userIdx })
      .getRawMany();

    let blockedUserIdxs = blocked.map(item => item.blockedUserIdx);
    if (blockedUserIdxs.length === 0) {
      blockedUserIdxs = [-1];
    }

    let query = Story.createQueryBuilder('story')
      .select([
        'story.storyIdx AS storyIdx',
        'story.title AS title',
        'story.content AS content',
        'user.userIdx AS userIdx',
        'user.nickname AS nickname'
      ])
      .leftJoin('story.user', 'user')
      .leftJoin(
        qb =>
          qb
            .select('storyIdx', 'storyIdx')
            .addSelect('COUNT(*)', 'likeCnt')
            .from(StoryLike, 'storyLike')
            .groupBy('storyLike.storyIdx'),
        'getCnt',
        'getCnt.storyIdx = story.storyIdx'
      )
      .addSelect('IFNULL(getCnt.likeCnt, 0)', 'likeCnt')
      .where('story.userIdx NOT IN (:...blockedUserIdxs)', { blockedUserIdxs });

    if (sort === sortTypes.RECENTLY) {
      query = query.orderBy('story.storyIdx', 'DESC');
    } else if (sort === sortTypes.POPULAR) {
      query = query.orderBy('likeCnt', 'DESC').addOrderBy('story.storyIdx', 'DESC');
    }

    if (cursor) {
      if (sort === sortTypes.RECENTLY) {
        query = query.andWhere('story.storyIdx < :storyIdx', { storyIdx: cursor });
      } else if (sort === sortTypes.POPULAR) {
        query = query.andWhere(
          `CONCAT(LPAD(IFNULL(getCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(story.storyIdx, 0), 10, '0')) < :cursor`,
          { cursor }
        );
      }
    }

    const stories = await query.limit(itemsPerPage.GET_ALL_STORY).getRawMany();

    for (let i = 0; i < stories.length; i++) {
      const { storyIdx } = stories[i];

      stories[i].likeCnt = parseInt(stories[i].likeCnt);
      stories[i].user = {
        userIdx: stories[i].userIdx,
        nickname: stories[i].nickname
      };
      delete stories[i].userIdx;
      delete stories[i].nickname;

      const thumbnail = await StoryImage.createQueryBuilder('storyImage')
        .select(['storyImage.url'])
        .where('storyImage.storyIdx = :storyIdx', { storyIdx })
        .getOne();

      stories[i].thumbnail = thumbnail!.url;

      if (userIdx) {
        const isLiked = await StoryLike.createQueryBuilder('storyLike')
          .select()
          .where('storyLike.userIdx = :userIdx', { userIdx })
          .andWhere('storyLike.storyIdx = :storyIdx', { storyIdx })
          .getOne();

        isLiked ? (stories[i].isLiked = true) : (stories[i].isLiked = false);
      } else {
        stories[i].isLiked = false;
      }
    }

    return stories;
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      []
    );
  }
};

/**
 *
 * @param cursor
 * @param sort
 * @param cursor
 * @desc 스토리 관련 meta data
 */
const getStoriesMeta = async (
  userIdx: number | undefined,
  sort: string,
  cursor: string | undefined
) => {
  try {
    const blocked = await Block.createQueryBuilder()
      .select('blockedUserIdx')
      .where('userIdx = :userIdx', { userIdx })
      .getRawMany();

    let blockedUsers = blocked.map(item => item.blockedUserIdx);
    if (blockedUsers.length === 0) {
      blockedUsers = [-1];
    }

    const nextCursor = await getStoryNextCursor(cursor, sort, blockedUsers);
    const totalStoryCnt = await Story.createQueryBuilder()
      .select()
      .where('userIdx NOT IN (:...blockedUsers)', { blockedUsers })
      .getCount();

    const meta = {
      count: totalStoryCnt,
      nextCursor
    };

    return meta;
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      []
    );
  }
};

const getStoryNextCursor = async (
  cursor: string | undefined,
  sort: string,
  blockedUsers: number[]
) => {
  if (sort === sortTypes.RECENTLY) {
    let query = Story.createQueryBuilder()
      .select()
      .limit(itemsPerPage.GET_ALL_STORY)
      .where('userIdx NOT IN (:...blockedUsers)', {
        blockedUsers
      })
      .orderBy('storyIdx', 'DESC');

    if (cursor) {
      query = query.andWhere('storyIdx < :storyIdx', { storyIdx: cursor });
    }

    const curPageStorys = await query.getMany();
    const nextCursor = curPageStorys[curPageStorys.length - 1]?.storyIdx;
    if (!nextCursor) {
      return null;
    }

    const nextStorys = await Story.createQueryBuilder()
      .select()
      .orderBy('storyIdx', 'DESC')
      .where('storyIdx < :storyIdx', { storyIdx: nextCursor })
      .andWhere('userIdx NOT IN (:...blockedUsers)', {
        blockedUsers
      })
      .getOne();

    return nextStorys ? String(nextCursor) : null;
  } else if (sort === sortTypes.POPULAR) {
    let query = Story.createQueryBuilder('story')
      .select('story.storyIdx AS storyIdx')
      .leftJoin(
        qb =>
          qb
            .select('storyLike.storyIdx', 'storyIdx')
            .addSelect('COUNT(*)', 'likeCnt')
            .from(StoryLike, 'storyLike')
            .groupBy('storyLike.storyIdx'),
        'getLikeCnt',
        'getLikeCnt.storyIdx = story.storyIdx'
      )
      .where('userIdx NOT IN (:...blockedUsers)', {
        blockedUsers
      })
      .addSelect('IFNULL(getLikeCnt.likeCnt, 0)', 'likeCnt')
      .addSelect(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(story.storyIdx, 0), 10, '0'))`,
        'customCursor'
      )
      .orderBy('likeCnt', 'DESC')
      .addOrderBy('story.storyIdx', 'DESC')
      .limit(itemsPerPage.GET_ALL_STORY);

    if (cursor) {
      query = query.andWhere(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(story.storyIdx, 0), 10, '0')) < :cursor`,
        { cursor }
      );
    }

    const curPageStorys = await query.getRawMany();
    const nextCursor = curPageStorys[curPageStorys.length - 1]?.customCursor;
    if (!nextCursor) {
      return null;
    }

    const nextStorys = await Story.createQueryBuilder('story')
      .select()
      .leftJoin(
        qb =>
          qb
            .select('storyLike.storyIdx', 'storyIdx')
            .addSelect('COUNT(*)', 'likeCnt')
            .from(StoryLike, 'storyLike')
            .groupBy('storyLike.storyIdx'),
        'getLikeCnt',
        'getLikeCnt.storyIdx = story.storyIdx'
      )
      .addSelect('IFNULL(getLikeCnt.likeCnt, 0)', 'likeCnt')
      .addSelect(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(story.storyIdx, 0), 10, '0'))`,
        'customCursor'
      )
      .where(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(story.storyIdx, 0), 10, '0')) < :nextCursor`,
        { nextCursor }
      )
      .andWhere('userIdx NOT IN (:...blockedUsers)', {
        blockedUsers
      })
      .orderBy('likeCnt', 'DESC')
      .addOrderBy('story.storyIdx', 'DESC')
      .getOne();

    return nextStorys ? nextCursor : null;
  }
};

/**
 *
 * @param storyIdx
 * @desc 스토리 존재 여부 체크
 */
const isExistStory = async (storyIdx: number) => {
  try {
    await Story.createQueryBuilder('story')
      .select()
      .where('story.storyIdx = :storyIdx', { storyIdx })
      .getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_STORYIDX.message,
      ErrorType.INVALID_STORYIDX.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param storyIdx
 * @desc 스토리 조회
 */
const getStory = async (userIdx: number | undefined, storyIdx: number): Promise<GetStoryDTO> => {
  try {
    const story = await Story.createQueryBuilder('story')
      .select([
        'story.storyIdx AS storyIdx',
        'story.title AS title',
        'story.content AS content',
        'user.userIdx AS userIdx',
        'user.nickname AS nickname',
        'IF(user.profile= "", NULL, user.profile) AS profile'
      ])
      .addSelect('CONVERT_TZ(story.createdAt, "UTC", "Asia/Seoul")', 'createdAt')
      .addSelect(
        qb =>
          qb
            .select('COUNT(*)')
            .from(StoryComment, 'storyComment')
            .where('storyComment.storyIdx = :storyIdx', { storyIdx }),
        'commentCnt'
      )
      .addSelect(
        qb =>
          qb
            .select('storyLikeIdx')
            .from(StoryLike, 'storyLike')
            .where('storyLike.storyIdx = :storyIdx', { storyIdx })
            .andWhere('storyLike.userIdx = :userIdx', { userIdx }),
        'isLiked'
      )
      .addSelect(
        qb =>
          qb
            .select('COUNT(*) AS likeCnt')
            .from(StoryLike, 'storyLike')
            .where('storyLike.storyIdx = :storyIdx', { storyIdx }),
        'likeCnt'
      )
      .leftJoin('story.user', 'user')
      .where('story.storyIdx = :storyIdx', { storyIdx })
      .getRawOne();

    const images = await StoryImage.createQueryBuilder('storyImage')
      .select('storyImage.url AS url')
      .where('storyImage.storyIdx = :storyIdx', { storyIdx })
      .getRawMany();

    story.images = [];
    images.map(image => story.images.push(image.url));

    const tags = await StoryTag.createQueryBuilder('storyTag')
      .select('storyTag.name AS name')
      .where('storyTag.storyIdx = :storyIdx', { storyIdx })
      .getRawMany();

    story.tags = [];
    tags.map(tag => story.tags.push(tag.name));

    story.isWriter = story.userIdx === userIdx ? true : false;
    story.isLiked = story.isLiked ? true : false;

    story.user = {
      userIdx: story.userIdx,
      nickname: story.nickname,
      profile: story.profile
    };

    delete story.userIdx;
    delete story.nickname;
    delete story.profile;

    return story;
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
 * @param userIdx
 * @param storyIdx
 * @desc 스토리 작성자 여부
 */
const isStoryOwner = async (userIdx: number, storyIdx: number) => {
  try {
    await Story.createQueryBuilder()
      .where('storyIdx = :storyIdx', { storyIdx })
      .andWhere('userIdx = :userIdx', { userIdx })
      .getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.UNAUTHORIZED,
      ErrorType.UNAUTHORIZED.message,
      ErrorType.UNAUTHORIZED.code,
      [err.message]
    );
  }
};

/**
 *
 * @param storyIdx
 * @param title
 * @param content
 * @param tags
 * @param images
 * @desc 스토리 수정
 */
const updateStory = async (
  storyIdx: number,
  title: string | undefined,
  content: string | undefined,
  tags: string[] | [],
  images: string[] | []
) => {
  try {
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.query(
        `UPDATE story SET title = IFNULL(?, title),content = IFNULL(?, content)
        WHERE storyIdx = ?`,
        [title, content, storyIdx]
      );

      if (images.length > 0) {
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(StoryImage)
          .where('storyIdx = :storyIdx', { storyIdx })
          .execute();

        images.map(async image => {
          await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(StoryImage)
            .values({
              url: image,
              storyIdx
            })
            .execute();
        });
      }

      if (tags.length > 0) {
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(StoryTag)
          .where('storyIdx = :storyIdx', { storyIdx })
          .execute();

        tags.map(async tag => {
          await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(StoryTag)
            .values({
              name: tag,
              storyIdx
            })
            .execute();
        });
      }
    });

    return {
      modified: true
    };
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
 * @param storyIdx
 * @desc 스토리 삭제
 */
const deletestory = async (storyIdx: number) => {
  try {
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager
        .createQueryBuilder()
        .softDelete()
        .from(Story)
        .where('storyIdx = :storyIdx', { storyIdx })
        .execute();

      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(StoryLike)
        .where('storyIdx = :storyIdx', { storyIdx })
        .execute();
    });
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
 * @param userIdx
 * @param storyIdx
 * @desc 스토리 신고 가능한지
 */
const canReportStory = async (userIdx: number, storyIdx: number) => {
  const isUserStory = await Story.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('storyIdx = :storyIdx', { storyIdx })
    .getOne();

  if (isUserStory) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.CAN_NOT_REPORT_SELF.message,
      ErrorType.CAN_NOT_REPORT_SELF.code,
      []
    );
  }

  const isReported = await StoryReqReport.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('storyIdx = :storyIdx', { storyIdx })
    .getOne();

  if (isReported) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.ALREADY_REPORT.message,
      ErrorType.ALREADY_REPORT.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param storyIdx
 * @param reasonIdx
 * @param etcReason
 * @desc 스토리 신고
 */
const reportStory = async (
  userIdx: number,
  storyIdx: number,
  reasonIdx: number,
  etcReason: string | undefined
) => {
  try {
    const reason = getReportReason(reasonIdx);
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(StoryReqReport)
        .values({
          userIdx,
          storyIdx,
          reason,
          etcReason
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

/**
 *
 * @param userIdx
 * @param storyIdx
 * @desc 스토리 차단 여부
 */
const isBlockedStory = async (userIdx: number, storyIdx: number): Promise<boolean> => {
  try {
    const { userIdx: storyUserIdx } = await Story.createQueryBuilder()
      .select('userIdx')
      .where('storyIdx = :storyIdx', { storyIdx })
      .getRawOne();

    const isBlocked = await Block.createQueryBuilder()
      .select()
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('blockedUserIdx = :blockedUserIdx', { blockedUserIdx: storyUserIdx })
      .getRawOne();

    return isBlocked ? true : false;
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param storyIdx
 * @desc 스토리 좋아요 변경
 */
const changeStoryLike = async (userIdx: number, storyIdx: number): Promise<LikeResult> => {
  let result: LikeResult = {
    isLiked: true
  };
  try {
    const likeStatus = await StoryLike.createQueryBuilder()
      .select()
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('storyIdx = :storyIdx', { storyIdx })
      .getOne();

    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      if (likeStatus) {
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(StoryLike)
          .where('userIdx = :userIdx', { userIdx })
          .andWhere('storyIdx = :storyIdx', { storyIdx })
          .execute();

        result = { isLiked: false };
      } else {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(StoryLike)
          .values({ userIdx, storyIdx })
          .execute();

        result = { isLiked: true };
      }
    });

    return result;
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      []
    );
  }
};

/**
 *
 * @param storyIdx
 * @param parentCommentIdx
 * @desc 스토리 댓글 작성 가능 여부
 */
const canCreateStoryComment = async (storyIdx: number, parentCommentIdx: number | undefined) => {
  try {
    await StoryComment.createQueryBuilder()
      .where('storyCommentIdx = :storyCommentIdx', {
        storyCommentIdx: parentCommentIdx
      })
      .andWhere('storyIdx = :storyIdx', { storyIdx })
      .getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_PARENTCOMMENTIDX.message,
      ErrorType.INVALID_PARENTCOMMENTIDX.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param storyIdx
 * @param parentCommentIdx
 * @param comment
 * @desc 스토리 댓글 작성
 */
const createStoryComment = async (
  userIdx: number,
  storyIdx: number,
  parentCommentIdx: number | undefined,
  comment: string
) => {
  try {
    let commentIdx;
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      const storyComment = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(StoryComment)
        .values({
          userIdx,
          storyIdx,
          parentCommentIdx,
          comment
        })
        .execute();

      commentIdx = storyComment.identifiers[0].storyCommentIdx;
    });

    return {
      commentIdx
    };
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      []
    );
  }
};

/**
 *
 * @param storyIdx
 * @param storyCommentIdx
 * @desc 존재하는 스토리 댓글인지
 */
const isExistStoryCommentIdx = async (storyIdx: number, storyCommentIdx: number) => {
  try {
    await StoryComment.createQueryBuilder()
      .select()
      .where('storyCommentIdx = :storyCommentIdx', { storyCommentIdx })
      .andWhere('storyIdx = :storyIdx', { storyIdx })
      .getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_COMMENTIDX.message,
      ErrorType.INVALID_COMMENTIDX.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param storyCommentIdx
 * @desc 유저의 스토리 댓글인지
 */
const isUserStoryComment = async (userIdx: number, storyCommentIdx: number) => {
  try {
    await StoryComment.createQueryBuilder()
      .select()
      .where('storyCommentIdx = :storyCommentIdx', { storyCommentIdx })
      .andWhere('userIdx = :userIdx', { userIdx })
      .getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.UNAUTHORIZED,
      ErrorType.UNAUTHORIZED.message,
      ErrorType.UNAUTHORIZED.code,
      []
    );
  }
};

/**
 *
 * @param storyCommentIdx
 * @param comment
 * @desc 스토리 댓글 수정
 */
const updateStoryComment = async (storyCommentIdx: number, comment: string) => {
  try {
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager
        .createQueryBuilder()
        .update(StoryComment)
        .set({ comment })
        .where('storyCommentIdx = :storyCommentIdx', { storyCommentIdx })
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

/**
 *
 * @param storyCommentIdx
 * @desc 스토리 댓글 삭제
 */
const deleteStoryComment = async (storyCommentIdx: number) => {
  try {
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager
        .createQueryBuilder()
        .softDelete()
        .from(StoryComment)
        .where('storyCommentIdx = :storyCommentIdx', { storyCommentIdx })
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

/**
 *
 * @param userIdx
 * @param storyCommentIdx
 * @desc 스토리 댓글 기존 신고 체크
 */
const canReportStoryComment = async (userIdx: number, storyCommentIdx: number) => {
  const isReported = await CommentReqReport.createQueryBuilder()
    .select()
    .where('storyCommentIdx = :storyCommentIdx', { storyCommentIdx })
    .andWhere('userIdx = :userIdx', { userIdx })
    .getOne();

  if (isReported) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.ALREADY_REPORT.message,
      ErrorType.ALREADY_REPORT.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param storyCommentIdx
 * @param reasonIdx
 * @param etcReason
 * @desc 스토리 댓글 신고
 */
const reportStoryComment = async (
  userIdx: number,
  storyCommentIdx: number,
  reasonIdx: number,
  etcReason: string | undefined
) => {
  const reason = getReportReason(reasonIdx);
  try {
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(CommentReqReport)
        .values({
          userIdx,
          storyCommentIdx,
          reason,
          etcReason
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

/**
 *
 * @param userIdx
 * @param storyIdx
 * @desc 스토리 댓글 조회
 */
const getStoryComments = async (
  userIdx: number | undefined,
  storyIdx: number,
  cursor: string | undefined
) => {
  let result: any = [];
  try {
    const { userIdx: storyUserIdx } = await Story.createQueryBuilder()
      .select('userIdx')
      .where('storyIdx = :storyIdx', { storyIdx })
      .getRawOne();

    const blocked = await Block.createQueryBuilder()
      .select('blockedUserIdx')
      .where('userIdx = :userIdx', { userIdx })
      .getRawMany();

    let blockedUserIdxs = blocked.map(item => item.blockedUserIdx);
    if (blockedUserIdxs.length === 0) {
      blockedUserIdxs = [-1];
    }

    let query = StoryComment.createQueryBuilder('storyComment')
      .select([
        'storyComment.storyCommentIdx AS commentIdx',
        'storyComment.comment AS content',
        'CONVERT_TZ(storyComment.createdAt, "UTC", "Asia/Seoul") AS createdAt',
        'user.userIdx AS userIdx',
        'user.nickname AS nickname',
        'user.profile AS profile',
        'storyComment.deletedAt AS deletedAt'
      ])
      .leftJoin('storyComment.user', 'user')
      .leftJoin(
        qb =>
          qb
            .select('storyRecomment.parentCommentIdx', 'parentCommentIdx')
            .addSelect('COUNT(*)', 'recommentCnt')
            .from(StoryComment, 'storyRecomment')
            .groupBy('storyRecomment.parentCommentIdx'),
        'getStoryRecomment',
        'getStoryRecomment.parentCommentIdx = storyComment.storyCommentIdx'
      )
      .addSelect('IFNULL(recommentCnt, 0)', 'recommentCnt')
      .where('storyComment.storyIdx = :storyIdx', { storyIdx })
      .andWhere('storyComment.parentCommentIdx IS NULL')
      .andWhere(
        new Brackets(qb => {
          qb.where('storyComment.deletedAt IS NULL').orWhere(
            'storyComment.deletedAt IS NOT NULL AND recommentCnt > 0'
          );
        })
      );

    if (cursor) {
      query = query.andWhere('storyComment.storyCommentIdx > :cursor', { cursor });
    }

    const parentComments = await query
      .withDeleted()
      .limit(itemsPerPage.GET_STORY_COMMENT)
      .getRawMany();

    for (let parentComment of parentComments) {
      const { commentIdx: storyCommentIdx } = parentComment;
      const reComments = await StoryComment.createQueryBuilder('storyRecomment')
        .select([
          'storyRecomment.storyCommentIdx AS commentIdx',
          'storyRecomment.comment AS content',
          'CONVERT_TZ(storyRecomment.createdAt, "UTC", "Asia/Seoul") AS createdAt',
          'user.userIdx AS userIdx',
          'user.nickname AS nickname',
          'user.profile AS profile'
        ])
        .leftJoin('storyRecomment.user', 'user')
        .where('storyRecomment.parentCommentIdx = :storyCommentIdx', { storyCommentIdx })
        .getRawMany();

      let reCommentsResult = [];
      for (let reComment of reComments) {
        reCommentsResult.push({
          commentIdx: reComment.commentIdx,
          content: reComment.content,
          createdAt: reComment.createdAt,
          isWriter: reComment.userIdx === storyUserIdx ? true : false,
          isUserComment: reComment.userIdx === userIdx ? true : false,
          isDeleted: false,
          isBlocked: blockedUserIdxs.includes(reComment.userIdx),
          user: {
            userIdx: reComment.userIdx,
            nickname: reComment.nickname,
            profile: reComment.profile === '' ? null : reComment.profile
          }
        });
      }

      result.push({
        commentIdx: parentComment.commentIdx,
        content: parentComment.content,
        createdAt: parentComment.createdAt,
        isWriter: parentComment.userIdx === storyUserIdx ? true : false,
        isUserComment: parentComment.userIdx === userIdx ? true : false,
        isDeleted: parentComment.deletedAt ? true : false,
        isBlocked: blockedUserIdxs.includes(parentComment.userIdx),
        user: {
          userIdx: parentComment.userIdx,
          nickname: parentComment.nickname,
          profile: parentComment.profile === '' ? null : parentComment.profile
        },
        reComments: reCommentsResult
      });
    }

    return result;
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.INTERAL_SERVER_ERROR,
      ErrorType.INTERAL_SERVER_ERROR.message,
      ErrorType.INTERAL_SERVER_ERROR.code,
      []
    );
  }
};

/**
 *
 * @param storyIdx
 * @param cursor
 * @desc 스토리 댓글 meta
 */
const getStoryCommentsMeta = async (storyIdx: number, cursor: string | undefined) => {
  const nextCursor = await getStoryCommentNextCursor(storyIdx, cursor);

  return {
    nextCursor
  };
};

const getStoryCommentNextCursor = async (storyIdx: number, cursor: string | undefined) => {
  let query = StoryComment.createQueryBuilder('storyComment')
    .select('storyComment.storyCommentIdx', 'storyCommentIdx')
    .leftJoin(
      qb =>
        qb
          .select('storyRecomment.parentCommentIdx', 'parentCommentIdx')
          .addSelect('COUNT(*)', 'recommentCnt')
          .from(StoryComment, 'storyRecomment')
          .groupBy('storyRecomment.parentCommentIdx'),
      'getStoryRecomment',
      'getStoryRecomment.parentCommentIdx = storyComment.storyCommentIdx'
    )
    .addSelect('IFNULL(recommentCnt, 0)', 'recommentCnt')
    .where('storyComment.storyIdx = :storyIdx', { storyIdx })
    .andWhere('storyComment.parentCommentIdx IS NULL')
    .andWhere(
      new Brackets(qb => {
        qb.where('storyComment.deletedAt IS NULL').orWhere(
          'storyComment.deletedAt IS NOT NULL AND recommentCnt > 0'
        );
      })
    );

  if (cursor) {
    query = query.andWhere('storyComment.storyCommentIdx > :cursor', { cursor });
  }

  const curPageStoryParComments = await query
    .withDeleted()
    .limit(itemsPerPage.GET_STORY_COMMENT)
    .getRawMany();

  const nextCursor = curPageStoryParComments[curPageStoryParComments.length - 1]?.storyCommentIdx;

  if (!nextCursor) {
    return null;
  }

  const nextStoryParComments = await StoryComment.createQueryBuilder('storyComment')
    .select('storyComment.storyCommentIdx', 'storyCommentIdx')
    .leftJoin(
      qb =>
        qb
          .select('storyRecomment.parentCommentIdx', 'parentCommentIdx')
          .addSelect('COUNT(*)', 'recommentCnt')
          .from(StoryComment, 'storyRecomment')
          .groupBy('storyRecomment.parentCommentIdx'),
      'getStoryRecomment',
      'getStoryRecomment.parentCommentIdx = storyComment.storyCommentIdx'
    )
    .addSelect('IFNULL(recommentCnt, 0)', 'recommentCnt')
    .where('storyComment.storyIdx = :storyIdx', { storyIdx })
    .andWhere('storyComment.parentCommentIdx IS NULL')
    .andWhere(
      new Brackets(qb => {
        qb.where('storyComment.deletedAt IS NULL').orWhere(
          'storyComment.deletedAt IS NOT NULL AND recommentCnt > 0'
        );
      })
    )
    .andWhere('storyComment.storyCommentIdx > :cursor', { cursor: nextCursor })
    .withDeleted()
    .limit(itemsPerPage.GET_STORY_COMMENT)
    .getRawOne();

  return nextStoryParComments ? String(nextCursor) : null;
};

export default {
  createStory,
  getStories,
  getStoriesMeta,
  isExistStory,
  getStory,
  isStoryOwner,
  updateStory,
  deletestory,
  canReportStory,
  reportStory,
  changeStoryLike,
  isBlockedStory,
  canCreateStoryComment,
  createStoryComment,
  isExistStoryCommentIdx,
  isUserStoryComment,
  updateStoryComment,
  deleteStoryComment,
  canReportStoryComment,
  reportStoryComment,
  getStoryComments,
  getStoryCommentsMeta
};
