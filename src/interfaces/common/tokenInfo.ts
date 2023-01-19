interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface VerifyTokenResult {
  valid: boolean;
  userIdx?: number;
  errCode?: number;
}

export { Tokens, VerifyTokenResult };
