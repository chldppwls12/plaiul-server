import { Qna } from '@entities/index';
import AppDataSource from '@config/data-source';

/**
 *
 * @param userIdx
 * @param title
 * @param content
 * @desc qna 작성
 */
const createQna = async (userIdx: number, title: string, content: string) => {
  let qnaIdx;
  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    const qna = await transactionalEntityManager
      .createQueryBuilder()
      .insert()
      .into(Qna)
      .values({
        title,
        content,
        userIdx
      })
      .execute();

    qnaIdx = qna.identifiers[0].qnaIdx;
  });

  return {
    qnaIdx
  };
};

export default {
  createQna
};
