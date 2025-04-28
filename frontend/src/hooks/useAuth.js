import { useSelector } from 'react-redux';
import { selectAuth } from '../features/auth/authSlice';

const useAuth = () => {
  const auth = useSelector(selectAuth);
  return {
    ...auth,
    isAuthenticated: !!auth.user,
  };
};

export default useAuth;