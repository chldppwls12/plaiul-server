import AppDataSource from '@config/data-source';
import { Tip, TipText, TipImage } from '@entities/index';
import { tipContentType } from '@utils/constants';

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

export default { createTip };
