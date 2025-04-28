import { Link } from 'react-router-dom';
import { BeatLoader } from 'react-spinners';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, clearError } from '../features/auth/authSlice';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthForm = ({ type }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, status, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    is_service_provider: type === 'register-provider'
  });

  const [errors, setErrors] = useState({});

  const isLoading = status === 'loading';
  const serverError = error;

  useEffect(() => {
    // Clear errors when component mounts
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    // Redirect if user is authenticated
    if (user) {
      navigate(type === 'register-provider' ? '/provider-dashboard' : '/dashboard');
    }
  }, [user, navigate, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (type !== 'login' && !formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (type !== 'login' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const authData = type === 'login' 
      ? { email: formData.email, password: formData.password }
      : formData;
    
    try {
      if (type === 'login') {
        await dispatch(loginUser(authData)).unwrap();
      } else {
        await dispatch(registerUser(authData)).unwrap();
      }
    } catch (error) {
      // Error is already handled by the slice
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-center text-gray-900">
        {type === 'register' 
          ? 'Create Account' 
          : type === 'register-provider'
            ? 'Register as Service Provider'
            : 'Sign In'}
      </h2>
      
      {serverError && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {typeof serverError === 'object' ? JSON.stringify(serverError) : serverError}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {(type === 'register' || type === 'register-provider') && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {(type === 'register' || type === 'register-provider') && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <BeatLoader size={8} color="#ffffff" />
            ) : (
              type === 'login' 
                ? 'Sign In' 
                : type === 'register-provider'
                  ? 'Register Provider'
                  : 'Register'
            )}
          </button>
        </div>
      </form>

      <div className="text-center text-sm">
        {type === 'login' ? (
          <>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register
              </Link>
            </p>
            <p className="mt-2">
              Are you a service provider?{' '}
              <Link to="/register-provider" className="font-medium text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
          </>
        ) : (
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;