import { Request, Response, text } from 'express';
import { CustomError } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { failRes, successRes } from '@utils/response';
import { ErrorType } from '@utils/error';
import { tipService } from '@services/index';

const createTip = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const { title } = req.body;
  let { textList, orderList } = req.body;
  const files = JSON.parse(JSON.stringify(req.files));
  const { location: thumbnail } = files.thumbnail[0];

  if (textList && typeof textList === 'string') {
    textList = [textList];
  }
  orderList = orderList.map((item: any) => parseInt(item, 10));
  let imageList: string[] = [];
  files.imageList.map((file: any) => imageList.push(file.location));

  if (orderList.length !== imageList.length + textList.length) {
    return res
      .status(httpStatusCode.BAD_REQUEST)
      .json(
        failRes(ErrorType.CLIENT_ERR.code, ErrorType.CLIENT_ERR.message, ['orderList 형식 안맞음'])
      );
  }

  try {
    const result = await tipService.createTip(
      userIdx,
      title,
      thumbnail,
      textList,
      imageList,
      orderList
    );

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

export default { createTip };
