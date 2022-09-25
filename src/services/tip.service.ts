import * as _ from 'lodash';
import { CustomError, ErrorType } from '@utils/error';
import AppDataSource from '@config/data-source';
import { Tip, TipText, TipImage, TipLike } from '@entities/index';
import { tipContentType } from '@utils/constants';
import httpStatusCode from '@utils/httpStatusCode';

/**
 *
 * @param userIdx
 * @param title
 * @param thumbnail
 * @param textList
 * @param imageList
 * @param orderList
 * @desc grower's tip 작성
 */
const createTip = async (
  userIdx: number,
  title: string,
  thumbnail: string,
  textList: string[] | [],
  imageList: string[] | [],
  orderList: number[]
) => {
  let tipIdx;
  await AppDataSource.transaction(async transactionalEntityManager => {
    const tip = await transactionalEntityManager
      .createQueryBuilder()
      .insert()
      .into(Tip)
      .values({
        userIdx,
        title,
        thumbnail
      })
      .execute();
    tipIdx = tip.identifiers[0].tipIdx;

    let textIdx = 0;
    let imageIdx = 0;

    for (let i = 0; i < orderList.length; i++) {
      if (orderList[i] === tipContentType.TEXT) {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(TipText)
          .values({
            content: textList[textIdx],
            order: i,
            tipIdx
          })
          .execute();
        textIdx += 1;
      } else if (orderList[i] === tipContentType.IMAGE) {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(TipImage)
          .values({
            url: imageList[imageIdx],
            order: i,
            tipIdx
          })
          .execute();
        imageIdx += 1;
      }
    }
  });

  return {
    tipIdx
  };
};

/**
 *
 * @param tipIdx
 * @desc 존재하는 tip인지
 */
const isExistTip = async (tipIdx: number) => {
  try {
    await Tip.createQueryBuilder().select().where('tipIdx = :tipIdx', { tipIdx }).getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_TIPIDX.message,
      ErrorType.INVALID_TIPIDX.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param tipIdx
 * @desc grower's tip 상세 조회
 */
const getTip = async (userIdx: number, tipIdx: number) => {
  const tip = await Tip.createQueryBuilder('tip')
    .select([
      'tip.tipIdx AS tipIdx',
      'tip.title AS title',
      'tip.thumbnail AS thumbnail',
      'tip.createdAt AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname',
      'user.profile AS profile'
    ])
    .leftJoin('tip.user', 'user')
    .where('tipIdx = :tipIdx', { tipIdx })
    .getRawOne();

  tip.user = {
    userIdx: tip.userIdx,
    nickname: tip.nickname,
    profile: tip.profile ? tip.profile : null
  };

  delete tip.userIdx;
  delete tip.nickname;
  delete tip.profile;

  if (userIdx) {
    const isLiked = await TipLike.createQueryBuilder()
      .select()
      .where('tipIdx = :tipIdx', { tipIdx })
      .andWhere('userIdx = :userIdx', { userIdx })
      .getOne();

    tip.isLiked = isLiked ? true : false;
  } else {
    tip.isLiked = false;
  }

  const likeCnt = await TipLike.createQueryBuilder()
    .select()
    .where('tipIdx = :tipIdx', { tipIdx })
    .getCount();
  tip.likeCnt = likeCnt;

  const texts = await TipText.createQueryBuilder('text')
    .select(['1 AS type', 'text.order AS no', 'text.content AS text', 'NULL AS image'])
    .where('tipIdx = :tipIdx', { tipIdx })
    .getRawMany();

  const images = await TipImage.createQueryBuilder('image')
    .select(['2 AS type', 'image.order AS no', 'NULL AS text', 'image.url AS image'])
    .where('tipIdx = :tipIdx', { tipIdx })
    .getRawMany();

  let content = [...texts, ...images];
  content = _.sortBy(content, 'no');
  content.forEach(item => delete item.no);

  tip.content = content;

  return tip;
};

/**
 *
 * @param userIdx
 * @param tipIdx
 * @desc 유저의 tip인지
 */
const isUserTip = async (userIdx: number, tipIdx: number) => {
  try {
    await Tip.createQueryBuilder()
      .select()
      .where('tipIdx = :tipIdx', { tipIdx })
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
 * @param tipIdx
 * @param title
 * @param thumbnail
 * @param textList
 * @param imageList
 * @param orderList
 * @desc tip 수정
 */
const updateTip = async (
  tipIdx: number,
  title: string | undefined,
  thumbnail: string | undefined,
  textList: string[] | [],
  imageList: string[] | [],
  orderList: number[] | []
) => {
  await AppDataSource.transaction(async transactionalEntityManager => {
    if (title || thumbnail) {
      await transactionalEntityManager.query(
        `UPDATE tip SET title = IFNULL(?, title), thumbnail = IFNULL(?, thumbnail)
        WHERE tipIdx = ?`,
        [title, thumbnail, tipIdx]
      );
    }

    if (textList.length > 0) {
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(TipText)
        .where('tipIdx = :tipIdx', { tipIdx })
        .execute();
    }
    if (imageList.length > 0) {
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(TipImage)
        .where('tipIdx = :tipIdx', { tipIdx })
        .execute();
    }

    let textIdx = 0;
    let imageIdx = 0;

    for (let i = 0; i < orderList.length; i++) {
      if (orderList[i] === tipContentType.TEXT) {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(TipText)
          .values({
            content: textList[textIdx],
            order: i,
            tipIdx
          })
          .execute();
        textIdx += 1;
      } else if (orderList[i] === tipContentType.IMAGE) {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(TipImage)
          .values({
            url: imageList[imageIdx],
            order: i,
            tipIdx
          })
          .execute();
        imageIdx += 1;
      }
    }
  });
};

/**
 *
 * @param tipIdx
 * @desc tip 삭제
 */
const deleteTip = async (tipIdx: number) => {
  await AppDataSource.transaction(async transactionalEntityManager => {
    await transactionalEntityManager
      .createQueryBuilder()
      .from(Tip, 'tip')
      .where('tipIdx = :tipIdx', { tipIdx })
      .softDelete()
      .execute();
  });
};

/**
 *
 * @param userIdx
 * @param tipIdx
 * @desc tip 좋아요 여부 변경
 */
const changeTipLike = async (userIdx: number, tipIdx: number) => {
  const curIsLiked = await TipLike.createQueryBuilder()
    .select()
    .where('tipIdx = :tipIdx', { tipIdx })
    .andWhere('userIdx = :userIdx', { userIdx })
    .getOne();

  let isLiked;
  await AppDataSource.transaction(async transactionalEntityManager => {
    if (curIsLiked) {
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(TipLike)
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('tipIdx = :tipIdx', { tipIdx })
        .execute();

      isLiked = false;
    } else {
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(TipLike)
        .values({
          tipIdx,
          userIdx
        })
        .execute();

      isLiked = true;
    }
  });

  return { isLiked };
};

export default { createTip, isExistTip, getTip, isUserTip, updateTip, deleteTip, changeTipLike };
