import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import httpStatusCode from '@utils/httpStatusCode';
import { ErrorType } from '@utils/error';
import { failRes } from '@utils/response';

const validator = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(httpStatusCode.BAD_REQUEST)
      .json(failRes(ErrorType.CLIENT_ERR.code, ErrorType.CLIENT_ERR.message, errors.array()));
  }

  next();
};

export default validator;
