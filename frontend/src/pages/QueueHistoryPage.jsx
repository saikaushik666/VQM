import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  FiClock, FiCheck, FiX, FiArrowRight, 
  FiUser, FiCalendar, FiMapPin, FiChevronDown,
  FiChevronUp, FiFilter, FiRefreshCw, FiStar,
  FiAlertCircle
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import authAPI from '../features/auth/authAPI';
import { useNavigate } from 'react-router-dom';

const QueueHistoryPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQueue, setExpandedQueue] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showNoQueueModal, setShowNoQueueModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserQueues();
  }, []);

  const fetchUserQueues = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getMyQueues();
      console.log('Fetched Queues:', response.data); // Add this
      const queueData = response.data || [];
      setQueues(queueData);
      
      if (queueData.length === 0) {
        setShowNoQueueModal(true);
      }
    } catch (error) {
      console.error('Error fetching queues:', error);
      toast.error('Failed to load your queue history');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowNoQueueModal(false);
    navigate('/');
  };

  const handleExpandQueue = (id) => {
    setExpandedQueue(expandedQueue === id ? null : id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getWaitDuration = (joinTime, serveTime) => {
    if (!joinTime || !serveTime) return 'N/A';
    
    try {
      const join = new Date(joinTime);
      const serve = new Date(serveTime);
      const diffMs = serve - join;
      
      const mins = Math.floor(diffMs / 60000);
      
      if (mins < 60) {
        return `${mins} min${mins !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`;
      }
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      waiting: { 
        color: 'bg-blue-500/20 text-blue-400', 
        icon: <FiClock className="mr-1" />,
        text: 'Waiting'
      },
      serving: { 
        color: 'bg-amber-500/20 text-amber-400', 
        icon: <FiUser className="mr-1" />,
        text: 'Serving'
      },
      completed: { 
        color: 'bg-emerald-500/20 text-emerald-400', 
        icon: <FiCheck className="mr-1" />,
        text: 'Completed'
      },
      cancelled: { 
        color: 'bg-rose-500/20 text-rose-400', 
        icon: <FiX className="mr-1" />,
        text: 'Cancelled'
      },
      no_show: { 
        color: 'bg-gray-500/20 text-gray-400', 
        icon: <FiX className="mr-1" />,
        text: 'No Show'
      }
    };

    const config = statusConfig[status] || statusConfig.waiting;
    
    return (
      <span className={`px-2 py-1 rounded-full flex items-center text-xs ${config.color}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const filteredAndSortedQueues = () => {
    if (!Array.isArray(queues)) {
      return [];
    }

    let filtered = [...queues];
    if (filterStatus !== 'all') {
      filtered = filtered.filter(q => q.status === filterStatus);
    }
    
    return [...filtered].sort((a, b) => {
      try {
        switch (sortBy) {
          case 'date-asc':
            return new Date(a.join_time || 0) - new Date(b.join_time || 0);
          case 'date-desc':
            return new Date(b.join_time || 0) - new Date(a.join_time || 0);
          case 'status':
            return (a.status || '').localeCompare(b.status || '');
          case 'service':
            return (a.service?.name || '').localeCompare(b.service?.name || '');
          default:
            return new Date(b.join_time || 0) - new Date(a.join_time || 0);
        }
      } catch (e) {
        return 0;
      }
    });
  };

  const displayedQueues = filteredAndSortedQueues();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navbar user={user} />

      {/* No Queue Modal */}
      {showNoQueueModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-500/20 text-amber-400">
                  <FiAlertCircle size={24} />
                </div>
                <h3 className="text-xl font-semibold">No Queue History Found</h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300">
                You haven't joined any queues yet. Would you like to join a queue now?
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowNoQueueModal(false);
                  navigate('/join-queue');
                }}
                className="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiArrowRight /> Join a Queue
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="md:ml-64 p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Queue History</h1>
            <p className="text-white/60">Track and manage your queuing activity</p>
          </div>
          
          <button 
            onClick={fetchUserQueues}
            className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm text-white/60 block mb-2">Filter by Status</label>
              <div className="relative">
                <select 
                  value={filterStatus}
                  onChange={handleFilterChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="waiting">Waiting</option>
                  <option value="serving">Serving</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiFilter className="text-white/60" />
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <label className="text-sm text-white/60 block mb-2">Sort by</label>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={handleSortChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="status">Status</option>
                  <option value="service">Service Type</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiChevronDown className="text-white/60" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Queue List */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <h2 className="font-medium">Your Queue History</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mb-3"></div>
              <p className="text-white/60">Loading your queue history...</p>
            </div>
          ) : displayedQueues.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <FiClock className="text-2xl text-white/40" />
              </div>
              <h3 className="font-medium mb-2">No Queue History</h3>
              <p className="text-white/60">You haven't joined any queues yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {displayedQueues.map((queue) => (
                <div key={queue.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div 
                    className="flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
                    onClick={() => handleExpandQueue(queue.id)}
                  >
                    <div className="flex flex-1 items-start gap-3">
                      <div className={`p-3 rounded-full ${
                        queue.status === 'completed' ? 'bg-emerald-500/10' : 
                        queue.status === 'waiting' ? 'bg-blue-500/10' : 
                        queue.status === 'serving' ? 'bg-amber-500/10' : 'bg-gray-500/10'
                      }`}>
                        {queue.status === 'completed' ? <FiCheck /> : 
                         queue.status === 'waiting' ? <FiClock /> : 
                         queue.status === 'serving' ? <FiUser /> : <FiX />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">Ticket #{queue.id}</h3>
                          {queue.priority && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs flex items-center">
                              <FiStar className="mr-1" size={10} /> Priority
                            </span>
                          )}
                          {getStatusBadge(queue.status)}
                        </div>
                        <p className="text-sm text-white/60">{queue.service?.name || 'General Service'}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
                          <span className="flex items-center">
                            <FiCalendar className="mr-1" size={12} /> 
                            {formatDate(queue.join_time)}
                          </span>
                          <span className="flex items-center">
                            <FiClock className="mr-1" size={12} /> 
                            {formatTime(queue.join_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-3 md:mt-0">
                      <div className="mr-6 text-right hidden md:block">
                        <p className="text-sm text-white/60">Wait Time</p>
                        <p className="font-medium">
                          {getWaitDuration(queue.join_time, queue.serve_time)}
                        </p>
                      </div>
                      <button className="text-white/60">
                        {expandedQueue === queue.id ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedQueue === queue.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Queue Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/60">Service:</span>
                            <span>{queue.service?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Position:</span>
                            <span>{queue.position || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Priority:</span>
                            <span>{queue.priority ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Status:</span>
                            <span className="capitalize">{queue.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Timing</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/60">Joined Queue:</span>
                            <span>{formatDate(queue.join_time)} at {formatTime(queue.join_time)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Started Service:</span>
                            <span>{queue.serve_time ? `${formatDate(queue.serve_time)} at ${formatTime(queue.serve_time)}` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Completed:</span>
                            <span>{queue.complete_time ? `${formatDate(queue.complete_time)} at ${formatTime(queue.complete_time)}` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Wait Duration:</span>
                            <span>{getWaitDuration(queue.join_time, queue.serve_time)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {queue.window && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium mb-2">Service Window</h4>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5">
                              <FiMapPin />
                            </div>
                            <div>
                              <p className="font-medium">{queue.window.name}</p>
                              <p className="text-sm text-white/60">{queue.window.description || 'Service counter'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {queue.notes && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium mb-2">Notes</h4>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-sm">{queue.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {!loading && queues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {[
              { 
                label: 'Total Queues', 
                value: queues.length,
                color: 'bg-cyan-500/10 text-cyan-400',
                icon: <FiClock /> 
              },
              { 
                label: 'Completed', 
                value: queues.filter(q => q.status === 'completed').length,
                color: 'bg-emerald-500/10 text-emerald-400',
                icon: <FiCheck /> 
              },
              { 
                label: 'Cancelled', 
                value: queues.filter(q => q.status === 'cancelled').length,
                color: 'bg-rose-500/10 text-rose-400',
                icon: <FiX /> 
              },
              { 
                label: 'Active', 
                value: queues.filter(q => ['waiting', 'serving'].includes(q.status)).length,
                color: 'bg-amber-500/10 text-amber-400',
                icon: <FiUser /> 
              }
            ].map((stat, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 border border-white/10">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-white/60">{stat.label}</p>
                  <h3 className="text-2xl font-semibold">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default QueueHistoryPage;