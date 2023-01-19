import { Brackets } from 'typeorm';
import { itemsPerPage, sortTypes } from '@utils/constants';
import { Block, Qna, QnaComment, QnaLike, QnaReqReport, CommentReqReport } from '@entities/index';
import AppDataSource from '@config/data-source';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { QnaDTO } from '@interfaces/qna';
import { getReportReason } from '@utils/reason';
import { LikeResult } from '@interfaces/common/response';

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
      'CONVERT_TZ(qna.createdAt, "UTC", "Asia/Seoul") AS createdAt',
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

  if (sort === sortTypes.RECENTLY) {
    query = query.orderBy('qna.qnaIdx', 'DESC');
  } else if (sort === sortTypes.POPULAR) {
    query = query.orderBy('likeCnt', 'DESC').addOrderBy('qna.qnaIdx', 'DESC');
  }

  if (cursor) {
    if (sort === sortTypes.RECENTLY) {
      query = query.andWhere('qna.qnaIdx < :qnaIdx', { qnaIdx: cursor });
    } else if (sort === sortTypes.POPULAR) {
      query = query.andWhere(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(qna.qnaIdx, 0), 10, '0')) < :cursor`,
        { cursor }
      );
    }
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

const getQnaNextCursor = async (
  cursor: string | undefined,
  sort: string,
  blockedUsers: number[]
) => {
  if (sort === sortTypes.RECENTLY) {
    let query = Qna.createQueryBuilder()
      .select()
      .limit(itemsPerPage.GET_ALL_QNA)
      .where('userIdx NOT IN (:...blockedUsers)', {
        blockedUsers
      })
      .orderBy('qnaIdx', 'DESC');

    if (cursor) {
      query = query.andWhere('qnaIdx < :qnaIdx', { qnaIdx: cursor });
    }

    const curPageQnas = await query.getMany();
    const nextCursor = curPageQnas[curPageQnas.length - 1]?.qnaIdx;
    if (!nextCursor) {
      return null;
    }

    const nextQnas = await Qna.createQueryBuilder()
      .select()
      .orderBy('qnaIdx', 'DESC')
      .where('qnaIdx < :qnaIdx', { qnaIdx: nextCursor })
      .andWhere('userIdx NOT IN (:...blockedUsers)', {
        blockedUsers
      })
      .getOne();

    return nextQnas ? String(nextCursor) : null;
  } else if (sort === sortTypes.POPULAR) {
    let query = Qna.createQueryBuilder('qna')
      .select('qna.qnaIdx AS qnaIdx')
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
      .where('userIdx NOT IN (:...blockedUsers)', {
        blockedUsers
      })
      .addSelect('IFNULL(getLikeCnt.likeCnt, 0)', 'likeCnt')
      .addSelect(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(qna.qnaIdx, 0), 10, '0'))`,
        'customCursor'
      )
      .orderBy('likeCnt', 'DESC')
      .addOrderBy('qna.qnaIdx', 'DESC')
      .limit(itemsPerPage.GET_ALL_QNA);

    if (cursor) {
      query = query.andWhere(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(qna.qnaIdx, 0), 10, '0')) < :cursor`,
        { cursor }
      );
    }

    const curPageQnas = await query.getRawMany();
    const nextCursor = curPageQnas[curPageQnas.length - 1]?.customCursor;
    if (!nextCursor) {
      return null;
    }

    const nextQnas = await Qna.createQueryBuilder('qna')
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
      .addSelect(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(qna.qnaIdx, 0), 10, '0'))`,
        'customCursor'
      )
      .where(
        `CONCAT(LPAD(IFNULL(getLikeCnt.likeCnt, 0), 10, '0'), LPAD(IFNULL(qna.qnaIdx, 0), 10, '0')) < :nextCursor`,
        { nextCursor }
      )
      .andWhere('userIdx NOT IN (:...blockedUsers)', {
        blockedUsers
      })
      .orderBy('likeCnt', 'DESC')
      .addOrderBy('qna.qnaIdx', 'DESC')
      .getOne();

    return nextQnas ? nextCursor : null;
  }
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

  let blockedUsers = blocked.map(item => item.blockedUserIdx);
  if (blockedUsers.length === 0) {
    blockedUsers = [-1];
  }

  const nextCursor = await getQnaNextCursor(cursor, sort, blockedUsers);
  const totalQnaCnt = await Qna.createQueryBuilder()
    .select()
    .where('userIdx NOT IN (:...blockedUsers)', { blockedUsers })
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
      'CONVERT_TZ(qna.createdAt, "UTC", "Asia/Seoul") AS createdAt',
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
    isWriter: qna.userIdx === userIdx ? true : false,
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

/**
 *
 * @param userIdx
 * @param qnaIdx
 * @desc qna 신고 가능한지
 */
const canReportQna = async (userIdx: number, qnaIdx: number) => {
  const isUserQna = await Qna.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('qnaIdx = :qnaIdx', { qnaIdx })
    .getOne();

  if (isUserQna) {
    throw new CustomError(
      httpStatusCode.BAD_REQUEST,
      ErrorType.CAN_NOT_REPORT_SELF.message,
      ErrorType.CAN_NOT_REPORT_SELF.code,
      []
    );
  }

  const isReported = await QnaReqReport.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('qnaIdx = :qnaIdx', { qnaIdx })
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
 * @param qnaIdx
 * @param reasonIdx
 * @param etcReason
 * @desc qna 신고
 */
const reportQna = async (
  userIdx: number,
  qnaIdx: number,
  reasonIdx: number,
  etcReason: string | undefined
) => {
  const reason = getReportReason(reasonIdx);
  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    transactionalEntityManager
      .createQueryBuilder()
      .insert()
      .into(QnaReqReport)
      .values({
        userIdx,
        qnaIdx,
        reason,
        etcReason
      })
      .execute();
  });
};

/**
 *
 * @param qnaIdx
 * @param parentCommentIdx
 * @desc qna 댓글 작성 가능 여부
 */
const canCreateQnaComment = async (qnaIdx: number, parentCommentIdx: number) => {
  try {
    await QnaComment.createQueryBuilder()
      .where('qnaCommentIdx = :qnaCommentIdx', {
        qnaCommentIdx: parentCommentIdx
      })
      .andWhere('qnaIdx = :qnaIdx', { qnaIdx })
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
 * @param qnaIdx
 * @param parentCommentIdx
 * @param comment
 * @desc qna 댓글 작성
 */
const createQnaComment = async (
  userIdx: number,
  qnaIdx: number,
  parentCommentIdx: number | undefined,
  comment: string
) => {
  let commentIdx;
  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    const qnaComment = await transactionalEntityManager
      .createQueryBuilder()
      .insert()
      .into(QnaComment)
      .values({
        userIdx,
        qnaIdx,
        parentCommentIdx,
        comment
      })
      .execute();

    commentIdx = qnaComment.identifiers[0].qnaCommentIdx;
  });

  return {
    commentIdx
  };
};

/**
 *
 * @param qnaIdx
 * @param qnaCommentIdx
 * @desc 존재하는 qna 댓글인지
 */
const isExistQnaCommentIdx = async (qnaIdx: number, qnaCommentIdx: number) => {
  try {
    await QnaComment.createQueryBuilder()
      .select()
      .where('qnaCommentIdx = :qnaCommentIdx', { qnaCommentIdx })
      .andWhere('qnaIdx = :qnaIdx', { qnaIdx })
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
 * @param qnaCommentIdx
 * @desc 유저의 qna 댓글인지
 */
const isUserQnaComment = async (userIdx: number, qnaCommentIdx: number) => {
  try {
    await QnaComment.createQueryBuilder()
      .select()
      .where('qnaCommentIdx = :qnaCommentIdx', { qnaCommentIdx })
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
 * @param qnaCommentIdx
 * @param comment
 * @desc qna 댓글 수정
 */
const updateQnaComment = async (qnaCommentIdx: number, comment: string) => {
  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    await transactionalEntityManager
      .createQueryBuilder()
      .update(QnaComment)
      .set({ comment })
      .where('qnaCommentIdx = :qnaCommentIdx', { qnaCommentIdx })
      .execute();
  });
};

/**
 *
 * @param qnaCommentIdx
 * @desc qna 댓글 삭제
 */
const deleteQnaComment = async (qnaCommentIdx: number) => {
  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    await transactionalEntityManager
      .createQueryBuilder()
      .softDelete()
      .from(QnaComment)
      .where('qnaCommentIdx = :qnaCommentIdx', { qnaCommentIdx })
      .execute();
  });
};

/** @param userIdx
 * @param qnaIdx
 * @desc qna 좋아요 변경
 */
const changeQnaLike = async (userIdx: number, qnaIdx: number) => {
  let result: LikeResult = {
    isLiked: true
  };

  const likeStatus = await QnaLike.createQueryBuilder()
    .select()
    .where('userIdx = :userIdx', { userIdx })
    .andWhere('qnaIdx = :qnaIdx', { qnaIdx })
    .getOne();

  await AppDataSource.manager.transaction(async transactionalEntityManager => {
    if (likeStatus) {
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(QnaLike)
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('qnaIdx = :qnaIdx', { qnaIdx })
        .execute();

      result = { isLiked: false };
    } else {
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(QnaLike)
        .values({ userIdx, qnaIdx })
        .execute();

      result = { isLiked: true };
    }
  });
  return result;
};

