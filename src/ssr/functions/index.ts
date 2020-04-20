import path from 'path';
import type { Request, Response } from 'express';

import { shortenURL } from '../../utils/url';
import { buildPathSSR } from '../../compiler';
import { loadEntrypoint } from './load';
import { invokeFunction } from './invoke';
import { getRawAppContext } from '../appContext';

import type { Bundle } from '../../compiler/bundler';

export async function listFunctions(url: string) {
  return Object.keys((await getRawAppContext()).functions[shortenURL(url)]);
}

export async function handleRequest(
  req: Request,
  res: Response,
  bundle: Bundle,
) {
  await loadEntrypoint(req.path, path.join(buildPathSSR, bundle.ssr[0]));
  await invokeFunction(req, res, req.body.functionName);
}
