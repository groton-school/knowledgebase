import Logger from '../Services/Logger';
import { Request, Response } from 'express';

export default function Logout() {
  return (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        Logger.error(JSON.stringify(err));
      }
      res.send('Logged out');
    });
  };
}
