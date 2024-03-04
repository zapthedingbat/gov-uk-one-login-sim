/* This is a convenience wrapper to ensure async express handlers pass errors to the error handler*/
import { NextFunction, RequestHandler } from "express";
import { ParamsDictionary, Query } from "express-serve-static-core";

export default function AsyncHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query,
>(handler: (...args: Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>) => Promise<void>): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return function(...args){
    return Promise.resolve(handler(...args)).catch(args[args.length-1] as NextFunction);
  };
}


