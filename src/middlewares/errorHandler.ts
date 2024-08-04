import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ApiErrorHandler } from '../utils/apiErrorHandler';
import {Error as mongooseError} from 'mongoose'


type customErrorType = ApiErrorHandler & mongooseError &{
  code:number,
  name:string,
  path:string
} 


const errorHandler = (err: customErrorType , req: Request, res: Response, next: NextFunction): void => {
  err.message=err.message || 'Something went wrong'
  err.statusCode=err.statusCode || 500

  if(err.code===11000){
    err.message='Email already exits'
    err.statusCode=401
}

if(err.name==='CastError'){
  err.message=`Resource not found ${err.path}`

}
  
  
  logger.error(`${req.method} ${req.url} ${err.statusCode} - ${err.message}`);
  res.status(err.statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export default errorHandler;
