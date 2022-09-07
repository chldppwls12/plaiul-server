import { Story, StoryTag, User, StoryImage } from '@entities/index';
import AppDataSource from '@config/data-source';
import { CustomError } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { ErrorType } from '@utils/error';
import { createStoryResult } from '@interfaces/story';

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

export default { createStory };
