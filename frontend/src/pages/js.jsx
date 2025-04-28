import React from 'react';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { joinQueue, leaveQueue, resetQueue } from '../features/queue/queueSlice';
import { toast } from 'react-toastify';
import { 
  FiClock, FiUser, FiMapPin, FiBell, 
  FiBarChart2, FiUsers, FiStar, 
  FiCalendar, FiActivity, FiCheck,
  FiDownload, FiNavigation, FiBookmark
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import authAPI from '../features/auth/authAPI';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { status } = useSelector((state) => state.queue);
  
  // State variables
  const [position, setPosition] = useState(null);
  const [queueLength, setQueueLength] = useState(0);
  const [waitTime, setWaitTime] = useState(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [activeWindows, setActiveWindows] = useState([]);
  const [queueStats, setQueueStats] = useState({ 
    served: 0, 
    avgWait: 0, 
    noShows: 0 
  });
  const [queueType, setQueueType] = useState('regular');
  const [peakHours, setPeakHours] = useState([10, 12, 15]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAgentTools, setShowAgentTools] = useState(false);
  const [viewMode, setViewMode] = useState('default');
  const [currentQueue, setCurrentQueue] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch windows status
        const windowsResponse = await authAPI.getWindows();
        setActiveWindows(windowsResponse.data);
        
        // Fetch queue stats if admin/agent
        if (user?.is_service_provider) {
          const statsResponse = await authAPI.getQueueStats();
          setQueueStats(statsResponse.data);
        }
        
        // Check if user is already in queue
        const queuesResponse = await authAPI.getQueues();
        const userQueue = queuesResponse.data.find(q => 
          q.user?.id === user?.id && 
          ['waiting', 'processing'].includes(q.status)
        );
        
        if (userQueue) {
          setCurrentQueue(userQueue);
          setPosition(userQueue.position);
          setWaitTime(userQueue.wait_time);
          setQueueType(userQueue.priority ? 'priority' : 'regular');
          
          const arrival = new Date(userQueue.join_time);
          arrival.setMinutes(arrival.getMinutes() + (userQueue.wait_time / 60));
          setEstimatedArrival(arrival.toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    fetchInitialData();
  }, [user?.id, user?.is_service_provider]);

  // Fetch queue length
  useEffect(() => {
    const fetchQueueLength = async () => {
      try {
        const response = await authAPI.getQueues();
        const waitingQueues = response.data.filter(q => q.status === 'waiting');
        setQueueLength(waitingQueues.length);
      } catch (error) {
        console.error('Error fetching queue length:', error);
      }
    };

    fetchQueueLength();
  }, [status]);

  // Handle joining queue
  const handleJoinQueue = async (serviceType) => {
    try {
      const queueData = {
        service_id: 1, // Default service ID - should be dynamic in real app
        priority: serviceType === 'priority',
        customer_name: user?.username,
        customer_phone: user?.phone_number
      };
      
      const response = await authAPI.joinQueue(queueData);
      setCurrentQueue(response.data);
      setPosition(response.data.position);
      setWaitTime(response.data.wait_time);
      setQueueType(serviceType);
      
      const arrival = new Date(response.data.join_time);
      arrival.setMinutes(arrival.getMinutes() + (response.data.wait_time / 60));
      setEstimatedArrival(arrival.toLocaleTimeString());
      
      toast.success('You have joined the queue');
      navigate('/my-queue', { state: { queueData: response.data } });
    } catch (error) {
      console.error('Error joining queue:', error);
      toast.error('Failed to join queue');
    }
  };

  // Handle leaving queue
  const handleLeaveQueue = async () => {
    try {
      if (!currentQueue) return;
      
      await authAPI.deleteQueue(currentQueue.id);
      setCurrentQueue(null);
      setPosition(null);
      setWaitTime(null);
      toast.info("You've left the queue");
    } catch (error) {
      console.error('Error leaving queue:', error);
      toast.error('Failed to leave queue');
    }
  };

  // Toggle notifications
  const toggleNotifications = () => {
    setNotifyEnabled(!notifyEnabled);
    toast.info(`SMS notifications ${!notifyEnabled ? 'enabled' : 'disabled'}`);
  };

  // Format wait time
  const formatWaitTime = (seconds) => {
    if (!seconds) return 'Calculating...';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Agent tools - complete current customer
  const handleCompleteCurrent = async () => {
    try {
      const response = await authAPI.completeCurrentQueue();
      toast.success('Customer service completed');
      // Refresh data
      const queuesResponse = await authAPI.getQueues();
      setQueueLength(queuesResponse.data.filter(q => q.status === 'waiting').length);
    } catch (error) {
      console.error('Error completing current queue:', error);
      toast.error('Failed to complete service');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navbar 
        user={user}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showAnalytics={showAnalytics}
        setShowAnalytics={setShowAnalytics}
        showAgentTools={showAgentTools}
        setShowAgentTools={setShowAgentTools}
      />

      <main className="md:ml-64 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {[
            { 
              icon: <FiUser />, 
              label: 'Current Queue', 
              value: queueLength,
              trend: '+3%', 
              color: 'bg-cyan-500/10 text-cyan-400' 
            },
            { 
              icon: <FiClock />, 
              label: 'Avg. Wait', 
              value: `${Math.floor(queueStats.avgWait / 60)} min`, 
              trend: '+2 min', 
              color: 'bg-purple-500/10 text-purple-400' 
            },
            { 
              icon: <FiActivity />, 
              label: 'Windows Active', 
              value: `${activeWindows.filter(w => w.status === 'available').length}/${activeWindows.length}`, 
              trend: 'All active', 
              color: 'bg-emerald-500/10 text-emerald-400' 
            },
            { 
              icon: <FiCheck />, 
              label: 'Today\'s Served', 
              value: queueStats.served, 
              trend: '+5%', 
              color: 'bg-amber-500/10 text-amber-400' 
            }
          ].map((stat, index) => (
            <div key={index} className={`${stat.color} backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 border border-white/10`}>
              <div className="p-3 rounded-full bg-white/5">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-white/80">{stat.label}</p>
                <h2 className="text-2xl font-semibold">{stat.value}</h2>
                <p className={`text-xs ${index === 1 ? 'text-rose-400' : 'text-emerald-400'}`}>{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Queue Panel */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-cyan-500/30 to-blue-500/30 px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-semibold">Queue Status</h3>
            {currentQueue && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {queueType === 'priority' ? 'Priority' : 'Standard'}
              </span>
            )}
          </div>
          
          <div className="p-6">
            {!currentQueue ? (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3">
                  <h3 className="text-lg font-medium mb-2">Join the Queue</h3>
                  <p className="text-white/60 mb-6">Select your preferred service option</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { 
                        icon: <FiUser />, 
                        label: 'Regular Queue', 
                        desc: 'Standard service', 
                        time: Math.floor(queueStats.avgWait / 60) || '10-15',
                        color: 'border-blue-500/30 hover:border-blue-400 bg-blue-500/5',
                        btnColor: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400',
                        type: 'regular',
                      },
                      { 
                        icon: <FiStar />, 
                        label: 'Priority Queue', 
                        desc: 'Faster service', 
                        time: Math.floor(queueStats.avgWait / 120) || '5-8',
                        color: 'border-amber-500/30 hover:border-amber-400 bg-amber-500/5',
                        btnColor: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400',
                        type: 'priority'
                      }
                    ].map((option, index) => (
                      <div 
                        key={index} 
                        className={`border rounded-xl p-4 hover:shadow-lg transition-all ${option.color}`}
                      >
                        <div className="mb-2 flex justify-between items-start">
                          <div className="p-2 rounded-lg bg-white/5">
                            {option.icon}
                          </div>
                          <span className="text-sm text-white/60">~{option.time} min</span>
                        </div>
                        <h4 className="font-medium mb-1">{option.label}</h4>
                        <p className="text-sm text-white/50 mb-4">{option.desc}</p>
                        <button 
                          onClick={() => handleJoinQueue(option.type)}
                          className={`w-full py-2 text-sm rounded-lg transition-colors ${option.btnColor}`}
                        >
                          Join Queue
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="md:w-1/3 bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="font-medium mb-3">Service Status</h3>
                  <div className="space-y-4">
                    {activeWindows.map((window) => (
                      <div key={window.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            window.status === 'busy' ? 'bg-rose-500' : 
                            window.status === 'closed' ? 'bg-gray-500' : 'bg-emerald-500'
                          }`}></div>
                          <span>{window.name}</span>
                        </div>
                        <span className="text-sm text-white/50 capitalize">
                          {window.status}
                          {window.current_queue && ` (Ticket ${window.current_queue.id})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Queue Ticket */}
                <div className="max-w-2xl mx-auto mb-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-shrink-0 p-4 bg-white/5 rounded-full border border-cyan-500/20">
                      <div className="text-4xl font-bold text-cyan-400">{position}</div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-white/60">Your position in queue</p>
                      <h3 className="text-xl font-semibold mb-1">Ticket #{currentQueue.id}</h3>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          queueType === 'priority' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {queueType === 'priority' ? 'Priority' : 'Standard'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-l border-white/10 pl-4 text-center md:text-left">
                      <p className="text-white/60">Estimated wait time</p>
                      <div className="text-xl font-semibold">{formatWaitTime(waitTime)}</div>
                      <p className="text-sm text-white/60">Arrive by {estimatedArrival}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t border-white/10 pt-4 flex flex-wrap gap-3 justify-center md:justify-end">
                    <button 
                      onClick={toggleNotifications} 
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                        notifyEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/80'
                      }`}
                    >
                      <FiBell /> {notifyEnabled ? 'Notifications ON' : 'Enable Notifications'}
                    </button>
                    
                    <button 
                      onClick={handleLeaveQueue} 
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 text-sm"
                    >
                      Leave Queue
                    </button>
                  </div>
                </div>
                
                {/* Progress Steps */}
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    <div className="h-1 bg-white/10 absolute top-5 left-0 right-0 z-0"></div>
                    <div className="flex justify-between relative z-10">
                      {['Joined', 'Waiting', 'Alert', 'Serving', 'Complete'].map((step, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            i < 2 ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/30'
                          }`}>
                            {i === 0 ? <FiCheck /> : 
                             i === 1 ? <FiClock /> : 
                             i === 2 ? <FiBell /> : 
                             i === 3 ? <FiUser /> : <FiCheck />}
                          </div>
                          <span className="text-sm mt-1 text-white/60">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Check-In Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[
            { 
              icon: <FiDownload />, 
              title: 'Mobile App', 
              desc: 'Join from anywhere', 
              btnText: 'Download App',
              color: 'from-blue-500/30 to-blue-600/30'
            },
            { 
              icon: <FiNavigation />, 
              title: 'On-Site Kiosk', 
              desc: 'Self-service check-in', 
              btnText: 'Get Directions',
              color: 'from-purple-500/30 to-purple-600/30'
            },
            { 
              icon: <FiBookmark />, 
              title: 'Appointment', 
              desc: 'Schedule in advance', 
              btnText: 'Book Now',
              color: 'from-emerald-500/30 to-emerald-600/30'
            }
          ].map((option, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className={`bg-gradient-to-r ${option.color} px-4 py-2 border-b border-white/10`}>
                <h3 className="font-medium">{option.title}</h3>
              </div>
              <div className="p-4 flex flex-col items-center text-center">
                <div className="w-20 h-20 mb-4 bg-white/5 rounded-full flex items-center justify-center text-white">
                  {option.icon}
                </div>
                <p className="text-white/60 mb-4">{option.desc}</p>
                <button className={`px-6 py-2 rounded-lg hover:shadow-lg transition-all ${
                  index === 0 ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' :
                  index === 1 ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400' :
                  'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                }`}>
                  {option.btnText}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Analytics Section */}
        {showAnalytics && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-emerald-500/30 to-green-500/30 px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiBarChart2 /> Queue Analytics
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Today's Served", value: queueStats.served, trend: '+5%', trendColor: 'text-emerald-400' },
                  { label: "Avg. Wait Time", value: `${Math.floor(queueStats.avgWait / 60)} min`, trend: '+2 min', trendColor: 'text-rose-400' },
                  { label: "No-Shows", value: queueStats.noShows, trend: '-2', trendColor: 'text-emerald-400' }
                ].map((stat, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-white/60 text-sm">{stat.label}</p>
                    <h4 className="text-3xl font-semibold">{stat.value}</h4>
                    <p className={`text-sm ${stat.trendColor}`}>{stat.trend}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Agent Tools */}
        {user?.is_service_provider && showAgentTools && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-500/30 to-indigo-500/30 px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiUsers /> Agent Panel
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3">Current Customer</h4>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    {activeWindows.find(w => w.service_provider?.id === user.id)?.current_queue ? (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                            <FiUser />
                          </div>
                          <div>
                            <h5 className="font-medium">
                              Ticket #{activeWindows.find(w => w.service_provider?.id === user.id)?.current_queue?.id}
                            </h5>
                            <p className="text-sm text-white/60">
                              {activeWindows.find(w => w.service_provider?.id === user.id)?.current_queue?.customer_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleCompleteCurrent}
                            className="flex-1 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg"
                          >
                            Complete Service
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-white/60">No current customer</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-3">Queue Control</h4>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white/80">Customers waiting:</span>
                      <span className="font-semibold">{queueLength}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white/80">Next ticket:</span>
                      <span className="font-semibold">
                        {queueLength > 0 ? `#${currentQueue?.id + 1}` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;