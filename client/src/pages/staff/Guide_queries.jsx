import React, { useState, useEffect } from 'react';
import { SendHorizonal, Store } from 'lucide-react';
import instance from '../../utils/axiosInstance';
import { useSelector } from "react-redux"
const Guide_queries = () => {
  const [queries, setQueries] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const selector = useSelector((Store) => Store.userSlice.auth?.user || null);

  // Fetch queries from the backend
  async function fetchQueries() {
    try {
      // const token = localStorage.getItem("accessToken");
      const response = await instance.get(`/guide/get_queries/${selector.reg_num}`);
      console.log(response.data);
      if (response.status === 200) {
        setQueries(response.data.data); // Assuming response.data is an array of queries
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    }
  }

  // Fetch queries when component mounts, and update every 3 seconds
  useEffect(() => {
    fetchQueries(); // Initial fetch
    const interval = setInterval(() => fetchQueries(), 3000); // Periodic fetch

    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  // Handle reply input changes
  const handleReplyChange = (queryId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [queryId]: value,
    }));
  };

  // Send reply to backend
  const handleSendReply = async (e, queryId) => {
    e.preventDefault();
    const reply = replyInputs[queryId];
    if (!reply) return;

    try {
      console.log(queryId, reply, "queryyyyaass");
      // const token = localStorage.getItem("accessToken");
      const response = await instance.patch(
        `/guide/add_reply/${queryId}`,
        { reply }
      );

      if (response.status === 200) {
        // Update the UI to reflect the sent reply
        setQueries((prevQueries) =>
          prevQueries.map((q) =>
            q.query_id === queryId ? { ...q, reply } : q
          )
        );
        setReplyInputs((prev) => ({ ...prev, [queryId]: '' }));
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  return (
    <div className="p-6 min-h-">
      <h2 className="text-3xl text-center font-bold mb-6">Student Queries</h2>

      <div className="grid gap-6">
        {Array.isArray(queries) && queries.length > 0 ? (
          [...queries]
            .sort((a, b) => (a.reply ? 1 : -1)) // Unreplied first
            .map((q) => (
              <div key={q.query_id} className="bg-white p-5 rounded-xl shadow-md">
                <div className="mb-2 bg-white">
                  <p className="text-sm bg-white text-gray-500 mb-2">
                    <strong className='bg-white'>Project ID:</strong> {q.project_id} &nbsp;| &nbsp;
                    <strong className='bg-white'>Project Name:</strong> {q.project_name}
                  </p>
                  <span className="font-semibold bg-white text-purple-500">{q.team_member}</span> asked:
                  <p className="text-lg mt-1 bg-white">{q.query}</p>
                </div>

                {q.reply ? (
                  <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
                    <strong className='bg-green-100'>Your Answer:</strong> {q.reply}
                  </div>
                ) : (
                  <form className='rounded-lg' onSubmit={(e) => handleSendReply(e, q.query_id)}>
                    <div className="mt-4 flex rounded-lg bg-white flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 p-2 border border-black rounded-lg bg-white"
                        placeholder="Type your reply here..."
                        value={replyInputs[q.query_id] || ''}
                        onChange={(e) => handleReplyChange(q.query_id, e.target.value)}
                      />
                      <button
                        type="submit"
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                      >
                        <SendHorizonal className='bg-purple-500' size={18} /> Send
                      </button>
                    </div></form>
                )}
              </div>
            ))
        ) : (
          <p className="text-center text-gray-400 font-light tracking-wide">
            — currently no active queries —
          </p>
        )}
      </div>
    </div>
  );
}


export default Guide_queries;
