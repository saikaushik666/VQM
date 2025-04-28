import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FiLogOut, FiClock, FiUser, FiBarChart2, FiUsers, 
  FiSettings, FiMenu, FiX, FiHome, FiHelpCircle, 
  FiChevronDown 
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { toast } from 'react-toastify';

const Navbar = ({ user, viewMode, setViewMode, showMyQueue, setShowMyQueue, showAgentTools, setShowAgentTools }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = () => {
    toast.info("Logging you out...");
    dispatch(logoutUser());
  };

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navItems = [
    { 
      icon: <FiHome className="text-lg" />, 
      label: 'Dashboard', 
      link: '/',
      active: location.pathname === '/'
    },
    { 
      icon: <FiClock className="text-lg" />, 
      label: 'Curent Queue', 
      link: '/my-queue',
      active: location.pathname === '/my-queue'
    },
    ...(user?.user_type === 'service provider' 
      ? [{ 
          icon: <FiUsers className="text-lg" />, 
          label: 'Service Provider Tools', 
          action: () => {
            setShowAgentTools(true);
            setShowMyQueue(false);
            setViewMode('default');
          },
          active: showAgentTools
        }] 
      : []),
    { 
      icon: <FiSettings className="text-lg" />, 
      label: 'My Profile', 
      link: '/settings',
      active: location.pathname === '/settings'
    },
    { 
      icon: <FiHelpCircle className="text-lg" />, 
      label: 'Help Center', 
      link: '/help-center',
      active: location.pathname === '/help-center'
    }
  ];

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed inset-y-0 left-0 bg-white/10 backdrop-blur-lg w-64 z-10 border-r border-white/20 flex-col">
        <div className="flex items-center justify-center py-6 px-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-10 h-10">
              <circle cx="50" cy="50" r="45" fill="#0e7490" />
              <path d="M50 20 C32 20 25 35 25 50 C25 65 32 80 50 80 C68 80 75 65 75 50 C75 35 68 20 50 20 Z" fill="#22d3ee" stroke="white" strokeWidth="3" />
              <path d="M60 65 L75 80" stroke="white" strokeWidth="5" strokeLinecap="round" />
              <circle cx="50" cy="50" r="20" fill="#0e7490" />
              <circle cx="35" cy="50" r="5" fill="white" />
              <circle cx="50" cy="50" r="5" fill="white" />
              <circle cx="65" cy="50" r="5" fill="white" opacity="0.6" />
            </svg>
            <h1 className="text-2xl font-bold text-cyan-400">VirtualQ</h1>
          </div>
        </div>
        
        {/* User Profile Section */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
              {user?.username.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-white">{user?.username || "User"}</span>
              <span className="text-xs text-white/60">{user?.role || "User"}</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                {item.link ? (
                  <Link
                    to={item.link}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                      item.active
                        ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span> {item.label}
                  </Link>
                ) : (
                  <button 
                    onClick={item.action}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                      item.active
                        ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
          
          {/* Logout Section */}
          <div className="border-t border-white/20 p-4 mt-auto">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-rose-500/80 rounded-lg hover:bg-rose-500 transition-colors"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900/90 backdrop-blur-lg sticky top-0 z-20 border-b border-white/10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
                setUserMenuOpen(false);
              }}
              className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
            
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8 mr-2">
                <circle cx="50" cy="50" r="45" fill="#0e7490" />
                <path d="M50 20 C32 20 25 35 25 50 C25 65 32 80 50 80 C68 80 75 65 75 50 C75 35 68 20 50 20 Z" fill="#22d3ee" stroke="white" strokeWidth="3" />
                <path d="M60 65 L75 80" stroke="white" strokeWidth="5" strokeLinecap="round" />
                <circle cx="50" cy="50" r="20" fill="#0e7490" />
                <circle cx="35" cy="50" r="5" fill="white" />
                <circle cx="50" cy="50" r="5" fill="white" />
                <circle cx="65" cy="50" r="5" fill="white" opacity="0.6" />
              </svg>
              <h1 className="text-xl font-bold text-cyan-400">VirtualQ</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center space-x-1 p-1 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                aria-label="User menu"
              >
                <div className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {user?.username.charAt(0).toUpperCase() || "U"}
                </div>
                <FiChevronDown className="text-white/60" />
              </button>
              
              {/* Mobile User Dropdown */}
              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-30 border border-white/10"
                  onClick={stopPropagation}
                >
                  <div className="p-3 border-b border-white/10">
                    <p className="font-medium text-white">{user?.username || "User"}</p>
                    <p className="text-xs text-white/60">{user?.role || "User"}</p>
                  </div>
                  <div>
                    <button className="w-full text-left p-3 hover:bg-white/5 transition-colors text-white flex items-center space-x-2">
                      <FiUser className="text-white/60" />
                      <span>Profile</span>
                    </button>
                    <Link 
                      to="/settings"
                      className="w-full text-left p-3 hover:bg-white/5 transition-colors text-white flex items-center space-x-2 block"
                    >
                      <FiSettings className="text-white/60" />
                      <span>Settings</span>
                    </Link>
                    <Link 
                      to="/help-center"
                      className="w-full text-left p-3 hover:bg-white/5 transition-colors text-white flex items-center space-x-2 block"
                    >
                      <FiHelpCircle className="text-white/60" />
                      <span>Help Center</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left p-3 hover:bg-rose-500/20 transition-colors text-rose-400 flex items-center space-x-2 border-t border-white/10"
                    >
                      <FiLogOut />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-10"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div 
              className="absolute top-0 left-0 h-full w-64 bg-gray-900 border-r border-white/10 shadow-lg p-4"
              onClick={stopPropagation}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8">
                    <circle cx="50" cy="50" r="45" fill="#0e7490" />
                    <path d="M50 20 C32 20 25 35 25 50 C25 65 32 80 50 80 C68 80 75 65 75 50 C75 35 68 20 50 20 Z" fill="#22d3ee" stroke="white" strokeWidth="3" />
                    <path d="M60 65 L75 80" stroke="white" strokeWidth="5" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="20" fill="#0e7490" />
                    <circle cx="35" cy="50" r="5" fill="white" />
                    <circle cx="50" cy="50" r="5" fill="white" />
                    <circle cx="65" cy="50" r="5" fill="white" opacity="0.6" />
                  </svg>
                  <h1 className="text-xl font-bold text-cyan-400">VirtualQ</h1>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                >
                  <FiX />
                </button>
              </div>
              
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="bg-cyan-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
                    {user?.username.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="font-medium text-white">{user?.username || "User"}</div>
                    <div className="text-xs text-white/60">{user?.role || "User"}</div>
                  </div>
                </div>
              </div>
              
              <nav className="space-y-1">
                {navItems.map((item, index) => (
                  item.link ? (
                    <Link
                      key={index}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                        item.active
                          ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span> {item.label}
                    </Link>
                  ) : (
                    <button 
                      key={index}
                      onClick={() => {
                        item.action();
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                        item.active
                          ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span> {item.label}
                    </button>
                  )
                ))}
                
                <div className="pt-4 mt-4 border-t border-white/10">
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-3 flex items-center justify-center gap-2 bg-rose-500/80 text-white rounded-lg hover:bg-rose-500 transition-colors"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;