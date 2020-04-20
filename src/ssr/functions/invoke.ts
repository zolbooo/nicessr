import type { Request, Response } from 'express';

import { shortenURL } from '../../utils/url';
import { getRawAppContext } from '../appContext';

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
  functionName: string,
) {
  const rawAppContext = await getRawAppContext();
  try {
    const fn = rawAppContext.functions[shortenURL(req.path)]?.[functionName];
    if (!fn) throw Error('Function not found');

    req.body = req.body.data;
    const result = await fn({ ...rawAppContext.context, req, res });
    res.status(200).send({ status: 'success', data: result });
  } catch (err) {
    res.send({ status: 'error', data: err.message });
  }
}
