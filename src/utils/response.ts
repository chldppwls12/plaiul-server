const successRes = (data: object | object[]) => {
  return {
    data
  };
};

const successResWithMeta = (data: object | object[], meta: object) => {
  return {
    data,
    meta
  };
};

const failRes = (code: number, message: string, errors: any[]) => {
  return {
    code,
    message,
    errors
  };
};

export { successRes, successResWithMeta, failRes };
