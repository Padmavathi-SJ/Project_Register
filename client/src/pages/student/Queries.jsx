import React, { useState, useRef, useEffect } from 'react';
import instance from '../../utils/axiosInstance';
import { useSelector } from 'react-redux';

function Queries() {
  const [queries, setQueries] = useState([]);
  const [newQuery, setNewQuery] = useState('');
  const chatEndRef = useRef(null);
  const selector = useSelector((state) => state.teamSlice.data || null);
  const name = useSelector((state) => state.userSlice.auth?.user || null);
  const statusSelector = useSelector((Store) => Store.teamStatusSlice);

  async function submitQuery(event) {
    event.preventDefault();
    if (newQuery.trim().length === 0) {
      alert("Query field is empty!");
      return;
    }
    try {

      // const token = localStorage.getItem("accessToken");
      console.log(statusSelector);
      await instance.post(
        `/student/student_query/${name.name}/${name.guide_reg_num}`,
        {
          team_id: selector[0].team_id,
          project_id: statusSelector.data.projectId,
          query: newQuery,
        }
      );

      setNewQuery('');
      fetchQueries();
    } catch (error) {
      console.error("ERROR:", error);
    }
  }
  // Function to fetch queries
  const fetchQueries = async () => {
    try {
      // const token = localStorage.getItem("accessToken");
      const response = await instance.get(
        `/student/get_queries_sent_by_my_team/${selector[0].team_id}`,
      );
      console.log(response, "team queries");
      if (Array.isArray(response.data)) {
        setQueries(response.data);
      } else {
        console.error("Response is not an array:", response.data);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    }
  };

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-black  top-24 left-[850px] text-2xl text-center font-semibold px-4 py-3">
          Guide Chat
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-2 space-y-4 mb-24 query-container"
        >
          {queries.length > 0 ? (
            queries.map((q) => (
              <div key={q.query_id} className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-purple-500 text-white p-3 rounded-lg max-w-xs shadow-md">
                    {q.query}
                  </div>
                </div>
                {q.reply && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-300 text-gray-800 p-3 rounded-lg max-w-xs shadow-sm">
                      {q.reply}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center">No messages yet.</div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Send Query Form */}
      <div className="mb-[-16px] ml-[-15px]  bg-white sticky bottom-0 w-[calc(100%+30px)]">
        <form onSubmit={submitQuery} className="flex p-3  bg-white gap-2">
          <input
            type="text"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            placeholder="Type your query..."
            className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}

export default Queries;
