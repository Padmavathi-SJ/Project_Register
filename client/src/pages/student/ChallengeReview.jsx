import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminChallengeReviewManager = () => {
  const [requests, setRequests] = useState([
    
  ]);
  const [availableStaffs, setAvailableStaffs] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDate, setReviewDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [guide, setGuide] = useState('');
  const [expert, setExpert] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/admin/challenge_review/get_requests');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptReject = async (status, request_id) => {
    try {
      await axios.patch(`/admin/challenge_review/accept_or_reject/${status}/${request_id}`);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchStaffs = async () => {
    try {
      const res = await axios.get(`/admin/challenge_review/get_available_guides_experts/${reviewDate}`);
      setAvailableStaffs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSchedule = async () => {
    if (!selectedRequest || !guide || !expert) return;

    try {
      const body = {
        project_id: selectedRequest.project_id,
        team_lead: selectedRequest.team_lead,
        review_date: reviewDate,
        start_time: startTime,
        team_id: selectedRequest.team_id,
        review_title: selectedRequest.review_title,
      };
      await axios.patch(`/admin/challenge_review/${selectedRequest.request_id}/${guide}/${expert}`, body);
      fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Pending Challenge Review Requests</h1>
      {requests.length === 0 ? (
        <p>No pending review requests</p>
      ) : (
        requests.map((req) => (
          <div key={req.request_id} className="border p-4 mb-4 rounded shadow">
            <p><strong>Request ID:</strong> {req.request_id}</p>
            <p><strong>Team ID:</strong> {req.team_id}</p>
            <p><strong>Team Lead:</strong> {req.team_lead}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleAcceptReject('reject', req.request_id)} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
              <button onClick={() => setSelectedRequest(req)} className="bg-green-500 text-white px-3 py-1 rounded">Accept & Schedule</button>
            </div>
          </div>
        ))
      )}

      {selectedRequest && (
        <div className="mt-8 p-4 border rounded shadow bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Schedule Review</h2>
          <input
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            className="border px-2 py-1 rounded mb-2"
          />
          <button
            onClick={handleFetchStaffs}
            className="ml-2 bg-blue-500 text-white px-3 py-1 rounded"
          >
            Check Available Staffs
          </button>

          <div className="mt-2">
            <label className="block mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border px-2 py-1 rounded w-full"
            />
          </div>

          <div className="mt-2">
            <label className="block mb-1">Guide</label>
            <select value={guide} onChange={(e) => setGuide(e.target.value)} className="w-full border px-2 py-1 rounded">
              <option value="">Select Guide</option>
              {availableStaffs.map(staff => <option key={staff.reg_num} value={staff.reg_num}>{staff.name}</option>)}
            </select>
          </div>

          <div className="mt-2">
            <label className="block mb-1">Subject Expert</label>
            <select value={expert} onChange={(e) => setExpert(e.target.value)} className="w-full border px-2 py-1 rounded">
              <option value="">Select Expert</option>
              {availableStaffs.map(staff => <option key={staff.reg_num} value={staff.reg_num}>{staff.name}</option>)}
            </select>
          </div>

          <button
            onClick={handleSchedule}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Schedule Review
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminChallengeReviewManager;