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
    const meta = await storyService.getStoriesMeta(cursor);
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

export default {
  createStory,
  getStories,
  getStory,
  updateStory
};
