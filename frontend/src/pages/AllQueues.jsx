import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authAPI from '../features/auth/authAPI';
import {
  FiClock, FiUser, FiHash, FiAlertCircle,
  FiCheckCircle, FiXCircle, FiNavigation,
  FiCalendar, FiPrinter, FiRefreshCw
} from 'react-icons/fi';

const AllQueues = () => {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const navigate = useNavigate();

  const fetchQueues = async () => {
    try {
      const response = await authAPI.getMyQueues();
      setQueues(response.data);
    } catch (error) {
      console.error('Error fetching queues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <FiClock className="text-amber-500" />;
      case 'processing':
        return <FiRefreshCw className="text-blue-500 animate-spin" />;
      case 'serving':
        return <FiNavigation className="text-green-500" />;
      case 'completed':
        return <FiCheckCircle className="text-green-500" />;
      case 'cancelled':
        return <FiXCircle className="text-red-500" />;
      default:
        return <FiAlertCircle className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Queues</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Queue List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-blue-600 px-4 py-3 border-b border-blue-700">
                <h2 className="text-lg font-semibold text-white">Queue History</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {queues.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No queues found
                  </div>
                ) : (
                  queues.map(queue => (
                    <div 
                      key={queue.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedQueue?.id === queue.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedQueue(queue)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(queue.status)}
                          <span className="font-medium">Ticket #{queue.id}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          queue.priority ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {queue.priority ? 'Priority' : 'Standard'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <FiPrinter className="text-gray-400" />
                          <span>{queue.service?.name || 'Unknown Service'}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <FiCalendar className="text-gray-400" />
                          <span>{formatDate(queue.join_time)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Queue Details */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-blue-600 px-4 py-3 border-b border-blue-700">
                <h2 className="text-lg font-semibold text-white">Queue Details</h2>
              </div>
              {selectedQueue ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Basic Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Ticket Number</p>
                            <p className="font-medium">#{selectedQueue.id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(selectedQueue.status)}
                              <span className="capitalize">{selectedQueue.status}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Service</p>
                            <p className="font-medium">{selectedQueue.service?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Priority</p>
                            <p className="font-medium">{selectedQueue.priority ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Timing Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Timing</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Joined At</p>
                            <p>{formatDate(selectedQueue.join_time)}</p>
                          </div>
                          {selectedQueue.start_time && (
                            <div>
                              <p className="text-sm text-gray-500">Started At</p>
                              <p>{formatDate(selectedQueue.start_time)}</p>
                            </div>
                          )}
                          {selectedQueue.end_time && (
                            <div>
                              <p className="text-sm text-gray-500">Completed At</p>
                              <p>{formatDate(selectedQueue.end_time)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                      {/* Customer Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Customer Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">{selectedQueue.user?.username || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{selectedQueue.user?.phone_number || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Window Assignment */}
                      {selectedQueue.active_window && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">Window Assignment</h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500">Window</p>
                              <p className="font-medium">{selectedQueue.active_window.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Service Provider</p>
                              <p className="font-medium">
                                {selectedQueue.active_window.service_provider?.username || 'Not assigned'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Location</p>
                              <p className="font-medium">
                                {selectedQueue.active_window.location || 'Main area'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {selectedQueue.notes && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
                          <p className="text-gray-700 whitespace-pre-line">{selectedQueue.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Select a queue from the list to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllQueues;