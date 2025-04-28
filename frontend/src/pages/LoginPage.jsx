import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError } from '../features/auth/authSlice';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiHelpCircle } from 'react-icons/fi';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, isAuthenticated } = useSelector((state) => state.auth);
  const isLoading = status === 'loading';

  useEffect(() => {
    // Clear any previous errors when component mounts
    dispatch(clearError());
    
    // Check local storage for saved username
    const savedUsername = localStorage.getItem('virtualq_username');
    if (savedUsername) {
      setFormData(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
  }, [dispatch, isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Handle remember me functionality
    if (rememberMe) {
      localStorage.setItem('virtualq_username', formData.username);
    } else {
      localStorage.removeItem('virtualq_username');
    }

    dispatch(loginUser(formData))
      .unwrap()
      .then(() => {
        toast.success('Login successful! Redirecting to dashboard...');
        navigate('/');
      })
      .catch((err) => {
        const errorMessage = err?.message || 
                            err?.detail || 
                            'Login failed. Please check your credentials.';
        toast.error(errorMessage);
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 p-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand Header */}
        <div className="text-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-20 h-20 mx-auto mb-4">
            <circle cx="50" cy="50" r="45" fill="#0e7490" />
            <path d="M50 20 C32 20 25 35 25 50 C25 65 32 80 50 80 C68 80 75 65 75 50 C75 35 68 20 50 20 Z" fill="#22d3ee" stroke="white" stroke-width="3" />
            <path d="M60 65 L75 80" stroke="white" stroke-width="5" stroke-linecap="round" />
            <circle cx="50" cy="50" r="20" fill="#0e7490" />
            <circle cx="35" cy="50" r="5" fill="white" />
            <circle cx="50" cy="50" r="5" fill="white" />
            <circle cx="65" cy="50" r="5" fill="white" opacity="0.6" />
          </svg>
          
          <h1 className="text-3xl font-bold text-cyan-400">VirtualQ</h1>
          <p className="text-white/80 mt-2">Queue management simplified</p>
        </div>
        
        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 overflow-hidden transition-all hover:border-white/30">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Welcome back</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-white/60" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 bg-white/5 border ${
                        errors.username ? 'border-rose-400' : 'border-white/20'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/40 transition`}
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-rose-400">{errors.username}</p>}
                </div>
                
                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-white/80">Password</label>
                    <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-white/60" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 py-3 bg-white/5 border ${
                        errors.password ? 'border-rose-400' : 'border-white/20'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/40 transition`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80 transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-rose-400">{errors.password}</p>}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={toggleRememberMe}
                    className="h-4 w-4 text-cyan-400 focus:ring-cyan-400 border-white/20 rounded bg-white/5"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-white/80">
                    Remember my username
                  </label>
                </div>

                {error && (
                  <div className="mt-2 p-3 bg-rose-500/10 border border-rose-400/30 rounded-lg">
                    <p className="text-sm text-rose-400">
                      {typeof error === 'string' ? error : 'Invalid credentials'}
                    </p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-500 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      Sign In <FiArrowRight className="ml-2" />
                    </>
                  )}
                </button>
                
                {/* Account Creation Link */}
                <div className="mt-6 text-center">
                  <p className="text-white/60 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition font-medium">
                      Create one now
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Help Section */}
        <div className="mt-6 text-center">
          <a href="/help" className="inline-flex items-center text-white/60 text-sm hover:text-white/80 transition">
            <FiHelpCircle className="mr-1" /> Need help? Contact support
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;