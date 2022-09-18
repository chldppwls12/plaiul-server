import { CustomError, ErrorType } from '@utils/error';
import { Request, Response } from 'express';
import httpStatusCode from '@utils/httpStatusCode';
import { successRes, successResWithMeta, failRes } from '@utils/response';
import { qnaService } from '@services/index';

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

export default { createQna, getQna, updateQna };