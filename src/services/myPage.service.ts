import { User } from '@entities/index';

const getMyPage = async (userIdx: number) => {
  const result = await User.createQueryBuilder()
    .select(['userIdx', 'nickname', 'IF(profile = "", NULL, profile) AS profile'])
    .where('userIdx = :userIdx', { userIdx })
    .getRawOne();

  return result;
};

export default {
  getMyPage
};
