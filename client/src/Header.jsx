import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Header() {
  // const selector = useSelector((state) => state.userSlice);
  const selector = useSelector((state) => state.userSlice.auth.user || null);
  const [showPopup, setShowPopup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <>
      <div className='w-full h-24 shadow-md bg-white flex items-center justify-between px-6 z-50'>
        <h6 className='bg-white text-3xl mt-1 ml-3 inline'>Project Register</h6>
        <div
          className='w-12 h-12 mr-3 rounded-full cursor-pointer bg-purple-500 flex items-center justify-center text-white text-2xl font-'
          onClick={() => setShowPopup(!showPopup)}
        >
          {selector?.emailId[0]?.toUpperCase() || "soryyy"}
        </div>

        {showPopup && (
          <div className='absolute right-3 top-20 w-80 bg-white shadow-lg rounded-lg p-4 border z-50'>
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-lg font-bold"
            >
              ×
            </button>

            <h2 className='text-xl bg-white text-black font-bold mb-2'>User Info</h2>
            <div className='text-sm bg-white space-y-1'>
              <p className='bg-white'><strong className='bg-white'>Name:</strong> {selector.name}</p>
              <p className='bg-white'><strong className='bg-white'>Email:</strong> {selector?.emailId}</p>
              <p className='bg-white'><strong className='bg-white'>Reg. Number:</strong> {selector.reg_num}</p>
              <p className='bg-white'><strong className='bg-white'>Department:</strong> {selector.dept}</p>
              <p className='bg-white'><strong className='bg-white'>Password:</strong> ******</p>
            </div>

            {!showChangePassword ? (
              <button
                className='mt-4 text-blue-500 underline'
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </button>
            ) : (
              <div className='mt-4 bg-white space-y-2'>
                {/* New Password Field */}
                <div className='relative'>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder='New Password'
                    className='w-full bg-white border px-2 py-1 rounded pr-10'
                  />
                  <div
                    className='absolute top-2 right-3 cursor-pointer text-gray-600'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEye className='bg-white' /> : <FaEyeSlash className='bg-white' />}
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className='relative'>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Confirm Password'
                    className='w-full bg-white border px-2 py-1 rounded pr-10'
                  />
                  <div
                    className='absolute top-2 right-3 cursor-pointer text-gray-600'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEye /> : <FaEyeSlash className='bg-white' />}
                  </div>
                </div>

                <button className='bg-blue-500 text-white px-4 py-1 rounded mt-1'>
                  Submit
                </button>
                <button
                  className='text-red-500 ml-4 underline'
                  onClick={() => setShowChangePassword(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Header;
