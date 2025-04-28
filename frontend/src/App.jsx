import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // You can use "light", "dark", or "colored"
        toastClassName="text-sm rounded-lg shadow-lg"
        bodyClassName="text-gray-800 font-medium"
        progressClassName="bg-[#f39c12]"
      />
      <AppRouter />
    </div>
  );
}

export default App;