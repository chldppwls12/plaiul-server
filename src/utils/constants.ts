const sortTypes = {
  POPULAR: 'popular',
  RECENTLY: 'recently'
};

const itemsPerPage = {
  GET_ALL_STORY: 5,
  GET_STORY_COMMENT: 5,
  GET_ALL_QNA: 5,
  GET_QNA_COMMENT: 6,
  GET_ALL_TIP: 5
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

export { sortTypes, itemsPerPage, reportType, tipContentType };
