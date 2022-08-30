const successRes = (data: object | object[]) => {
  return {
    data
  };
};

const failRes = (code: number, message: string, errors: any[]) => {
  return {
    code,
    message,
    errors
  };
};

export { successRes, failRes };
