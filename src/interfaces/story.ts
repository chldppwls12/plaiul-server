interface createStoryResult {
  storyIdx: number;
}

interface GetStoryDTO {
  storyIdx: number;
  title: string;
  thumbnail?: string;
  images?: string[];
  content?: string;
  tags?: string[];
  isLiked?: boolean;
  likeCnt?: number;
  commentCnt?: number;
  createdAt?: string;
  user: { userIdx: number; nickname: string };
}

export { createStoryResult, GetStoryDTO };
