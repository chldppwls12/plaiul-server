const sortTypes = {
  POPULAR: 'popular',
  RECENTLY: 'recently'
};

const itemsPerPage = {
  GET_ALL_STORY: 5,
  GET_STORY_COMMENT: 5,
  GET_ALL_QNA: 5,
  GET_QNA_COMMENT: 6,
  GET_ALL_TIP: 5,
  GET_ALL_LIKE_TIP: 5,
  GET_ALL_MY_TIP: 5,
  GET_ALL_LIKED_STORY: 5,
  GET_ALL_LIKED_QNA: 5,
  GET_ALL_USERS_STORY: 5,
  GET_ALL_USERS_QNA: 5,
  GET_ALL_USERS_STORY_COMMENT: 5,
  GET_ALL_USERS_QNA_COMMENT: 5,
  GET_ALL_TIP_BY_USER: 5
};

const reportType = {
  CURSE: 1,
  PROMOTE: 2,
  ILLEGALITY: 3,
  OBSCENCE: 4,
  LEAKAGE: 5,
  SPAM: 6,
  ETC: 7
};

const tipContentType = {
  TEXT: 0,
  IMAGE: 1
};

const communityType = {
  STORY: 'story',
  QNA: 'qna'
};

export { sortTypes, itemsPerPage, reportType, tipContentType, communityType };
