// ChangeTimeLine.jsx
import React, { useState } from 'react';
import instance from '../../utils/axiosInstance';

const ChangeTimeLine = () => {
  const [week, setWeek] = useState('week1');  // match backend week column
  const [teamId, setTeamId] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const allowedWeeks = [
    "week1", "week2", "week3", "week4", "week5",
    "week6", "week7", "week8", "week9", "week10",
    "week11", "week12"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    console.log(newDeadline, week, teamId, "newww");
    try {
      const res = await instance.patch(
        `/admin/update_deadline/${week}/${teamId}`,
        { newDeadline }  // already in "YYYY-MM-DD"
      );
      setMessage(res.data.message, "neww");
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded-10 shadow-lg bg-white">
      <h2 className="text-xl font-semibold text-center mb-4 bg-white">Change Timeline Deadline</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white">
        <div>
          <label className="block font-medium bg-white">Select Week</label>
          <select
            className="w-full border p-2 rounded bg-white"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            required
          >
            {allowedWeeks.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium bg-white">Team ID</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-white"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium bg-white">New Deadline</label>
          <input
            type="date"
            className="w-full border p-2 rounded bg-white"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            required
          />
        </div>
        <div className="bg-white text-center">

          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-800 "
          >
            Update Deadline
          </button>
        </div>
      </form>

      {message && <p className="text-green-600 mt-4 bg-white">{message}</p>}
      {error && <p className="text-red-600 mt-4 bg-white">{error}</p>}
    </div>
  );
};

export default ChangeTimeLine;
