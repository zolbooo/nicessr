import type { Request, Response } from 'express';

import { getAppContext } from '../appContext';

export interface FnInvocationContext {
  req: Request;
  res: Response;
}
export type FunctionMap = {
  [key: string]: (ctx: FnInvocationContext) => Promise<any>;
};

export async function invokeFunction(
  req: Request,
  res: Response,
  fn: (ctx: FnInvocationContext) => Promise<any>,
) {
  const appContext = await getAppContext();
  try {
    const result = await fn({ ...appContext, req, res });
    res.status(200).send({ status: 'success', data: result });
  } catch (err) {
    res.send({ status: 'error', data: err.message });
  }
}
