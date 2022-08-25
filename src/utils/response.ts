const successRes = (message: string, data: object | []) => {
  return {
    message,
    data
  };
};

const failRes = (code: number, message: string, errors: []) => {
  return {
    code,
    message,
    errors
  };
};

export default {
  successRes,
  failRes
};
