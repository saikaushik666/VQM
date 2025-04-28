import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiUser, 
  FiStar, 
  FiCalendar, 
  FiArrowLeft,
  FiInfo,
  FiPhone,
  FiEdit2,
  FiClock,
  FiShield
} from 'react-icons/fi';
import authAPI from '../features/auth/authAPI';

const JoinQueuePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.username || '',
    phone: user?.phone_number || '',
    serviceType: location.state?.queueType || 'regular',
    service_id: location.state?.serviceId || '',
    notes: '',
    priority: false
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await authAPI.getServices();
        setServices(response.data);
        // Set default service if not already set
        if (!formData.service_id && response.data.length > 0) {
          setFormData(prev => ({ ...prev, service_id: response.data[0].id }));
        }
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleServiceTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      serviceType: type,
      priority: type === 'priority'
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (!formData.name || !formData.phone) {
      
      setSubmitting(false);
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      
      setSubmitting(false);
      return;
    }

    if (!formData.service_id) {
      setSubmitting(false);
      return;
    }

    const queueData = {
      service_id: formData.service_id,
      priority: formData.serviceType === 'priority',
      notes: formData.notes,
      customer_name: formData.name,
      customer_phone: formData.phone,
      user: user?.id || null
    };

    try {
      // First verify the token is still valid
      await authAPI.verifyToken();
      
      // Then join the queue using authAPI
      const response = await authAPI.joinQueue(queueData);
      
      if (response.data) {
        // Navigate to MyQueue with the queue data
        navigate('/my-queue', { state: { queueData: response.data } });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          // Attempt to refresh token if expired
          await authAPI.refreshToken();
          // Retry the queue join after refresh
          const retryResponse = await authAPI.joinQueue(queueData);
          navigate('/my-queue', { state: { queueData: retryResponse.data } });
        } catch (refreshError) {
          toast.error('Session expired. Please login again.');
          navigate('/login');
        }
      } else {
        toast.error(err.response?.data?.message || 'Failed to join queue');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate estimated wait time based on service type
  const getEstimatedWaitTime = () => {
    const selectedService = services.find(s => s.id === parseInt(formData.service_id));
    const baseTime = selectedService?.average_service_time || 15;
    
    switch(formData.serviceType) {
      case 'priority':
        return `${Math.floor(baseTime * 0.5)}-${Math.floor(baseTime * 0.75)} minutes`;
      case 'appointment':
        return '0-5 minutes';
      default:
        return `${baseTime}-${baseTime + 5} minutes`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <FiArrowLeft /> Back to Dashboard
          </button>
          
          {user?.is_service_provider && (
            <div className="flex items-center gap-1 text-sm text-amber-300">
              <FiShield size={14} /> Service Provider Mode
            </div>
          )}
        </div>

        {/* Main content card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {/* Card header */}
          <div className="bg-gradient-to-r from-cyan-500/30 to-blue-500/30 px-6 py-4 border-b border-white/10">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FiUser /> Join Queue
            </h1>
          </div>

          {/* Form content */}
          <form onSubmit={onSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Customer Information Section */}
              <div className="bg-white/5 rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4 text-cyan-400">Customer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                      <FiUser size={14} /> Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={onChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                      <FiPhone size={14} /> Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={onChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      required
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details Section */}
              <div className="bg-white/5 rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4 text-cyan-400">Service Details</h2>
                
                {/* Service Selection */}
                <div className="mb-4">
                  <label htmlFor="service_id" className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                    <FiInfo size={14} /> Service Needed
                  </label>
                  {loading ? (
                    <div className="animate-pulse bg-white/5 rounded-lg h-12"></div>
                  ) : (
                    <select
                      id="service_id"
                      name="service_id"
                      value={formData.service_id}
                      onChange={onChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      required
                      disabled={loading}
                    >
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} (~{service.average_service_time} mins)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Estimated Wait Time */}
                {formData.service_id && (
                  <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
                    <FiClock className="text-cyan-400" size={20} />
                    <div>
                      <div className="text-sm text-white/60">Estimated Wait Time</div>
                      <div className="font-medium">
                        {getEstimatedWaitTime()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Queue Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                    <FiStar size={14} /> Queue Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'regular', label: 'Regular', icon: <FiUser />, desc: 'Standard service' },
                      { value: 'priority', label: 'Priority', icon: <FiStar />, desc: 'Faster service', disabled: !user?.is_service_provider },
                      { value: 'appointment', label: 'Appointment', icon: <FiCalendar />, desc: 'Pre-scheduled' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center">
                        <input
                          id={`type-${option.value}`}
                          name="serviceType"
                          type="radio"
                          value={option.value}
                          checked={formData.serviceType === option.value}
                          onChange={() => handleServiceTypeChange(option.value)}
                          className="hidden"
                          disabled={option.disabled}
                        />
                        <label
                          htmlFor={`type-${option.value}`}
                          className={`w-full p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                            formData.serviceType === option.value
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {option.icon}
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-white/60">{option.desc}</div>
                            {option.disabled && (
                              <div className="text-xs text-amber-400 mt-1">
                                {user ? 'Available for staff only' : 'Login required'}
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                    <FiEdit2 size={14} /> Additional Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={onChange}
                    rows="3"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    placeholder="Any special requirements or details..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button - Full width at bottom */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting || loading}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  submitting || loading
                    ? 'bg-gray-500/10 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining Queue...
                  </>
                ) : (
                  'Join Queue Now'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinQueuePage;