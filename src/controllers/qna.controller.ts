import { CustomError, ErrorType } from '@utils/error';
import { Request, Response } from 'express';
import httpStatusCode from '@utils/httpStatusCode';
import { successRes, successResWithMeta, failRes } from '@utils/response';
import { qnaService } from '@services/index';

/**
 *
 * @routes /api/qna
 * @desc qna 전체 조회
 */
const getQnas = async (req: Request, res: Response) => {
  const sort = req.query.sort as string;
  const cursor = req.query?.cursor as string;
  const userIdx = req?.userIdx;

  try {
    const result = await qnaService.getQnas(userIdx, sort, cursor);
    const meta = await qnaService.getQnasMeta(userIdx, sort, cursor);
    return res.status(httpStatusCode.OK).json(successResWithMeta(result, meta));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    } else {
      return res
        .status(httpStatusCode.INTERAL_SERVER_ERROR)
        .json(
          failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
        );
    }
  }
};

/**
 *
 * @routes /api/qna
 * @desc qna 작성
 */
const createQna = async (req: Request, res: Response) => {
  const { title, content } = req.body;
  const userIdx = req.userIdx as number;

  try {
    const result = await qnaService.createQna(userIdx, title, content);
    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    console.log(err);
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    } else {
      return res
        .status(httpStatusCode.INTERAL_SERVER_ERROR)
        .json(
          failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
        );
    }
  }
};

/**
 *
 * @routes /api/qna/:qnaIdx
 * @desc qna 상세 조회
 */
const getQna = async (req: Request, res: Response) => {
  const qnaIdx = parseInt(req.params.qnaIdx);
  const userIdx = req?.userIdx;

  try {
    await qnaService.isExistQnaIdx(qnaIdx);
    const result = await qnaService.getQna(userIdx, qnaIdx);

    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    } else {
      return res
        .status(httpStatusCode.INTERAL_SERVER_ERROR)
        .json(
          failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
        );
    }
  }
};

/**
 *
 * @routes /api/qna/:qnaIdx
 * @desc qna 수정
 */
const updateQna = async (req: Request, res: Response) => {
  const qnaIdx = parseInt(req.params.qnaIdx);
  const title = req.body?.title;
  const content = req.body?.content;
  const userIdx = req.userIdx as number;

  try {
    await qnaService.isExistQnaIdx(qnaIdx);
    await qnaService.isUserQna(userIdx, qnaIdx);
    await qnaService.updateQna(qnaIdx, title, content);

    return res.status(httpStatusCode.OK).json(successRes({ modified: true }));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    }
    return res
      .status(httpStatusCode.INTERAL_SERVER_ERROR)
      .json(
        failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
      );
  }
};

/**
 *
 * @routes DELETE /api/qna/:qnaIdx
 * @desc qna 삭제
 */
const deleteQna = async (req: Request, res: Response) => {
  const qnaIdx = parseInt(req.params.qnaIdx);
  const userIdx = req.userIdx as number;

  try {
    await qnaService.isExistQnaIdx(qnaIdx);
    await qnaService.isUserQna(userIdx, qnaIdx);
    await qnaService.deleteQna(qnaIdx);

    return res.status(httpStatusCode.OK).json(successRes({ deleted: true }));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    }
    return res
      .status(httpStatusCode.INTERAL_SERVER_ERROR)
      .json(
        failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
      );
  }
};

/**
 *
 * @routes POST /api/qna/:qnaIdx/report
 * @desc qna 신고
 */
const reportQna = async (req: Request, res: Response) => {
  const qnaIdx = parseInt(req.params.qnaIdx);
  const userIdx = req.userIdx as number;
  const { reasonIdx, reason: etcReason } = req.body;

  try {
    await qnaService.isExistQnaIdx(qnaIdx);
    await qnaService.canReportQna(userIdx, qnaIdx);
    await qnaService.reportQna(userIdx, qnaIdx, reasonIdx, etcReason);

    return res.status(httpStatusCode.OK).json(successRes({ reported: true }));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    }
    return res
      .status(httpStatusCode.INTERAL_SERVER_ERROR)
      .json(
        failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
      );
  }
};

/**
 *
 * @routes POST /api/qna/:qnaIdx/comments
 * @desc Qna 댓글 작성
 */
const createQnaComment = async (req: Request, res: Response) => {
  const qnaIdx = parseInt(req.params.qnaIdx);
  const userIdx = req.userIdx as number;
  const { content: comment, parentCommentIdx } = req.body;

  try {
    await qnaService.isExistQnaIdx(qnaIdx);
    if (parentCommentIdx) {
      await qnaService.canCreateQnaComment(qnaIdx, parentCommentIdx);
    }
    const result = await qnaService.createQnaComment(userIdx, qnaIdx, parentCommentIdx, comment);

    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    }
    return res
      .status(httpStatusCode.INTERAL_SERVER_ERROR)
      .json(
        failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
      );
  }
};

/**
 *
 * @routes PATCH /api/qna/:qnaIdx/comments/:commentIdx
 * @desc qna 댓글 수정
 */
const updateQnaComment = async (req: Request, res: Response) => {
  const qnaIdx = parseInt(req.params.qnaIdx);
  const qnaCommentIdx = parseInt(req.params.commentIdx);
  const userIdx = req.userIdx as number;
  const { content: comment } = req.body;

  try {
    await qnaService.isExistQnaIdx(qnaIdx);
    await qnaService.isExistQnaCommentIdx(qnaIdx, qnaCommentIdx);
    await qnaService.isUserQnaComment(userIdx, qnaCommentIdx);
    await qnaService.updateQnaComment(qnaCommentIdx, comment);

    return res.status(httpStatusCode.OK).json(successRes({ modified: true }));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    }
    return res
      .status(httpStatusCode.INTERAL_SERVER_ERROR)
      .json(
        failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
      );
  }
};

/**
 *
 * @routes DELETE /api/qna/:qnaIdx/comments/:commentIdx
 * @desc qna 댓글 삭제
 */
const deleteQnaComment = async (req: Request, res: Response) => {
  const qnaIdx = parseInt(req.params.qnaIdx);
  const qnaCommentIdx = parseInt(req.params.commentIdx);
  const userIdx = req.userIdx as number;

  try {
    await qnaService.isExistQnaIdx(qnaIdx);
    await qnaService.isExistQnaCommentIdx(qnaIdx, qnaCommentIdx);
    await qnaService.isUserQnaComment(userIdx, qnaCommentIdx);
    await qnaService.deleteQnaComment(qnaCommentIdx);

    return res.status(httpStatusCode.OK).json(successRes({ deleted: true }));
  } catch (err: any) {
    if (err instanceof CustomError) {
      return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
    }
    return res
      .status(httpStatusCode.INTERAL_SERVER_ERROR)
      .json(
        failRes(ErrorType.INTERAL_SERVER_ERROR.code, ErrorType.INTERAL_SERVER_ERROR.message, [])
      );
  }
};

export default {
  getQnas,
  createQna,
  getQna,
  updateQna,
  deleteQna,
  reportQna,
  createQnaComment,
  updateQnaComment,
  deleteQnaComment
};
