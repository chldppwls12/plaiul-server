import * as _ from 'lodash';
import { Request, Response } from 'express';
import { CustomError } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { failRes, successRes, successResWithMeta } from '@utils/response';
import { ErrorType } from '@utils/error';
import { tipService } from '@services/index';
import { tipContentType } from '@utils/constants';

/**
 *
 * @routes POST /api/tips
 * @desc grower's tip 생성
 * @access private
 */
const createTip = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const { title } = req.body;
  let { textList, orderList } = req.body;

  try {
    const files = JSON.parse(JSON.stringify(req.files));
    if (!files?.thumbnail)
      return res
        .status(httpStatusCode.BAD_REQUEST)
        .json(
          failRes(ErrorType.CLIENT_ERR.code, ErrorType.CLIENT_ERR.message, ['thumbnail 입력 필수'])
        );

    const { location: thumbnail } = files.thumbnail[0];

    if (textList === undefined) textList = [];
    if (typeof textList === 'string') textList = [textList];

    orderList = orderList.map((item: any) => parseInt(item, 10));
    const imageList = files.imageList.map((file: any) => file.location);

    const orderListInfo = _.countBy(orderList);

    if (
      (orderListInfo[tipContentType.TEXT] &&
        orderListInfo[tipContentType.TEXT] !== textList.length) ||
      (orderListInfo[tipContentType.IMAGE] &&
        orderListInfo[tipContentType.IMAGE] !== imageList.length) ||
      orderList.length !== imageList.length + textList.length
    ) {
      return res
        .status(httpStatusCode.BAD_REQUEST)
        .json(
          failRes(ErrorType.CLIENT_ERR.code, ErrorType.CLIENT_ERR.message, [
            'orderList 형식 안맞음'
          ])
        );
    }

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

/**
 *
 * @routes GET /api/tips/:tipIdx
 * @desc grower's tip 상세 조회
 * @access public
 */
const getTip = async (req: Request, res: Response) => {
  const tipIdx = parseInt(req.params.tipIdx);
  const userIdx = req?.userIdx as number;

  try {
    await tipService.isExistTip(tipIdx);
    const result = await tipService.getTip(userIdx, tipIdx);

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
 * @routes PATCH /api/tips/:tipIdx
 * @desc grower's tip 수정
 * @access private
 */
const updateTip = async (req: Request, res: Response) => {
  const tipIdx = parseInt(req.params.tipIdx, 10);
  const userIdx = req.userIdx as number;
  const { title } = req.body;
  let { textList, orderList } = req.body;

  try {
    const files = JSON.parse(JSON.stringify(req.files));

    if (textList === undefined) textList = [];
    if (typeof textList === 'string') textList = [textList];

    if (orderList === undefined) orderList = [];
    orderList = orderList.map((item: any) => parseInt(item, 10));

    let imageList: string[] = [];
    if (files?.imageList) {
      imageList = files.imageList.map((file: any) => file.location);
    }

    const orderListInfo = _.countBy(orderList);

    if (
      (orderListInfo[tipContentType.TEXT] &&
        orderListInfo[tipContentType.TEXT] !== textList.length) ||
      (orderListInfo[tipContentType.IMAGE] &&
        orderListInfo[tipContentType.IMAGE] !== imageList.length) ||
      orderList.length !== imageList.length + textList.length
    ) {
      return res
        .status(httpStatusCode.BAD_REQUEST)
        .json(
          failRes(ErrorType.CLIENT_ERR.code, ErrorType.CLIENT_ERR.message, [
            'orderList 형식 안맞음'
          ])
        );
    }

    let thumbnail;
    if (files?.thumbnail) {
      thumbnail = files.thumbnail[0].location;
    }

    await tipService.isExistTip(tipIdx);
    await tipService.isUserTip(userIdx, tipIdx);
    await tipService.updateTip(tipIdx, title, thumbnail, textList, imageList, orderList);

    return res.status(httpStatusCode.OK).json(successRes({ modified: true }));
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
 * @routes DELETE /api/tips/:tipIdx
 * @desc grower's tip 삭제
 * @access private
 */
const deleteTip = async (req: Request, res: Response) => {
  const tipIdx = parseInt(req.params.tipIdx);
  const userIdx = req.userIdx as number;

  try {
    await tipService.isExistTip(tipIdx);
    await tipService.isUserTip(userIdx, tipIdx);
    await tipService.deleteTip(tipIdx);

    return res.status(httpStatusCode.OK).json(successRes({ deleted: true }));
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
 * @routes PATCH /api/tips/:tipIdx
 * @desc grower's tip 좋아요 여부 변경
 * @access private
 */
const changeTipLike = async (req: Request, res: Response) => {
  const tipIdx = parseInt(req.params.tipIdx);
  const userIdx = req.userIdx as number;

  try {
    await tipService.isExistTip(tipIdx);
    const result = await tipService.changeTipLike(userIdx, tipIdx);

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
 * @routes GET /api/tips
 * @desc grower's tip 전체 조회
 * @access public
 */
const getTips = async (req: Request, res: Response) => {
  const userIdx = req?.userIdx;
  const cursor = req.query?.cursor as string;
  try {
    const result = await tipService.getTips(userIdx, cursor);
    const meta = await tipService.getTipsMeta(cursor);

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

export default { createTip, getTip, updateTip, deleteTip, changeTipLike, getTips };
