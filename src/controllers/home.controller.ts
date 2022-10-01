import { Request, Response } from 'express';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { failRes, successRes } from '@utils/response';
import { homeService } from '@services/index';

/**
 *
 * @routes GET /api/home
 * @desc 홈 화면 조회
 * @access public
 */
const getHome = async (req: Request, res: Response) => {
  try {
    const result = await homeService.getHome();
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

export default {
  getHome
};
