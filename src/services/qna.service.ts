import { Qna, QnaComment, QnaLike } from '@entities/index';
import AppDataSource from '@config/data-source';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';

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

/**
 *
 * @param qnaIdx
 * @desc 존재하는 qnaIdx인지
 */
const isExistQnaIdx = async (qnaIdx: number) => {
  try {
    await Qna.createQueryBuilder().where('qnaIdx = :qnaIdx', { qnaIdx }).getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.INVALID_QNAIDX.message,
      ErrorType.INVALID_QNAIDX.code,
      []
    );
  }
};

/**
 *
 * @param userIdx
 * @param qnaIdx
 * @desc qna 조회
 */
const getQna = async (userIdx: number | undefined, qnaIdx: number) => {
  const qna = await Qna.createQueryBuilder('qna')
    .select([
      'qna.qnaIdx AS qnaIdx',
      'qna.title AS title',
      'qna.content AS content',
      'qna.createdAt AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname',
      'IF(user.profile != "", user.profile, NULL) AS profile'
    ])
    .leftJoin('qna.user', 'user')
    .addSelect(
      qb =>
        qb
          .select('qnaLikeIdx')
          .from(QnaLike, 'qnaLike')
          .where('qnaLike.userIdx = :userIdx', { userIdx })
          .andWhere('qnaLike.qnaIdx = :qnaIdx', { qnaIdx }),
      'isLiked'
    )
    .addSelect(
      qb =>
        qb
          .select('COUNT(*) AS likeCnt')
          .from(QnaLike, 'qnaLike')
          .where('qnaLike.qnaIdx = :qnaIdx', { qnaIdx }),
      'likeCnt'
    )
    .addSelect(
      qb =>
        qb
          .select('COUNT(*) AS commentCnt')
          .from(QnaComment, 'qnaComment')
          .where('qnaComment.qnaIdx = :qnaIdx', { qnaIdx }),
      'commentCnt'
    )
    .where('qna.qnaIdx = :qnaIdx', { qnaIdx })
    .getRawOne();

  const result = {
    qnaIdx: qna.qnaIdx,
    title: qna.title,
    content: qna.content,
    isLiked: qna.isLiked ? true : false,
    likeCnt: qna.likeCnt,
    commentCnt: qna.commentCnt,
    createdAt: qna.createdAt,
    user: {
      userIdx: qna.userIdx,
      nickname: qna.nickname,
      profile: qna.profile
    }
  };

  return result;
};

/**
 *
 * @param userIdx
 * @param qnaIdx
 * @desc 유저의 Qna인지
 */
const isUserQna = async (userIdx: number, qnaIdx: number) => {
  try {
    await Qna.createQueryBuilder()
      .select()
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('qnaIdx = :qnaIdx', { qnaIdx })
      .getOneOrFail();
  } catch (err: any) {
    throw new CustomError(
      httpStatusCode.FORBIDDEN,
      ErrorType.UNAUTHORIZED.message,
      ErrorType.UNAUTHORIZED.code,
      []
    );
  }
};

/**
 *
 * @param qnaIdx
 * @param title
 * @param content
 * @desc qna 수정
 */
const updateQna = async (
  qnaIdx: number,
  title: string | undefined,
  content: string | undefined
) => {
  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    transactionalEntityManager.query(
      `UPDATE qna SET title = IFNULL(?, title), content = IFNULL(?, content)
        WHERE qnaIdx = ?`,
      [title, content, qnaIdx]
    );
  });
};

/**
 *
 * @param qnaIdx
 * @desc qna 삭제
 */
const deleteQna = async (qnaIdx: number) => {
  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    await transactionalEntityManager
      .createQueryBuilder()
      .softDelete()
      .from(Qna)
      .where('qnaIdx = :qnaIdx', { qnaIdx })
      .execute();
  });
};

export default {
  createQna,
  isExistQnaIdx,
  getQna,
  isUserQna,
  updateQna,
  deleteQna
};
