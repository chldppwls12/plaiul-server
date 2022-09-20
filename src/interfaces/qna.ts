import { UserDTO } from '@interfaces/user';

interface QnaDTO {
  qnaIdx: number;
  title: string;
  isLiked: boolean;
  likeCnt: number;
  commentCnt: number;
  createdAt: string;
  user: UserDTO;
}

export { QnaDTO };