/**
 *
 * @param userIdx
 * @param qnaCommentIdx
 * @desc qna 댓글 기존 신고 체크
 */
const canReportQnaComment = async (userIdx: number, qnaCommentIdx: number) => {
  const isReported = await CommentReqReport.createQueryBuilder()
    .select()
    .where('qnaCommentIdx = :qnaCommentIdx', { qnaCommentIdx })
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
 * @param qnaCommentIdx
 * @param reasonIdx
 * @param etcReason
 * @desc qna 댓글 신고
 */
const reportQnaComment = async (
  userIdx: number,
  qnaCommentIdx: number,
  reasonIdx: number,
  etcReason: string | undefined
) => {
  const reason = getReportReason(reasonIdx);
  try {
    await AppDataSource.manager.transaction(async transactionalEntityManager => {
      transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(CommentReqReport)
        .values({
          userIdx,
          qnaCommentIdx,
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
 * @param cursor
 * @param qnaIdx
 * @desc Qna 댓글 조회
 */
const getQnaComments = async (
  userIdx: number | undefined,
  cursor: string | undefined,
  qnaIdx: number
) => {
  let result: any = [];
  const { userIdx: qnaUserIdx } = await Qna.createQueryBuilder()
    .select('userIdx')
    .where('qnaIdx = :qnaIdx', { qnaIdx })
    .getRawOne();

  const blocked = await Block.createQueryBuilder()
    .select('blockedUserIdx')
    .where('userIdx = :userIdx', { userIdx })
    .getRawMany();

  let blockedUsers = blocked.map(item => item.blockedUserIdx);
  if (blockedUsers.length === 0) {
    blockedUsers = [-1];
  }

  let query = QnaComment.createQueryBuilder('qnaComment')
    .select([
      'qnaComment.qnaCommentIdx AS commentIdx',
      'qnaComment.comment AS content',
      'CONVERT_TZ(qnaComment.createdAt, "UTC", "Asia/Seoul") AS createdAt',
      'user.userIdx AS userIdx',
      'user.nickname AS nickname',
      'user.profile AS profile',
      'qnaComment.deletedAt AS deletedAt'
    ])
    .leftJoin('qnaComment.user', 'user')
    .leftJoin(
      qb =>
        qb
          .select('qnaRecomment.parentCommentIdx', 'parentCommentIdx')
          .addSelect('COUNT(*)', 'recommentCnt')
          .from(QnaComment, 'qnaRecomment')
          .groupBy('qnaRecomment.parentCommentIdx'),
      'getQnaRecomment',
      'getQnaRecomment.parentCommentIdx = qnaComment.qnaCommentIdx'
    )
    .addSelect('IFNULL(recommentCnt, 0)', 'recommentCnt')
    .where('qnaComment.qnaIdx = :qnaIdx', { qnaIdx })
    .andWhere('qnaComment.parentCommentIdx IS NULL')
    .andWhere(
      new Brackets(qb => {
        qb.where('qnaComment.deletedAt IS NULL').orWhere(
          'qnaComment.deletedAt IS NOT NULL AND recommentCnt > 0'
        );
      })
    );

  if (cursor) {
    query = query.andWhere('qnaComment.qnaCommentIdx > :cursor', { cursor });
  }

  const parentComments = await query.withDeleted().limit(itemsPerPage.GET_QNA_COMMENT).getRawMany();
  for (let parentComment of parentComments) {
    const { commentIdx: qnaCommentIdx } = parentComment;
    const reComments = await QnaComment.createQueryBuilder('qnaRecomment')
      .select([
        'qnaRecomment.qnaCommentIdx AS commentIdx',
        'qnaRecomment.comment AS content',
        'CONVERT_TZ(qnaRecomment.createdAt, "UTC", "Asia/Seoul") AS createdAt',
        'user.userIdx AS userIdx',
        'user.nickname AS nickname',
        'user.profile AS profile'
      ])
      .leftJoin('qnaRecomment.user', 'user')
      .where('qnaRecomment.parentCommentIdx = :qnaCommentIdx', { qnaCommentIdx })
      .getRawMany();

    let reCommentsResult = [];
    for (let reComment of reComments) {
      reCommentsResult.push({
        commentIdx: reComment.commentIdx,
        content: reComment.content,
        createdAt: reComment.createdAt,
        isWriter: reComment.userIdx === qnaUserIdx ? true : false,
        isUserComment: reComment.userIdx === userIdx ? true : false,
        isDeleted: false,
        isBlocked: blockedUsers.includes(reComment.userIdx),
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
      isWriter: parentComment.userIdx === qnaUserIdx ? true : false,
      isUserComment: parentComment.userIdx === userIdx ? true : false,
      isDeleted: parentComment.deletedAt ? true : false,
      isBlocked: blockedUsers.includes(parentComment.userIdx),
      user: {
        userIdx: parentComment.userIdx,
        nickname: parentComment.nickname,
        profile: parentComment.profile === '' ? null : parentComment.profile
      },
      reComments: reCommentsResult
    });
  }

  return result;
};

/**
 *
 * @param qnaIdx
 * @param cursor
 * @desc qna 댓글 meta
 */
const getQnaCommentsMeta = async (qnaIdx: number, cursor: string | undefined) => {
  const nextCursor = await getQnaCommentNextCursor(qnaIdx, cursor);

  return {
    nextCursor
  };
};

const getQnaCommentNextCursor = async (qnaIdx: number, cursor: string | undefined) => {
  let query = QnaComment.createQueryBuilder('qnaComment')
    .select('qnaComment.qnaCommentIdx', 'qnaCommentIdx')
    .leftJoin(
      qb =>
        qb
          .select('qnaRecomment.parentCommentIdx', 'parentCommentIdx')
          .addSelect('COUNT(*)', 'recommentCnt')
          .from(QnaComment, 'qnaRecomment')
          .groupBy('qnaRecomment.parentCommentIdx'),
      'getQnaRecomment',
      'getQnaRecomment.parentCommentIdx = qnaComment.qnaCommentIdx'
    )
    .addSelect('IFNULL(recommentCnt, 0)', 'recommentCnt')
    .where('qnaComment.qnaIdx = :qnaIdx', { qnaIdx })
    .andWhere('qnaComment.parentCommentIdx IS NULL')
    .andWhere(
      new Brackets(qb => {
        qb.where('qnaComment.deletedAt IS NULL').orWhere(
          'qnaComment.deletedAt IS NOT NULL AND recommentCnt > 0'
        );
      })
    );

  if (cursor) {
    query = query.andWhere('qnaComment.qnaCommentIdx > :cursor', { cursor });
  }

  const curPageQnaParComments = await query
    .withDeleted()
    .limit(itemsPerPage.GET_QNA_COMMENT)
    .getRawMany();

  const nextCursor = curPageQnaParComments[curPageQnaParComments.length - 1]?.qnaCommentIdx;

  if (!nextCursor) {
    return null;
  }

  const nextQnaParComments = await QnaComment.createQueryBuilder('qnaComment')
    .select('qnaComment.qnaCommentIdx', 'qnaCommentIdx')
    .leftJoin(
      qb =>
        qb
          .select('qnaRecomment.parentCommentIdx', 'parentCommentIdx')
          .addSelect('COUNT(*)', 'recommentCnt')
          .from(QnaComment, 'qnaRecomment')
          .groupBy('qnaRecomment.parentCommentIdx'),
      'getQnaRecomment',
      'getQnaRecomment.parentCommentIdx = qnaComment.qnaCommentIdx'
    )
    .addSelect('IFNULL(recommentCnt, 0)', 'recommentCnt')
    .where('qnaComment.qnaIdx = :qnaIdx', { qnaIdx })
    .andWhere('qnaComment.parentCommentIdx IS NULL')
    .andWhere(
      new Brackets(qb => {
        qb.where('qnaComment.deletedAt IS NULL').orWhere(
          'qnaComment.deletedAt IS NOT NULL AND recommentCnt > 0'
        );
      })
    )
    .andWhere('qnaComment.qnaCommentIdx > :cursor', { cursor: nextCursor })
    .withDeleted()
    .limit(itemsPerPage.GET_QNA_COMMENT)
    .getRawOne();

  return nextQnaParComments ? String(nextCursor) : null;
};

export default {
  getQnas,
  getQnasMeta,
  createQna,
  isExistQnaIdx,
  getQna,
  isUserQna,
  updateQna,
  deleteQna,
  canReportQna,
  reportQna,
  canCreateQnaComment,
  createQnaComment,
  isExistQnaCommentIdx,
  isUserQnaComment,
  updateQnaComment,
  deleteQnaComment,
  changeQnaLike,
  canReportQnaComment,
  reportQnaComment,
  getQnaComments,
  getQnaCommentsMeta
};
