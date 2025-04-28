import React, { useState } from 'react';
import { FiSearch, FiMail, FiPhone, FiMessageSquare, FiFileText, FiVideo } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Import the Navbar component

const HelpCenter = () => {
  const [viewMode, setViewMode] = useState('help-center');
  const [showMyQueue, setShowMyQueue] = useState(false);
  const [showAgentTools, setShowAgentTools] = useState(false);

  const faqs = [
    {
      question: "How do I create a new queue?",
      answer: "Navigate to the Service Provider Tools section and click 'Create New Queue'. Fill in the required details and save."
    },
    {
      question: "How can customers join my queue?",
      answer: "Customers can scan your QR code or enter your queue code on their mobile app to join."
    },
    {
      question: "What happens when a customer reaches the front of the queue?",
      answer: "They will receive a notification and you'll see their details in your 'Next in Queue' panel."
    },
    {
      question: "How do I manage queue priorities?",
      answer: "In the queue settings, you can enable priority queues and assign priority levels to customers."
    },
    {
      question: "Can I export my queue data?",
      answer: "Yes, you can export queue statistics and customer data in CSV format from the Analytics section."
    }
  ];

  const videoGuides = [
    {
      title: "Getting Started with VirtualQ",
      duration: "4:32",
      thumbnail: "/thumbnails/getting-started.jpg"
    },
    {
      title: "Managing Your Queues",
      duration: "6:15",
      thumbnail: "/thumbnails/managing-queues.jpg"
    },
    {
      title: "Advanced Queue Settings",
      duration: "8:47",
      thumbnail: "/thumbnails/advanced-settings.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Include the Navbar component */}
      <Navbar 
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
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-white mb-16">How can we help you?</h1>
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search help articles..."
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 pl-14"
              />
              <FiSearch className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Help Categories */}
            <div className="lg:col-span-2">
              {/* Popular Articles */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-white mb-6">Popular Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {faqs.slice(0, 4).map((faq, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                      <h3 className="text-lg font-medium text-white mb-2">{faq.question}</h3>
                      <p className="text-gray-300">{faq.answer}</p>
                      <Link to="#" className="mt-3 inline-flex items-center text-cyan-400 hover:text-cyan-300">
                        Read more
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Guides */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-white mb-6">Video Guides</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {videoGuides.map((video, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all">
                      <div className="relative pb-[56.25%] bg-gray-700">
                        <img src={video.thumbnail} alt="" className="absolute h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <FiVideo className="text-white text-2xl" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">{video.title}</h3>
                        <Link to="#" className="text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center">
                          Watch now
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-white/10 pb-4">
                      <button className="flex justify-between items-center w-full text-left">
                        <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="mt-2 text-gray-300">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Contact & Resources */}
            <div>
              {/* Contact Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Still need help?</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiMail className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-white">Email us</h3>
                      <p className="text-sm text-gray-300">support@virtualq.com</p>
                      <p className="text-sm text-gray-400 mt-1">Typically replies within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiMessageSquare className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-white">Live chat</h3>
                      <p className="text-sm text-gray-300">Available 9am-5pm EST</p>
                      <button className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
                        Start chat
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiPhone className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-white">Call us</h3>
                      <p className="text-sm text-gray-300">+1 (800) 123-4567</p>
                      <p className="text-sm text-gray-400 mt-1">Monday-Friday, 9am-5pm EST</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Resources</h2>
                <div className="space-y-3">
                  <Link to="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-white/10 transition-colors">
                    <FiFileText className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                    <span className="ml-3">User Guide (PDF)</span>
                  </Link>
                  <Link to="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-white/10 transition-colors">
                    <FiFileText className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                    <span className="ml-3">API Documentation</span>
                  </Link>
                  <Link to="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-white/10 transition-colors">
                    <FiFileText className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                    <span className="ml-3">Release Notes</span>
                  </Link>
                  <Link to="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-white/10 transition-colors">
                    <FiFileText className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                    <span className="ml-3">System Status</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;