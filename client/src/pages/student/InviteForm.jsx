import React from 'react';
import instance from '../../utils/axiosInstance';
import { useSelector } from 'react-redux';

function InviteForm({ inviteForm, handleInviteChange, setIsInviteOpen }) {
  const selector = useSelector((state) => state.userSlice.auth?.user || null);
  console.log(selector, "logg");
  async function handleInviteSubmit(e) {
    e.preventDefault();
    console.log("Submitting invite...");

    // const accessToken = localStorage.getItem("accessToken");

    try {
      console.log(selector.reg_num, "inviteform");
      const response = await instance.post("/student/join_request",
        {
          from_reg_num: selector.reg_num,           // sender
          to_reg_num: inviteForm.registerNumber     // receiver
        }
      );
      console.log(response.data.data);
      //  Show success message
      alert(response.data || "Invite sent successfully!");
      setIsInviteOpen(false);

      window.location.href = "/student";

    } catch (err) {
      console.error("Error sending invite", err);

      // Show error message from backend if available
      if (err.response && err.response.data) {
        alert(err.response.data.message || "Failed to send invite");
      } else {
        alert("Network error occurred while sending invite.");
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl">
        <h2 className="text-xl font-semibold bg-white mb-4">Alert</h2>
        {selector.project_type === null ?
          <form onSubmit={handleInviteSubmit} className=" bg-white space-y-4">
            <div className=' bg-white '>
              <label className="block text-sm font-semibold bg-white  text-gray-700">Project Type to invite member</label>

            </div>
            <div className="mt-6 flex bg-white  justify-between space-x-2">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>

            </div>
          </form> : <form onSubmit={handleInviteSubmit} className=" bg-white space-y-4">
            <div className=' bg-white '>
              <label className="block text-sm font-medium bg-white  text-gray-700">Register Number</label>
              <input
                name="registerNumber"
                value={inviteForm.registerNumber}
                onChange={handleInviteChange}
                type="text"
                required
                placeholder="Enter Register Number"
                className="mt-1 block w-full border bg-white  border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-indigo-300"
              />
            </div>
            <div className="mt-6 flex bg-white  justify-between space-x-2">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-700 transition"
              >
                Invite
              </button>
            </div>
          </form>
        }

      </div>
    </div>
  );
}

export default InviteForm;
