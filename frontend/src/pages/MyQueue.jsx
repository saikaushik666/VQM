import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authAPI from '../features/auth/authAPI';
import {
  FiUser, FiClock, FiHash, FiAlertCircle,
  FiCheckCircle, FiXCircle, FiNavigation, FiX,
  FiRotateCw, FiPrinter
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import React from 'react';


const MyQueue = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState(state?.queueData || null);
  const [assignedWindow, setAssignedWindow] = useState(null);
  const [showWindowPopup, setShowWindowPopup] = useState(false);
  const [windows, setWindows] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingWindows, setIsLoadingWindows] = useState(false);
  const [viewMode, setViewMode] = useState('my-queue');
  const [showMyQueue, setShowMyQueue] = useState(true);
  const [showAgentTools, setShowAgentTools] = useState(false);
  const countdownInterval = useRef(null);
  const initialWaitTime = useRef(null);

  // Format wait time from seconds to minutes:seconds
  const formatWaitTime = (waitTime) => {
    if (waitTime === undefined || waitTime === null) return 'Calculating...';
    if (waitTime <= 0) return 'Ready!';
    
    const seconds = Number(waitTime);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Generate ticket number safely
  const getTicketNumber = () => {
    if (queueData?.ticket_number) return queueData.ticket_number;
    if (queueData?.id) {
      const idStr = queueData.id.toString();
      return `Q-${idStr.padStart(6, '0').slice(-6)}`;
    }
    return 'Q-XXXXXX';
  };

  // Start or update countdown timer
  const startCountdown = useCallback(() => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    if (queueData?.status !== 'waiting' || !queueData.wait_time) {
      return;
    }

    countdownInterval.current = setInterval(() => {
      setQueueData(prev => {
        if (!prev || !prev.wait_time) return prev;
        const newWaitTime = Math.max(0, prev.wait_time - 1);
        return {
          ...prev,
          wait_time: newWaitTime
        };
      });
    }, 1000);
  }, [queueData?.status, queueData?.wait_time]);

  // Fetch all windows and check for assignments
  const fetchWindows = useCallback(async () => {
    if (!queueData?.id) return;

    setIsLoadingWindows(true);
    try {
      const response = await authAPI.getWindows();
      setWindows(response.data);
      
      // Check for both direct assignment and service matching
      const queueWindow = response.data.find(w => 
        w.current_queue?.id?.toString() === queueData?.id?.toString() ||
        (w.services?.some(s => s.id === queueData.service?.id) && w.status === 'available'
      ))
      
      if (queueWindow) {
        setAssignedWindow(queueWindow);
        
        if (queueWindow.current_queue?.id?.toString() === queueData?.id?.toString()) {
          setShowWindowPopup(true);
          setTimeout(() => setShowWindowPopup(false), 60000);
        }
      } else {
        setAssignedWindow(null);
      }
    } catch (error) {
      console.error('Error fetching windows:', error);
      if (!error.response || error.response.status !== 401) {
        
      }
    } finally {
      setIsLoadingWindows(false);
    }
  }, [queueData?.id, queueData?.service?.id]);

  const checkForWindowAssignment = useCallback(async () => {
    if (!queueData || queueData.status !== 'waiting') return;
    
    try {
      const response = await authAPI.assignToBestWindow({
        queue_id: queueData.id
      });

      if (response.data) {
        setAssignedWindow(response.data.window);
        setQueueData(prev => ({
          ...prev,
          status: 'processing',
          start_time: new Date().toISOString()
        }));
        setShowWindowPopup(true);
        toast.success(`Assigned to window ${response.data.window.name}`);
      }
    } catch (error) {
      console.error('Window assignment failed:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to assign window');
      }
    }
  }, [queueData]);

  // Refresh queue data
  const refreshQueueData = useCallback(async () => {
    if (!queueData?.id) return;
    
    setIsRefreshing(true);
    try {
      const response = await authAPI.getQueue(queueData.id);
      const updatedData = response.data;
      
      // Store initial wait time if this is the first refresh
      if (initialWaitTime.current === null && updatedData.wait_time) {
        initialWaitTime.current = updatedData.wait_time;
      }
      
      setQueueData(prevData => {
        const statusChanged = prevData.status !== 'serving' && updatedData.status === 'serving';
        
        if (statusChanged) {
          setTimeout(() => fetchWindows(), 0);
        }
        
        return updatedData;
      });
      
      if (updatedData.status === 'waiting') {
        await checkForWindowAssignment();
      } else {
        await fetchWindows();
      }
      
    } catch (error) {
      console.error('Error refreshing queue:', error);
      if (error.response?.status === 404) {
        navigate('/');
        toast.info('Your queue session has ended');
      } else if (!error.response || error.response.status !== 401) {
        toast.error('Failed to refresh queue data');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [queueData?.id, fetchWindows, checkForWindowAssignment, navigate]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    await refreshQueueData();
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!queueData) {
          const response = await authAPI.getQueues();
          const userQueues = response.data
            .filter(q => ['waiting', 'serving', 'processing'].includes(q.status))
            .sort((a, b) => new Date(b.join_time) - new Date(a.join_time));
          
          if (userQueues.length > 0) {
            const latestQueue = userQueues[0];
            setQueueData(latestQueue);
            
            if (latestQueue.wait_time !== undefined) {
              initialWaitTime.current = latestQueue.wait_time;
            }
          } else {
            navigate('/');
            toast.info('You are not currently in any queue');
            return;
          }
        }
      } catch (error) {
        console.error('Initial data fetch error:', error);
        navigate('/');
        return;
      }
      
      try {
        await fetchWindows();
        if (queueData?.status === 'waiting') {
          await checkForWindowAssignment();
        }
      } catch (windowError) {
        console.error('Error fetching windows during initial load:', windowError);
      }
    };

    fetchInitialData();
  }, [navigate, fetchWindows, checkForWindowAssignment]);

  // Set up periodic refresh and countdown
  useEffect(() => {
    if (!queueData?.id) return;

    const refreshInterval = setInterval(() => {
      refreshQueueData();
    }, 60000);

    // Start countdown if in waiting status
    if (queueData?.status === 'waiting' && queueData.wait_time) {
      startCountdown();
    }

    return () => {
      clearInterval(refreshInterval);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [queueData?.id, queueData?.status, queueData?.wait_time, refreshQueueData, startCountdown]);

  // Handle queue status changes
  useEffect(() => {
    if (queueData?.status === 'serving' && assignedWindow && !showWindowPopup) {
      setShowWindowPopup(true);
    }
    
    if (queueData?.status === 'completed' || queueData?.status === 'cancelled') {
      const timer = setTimeout(() => {
        navigate('/');
        toast.info(`Your queue session has ${queueData.status}`);
      }, 60000);
      
      return () => clearTimeout(timer);
    }
  }, [queueData?.status, assignedWindow, showWindowPopup, navigate]);

  const handleLeaveQueue = async () => {
    if (!queueData?.id) return;
    
    try {
      await authAPI.deleteQueue(queueData.id);
      navigate('/');
      toast.success('You have left the queue');
    } catch (error) {
      console.error('Error leaving queue:', error);
      toast.error('Failed to leave queue');
    }
  };

  if (!queueData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your queue information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        showMyQueue={showMyQueue}
        setShowMyQueue={setShowMyQueue}
        showAgentTools={showAgentTools}
        setShowAgentTools={setShowAgentTools}
      />
      
      <div className="pt-20 md:pl-64 p-6">
        {showWindowPopup && assignedWindow && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 relative animate-fade-in border border-green-300">
              <button 
                onClick={() => setShowWindowPopup(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <FiX size={24} />
              </button>
              <h3 className="text-2xl font-bold text-green-600 mb-2 flex items-center gap-2">
                <FiPrinter className="animate-pulse" /> Window Assigned!
              </h3>
              <div className="space-y-4 mt-4">
                <div>
                  <div className="text-sm text-slate-500">Window Number</div>
                  <div className="text-xl font-semibold text-slate-800">{assignedWindow.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Location</div>
                  <div className="text-lg text-slate-700">{assignedWindow.location || 'Main Area'}</div>
                </div>
                {assignedWindow.service_provider && (
                  <div>
                    <div className="text-sm text-slate-500">Service Provider</div>
                    <div className="text-lg text-slate-700">{assignedWindow.service_provider.username}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-slate-500">Status</div>
                  <div className="flex items-center gap-2 capitalize text-slate-700">
                    {assignedWindow.status === 'available' ? (
                      <FiCheckCircle className="text-green-500" />
                    ) : assignedWindow.status === 'busy' ? (
                      <FiAlertCircle className="text-amber-500" />
                    ) : null}
                    {assignedWindow.status}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWindowPopup(false);
                    navigate('/service-window', { state: { window: assignedWindow } });
                  }}
                  className="w-full mt-4 py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FiNavigation /> Proceed to Window
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-6 py-4 border-b ${
              queueData.status === 'serving' ? 'bg-green-100 border-green-200' :
              queueData.status === 'processing' ? 'bg-blue-100 border-blue-200' :
              queueData.priority ? 'bg-amber-100 border-amber-200' :
              'bg-indigo-100 border-indigo-200'
            } flex justify-between items-center`}>
              <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                {queueData.status === 'serving' ? (
                  <FiNavigation className="animate-pulse text-green-600" />
                ) : queueData.status === 'processing' ? (
                  <FiRotateCw className="animate-spin text-blue-600" />
                ) : (
                  <FiClock className="text-indigo-600" />
                )}
                {queueData.status === 'serving' ? 'Your Turn Now!' : 
                 queueData.status === 'processing' ? 'Processing Your Request' : 
                 'Queue Status'}
              </h1>
              <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-full ${isRefreshing ? 'animate-spin' : 'hover:bg-white/50'} text-slate-600`}
                aria-label="Refresh queue data"
              >
                <FiRotateCw size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                  <div className="text-4xl font-bold text-indigo-100 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    {queueData.position || '-'}
                  </div>
                    <div>
                      <div className="text-sm text-slate-500">Your Position</div>
                      <div className="text-xl font-semibold text-slate-800">
                        {queueData.priority && (
                          <span className="text-amber-600 mr-2">Priority</span>
                        )}
                        {queueData.service?.name || 'General Service'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Ticket #</div>
                    <div className="font-mono text-lg text-slate-800">
                      {getTicketNumber()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <div className="text-sm text-slate-500">Service</div>
                    <div className="font-medium text-slate-800">{queueData.service?.name || 'General'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Window</div>
                    <div className="font-medium text-slate-800">
                      {isLoadingWindows ? (
                        <span className="animate-pulse">Checking...</span>
                      ) : assignedWindow ? (
                        <>
                          {assignedWindow.name} ({assignedWindow.location})
                          {assignedWindow.status === 'busy' && (
                            <span className="ml-2 text-xs text-amber-600">(In Service)</span>
                          )}
                        </>
                      ) : (
                        'Not assigned yet'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Status</div>
                    <div className="flex items-center gap-1 text-slate-800">
                      {queueData.status === 'waiting' && (
                        <FiAlertCircle className="text-amber-500" />
                      )}
                      {queueData.status === 'serving' && (
                        <FiCheckCircle className="text-green-500" />
                      )}
                      {queueData.status === 'processing' && (
                        <FiRotateCw className="text-blue-500 animate-spin" />
                      )}
                      {queueData.status === 'completed' && (
                        <FiCheckCircle className="text-green-500" />
                      )}
                      {queueData.status === 'cancelled' && (
                        <FiXCircle className="text-red-500" />
                      )}
                      <span className="capitalize">{queueData.status}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Time Remaining</div>
                    <div className="font-medium text-slate-800">
                      {formatWaitTime(queueData.wait_time)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <FiUser className="text-indigo-600" /> Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-slate-500">Name</div>
                      <div className="text-slate-800">{queueData.user?.username || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Phone</div>
                      <div className="text-slate-800">{queueData.user?.phone_number || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Account</div>
                      <div className="text-slate-800">{queueData.user ? 'Registered User' : 'Guest'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <FiHash className="text-indigo-600" /> Queue Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-slate-500">Joined At</div>
                      <div className="text-slate-800">
                        {new Date(queueData.join_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {queueData.start_time && (
                      <div>
                        <div className="text-sm text-slate-500">Service Started</div>
                        <div className="text-slate-800">{new Date(queueData.start_time).toLocaleString()}</div>
                      </div>
                    )}
                    {queueData.notes && queueData.notes !== 'none' && (
                      <div>
                        <div className="text-sm text-slate-500">Notes</div>
                        <div className="italic text-slate-800">{queueData.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLeaveQueue}
                  className="flex-1 py-3 px-6 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-200"
                >
                  <FiXCircle /> Leave Queue
                </button>
                {queueData.status === 'serving' && assignedWindow && (
                  <button
                    onClick={() => navigate('/service-window', { state: { window: assignedWindow } })}
                    className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FiNavigation /> Proceed to Window
                  </button>
                )}
                {queueData.status === 'waiting' && !assignedWindow && (
                  <button
                    onClick={checkForWindowAssignment}
                    className="flex-1 py-3 px-6 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center justify-center gap-2 border border-blue-200"
                  >
                    <FiRotateCw /> Check for Window
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyQueue;