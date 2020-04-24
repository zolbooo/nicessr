import type { Request, Response } from 'express';

export type RequestContext = {
  req: Request;
  res: Response;
};

export type { Ref } from './hooks/ref';
export { isRef, useRef } from './hooks/ref';

export { useForm } from './hooks/form';
