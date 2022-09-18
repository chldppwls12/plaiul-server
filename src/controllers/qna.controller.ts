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

export default { createQna };
