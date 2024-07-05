import Logger from '../Services/Logger';
import HandlerFactory from './HandlerFactory';

const Logout: HandlerFactory = () => {
  return (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        Logger.error(JSON.stringify(err));
        res.status(err.code || 500);
        res.send('Error logging out');
      } else {
        res.send('Logged out');
      }
    });
  };
};

export default Logout;
