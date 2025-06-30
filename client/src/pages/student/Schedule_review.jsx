import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import instance from "../../utils/axiosInstance";

const ScheduleReview = () => {
  const { reg_num, mentor_reg_num } = useSelector((state) => state.userSlice.auth.user || null);
  const teamSelector = useSelector((state) => state.teamSlice.data);
  const statusSelector = useSelector((state) => state.teamStatusSlice);
  console.log(statusSelector?.data);
  const [form, setForm] = useState({
    project_id: "",
    project_name: "",
    team_lead: "",
    review_date: "",
    start_time: "",
    isOptional: "",
    reason: "",
    mentor_reg_num: ""
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const team_id = teamSelector[0]?.team_id;

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      project_id: statusSelector?.data.projectId || "",
      project_name: statusSelector?.data.projectName || "",
      team_lead: teamSelector[0]?.from_reg_num || "",
      mentor_reg_num: mentor_reg_num || ""
    }));
  }, [statusSelector, teamSelector, mentor_reg_num]);

  useEffect(() => {
    const fetchReviewHistory = async () => {
      if (!team_id) return;
      try {
        const res = await instance.get(`/student/get_review_request_history/${team_id}`);
        const sorted = res.data.sort((a, b) => new Date(b.review_date) - new Date(a.review_date));
        const latestReview = sorted[0];
        setReviewStatus(latestReview);
      } catch (err) {
        setReviewStatus(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReviewHistory();
  }, [team_id, formSubmitted]);

  const handleInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { project_id, project_name, team_lead, review_date, start_time, isOptional, reason } = form;
    console.log(project_id, project_name, team_lead, review_date, start_time, isOptional, reason);
    if (!team_id || !project_id || !reg_num) {
      alert("Missing required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("team_id", team_id);
    formData.append("project_id", project_id);
    formData.append("project_name", project_name);
    formData.append("team_lead", team_lead);
    formData.append("mentor_reg_num", mentor_reg_num);
    formData.append("review_date", review_date);
    formData.append("start_time", start_time);
    formData.append("isOptional", isOptional);
    formData.append("reason", reason);

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop().toLowerCase();
      if (["pdf", "doc", "docx"].includes(fileExt)) {
        formData.append("report", selectedFile);
      } else if (["ppt", "pptx"].includes(fileExt)) {
        formData.append("ppt", selectedFile);
      } else if (["zip", "rar"].includes(fileExt)) {
        formData.append("outcome", selectedFile);
      } else {
        alert("Unsupported file format.");
        return;
      }
    }

    try {
      console.log(formData, "FormData contents:");
      let obj = {};
      for (let [key, value] of formData.entries()) {
        obj[key] = value;
        console.log(key, value);
      }
      console.log(obj);
      const res = await instance.post(
        `/student/send_review_request/${team_id}/${project_id}/${reg_num}`,
        obj,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log(res.data);
      alert(res.message);
      setSelectedFile(null);
      document.querySelector('input[type="file"]').value = '';
      setForm((prev) => ({
        ...prev,
        review_date: "",
        start_time: "",
        isOptional: "",
        reason: ""
      }));
      setFormSubmitted((prev) => !prev); // trigger history refresh
    } catch (error) {
      console.error(error?.response?.data.error);
      alert(error?.response?.data.error || "Error submitting request.");

    }
  };

  const shouldShowForm = () => {
    if (!reviewStatus) return true;

    const { guide_status, expert_status } = reviewStatus;

    if (guide_status === "reject" || expert_status === "reject") return true;
    return false;
  };

  const bothAccepted = reviewStatus?.guide_status === "accept" && reviewStatus?.expert_status === "accept";
  const requestPending = reviewStatus?.guide_status === "interested" || reviewStatus?.expert_status === "interested";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-center mb-6">Schedule Review</h1>

      {!loading && reviewStatus && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-100">
          <p><strong>Review Date:</strong> {reviewStatus.review_date}</p>
          <p><strong>Start Time:</strong> {reviewStatus.start_time}</p>

          {requestPending && (
            <p className="text-yellow-600">
              You have already sent a review request. Please wait for guide and expert to respond.
            </p>
          )}

          {bothAccepted && (
            <div className="text-green-600">
              <p>✅ Guide and Expert have accepted the review.</p>
              <p><strong>Meeting Link:</strong>{" "}
                <a href={reviewStatus.temp_meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {reviewStatus.temp_meeting_link}
                </a>
              </p>
            </div>
          )}

          {(reviewStatus.guide_status === "reject" || reviewStatus.expert_status === "reject") && (
            <div className="text-red-600">
              <p><strong>❌ Review Rejected</strong></p>
              {reviewStatus.guide_status === "reject" && (
                <p><strong>Guide Reason:</strong> {reviewStatus.guide_reason}</p>
              )}
              {reviewStatus.expert_status === "reject" && (
                <p><strong>Expert Reason:</strong> {reviewStatus.expert_reason}</p>
              )}
              <p className="mt-2 text-black">You can correct and resubmit the review request.</p>
            </div>
          )}
        </div>
      )}

      {!loading && shouldShowForm() && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="date"
            name="review_date"
            onChange={handleInput}
            value={form.review_date}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="time"
            name="start_time"
            onChange={handleInput}
            value={form.start_time}
            className="w-full p-2 border rounded"
            required
          />
          <select
            name="isOptional"
            onChange={handleInput}
            value={form.isOptional}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Review Type</option>
            <option value="regular">Regular Review</option>
            <option value="optional">Optional Review</option>
          </select>

          {form.isOptional === "optional" && (
            <input
              name="reason"
              onChange={handleInput}
              value={form.reason}
              placeholder="Reason for Optional Review"
              className="w-full p-2 border rounded"
              required
            />
          )}

          <div className="flex flex-col gap-2">
            <label>Upload File (PDF, DOC, PPT, ZIP):</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit Review Request
          </button>
        </form>
      )}
    </div>
  );
};

export default ScheduleReview;
