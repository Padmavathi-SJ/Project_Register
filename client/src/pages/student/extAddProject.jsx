import React, { useState } from 'react';
import instance from '../../utils/axiosInstance';

function extAddProject() {
  const [projectName, setProjectName] = useState('');
  const [clusterName, setClusterName] = useState('');
  const [description, setDescription] = useState('');
  const [phases, setPhases] = useState(
    Array(5).fill({ requirements: '', days: '' })
  );

  const handlePhaseChange = (index, field, value) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPhases(newPhases);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isProjectDataValid = () => {
      if (!projectName || !clusterName || !description || phases.length !== 5) return false;
      return phases.every(phase => phase.requirements && phase.days);
    };

    if (!isProjectDataValid()) {
      alert("Please fill in all fields!");
      return;
    }

    const projectData = {
      project_id: "EXT-CS-P11", // mathan will make it dynamic
      project: projectName,
      cluster: clusterName,
      description,
      phase_1_requirement: phases[0].requirements,
      phase_1_deadline: parseInt(phases[0].days),
      phase_2_requirement: phases[1].requirements,
      phase_2_deadline: parseInt(phases[1].days),
      phase_3_requirement: phases[2].requirements,
      phase_3_deadline: parseInt(phases[2].days),
      phase_4_requirement: phases[3].requirements,
      phase_4_deadline: parseInt(phases[3].days),
      phase_5_requirement: phases[4].requirements,
      phase_5_deadline: parseInt(phases[4].days),
    };

    try {
      // const accessToken = localStorage.getItem("accessToken");
      const response = await instance.post(`${import.meta.env.VITE_API_URL}/teacher/addproject`, projectData);

      if (response.status === 200) {
        alert('Project added successfully!');
        // Optionally reset form here
      } else {
        alert('Failed to add project');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while adding the project.');
    }
  };

  return (
    <div className="min-h-screen flex  items-center justify-center bg-white-50 p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center bg-white text-gray-800">Post New Project</h2>
        <form className="space-y-6 bg-white" onSubmit={handleSubmit}>
          {/* Project and Cluster Name */}
          <div className="grid grid-cols-1 bg-white md:grid-cols-2 gap-6">
            <div className='bg-white'>
              <label className="block bg-white text-sm font-medium text-gray-700">Project Name</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter Project Name"
                className="mt-1 bg-white w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className='bg-white'>
              <label className="block bg-white text-sm font-medium text-gray-700">Cluster Name</label>
              <select
                required
                value={clusterName}
                onChange={(e) => setClusterName(e.target.value)}
                className="mt-1 bg-white w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="" disabled>
                  Select Cluster Name
                </option>
                <option value="CSE">CSE</option>
                <option value="AIDS">AIDS</option>
                <option value="IT">IT</option>
                <option value="AIML">AIML</option>
                <option value="CT">CT</option>
                <option value="AGRI">AGRI</option>
                <option value="ECE">ECE</option>
                <option value="EIE">EIE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="FT">FT</option>
                <option value="FD">FD</option>
                {/* Add more options as needed */}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className='bg-white'>
            <label className="block text-sm bg-white font-medium text-gray-700">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Description"
              className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {/* Phases */}
          {phases.map((phase, index) => (
            <div key={index} className="grid bg-white grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2 bg-white">
                <label className="block text-sm font-medium bg-white text-gray-700">Phase {index + 1} Requirements</label>
                <input
                  type="text"
                  required
                  value={phase.requirements}
                  onChange={(e) => handlePhaseChange(index, 'requirements', e.target.value)}
                  placeholder="Requirements"
                  className="mt-1 bg-white w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="col-span-2 bg-white">
                <label className="block text-sm font-medium bg-white text-gray-700">Phase {index + 1} Duration (Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={phase.days}
                  onChange={(e) => handlePhaseChange(index, 'days', e.target.value)}
                  placeholder="No. of days"
                  className="mt-1 w-full border bg-white border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <div className="text-center bg-white">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md shadow-md transition duration-200"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default extAddProject;
