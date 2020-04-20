import type { Request, Response } from 'express';

export interface FnInvocationContext {
  req: Request;
  res: Response;
}
export type FunctionMap = {
  [key: string]: (ctx: FnInvocationContext) => Promise<any>;
};
