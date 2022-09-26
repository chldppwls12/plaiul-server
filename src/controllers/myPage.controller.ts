import { Request, Response } from 'express';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { successRes, failRes } from '@utils/response';
import { myPageService } from '@services/index';

const getMyPage = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  try {
    const result = await myPageService.getMyPage(userIdx);

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

export default { getMyPage };
