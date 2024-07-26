import { Request, Response } from 'express';

function Favicon(_: Request, res: Response) {
  res.redirect(301, '/assets/favicon.ico');
}

export default Favicon;
