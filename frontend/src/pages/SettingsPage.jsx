import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  FiUser, FiMail, FiPhone, FiLock, 
  FiSave, FiEdit, FiX
} from 'react-icons/fi';
import authAPI from '../features/auth/authAPI';
import Navbar from '../components/Navbar'; // Import the Navbar component

const SettingsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [viewMode, setViewMode] = useState('settings');
  const [showMyQueue, setShowMyQueue] = useState(false);
  const [showAgentTools, setShowAgentTools] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isPasswordEditing && formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number
      };

      if (isPasswordEditing && formData.newPassword) {
        updateData.current_password = formData.currentPassword;
        updateData.new_password = formData.newPassword;
      }

      const response = await authAPI.updateUser(updateData);
      
      toast.success('Settings updated successfully');
      setIsEditing(false);
      setIsPasswordEditing(false);
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Include the Navbar component */}
      <Navbar 
        user={user} 
        viewMode={viewMode}
        setViewMode={setViewMode}
        showMyQueue={showMyQueue}
        setShowMyQueue={setShowMyQueue}
        showAgentTools={showAgentTools}
        setShowAgentTools={setShowAgentTools}
      />
      
      {/* Main content with padding to account for navbar */}
      <div className="pt-20 md:pl-64"> {/* Adjust padding based on your navbar width */}
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FiUser /> Profile Information
              </h2>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm"
                >
                  <FiEdit /> Edit
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 text-sm"
                >
                  <FiX /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-white/80 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20"
                  >
                    <FiSave /> Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FiLock /> Password
              </h2>
              {!isPasswordEditing ? (
                <button 
                  onClick={() => setIsPasswordEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm"
                >
                  <FiEdit /> Change Password
                </button>
              ) : (
                <button 
                  onClick={() => setIsPasswordEditing(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 text-sm"
                >
                  <FiX /> Cancel
                </button>
              )}
            </div>

            {isPasswordEditing && (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-white/80 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-white/80 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                      minLength="8"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                      minLength="8"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20"
                  >
                    <FiSave /> Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;