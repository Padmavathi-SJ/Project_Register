import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import instance from "../../utils/axiosInstance";
import { Link } from "react-router-dom";

const Progress_Update = () => {
  const { reg_num } = useSelector((state) => state.userSlice.auth.user || null);
  const teamSelector = useSelector((state) => state.teamSlice.data);

  const [description, setDescription] = useState("");
  const [canUpdate, setCanUpdate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(null);
  const [currentWeekKey, setCurrentWeekKey] = useState("");
  const [deadlines, setDeadlines] = useState({});
  const [reviewHistory, setReviewHistory] = useState([]);
  const [currentWeekStatus, setCurrentWeekStatus] = useState(null);
  const [isAlreadyUpdated, setIsAlreadyUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRemarks, setCurrentRemarks] = useState("");
  const [currentReason, setCurrentReason] = useState("");


  const determineCurrentWeek = (deadlineData) => {
    const today = new Date().toISOString().split("T")[0];
    // console.log(today);
    for (let i = 1; i <= 12; i++) {
      const key = `week${i}`;
      // console.log(deadlineData[key]);
      if (deadlineData[key] && today <= deadlineData[key]) {
        // console.log("inside");
        setCurrentWeekIndex(i);
        setCurrentWeekKey(key);
        break;
      }
    }
  };
  console.log(canEdit, canUpdate);
  const fetchDeadlines = async () => {
    try {
      const teamId = teamSelector[0]?.team_id;
      if (!teamId) return;
      const response = await instance.get(`/guide/fetchDeadlines/${teamId}`);
      // console.log(response.data.data, "111111111111");
      const data = response.data.data[0];
      console.log(data);
      setDeadlines(data);
      determineCurrentWeek(data);
    } catch (error) {
      console.error("Deadline fetch failed", error);
    }
  };

  const checkIfAlreadyUpdated = async (teamId, week, reg_num) => {
    try {
      const res = await instance.get(
        `/student/checks_whether_log_updated/${teamId}/${week}/${reg_num}`
      );
      return res.data === "Already Updated!";
    } catch (err) {
      console.error("Check update failed", err);
      return false;
    }
  };

  const fetchReviewHistory = async () => {
    try {
      const teamId = teamSelector[0].team_id;
      const response = await instance.get(`/student/get_review_history/${teamId}`);
      console.log(response);
      const data = typeof response.data.data !== "string" ? response.data.data : [];

      setReviewHistory(data);

      const currentReview = data.find((r) => r.week_number === currentWeekIndex);

      const prevReview = data.find((r) => r.week_number === currentWeekIndex - 1);

      if (currentReview) {
        setCurrentWeekStatus(currentReview.status || null);
        setCurrentRemarks(currentReview.remarks || "");
        setCurrentReason(currentReview.reason || "");

        if (currentReview.status === "reject") {
          setCanEdit(true);
          setDescription(currentReview.progress);
        }
      }


      if (currentReview) {
        setCurrentWeekStatus(currentReview.status || null);
        if (currentReview.status === "reject") {
          setCanEdit(true);
          setDescription(currentReview.progress);
        }
      }

      const updated = await checkIfAlreadyUpdated(teamId, currentWeekIndex, reg_num);
      setIsAlreadyUpdated(updated);

      if (!currentReview) {
        if (!updated && (currentWeekIndex === 1 || prevReview?.status === "accept")) {
          setCanUpdate(true);
        }
      }
    } catch (error) {
      console.error("Review history fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const teamId = teamSelector[0].team_id;
    try {
      await instance.post(`/student/update_progress/${currentWeekKey}/${reg_num}/${teamId}`, {
        progress: description,
      });
      alert("Progress submitted!");
      setCanUpdate(false);
      fetchReviewHistory();
    } catch (error) {
      alert("Submit failed");
      console.error(error);
    }
  };

  const handleEdit = async () => {
    const teamId = teamSelector[0].team_id;
    try {
      await instance.patch(
        `/student/edit_submitted_progress/${teamId}/${currentWeekIndex}/${reg_num}`,
        { newProgress: description }
      );
      alert("Progress updated!");
      setCanEdit(false);
      fetchReviewHistory();
    } catch (error) {
      alert("Edit failed");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  useEffect(() => {
    if (currentWeekIndex !== null) {
      fetchReviewHistory();
    }
  }, [currentWeekIndex]);

  if (loading) {
    return <div className="text-center mt-10 text-blue-600 font-semibold">Loading progress status...</div>;
  }

  let statusMessage = null;
  let details = null;

  if (currentWeekStatus === "accept") {
    statusMessage = "✅ This week’s progress is accepted by the guide.";
    details = currentRemarks;
  } else if (currentWeekStatus === "reject") {
    statusMessage = "❌ This week’s progress was rejected. Please update it.";
    details = currentReason;
  } else if (isAlreadyUpdated && !canEdit) {
    statusMessage = canUpdate
      ? "⏳ Resubmission of your progress of this week is updated, wait for guide verification."
      : "⏳ Progress of this week is updated, wait for guide verification.";
  }


  return (
    <div className="p-6  w-full mx-auto font-sans">
      <h1 className="text-4xl font-semibold text-center text-gray-900 mb-8">Progress Update</h1>
      {/* <div className="w-full p-2 text-right"> */}
      <Link to="/student/week" className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-700 text-white">
        View Weekly Logs History
      </Link>
      {/* </div> */}


      {statusMessage && (
        <p className="text-center mt-6 font-semibold text-gray-700">{statusMessage}</p>
      )}
      {details && (
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 p-6 rounded-xl shadow-lg">

          <h1 className="bg-white font-semibold ">{currentWeekStatus == "accept" ? "Remarks :" : "Reason :"}</h1>
          <h3 className="text-center bg-white mt-6 font-semibold text-gray-600">{details} </h3>
        </div>
      )}

      {(canUpdate || canEdit) && (
        <div className="bg-white max-w-2xl border border-gray-200 rounded-2xl p-8 shadow-lg mt-6 mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3 bg-white">Week {currentWeekIndex}</h2>
          <p className="text-sm text-gray-500 mb-2  bg-white">
            Deadline:{" "}
            <span className="font-medium text-gray-700  bg-white">{deadlines[currentWeekKey]}</span>
          </p>
          <textarea
            className="w-full p-4 border border-gray-300 rounded-xl text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purplegit -500"
            rows={6}
            placeholder="Describe your weekly progress here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="mt-6 text-right  bg-white">
            {canEdit ? (
              <button
                onClick={handleEdit}
                className="bg-yellow-500 text-white px-6 py-2 rounded-xl hover:bg-yellow-600 transition font-semibold shadow-lg"
              >
                Update Rejected Progress
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r  from-indigo-600 to-blue-500 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-blue-600 transition font-semibold shadow-lg"
              >
                Submit Progress
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress_Update;
