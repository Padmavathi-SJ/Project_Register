import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import instance from '../../utils/axiosInstance';

function Add_Users() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [RegisterNumber, setRegisterNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subject, setSubject] = useState('CSE');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    console.log(name,password,email);
    
    if (!name || !password ||!email) {
      alert('Please fill in all fields');
      return;
    }

    const userData = {
      emailId: email,
      name:name,
      dept:subject,
      phone_number:phoneNumber,
      password: password,
      reg_num: RegisterNumber,
      role: role,
    };

    if ((role === 'guide' || role === 'ext-guide') && phoneNumber) {
      userData.phone_number = phoneNumber;
    }

    if (role === 'sub_expert' && subject) {
      userData.subject = subject;
    }

    let response = await instance.post("/admin/adduser", userData);
    if (response.status === 200) {
      setName("");
      setEmail("");
      setPassword("");
      setRegisterNumber("");
      setRole("");
      setPhoneNumber("");
      setSubject("");
      alert("User Added Successfully");
    }
  };

  return (
    <>
        <h2 className="text-3xl font-bold text-center mt-6 mb-6">Add New User</h2>
    <div className="mt-3 flex justify-center">
      <div className=" bg-white w-6/12 max-w-5xl rounded-2xl shadow-2xl p-7 transition-all duration-300">

        <div className="grid bg-white  grid-cols-2 gap-x-9">
          <div className="mb-5 bg-white ">
            <label className=" bg-white block text-sm text-black mb-2">Name</label>
            <input
              type="name"
              placeholder="Enter user Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white  px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-5 bg-white ">
            <label className="block text-sm bg-white  text-black mb-2">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border bg-white  border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option className='bg-white' value="admin">Admin</option>
              <option className='bg-white' value="staff">Staff</option>
            </select>
          </div>

          <div className="mb-5 bg-white ">
            <label className="block text-sm bg-white  text-black mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter user email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border bg-white  border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-5 bg-white ">
            <label className="block text-sm bg-white  text-black mb-2">Password</label>
            <input
              type="text"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              list="password-suggestions"
              className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />            
            <datalist id="password-suggestions">
              <option value="Bitsathy@1" />   
            </datalist>

          </div>

          {(role!=="admin")&&(<div className="mb-5  bg-white ">
            <label className="block  bg-white text-sm text-black mb-2">Register Number</label>
            <input
              type="text"
              placeholder="Enter register number"
              value={RegisterNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              className="w-full px-4 py-2  bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>)}

          

          {(role === 'staff') && (
            <div className="mb-5 bg-white ">
              <label className="block text-sm bg-white  text-black mb-2">Phone Number</label>
              <input
                type="text"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4  bg-white py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {(role === 'staff') && (
            <div className="mb-5 bg-white ">
              <label className=" bg-white block text-sm text-black mb-2">Cluster</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 bg-white  w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option className='bg-white' value="CSE">CSE</option>
                <option className='bg-white' value="AIDS">AIDS</option>
                <option className='bg-white' value="IT">IT</option>
                <option className='bg-white' value="AIML">AIML</option>
                <option className='bg-white' value="CT">CT</option>
                <option className='bg-white' value="AGRI">AGRI</option>
                <option className='bg-white' value="ECE">ECE</option>
                <option className='bg-white' value="EIE">EIE</option>
                <option className='bg-white' value="EEE">EEE</option>
                <option className='bg-white' value="MECH">MECH</option>
                <option className='bg-white' value="FT">FT</option>
                <option className='bg-white' value="FD">FD</option>
              </select>
            </div>
          )}
        </div>



        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-purple-500 text-white py-2 rounded-lg font-semibold text-lg hover:bg-purple-600 transition duration-200 shadow-md"
        >
          Add User
        </button>
      </div>
    </div></>
  );
}

export default Add_Users;
