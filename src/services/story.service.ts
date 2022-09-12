import { Story, StoryTag, StoryImage, StoryLike, StoryComment } from '@entities/index';
import AppDataSource from '@config/data-source';
import { CustomError } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { ErrorType } from '@utils/error';
import { createStoryResult } from '@interfaces/story';
import { GetStoryDTO } from '@interfaces/story';
import { itemsPerPage, sortTypes } from '@utils/constants';

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
  let query = Story.createQueryBuilder('story')
    .select([
      'story.storyIdx AS storyIdx',
      'story.title AS title',
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
    .addSelect('IFNULL(getCnt.likeCnt, 0)', 'likeCnt');

  //정렬 처리
  if (sort === sortTypes.POPULAR) {
    query = query.orderBy('likeCnt', 'DESC').addOrderBy('story.storyIdx', 'DESC');
  } else if (sort === sortTypes.RECENTLY) {
    query = query.orderBy('story.storyIdx', 'DESC');
  }

  //페이지네이션 처리
  if (cursor) {
    query = query.offset(parseInt(cursor));
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
};

/**
 *
 * @param cursor
 * @desc 스토리 관련 meta data
 */
const getStoriesMeta = async (cursor: string | undefined) => {
  let query = Story.createQueryBuilder().take(itemsPerPage.GET_ALL_STORY);
  if (cursor) {
    query = query.skip(parseInt(cursor) + itemsPerPage.GET_ALL_STORY);
  }
  const nextStory = await query.getOne();

  const haveNextCursor = nextStory ? true : false;

  let nextCursor = null;
  if (haveNextCursor) {
    nextCursor = cursor
      ? String(parseInt(cursor) + itemsPerPage.GET_ALL_STORY)
      : String(itemsPerPage.GET_ALL_STORY);
  }

  const totalStoryCnt = await Story.createQueryBuilder('story').select().getCount();

  const meta = {
    count: totalStoryCnt,
    nextCursor
  };

  return meta;
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

export default {
  createStory,
  getStories,
  getStoriesMeta,
  isExistStory,
  getStory,
  isStoryOwner,
  updateStory,
  deletestory
};
