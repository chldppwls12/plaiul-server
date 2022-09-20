import { itemsPerPage, sortTypes } from '@utils/constants';
import { Block, Qna, QnaComment, QnaLike } from '@entities/index';
import AppDataSource from '@config/data-source';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { QnaDTO } from '@interfaces/qna';

/**
 *
 * @param userIdx
 * @desc qna 전체 조회
 */
const getQnas = async (
  userIdx: number | undefined,
  sort: string,
  cursor: string
): Promise<QnaDTO[]> => {
  const blocked = await Block.createQueryBuilder()
    .select('blockedUserIdx')
    .where('userIdx = :userIdx', { userIdx })
    .getRawMany();

  let blockedUserIdxs = blocked.map(item => item.blockedUserIdx);
  if (blockedUserIdxs.length === 0) {
    blockedUserIdxs = [-1];
  }

  let query = Qna.createQueryBuilder('qna')
    .select([
      'qna.qnaIdx AS qnaIdx',
      'qna.title AS title',
      'qna.createdAt AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname'
    ])
    .leftJoin('qna.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select('qnaLike.qnaIdx', 'qnaIdx')
          .addSelect('COUNT(*)', 'likeCnt')
          .from(QnaLike, 'qnaLike')
          .groupBy('qnaLike.qnaIdx'),
      'getLikeCnt',
      'getLikeCnt.qnaIdx = qna.qnaIdx'
    )
    .leftJoin(
      qb =>
        qb
          .select('qnaComment.qnaIdx', 'qnaIdx')
          .addSelect('COUNT(*)', 'commentCnt')
          .from(QnaComment, 'qnaComment')
          .groupBy('qnaComment.qnaIdx'),
      'getCommentCnt',
      'getCommentCnt.qnaIdx = qna.qnaIdx'
    )
    .addSelect('IFNULL(getCommentCnt.commentCnt, 0)', 'commentCnt')
    .addSelect('IFNULL(getLikeCnt.likeCnt, 0)', 'likeCnt')
    .where('qna.userIdx NOT IN (:...blockedUserIdxs)', { blockedUserIdxs });

  if (sort === sortTypes.POPULAR) {
    query = query.orderBy('likeCnt', 'DESC');
  } else if (sort === sortTypes.RECENTLY) {
    query = query.orderBy('qna.qnaIdx', 'DESC');
  }

  if (cursor) {
    query = query.offset(parseInt(cursor));
  }

  const qnas = await query.limit(itemsPerPage.GET_ALL_QNA).getRawMany();

  const result: any = [];

  let isLiked;

  for (let qna of qnas) {
    if (userIdx) {
      isLiked = await QnaLike.createQueryBuilder()
        .select()
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('qnaIdx = :qnaIdx', { qnaIdx: qna.qnaIdx })
        .getOne();
    }

    result.push({
      qnaIdx: qna.qnaIdx,
      title: qna.title,
      createdAt: qna.createdAt,
      commentCnt: qna.commentCnt,
      likeCnt: qna.likeCnt,
      user: {
        userIdx: qna.userIdx,
        nickname: qna.nickname
      },
      isLiked: isLiked ? true : false
    });
  }

  return result;
};

/**
 * @param cursor
 * @desc qna 관련 meta data
 */
const getQnasMeta = async (
  userIdx: number | undefined,
  sort: string,
  cursor: string | undefined
) => {
  const blocked = await Block.createQueryBuilder()
    .select('blockedUserIdx')
    .where('userIdx = :userIdx', { userIdx })
    .getRawMany();

  let blockedUserIdxs = blocked.map(item => item.blockedUserIdx);
  if (blockedUserIdxs.length === 0) {
    blockedUserIdxs = [-1];
  }

  let query = Qna.createQueryBuilder('qna')
    .select()
    .leftJoin(
      qb =>
        qb
          .select('qnaLike.qnaIdx', 'qnaIdx')
          .addSelect('COUNT(*)', 'likeCnt')
          .from(QnaLike, 'qnaLike')
          .groupBy('qnaLike.qnaIdx'),
      'getLikeCnt',
      'getLikeCnt.qnaIdx = qna.qnaIdx'
    )
    .addSelect('IFNULL(getLikeCnt.likeCnt, 0)', 'likeCnt')
    .where('userIdx NOT IN (:...blockedUserIdxs)', {
      blockedUserIdxs
    })
    .take(itemsPerPage.GET_ALL_QNA);

  if (cursor) {
    query = query.andWhere('qna.qnaIdx < :cursor', { cursor: parseInt(cursor) });
  }

  if (sort === sortTypes.POPULAR) {
    query = query.orderBy('likeCnt', 'DESC');
  } else if (sort === sortTypes.RECENTLY) {
    query = query.orderBy('qna.qnaIdx', 'DESC');
  }

  const nextQna = await query.getOne();

  let nextCursor = null;
  if (nextQna) {
    nextCursor = cursor
      ? String(parseInt(cursor) + itemsPerPage.GET_ALL_QNA)
      : String(itemsPerPage.GET_ALL_QNA);
  }

  const totalQnaCnt = await Qna.createQueryBuilder('qna')
    .select()
    .where('userIdx NOT IN (:...blockedUserIdxs)', { blockedUserIdxs })
    .getCount();

  const meta = {
    count: totalQnaCnt,
    nextCursor
  };

  return meta;
};

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
  getQnas,
  getQnasMeta,
  createQna,
  isExistQnaIdx,
  getQna,
  isUserQna,
  updateQna,
  deleteQna
};
