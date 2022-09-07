import { Request, Response } from 'express';
import { storyService } from '@services/index';
import httpStatusCode from '@utils/httpStatusCode';
import { successRes, failRes } from '@utils/response';
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

export default {
  createStory
};
