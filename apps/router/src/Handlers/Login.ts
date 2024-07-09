import Auth from '../Services/Auth';
import HandlerFactory from './HandlerFactory';

const Login: HandlerFactory = () => {
  return Auth.authorize;
};

export default Login;
