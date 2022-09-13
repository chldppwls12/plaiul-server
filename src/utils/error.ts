class CustomError extends Error {
  httpStatusCode: number;
  message: string;
  code: number;
  errors: any[];

  constructor(httpStatusCode: number, message: string, code: number, errors: any[]) {
    super();
    this.httpStatusCode = httpStatusCode;
    this.message = message;
    this.code = code;
    this.errors = errors;
  }
}

const ErrorType = {
  CLIENT_ERR: { code: 1000, message: '클라이언트 에러' },

  //1100 토큰 관련
  LOGIN_REQUIRED: { code: 1100, message: '로그인 필요' },
  INVALID_TOKEN: { code: 1101, message: '유효하지 않은 토큰' },
  EXPIRED_TOKEN: { code: 1102, message: '만료된 토큰' },
  VALID_TOKEN: { code: 1103, message: '아직 유효한 토큰' },
  EXPIRED_REFRESH_TOKEN: { code: 1104, message: 'refreshToken 만료로 인한 재로그인 필요' },

  //1200 권한 관련
  UNAUTHORIZED: { code: 1200, message: '권한 없음' },

  //2100 idx 관련
  INVALID_STORYIDX: { code: 2100, message: '존재하지 않는 storyIdx' },
  INVALID_PARENTCOMMENTIDX: { code: 2101, message: '존재하지 않는 parentCommentIdx' },
  INVALID_COMMENTIDX: { code: 2102, message: '존재하지 않는 commentIdx' },
  INVALID_QNAIDX: { code: 2103, message: '존재하지 않는 qnaIdx' },
  INVALID_USERIDX: { code: 2104, message: '존재하지 않는 userIdx' },

  //3000 회원가입 및 로그인 관련
  EXIST_EMAIL: { code: 3000, message: '이미 가입한 이메일' },
  INVALID_AUTHCODE: { code: 3001, message: '인증번호 불일치' },
  EXIST_NICKNAME: { code: 3002, message: '이미 존재하는 닉네임' },
  INVALID_USER_INFO: { code: 3003, message: '존재하지 않는 회원 정보' },

  //3100 신고 관련
  ALREADY_REPORT: { code: 3100, message: '기존에 신고함' },
  CAN_NOT_REPORT_SELF: { code: 3101, message: '자신의 글 신고 불가' },

  //3110 차단 관련
  ALREADY_BLOCK: { code: 3110, message: '기존에 차단함' },
  CAN_NOT_BLOCK_SELF: { code: 3111, message: '자신의 글 차단 불가' },
  BLOCKED_USER_STORY: { code: 3112, message: '차단한 유저의 storyIdx' },

  //5000 SERVER
  INTERAL_SERVER_ERROR: { code: 5000, message: '서버 에러' }
};

export { CustomError, ErrorType };
