import React, { useEffect, useState } from "react";
import instance from "../../utils/axiosInstance";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";

const TimeLine = () => {
  const [timelines, setTimelines] = useState([]);
  const [newTimeline, setNewTimeline] = useState({ name: "", startTime: "", endTime: "" });
  const [editIndex, setEditIndex] = useState(null);
  const [editTimeline, setEditTimeline] = useState({ name: "", startTime: "", endTime: "" });
  console.log(timelines);
  // Predefined name options for the dropdown
  const nameOptions = [
    "Team Formation",
    "Submit Project Details",
    "Assign Guides and Mentors",
    "Start Project Development",
    "Review 1",
    "Review 2",
    "Submit Report & PPT",
    "Optional Review",
    "Challenge Review"
  ];

  useEffect(() => {
    fetchTimelines();
  }, []);

  const fetchTimelines = async () => {
    try {
      const res = await instance.get("/admin/get_timelines");
      if (res.status !== 200 || res.data.length === 0) return alert("Error fetching timeline!");
      // console.log(res.data.data);
      setTimelines(
        res.data.data
      );
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const formatForDateTimeLocal = (dateString) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { name, startTime, endTime } = newTimeline;
    if (!name || !startTime || !endTime) return;

    try {
      await instance.post("/admin/addTimeLine", {
        name,
        start_date: startTime,
        end_date: endTime,
      });
      setNewTimeline({ name: "", startTime: "", endTime: "" });
      fetchTimelines();
    } catch (error) {
      console.error("Add error:", error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await instance.delete(`/admin/remove_timeline/${id}`);
      fetchTimelines();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEditClick = (index) => {
    const item = timelines[index];
    setEditIndex(index);
    setEditTimeline({
      id: item.id,
      name: item.name || "",
      startTime: formatForDateTimeLocal(item.startTime),
      endTime: formatForDateTimeLocal(item.endTime),
    });
  };

  const handleEditSave = async () => {
    const { id, name, startTime, endTime } = editTimeline;
    try {
      await instance.patch(`/admin/update_timeline_id/${id}`, {
        name,
        start_date: startTime,
        end_date: endTime,
      });
      setEditIndex(null);
      fetchTimelines();
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center mt-6 mb-6">Timeline Management</h2>
      <div className="w-full flex flex-end justify-between">
        <Link
          to="/admin/timeline/change-timeline"
          className="px-4 py-2 ml-[9%] bg-purple-500 rounded hover:bg-purple-700 text-white"
        >
          Change Deadline
        </Link>
        <Link
          to="/admin/timeline/assignguideexpert"
          className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-700 text-white"
        >
          Assign Guide or Expert
        </Link>

        <Link
          to="/admin/timeline/weeklogupdate"
          className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-700 text-white"
        >
          Week log deadline
        </Link>

        <Link
          to="/admin/timeline/challenge-review"
          className="px-4 py-2 mr-[9%] bg-purple-500 rounded hover:bg-purple-700 text-white"
        >
          Challenge Review Requests
        </Link>
      </div>
      <div className="max-w-5xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow">
        <form onSubmit={handleAdd} className="grid grid-cols-1 bg-white md:grid-cols-4 gap-4 items-end mb-6">
          <div className="bg-white">
            <label className="block font-medium bg-white mb-1">Name</label>
            <select
              value={newTimeline.name}
              onChange={(e) => setNewTimeline({ ...newTimeline, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a phase...</option>
              {nameOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white">
            <label className="block bg-white font-medium mb-1">Start Date & Time</label>
            <input
              type="date"
              value={newTimeline.startTime}
              onChange={(e) => setNewTimeline({ ...newTimeline, startTime: e.target.value })}
              className="w-full px-3 py-2 border bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="bg-white">
            <label className="block font-medium bg-white mb-1">End Date & Time</label>
            <input
              type="date"
              value={newTimeline.endTime}
              onChange={(e) => setNewTimeline({ ...newTimeline, endTime: e.target.value })}
              className="w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-purple-500 text-white py-2 rounded-md hover:bg-purple-700 font-semibold"
          >
            Add
          </button>
        </form>

        <table className="w-full table-auto border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border bg-white w-12">S.no</th>
              <th className="p-3 border bg-white min-w-[150px]">Name</th>
              <th className="p-3 border bg-white min-w-[180px]">Start Date & Time</th>
              <th className="p-3 border bg-white min-w-[180px]">End Date & Time</th>
              <th className="p-3 border bg-white w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timelines.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No timeline added yet.
                </td>
              </tr>
            ) : (
              timelines.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 border text- bg-white">{index + 1}</td>
                  <td className="p-3 border bg-white">
                    {editIndex === index ? (
                      <select
                        value={editTimeline.name}
                        onChange={(e) => setEditTimeline({ ...editTimeline, name: e.target.value })}
                        className="w-full bg-white border rounded-md px-2 py-1"
                      >
                        <option value="">Select a phase...</option>
                        {nameOptions.map((option, idx) => (
                          <option key={idx} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="p-3 border bg-white">
                    {editIndex === index ? (
                      <input
                        type="datetime-local"
                        value={editTimeline.startTime}
                        onChange={(e) => setEditTimeline({ ...editTimeline, startTime: e.target.value })}
                        className="bg-white rounded-md"
                        style={{ boxSizing: "border-box" }}
                      />
                    ) : (
                      new Date(item.start_date).toLocaleString()
                    )}
                  </td>
                  <td className="p-3 border bg-white">
                    {editIndex === index ? (
                      <input
                        type="datetime-local"
                        value={editTimeline.endTime}
                        onChange={(e) => setEditTimeline({ ...editTimeline, endTime: e.target.value })}
                        className="w-full bg-white rounded-md"
                        style={{ boxSizing: "border-box" }}
                      />
                    ) : (
                      new Date(item.end_date).toLocaleString()
                    )}
                  </td>
                  <td className="p-3 border space-x-2 text-center bg-white">
                    {editIndex === index ? (
                      <>
                        <button
                          onClick={handleEditSave}
                          className="text-green-600 text-xl mx-5"
                          title="Save"
                          type="button"
                        >
                          <FaSave className="bg-white" />
                        </button>
                        <button
                          onClick={() => setEditIndex(null)}
                          className="text-grey-600 text-xl mx-5"
                          title="Cancel"
                          type="button"
                        >
                          <FaTimes className="bg-white" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(index)}
                          className="text-blue-600 text-xl mx-5"
                          title="Edit"
                          type="button"
                        >
                          <FaEdit className="bg-white" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 text-xl mx-5"
                          title="Delete"
                          type="button"
                        >
                          <FaTrash className="bg-white" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TimeLine;