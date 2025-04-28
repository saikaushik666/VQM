import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../features/auth/authSlice';
import { validateRegisterForm } from '../utils/validators';
import { toast } from 'react-toastify';
import { 
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, 
  FiArrowRight, FiPhone, FiCheck 
} from 'react-icons/fi';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);
  const isLoading = status === 'loading';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      phone_number: formData.phone_number,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      user_type: 'customer',
      is_service_provider: false
    };

    dispatch(registerUser(userData))
      .unwrap()
      .then(() => {
        toast.success('Registration successful!');
        navigate('/login');
      })
      .catch((err) => {
        toast.error(err.message || 'Registration failed');
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Header */}
        <div className="mb-8 text-center">
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
    <p className="text-white/80 mt-2">Welcome back</p>
  </div>
        
        {/* Form Card with Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-white/60" />
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
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-rose-400">{errors.username}</p>}
                </div>
                
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-white/60" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 bg-white/5 border ${
                        errors.email ? 'border-rose-400' : 'border-white/20'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/40 transition`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-rose-400">{errors.email}</p>}
                </div>

                {/* Phone Number Field */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="text-white/60" />
                    </div>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 bg-white/5 border ${
                        errors.phone_number ? 'border-rose-400' : 'border-white/20'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/40 transition`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  {errors.phone_number && <p className="mt-1 text-sm text-rose-400">{errors.phone_number}</p>}
                </div>
                
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
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
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80 transition"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-rose-400">{errors.password}</p>}
                </div>
                
                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-white/60" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 py-3 bg-white/5 border ${
                        errors.confirmPassword ? 'border-rose-400' : 'border-white/20'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/40 transition`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80 transition"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-rose-400">{errors.confirmPassword}</p>}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 rounded bg-white/5 border-white/20 text-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-white/80">
                      I agree to the <a href="#" className="text-cyan-400 hover:underline">Terms and Conditions</a>
                    </label>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-5 p-3 bg-rose-500/10 border border-rose-400/30 rounded-lg">
                  <p className="text-sm text-rose-400">{error.message}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 w-full bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 py-3 px-4 rounded-lg font-medium flex items-center justify-center hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    Create Account <FiArrowRight className="ml-2" />
                  </>
                )}
              </button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-white/60">
                  Already have an account?{' '}
                  <a 
                    href="/login" 
                    className="font-medium text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;