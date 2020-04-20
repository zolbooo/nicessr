import type { Request, Response } from 'express';
import type { Bundle } from '../../compiler/bundler';

import { loadEntrypoint } from './load';
import { invokeFunction } from './invoke';

export async function handleRequest(
  req: Request,
  res: Response,
  bundle: Bundle,
) {
  await loadEntrypoint(req.path, bundle.ssr[0]);
  await invokeFunction(req, res, req.body.functionName);
}
