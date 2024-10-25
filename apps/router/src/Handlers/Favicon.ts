import { Request, Response } from 'express';

export function Favicon(_: Request, res: Response) {
  res.redirect(301, '/assets/favicon.ico');
}
