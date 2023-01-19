import { StoryImage } from './../entities/story/Image';
import * as _ from 'lodash';
import { Tip, Story, StoryLike, Qna, QnaLike } from '@entities/index';

/**
 * @desc 홈 화면 조회
 */
const getHome = async () => {
  const tips = await Tip.createQueryBuilder('tip')
    .select([
      'tip.tipIdx AS tipIdx',
      'tip.title AS title',
      'tip.thumbnail AS thumbnail',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('tip.user', 'user')
    .limit(5)
    .getRawMany();

  const popularStories = await Story.createQueryBuilder('story')
    .select([
      'story.storyIdx AS storyIdx',
      'NULL AS qnaIdx',
      'story.title AS title',
      'story.content AS content',
      'CONVERT_TZ(story.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('story.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select(['storyLike.storyIdx AS storyIdx', 'COUNT(*) AS likeCnt'])
          .from(StoryLike, 'storyLike')
          .groupBy('storyLike.storyIdx'),
      'getLikeCnt',
      'getLikeCnt.storyIdx = story.storyIdx'
    )
    .addSelect('IFNULL(likeCnt, 0) AS likeCnt')
    .orderBy('IFNULL(likeCnt, 0)', 'DESC')
    .addOrderBy('story.storyIdx', 'DESC')
    .limit(5)
    .getRawMany();

  const popularQnas = await Qna.createQueryBuilder('qna')
    .select([
      'NULL AS storyIdx',
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
          .select(['qnaLike.qnaIdx AS qnaIdx', 'COUNT(*) AS likeCnt'])
          .from(QnaLike, 'qnaLike')
          .groupBy('qnaLike.qnaIdx'),
      'getLikeCnt',
      'getLikeCnt.qnaIdx = qna.qnaIdx'
    )
    .addSelect('IFNULL(likeCnt, 0) AS likeCnt')
    .orderBy('IFNULL(likeCnt, 0)', 'DESC')
    .addOrderBy('qna.qnaIdx', 'DESC')
    .limit(5)
    .getRawMany();

  const popularPosts = _.sortBy([...popularStories, ...popularQnas], ['likeCnt', 'createdAt'])
    .reverse()
    .slice(0, 5);

  const recentlyStories = await Story.createQueryBuilder('story')
    .select([
      'story.storyIdx AS storyIdx',
      'NULL AS qnaIdx',
      'story.title AS title',
      'story.content AS content',
      'CONVERT_TZ(story.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('story.user', 'user')
    .orderBy('story.storyIdx', 'DESC')
    .limit(5)
    .getRawMany();

  const recentlyQnas = await Qna.createQueryBuilder('qna')
    .select([
      'NULL AS storyIdx',
      'qna.qnaIdx AS qnaIdx',
      'qna.title AS title',
      'qna.content AS content',
      'NULL AS thumbnail',
      'CONVERT_TZ(qna.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('qna.user', 'user')
    .orderBy('qna.qnaIdx', 'DESC')
    .limit(5)
    .getRawMany();

  const recentlyPosts = _.sortBy([...recentlyStories, ...recentlyQnas], ['likeCnt', 'createdAt'])
    .reverse()
    .slice(0, 5);

  let result: any = {
    tips: [],
    popularPosts: [],
    recentlyPosts: []
  };

  for (let tip of tips) {
    result.tips.push({
      tipIdx: tip.tipIdx,
      title: tip.title,
      thumbnail: tip.thumbnail,
      user: {
        userIdx: tip.userIdx,
        nickname: tip.nickname
      }
    });
  }

  for (let popularPost of popularPosts) {
    let thumbnail;
    if (popularPost.storyIdx) {
      const { storyIdx } = popularPost;
      thumbnail = await StoryImage.createQueryBuilder()
        .select()
        .where('storyIdx = :storyIdx', { storyIdx })
        .getOne();
    }

    result.popularPosts.push({
      qnaIdx: popularPost.qnaIdx,
      storyIdx: popularPost.storyIdx,
      title: popularPost.title,
      content: popularPost.content,
      thumbnail: thumbnail ? thumbnail.url : null,
      user: {
        userIdx: popularPost.userIdx,
        nickname: popularPost.nickname
      }
    });
  }

  for (let recentlyPost of recentlyPosts) {
    let thumbnail;
    if (recentlyPost.storyIdx) {
      const { storyIdx } = recentlyPost;
      thumbnail = await StoryImage.createQueryBuilder()
        .select()
        .where('storyIdx = :storyIdx', { storyIdx })
        .getOne();
    }

    result.recentlyPosts.push({
      qnaIdx: recentlyPost.qnaIdx,
      storyIdx: recentlyPost.storyIdx,
      title: recentlyPost.title,
      content: recentlyPost.content,
      thumbnail: thumbnail ? thumbnail.url : null,
      user: {
        userIdx: recentlyPost.userIdx,
        nickname: recentlyPost.nickname
      }
    });
  }

  return result;
};

export default {
  getHome
};
