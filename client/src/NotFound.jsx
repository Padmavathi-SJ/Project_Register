import React from 'react';
import error from "./assets/error.svg"
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center bg-gray-100">
        <img className='w-auto bg-gray-100 h-96' src={error} alt="" />
        <h1 className="text-6xl font-bold bg-gray-100 text-red-500">404</h1>
        <p className="text-2xl bg-gray-100 mt-4">Oops! Page Not Found.</p>
        <Link to="/auth" className="mt-6 rounded-md inline-block bg-purple-500 text-white px-4 py-2  hover:bg-purple-600">
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
