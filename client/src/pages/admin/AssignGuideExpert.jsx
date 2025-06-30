import React, { useState } from "react";
import axios from "axios";
import instance from '../../utils/axiosInstance';

const AssignGuideExpert = () => {
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState("guide");
  const [regNum, setRegNum] = useState("");
  const [status, setStatus] = useState({ loading: false, message: "", error: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: "", error: false });

    if (!teamId || !regNum || !role) {
      setStatus({ loading: false, message: "All fields are required.", error: true });
      return;
    }
    try {
      const res = await instance.patch(
        `/admin/assign_guide_expert/${teamId}/${role}`,
        { guideOrexpert_reg_num: regNum }
      );
      setStatus({ loading: false, message: res.data, error: false });
    } catch (err) {
      console.log(err);
      const message = err.response?.data?.message || "An error occurred.";
      setStatus({ loading: false, message, error: true });
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg border border-purple-200">
      <h2 className="text-2xl bg-white font-bold text-purple-700 mb-4 text-center">Assign Guide or Expert</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white">
        <div>
          <label className="block text-purple-700 font-medium bg-white">Team ID</label>
          <input
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full px-4 py-2 rounded border bg-white border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter Team ID"
          />
        </div>

        <div>
          <label className="block text-purple-700 bg-white font-medium">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 rounded border bg-white border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="guide">Guide</option>
            <option value="sub_expert">Subject Expert</option>
          </select>
        </div>

        <div>
          <label className="block bg-white text-purple-700 font-medium">Guide/Expert Reg. Number</label>
          <input
            type="text"
            value={regNum}
            onChange={(e) => setRegNum(e.target.value)}
            className="w-full px-4 py-2 rounded border bg-white border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter Registration Number"
          />
        </div>

        <button
          type="submit"
          disabled={status.loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          {status.loading ? "Assigning..." : "Assign"}
        </button>

        {status.message && (
          <div
            className={`text-center mt-4 px-4 py-2 rounded ${status.error ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
              }`}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default AssignGuideExpert;
