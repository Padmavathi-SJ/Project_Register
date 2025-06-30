import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import instance from "../../utils/axiosInstance";

const WeeklyLogsHistory = () => {

  const teamSelector = useSelector((state) => state.teamSlice.data);
  const teamId = teamSelector[0]?.team_id;

  const [reviewHistory, setReviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    const fetchReviewHistory = async () => {
      try {
        const response = await instance.get(`/student/get_review_history/${teamId}`);
        if (typeof response.data.data === "string") {
          setError(response.data);
        } else {
          setReviewHistory(response.data.data);
          //   alert(reviewHistory[0].status)
        }
      } catch (err) {
        setError("Failed to fetch review history.");
      } finally {
        setLoading(false);
      }
    };

    if (teamId) fetchReviewHistory();
  }, [teamId]);

  if (loading) {
    return <div className="text-center text-blue-600 mt-4">Loading review history...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-4">{error}</div>;
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">Weekly Logs Review History</h2>
      <div className="overflow-x-auto shadow border rounded-xl bg-white">
        <table className="min-w-full bg-white text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left bg-white">Week</th>
              <th className="px-4 py-3 text-left bg-white">Status</th>
              <th className="px-4 py-3 text-left bg-white">Verified</th>
              <th className="px-4 py-3 text-left bg-white">Verified By</th>
              <th className="px-4 py-3 text-left bg-white">Verified At</th>
              <th className="px-4 py-3 text-left bg-white">Remarks / Reason</th>
            </tr>
          </thead>
          <tbody>
            {reviewHistory.map((entry, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-2 bg-white">{entry.week_number}</td>
                <td className={`px-4 py-2 font-medium bg-white ${entry.status === "accept"
                  ? "text-green-600"
                  : entry.status === "reject"
                    ? "text-red-600"
                    : "text-gray-600"
                  }`}>
                  {entry.status}
                </td>
                <td className="px-4 py-2 bg-white">
                  {entry.is_verified ? "Yes" : "No"}
                </td>
                <td className="px-4 py-2 bg-white">{entry.verified_by || "—"}</td>
                <td className="px-4 py-2 bg-white">
                  {entry.verified_at ? new Date(entry.verified_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2 bg-white">
                  {entry.status === "accept" && entry.remarks
                    ? entry.remarks
                    : entry.status === "rejected" && entry.reason
                      ? entry.reason
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyLogsHistory;
