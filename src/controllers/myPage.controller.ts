import { communityType } from '@utils/constants';
import { Request, Response } from 'express';
import { CustomError, ErrorType } from '@utils/error';
import httpStatusCode from '@utils/httpStatusCode';
import { successRes, failRes, successResWithMeta } from '@utils/response';
import { myPageService } from '@services/index';

/**
 *
 * @route GET /api/my-page
 * @desc 마이페이지 조회
 * @access private
 */
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

/**
 *
 * @route GET /api/my-page/liked/tips
 * @desc 좋아요한 grower's tip 조회
 * @access private
 */
const getLikedTips = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const cursor = req.query?.cursor as string;

  try {
    const result = await myPageService.getLikedTips(userIdx, cursor);
    const meta = await myPageService.getLikedTipsMetaData(userIdx, cursor);
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
 * @route GET /api/my-page/tips
 * @desc 내가 쓴 grower's tip 조회
 * @access private
 */
const getMyTips = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const cursor = req.query?.cursor as string;

  try {
    const result = await myPageService.getMyTips(userIdx, cursor);
    const meta = await myPageService.getMyTipsMetaData(userIdx, cursor);
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
 * @route PATCH /api/my-page/profile
 * @desc 프로필 수정
 * @access private
 */
const updateProfile = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const { nickname } = req.body;
  let { defaultProfile } = req.body;
  const profile = (req.file as any)?.location;
  defaultProfile = defaultProfile ? true : false;

  try {
    await myPageService.updateProfile(userIdx, profile, defaultProfile, nickname);
    return res.status(httpStatusCode.OK).json(successRes({ modified: true }));
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
 * @route GET /api/my-page/liked/community
 * @desc 좋아요한 게시글 조회
 * @access private
 */
const getLikedCommunity = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const { type } = req.query;
  const cursor = req.query?.cursor as string;

  try {
    let result;
    let meta: any;
    if (type === communityType.STORY) {
      result = await myPageService.getLikedStory(userIdx, cursor);
      meta = await myPageService.getLikedStoryMetaData(userIdx, cursor);
    } else if (type === communityType.QNA) {
      result = await myPageService.getLikedQna(userIdx, cursor);
      meta = await myPageService.getLikedQnaMetaData(userIdx, cursor);
    }

    return res.status(httpStatusCode.OK).json(successResWithMeta(result, meta));
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
 * @route GET /api/my-page/community
 * @desc 내가 쓴 게시글 조회
 * @access private
 */
const getUserCommunity = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const { type } = req.query;
  const cursor = req.query?.cursor as string;

  try {
    let result: any;
    let meta: any;
    if (type === communityType.STORY) {
      result = await myPageService.getUserStory(userIdx, cursor);
      meta = await myPageService.getUserStoryMetaData(userIdx, cursor);
    } else if (type === communityType.QNA) {
      result = await myPageService.getUserQna(userIdx, cursor);
      meta = await myPageService.getUserQnaMetaData(userIdx, cursor);
    }

    return res.status(httpStatusCode.OK).json(successResWithMeta(result, meta));
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
 * @route GET /api/my-page/community/comments
 * @desc 댓글 단 게시글 조회
 * @access private
 */
const getUserCommunityComment = async (req: Request, res: Response) => {
  const userIdx = req.userIdx as number;
  const { type } = req.query;
  const cursor = req.query?.cursor as string;

  try {
    let result: any;
    let meta: any;
    if (type === communityType.STORY) {
      result = await myPageService.getUserCommentByStory(userIdx, cursor);
      meta = await myPageService.getUserCommentByStoryMetaData(userIdx, cursor);
    } else if (type === communityType.QNA) {
      result = await myPageService.getUserCommentByQna(userIdx, cursor);
      meta = await myPageService.getUserCommentByQnaMetaData(userIdx, cursor);
    }

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

export default {
  getMyPage,
  getLikedTips,
  getMyTips,
  updateProfile,
  getLikedCommunity,
  getUserCommunity,
  getUserCommunityComment
};
