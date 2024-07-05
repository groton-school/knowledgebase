import HandlerFactory from './HandlerFactory';

const Favicon: HandlerFactory = () => {
  return (_, res) => {
    res.redirect(301, '/assets/favicon.ico');
  };
};

export default Favicon;
