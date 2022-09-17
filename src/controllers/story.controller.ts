import { CustomError, ErrorType } from '@utils/error';
import { Request, Response } from 'express';
import { storyService } from '@services/index';
import httpStatusCode from '@utils/httpStatusCode';
import { successRes, successResWithMeta, failRes } from '@utils/response';
import { createStoryResult } from '@interfaces/story';

/**
 *
 * @routes POST /api/stories
 * @desc 스토리 작성
 * @access private
 */
const createStory = async (req: Request, res: Response) => {
  const { title, content, tags } = req.body;
  const userIdx = req.userIdx as number;

  const images = (req.files as any[])?.map(item => item.location);
  try {
    const result = await storyService.createStory(userIdx, title, content, tags, images);
    return res.status(httpStatusCode.OK).json(successRes(result as createStoryResult));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes GET /api/stories
 * @desc 스토리 전체 조회
 *
 */
const getStories = async (req: Request, res: Response) => {
  const sort = req.query.sort as string;
  const cursor = req.query?.cursor as string;
  const userIdx = req?.userIdx;

  try {
    const result = await storyService.getStories(userIdx, sort, cursor);
    const meta = await storyService.getStoriesMeta(userIdx, cursor);
    return res.status(httpStatusCode.OK).json(successResWithMeta(result, meta));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes GET /api/stories/:storyIdx
 * @desc 스토리 상세 조회
 */
const getStory = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const userIdx = req?.userIdx;

  try {
    await storyService.isExistStory(storyIdx);

    if (userIdx) {
      const isBlockedStory = await storyService.isBlockedStory(userIdx, storyIdx);
      if (isBlockedStory) {
        throw new CustomError(
          httpStatusCode.BAD_REQUEST,
          ErrorType.BLOCKED_USER_STORY.message,
          ErrorType.BLOCKED_USER_STORY.code,
          []
        );
      }
    }
    const result = await storyService.getStory(userIdx, storyIdx);
    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes PATCH /api/stories/:storyIdx
 * @desc 스토리 수정
 */
const updateStory = async (req: Request, res: Response) => {
  const title = req.body?.title;
  const content = req.body?.content;
  const tags = req.body?.tags ? req.body?.tags : [];
  const images = (req?.files as any[])?.map(item => item.location);

  const storyIdx = parseInt(req.params.storyIdx);
  const userIdx = req.userIdx as number;

  try {
    await storyService.isExistStory(storyIdx);
    await storyService.isStoryOwner(userIdx, storyIdx);
    const result = await storyService.updateStory(storyIdx, title, content, tags, images);
    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes DELETE /api/stories/:storyIdx
 * @desc 스토리 삭제
 */
const deleteStory = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const userIdx = req.userIdx as number;

  try {
    await storyService.isExistStory(storyIdx);
    await storyService.isStoryOwner(userIdx, storyIdx);
    await storyService.deletestory(storyIdx);

    return res.status(httpStatusCode.OK).json(successRes({ deleted: true }));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes POST /api/stories/:storyIdx/report
 * @desc 스토리 신고
 */
const reportStory = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const userIdx = req.userIdx as number;
  const { reasonIdx, reason: etcReason } = req.body;

  try {
    await storyService.isExistStory(storyIdx);
    await storyService.canReportStory(userIdx, storyIdx);
    await storyService.reportStory(userIdx, storyIdx, reasonIdx, etcReason);

    return res.status(httpStatusCode.OK).json(successRes({ reported: true }));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes PATCH /api/stories/:storyIdx/like
 * @desc 스토리 좋아요 변경
 */
const changeStoryLike = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const userIdx = req.userIdx as number;

  try {
    await storyService.isExistStory(storyIdx);
    const result = await storyService.changeStoryLike(userIdx, storyIdx);

    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes POST /api/stories/:storyIdx/comments
 * @desc 스토리 댓글 작성
 */
const createStoryComment = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const userIdx = req.userIdx as number;
  const { content: comment, parentCommentIdx } = req.body;

  try {
    await storyService.isExistStory(storyIdx);
    if (parentCommentIdx) {
      await storyService.canCreateStoryComment(storyIdx, parentCommentIdx);
    }
    const result = await storyService.createStoryComment(
      userIdx,
      storyIdx,
      parentCommentIdx,
      comment
    );

    return res.status(httpStatusCode.OK).json(successRes(result));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes PATCH /api/stories/:storyIdx/comments/:commentIdx
 * @desc 스토리 댓글 수정
 */
const updateStoryComment = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const storyCommentIdx = parseInt(req.params.commentIdx);
  const userIdx = req.userIdx as number;
  const { content: comment } = req.body;

  try {
    await storyService.isExistStory(storyIdx);
    await storyService.isExistStoryCommentIdx(storyIdx, storyCommentIdx);
    await storyService.isUserStoryComment(userIdx, storyCommentIdx);
    await storyService.updateStoryComment(storyCommentIdx, comment);

    return res.status(httpStatusCode.OK).json(successRes({ modified: true }));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes DELETE /api/stories/:storyIdx/comments/:commentIdx
 * @desc 스토리 댓글 삭제
 */
const deleteStoryComment = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const storyCommentIdx = parseInt(req.params.commentIdx);
  const userIdx = req.userIdx as number;

  try {
    await storyService.isExistStory(storyIdx);
    await storyService.isExistStoryCommentIdx(storyIdx, storyCommentIdx);
    await storyService.isUserStoryComment(userIdx, storyCommentIdx);
    await storyService.deleteStoryComment(storyCommentIdx);

    return res.status(httpStatusCode.OK).json(successRes({ deleted: true }));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes POST /api/stories/:storyIdx/comments/:commentIdx/report
 * @desc 스토리 댓글 신고
 */
const reportStoryComment = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const storyCommentIdx = parseInt(req.params.commentIdx);
  const userIdx = req.userIdx as number;
  const { reasonIdx, reason: etcReason } = req.body;

  try {
    await storyService.isExistStory(storyIdx);
    await storyService.isExistStoryCommentIdx(storyIdx, storyCommentIdx);
    await storyService.canReportStoryComment(userIdx, storyCommentIdx);
    await storyService.reportStoryComment(userIdx, storyCommentIdx, reasonIdx, etcReason);

    return res.status(httpStatusCode.OK).json(successRes({ reported: true }));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

/**
 *
 * @routes GET /api/stories/:storyIdx/comments
 * @desc 스토리 댓글 조회
 */
const getStoryComments = async (req: Request, res: Response) => {
  const storyIdx = parseInt(req.params.storyIdx);
  const userIdx = req.userIdx as number;
  const cursor = req.query?.cursor as string;

  try {
    await storyService.isExistStory(storyIdx);
    const result = await storyService.getStoryComments(userIdx, storyIdx, cursor);
    const meta = await storyService.getStoryCommentsMeta(storyIdx, cursor);
    return res.status(httpStatusCode.OK).json(successResWithMeta(result, meta));
  } catch (err: any) {
    return res.status(err.httpStatusCode).json(failRes(err.code, err.message, err.errors));
  }
};

export default {
  createStory,
  getStories,
  getStory,
  updateStory,
  deleteStory,
  reportStory,
  changeStoryLike,
  createStoryComment,
  updateStoryComment,
  deleteStoryComment,
  reportStoryComment,
  getStoryComments
};
