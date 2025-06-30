import React, { useState } from "react";
import instance from "../../utils/axiosInstance";

const ProjectFileUpload = ({ teamId, reg_num, project_id }) => {
  const [outcomeFile, setOutcomeFile] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [pptFile, setPptFile] = useState(null);

  const handleUpload = async (fileType, file) => {
    if (!teamId || !project_id) {
      alert("Please enter both Team ID and Project ID");
      return;
    }

    if (!file) {
      alert(`Please choose a ${fileType.toUpperCase()} file`);
      return;
    }

    const allowedExtensions = {
      outcome: ["pdf"],
      report: ["pdf"],
      ppt: ["ppt", "pptx"],
    };

    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions[fileType].includes(ext)) {
      alert(`Invalid file type for ${fileType.toUpperCase()}`);
      return;
    }

    const formData = new FormData();
    formData.append("team_id", teamId);
    formData.append("project_id", project_id);
    formData.append(fileType, file);

    try {
      const response = await instance.post("/upload-files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.error || "File upload failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Project File Upload</h2>

      <div className="mb-4">
        <label>Upload Outcome:</label>
        <input
          type="file"
          onChange={(e) => setOutcomeFile(e.target.files[0])}
          className="block mt-1"
        />
        <button
          className="bg-green-600 hover:bg-green-700 text-white w-full mt-2 py-2 rounded"
          onClick={() => handleUpload("outcome", outcomeFile)}
        >
          Upload Outcome
        </button>
      </div>

      <div className="mb-4">
        <label>Upload Report:</label>
        <input
          type="file"
          onChange={(e) => setReportFile(e.target.files[0])}
          className="block mt-1"
        />
        <button
          className="bg-green-600 hover:bg-green-700 text-white w-full mt-2 py-2 rounded"
          onClick={() => handleUpload("report", reportFile)}
        >
          Upload Report
        </button>
      </div>

      <div>
        <label>Upload PPT:</label>
        <input
          type="file"
          onChange={(e) => setPptFile(e.target.files[0])}
          className="block mt-1"
        />
        <button
          className="bg-green-600 hover:bg-green-700 text-white w-full mt-2 py-2 rounded"
          onClick={() => handleUpload("ppt", pptFile)}
        >
          Upload PPT
        </button>
      </div>
    </div>
  );
};

export default ProjectFileUpload;
