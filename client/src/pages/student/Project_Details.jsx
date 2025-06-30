import React, { useEffect, useState } from 'react';
import instance from '../../utils/axiosInstance';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

const Project_Details = () => {
  const userselector = useSelector((state) => state.userSlice.auth.user || null);
  const teamselector = useSelector((state) => state.teamSlice.data || []);
  const teamstatusselector = useSelector((state) => state.teamStatusSlice);

  const [projectName, setProjectName] = useState('');
  const [clusterName, setClusterName] = useState('');
  const [core, setCore] = useState('');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('');
  const [expertsList, setExpertsList] = useState([]);
  const [guidesList, setGuidesList] = useState([]);
  const [selectedExperts, setSelectedExperts] = useState([]);
  const [selectedGuides, setSelectedGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [projectData, setProjectData] = useState([]);
  const navigate = useNavigate();

  const uniqueDepartments = React.useMemo(() => {
    return [...new Set(
      teamselector
        .filter(team => team?.dept)
        .map(team => team.dept)
    )];
  }, [teamselector]);

  // Custom filter functions and handlers remain the same
  const customFilter = (option, inputValue) => {
    const label = option.label?.toLowerCase();
    const value = option.value?.toLowerCase();
    const search = inputValue?.toLowerCase();
    return label.includes(search) || value.includes(search);
  };

  const handleExpertChange = (selectedOptions) => {
    const selectedRegNums = selectedOptions.map(option => option.value);
    setSelectedExperts(selectedRegNums);
  };

  const handleGuideChange = (selectedOptions) => {
    const selectedRegNums = selectedOptions.map(option => option.value);
    setSelectedGuides(selectedRegNums);
  };
  // Custom search filter (search by name or reg_num)
  const customGuideFilter = (option, inputValue) => {
    const label = option.label.toLowerCase();
    const value = option.value.toLowerCase();
    const search = inputValue.toLowerCase();
    return label.includes(search) || value.includes(search);
  };
  const filteredExpertOptions = expertsList
    .filter(expert => !selectedGuides.includes(expert.reg_num))
    .map((expert) => ({
      value: expert.reg_num,
      label: `${expert.name} (${expert.reg_num})`,
    }));

  const filteredGuideOptions = guidesList
    .filter(guide => !selectedExperts.includes(guide.reg_num))
    .map((guide) => ({
      value: guide.reg_num,
      label: `${guide.name} (${guide.reg_num})`,
    }));

  useEffect(() => {
    if (teamselector.length === 0 || !teamstatusselector.data?.projectId) {
      console.log("Team data not ready or missing project_id");
      return;
    }

    instance
      .get(`/student/get_project_details/${teamstatusselector.data.projectId}`)
      .then((res) => {
        if (res.status === 200) {
          setProjectData(res.data.data.project);
          setIsSuccess(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching project details:", err);
      });
  }, [teamselector, teamstatusselector]);

  useEffect(() => {
    async function fetchExpertsAndGuides() {
      try {
        const [expertRes, guideRes] = await Promise.all([
          instance.get('/admin/get_users/staff', { withCredentials: true }),
          instance.get('/admin/get_users/staff', { withCredentials: true }),
        ]);
        if (expertRes.status === 200) setExpertsList(expertRes.data.data);
        if (guideRes.status === 200) setGuidesList(guideRes.data.data);
      } catch (err) {
        console.error('Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchExpertsAndGuides();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await instance.post(
        `/student/addproject/${userselector.project_type}/${teamselector[0].team_id}/${userselector.reg_num}`,
        {
          "project_name": projectName,
          "cluster": clusterName,
          "description": description,
          "outcome": outcome,
          "hard_soft": core
        }
      );

      const { message, data: { project_id } } = response.data;
      if (!project_id) throw new Error('Project ID not returned.');

      await Promise.all([
        instance.post(`/guide/sent_request_to_guide/${userselector.semester}`, {
          "from_team_id": teamselector[0].team_id,
          "project_id": project_id,
          "project_name": projectName.trim(),
          "to_guide_reg_num": selectedGuides,
        }),
        instance.post(`/sub_expert/sent_request_to_expert/${userselector.semester}`, {
          "from_team_id": teamselector[0].team_id,
          "project_id": project_id,
          "project_name": projectName.trim(),
          "to_expert_reg_num": selectedExperts,
        })
      ]);

      alert('Project submitted and requests sent successfully!');
      navigate('/student');
    } catch (error) {
      console.error('Submit Error:', error);
      alert("Failed to submit project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  function Detail({ label, value, fullWidth = false }) {
    return (
      <div className={`flex flex-col ${fullWidth ? 'md:col-span-2' : ''}`}>
        <span className="text-sm bg-white text-gray-500 font-medium">{label}</span>
        <span className="text-base bg-white text-gray-800 font-semibold">{value}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (teamselector.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold mb-4">Team data not available</h2>
        <p className="text-gray-600 mb-4">Please try again later or contact support</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Refresh Page
        </button>
      </div>
    );
  }


  return (
    <>
      {isSuccess && projectData.length > 0 ? (
        <div className="max-w-3xl mx-auto mt-10">
          <h2 className="text-2xl flex justify-center font-semibold text-gray-800 mb-6 border-b pb-3">
            Project Details
          </h2>
          <div className="bg-white shadow-lg rounded-xl p-5 border border-gray-200 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-14 gap-y-4 text-gray-700 bg-white p-4 rounded-lg">
              <Detail label="Project ID" value={projectData[0].projectId} />
              <Detail label="Project Name" value={projectData[0].project_name} />
              <Detail label="Project Type" value={projectData[0].project_type} />
              <Detail label="Cluster" value={projectData[0].cluster} />
              <Detail label="Hard/Soft" value={projectData[0].hard_soft} />
              <Detail label="Posted Date" value={new Date(projectData[0].posted_date).toLocaleDateString()} />
              <Detail label="Team Lead Reg.no" value={projectData[0].tl_reg_num} />
              <Detail label="Description" value={projectData[0].description} fullWidth />
              <Detail label="Outcome" value={projectData[0].outcome} fullWidth />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="flex justify-center text-2xl font-bold mb-6">Project Submission</h2>
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 bg-white rounded-lg shadow">
            <div className="mb-4 bg-white ">
              <label className="block mb-1 bg-white font-medium">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-white  border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className='flex col-span-2 gap-4 bg-white'>
              <div className="mb-4 w-[50%] bg-white ">
                <label className="block mb-1  bg-white font-medium">Cluster Name</label>
                <select
                  value={clusterName}
                  onChange={(e) => { setClusterName(e.target.value); console.log(e.target.value); }}
                  className="w-full border px-3 py-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="" disabled>Select cluster</option>
                  {uniqueDepartments.map((dept, i) => (
                    <option key={i} value={dept}>{dept}</option>
                  ))}
                </select>

              </div>

              <div className="mb-4 bg-white w-[50%]">
                <label className="block mb-1  bg-white  font-medim">Project Type</label>
                <select
                  value={core}
                  onChange={(e) => setCore(e.target.value)}
                  className="w-full bg-white  border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="" disabled>Select</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                </select>
              </div>
            </div>

            <div className="mb-4 bg-white ">
              <label className="block bg-white  mb-1 font-medium">Project Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full  bg-white border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
                required
              />
            </div>

            <div className="mb-6 bg-white ">
              <label className="block mb-1 bg-white  font-medium">Expected Outcome</label>
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full border px-3 py-2 bg-white  rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                required
              />
            </div>

            {/* Subject Experts Dropdown */}
            <div className="mb-6 bg-white">
              <h3 className="text-md bg-white font-medium mb-2">Select Subject Experts:</h3>
              <Select
                options={filteredExpertOptions}
                isMulti
                onChange={handleExpertChange}
                value={filteredExpertOptions.filter(option => selectedExperts.includes(option.value))}
                placeholder="Select experts..."
                className="basic-multi-select bg-white"
                classNamePrefix="select"
                filterOption={customFilter}
                closeMenuOnSelect={false}

              // <-- keep dropdown open after selection
              />
            </div>

            {/* Guides Dropdown */}
            <div className="mb-6 bg-white">
              <h3 className="text-md bg-white font-medium mb-2">Select Guides:</h3>
              <Select
                options={filteredGuideOptions}
                isMulti
                onChange={handleGuideChange}
                value={filteredGuideOptions.filter(option => selectedGuides.includes(option.value))}
                placeholder="Select guides..."
                className="basic-multi-select"
                classNamePrefix="select"
                filterOption={customGuideFilter}
                closeMenuOnSelect={false}  // <-- keep dropdown open after selection
              />
            </div>



            <div className="text-center bg-white ">
              <button
                type="submit"
                className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
              >
                Submit Project
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
export default Project_Details;




















// import React, { useEffect, useState } from 'react';
// import instance from '../../utils/axiosInstance';
// import { useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import Select from 'react-select';


// const Project_Details = () => {
//   const userselector = useSelector((state) => state.userSlice.auth.user || null);
//   const teamselector = useSelector((State) => State.teamSlice || []);
//   const teamstatusselector = useSelector((State) => State.teamStatusSlice);
//   const [projectName, setProjectName] = useState('');
//   const [clusterName, setClusterName] = useState('');
//   const [core, setCore] = useState('');
//   const [description, setDescription] = useState('');
//   const [outcome, setOutcome] = useState('');

//   const [expertsList, setExpertsList] = useState([]);
//   const [guidesList, setGuidesList] = useState([]);
//   const [selectedExperts, setSelectedExperts] = useState([]);
//   const [selectedGuides, setSelectedGuides] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [projectData, setProjectData] = useState([]);
//   const navigate = useNavigate();
//   console.log(teamselector, "teamselector from project_details.jsx");
//   console.log(teamstatusselector, "teamstatusselector from project_details.jsx");

//   // const uniqueDepartments = [...new Set(teamselector
//   //   .filter(team => Boolean(team.dept))
//   //   .map(team => team.dept))];

//   const uniqueDepartments = React.useMemo(() => {
//     return [...new Set(
//       (Array.isArray(teamselector) ? teamselector : [])
//         .filter(team => team?.dept)
//         .map(team => team.dept)
//     )];
//   }, [teamselector]);
//   // const expertOptions = expertsList.map((expert) => ({
//   //   value: expert.reg_num,
//   //   label: `${expert.name} (${expert.reg_num})`,
//   // }));

//   // Custom filter to search by name or reg_num
//   const customFilter = (option, inputValue) => {
//     const label = option.label?.toLowerCase();
//     const value = option.value?.toLowerCase();
//     const search = inputValue?.toLowerCase();
//     return label.includes(search) || value.includes(search);
//   };

//   const handleExpertChange = (selectedOptions) => {
//     const selectedRegNums = selectedOptions.map(option => option.value);
//     setSelectedExperts(selectedRegNums);
//   };

//   const guideOptions = guidesList.map((guide) => ({
//     value: guide.reg_num,
//     label: `${guide.name} (${guide.reg_num})`,
//   }));

// // Custom search filter (search by name or reg_num)
// const customGuideFilter = (option, inputValue) => {
//   const label = option.label.toLowerCase();
//   const value = option.value.toLowerCase();
//   const search = inputValue.toLowerCase();
//   return label.includes(search) || value.includes(search);
// };

//   // Handle guide selection
//   const handleGuideChange = (selectedOptions) => {
//     const selectedRegNums = selectedOptions.map(option => option.value);
//     setSelectedGuides(selectedRegNums);
//   };

//   // Filtered options to ensure no overlap
//   const filteredExpertOptions = expertsList
//     .filter(expert => !selectedGuides.includes(expert.reg_num)) // exclude selected guides
//     .map((expert) => ({
//       value: expert.reg_num,
//       label: `${expert.name} (${expert.reg_num})`,
//     }));

//   const filteredGuideOptions = guidesList
//     .filter(guide => !selectedExperts.includes(guide.reg_num)) // exclude selected experts
//     .map((guide) => ({
//       value: guide.reg_num,
//       label: `${guide.name} (${guide.reg_num})`,
//     }));


//   useEffect(() => {
//     if (!teamselector || !Array.isArray(teamselector) || !teamselector[0] || !teamstatusselector.data.projectId) {
//       console.log("Team selector not ready or missing project_id");
//       return;
//     }
//     instance
//       .get(`/student/get_project_details/${teamstatusselector.data.projectId}`)
//       .then((res) => {
//         if (res.status === 200) {
//           console.log(res.data.data.project, "get_project_details");
//           setProjectData(res.data.data.project);
//           setIsSuccess(true);
//           console.log(res, "get_project_details");
//         }
//       })
//       .catch((err) => {
//         console.error("Error fetching project details:", err);
//       });
//   }, [teamselector]); // <-- important to add teamselector as dependency

//   function Detail({ label, value, fullWidth = false }) {
//     return (
//       <div className={`flex flex-col ${fullWidth ? 'md:col-span-2' : ''}`}>
//         <span className="text-sm bg-white text-gray-500 font-medium">{label}</span>
//         <span className="text-base bg-white text-gray-800 font-semibold">{value}</span>
//       </div>
//     );
//   }
//   console.log(projectData, "projectDataProjectData");
//   useEffect(() => {
//     async function fetchExpertsAndGuides() {
//       try {
//         const [expertRes, guideRes] = await Promise.all([
//           instance.get('/admin/get_users/staff', { withCredentials: true }),
//           instance.get('/admin/get_users/staff', { withCredentials: true }),
//         ]);
//         if (expertRes.status === 200) setExpertsList(expertRes.data.data);
//         if (guideRes.status === 200) setGuidesList(guideRes.data.data);
//       } catch (err) {
//         console.error('Fetch Error:', err);
//         alert('Failed to load experts and guides.', err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchExpertsAndGuides();
//   }, []);


//   const toggleExpertSelection = (reg_num) => {
//     setSelectedExperts((prev) =>
//       prev.includes(reg_num)
//         ? prev.filter((e) => e !== reg_num)
//         : [...prev, reg_num]
//     );
//   };

//   const toggleGuideSelection = (reg_num) => {
//     setSelectedGuides((prev) =>
//       prev.includes(reg_num)
//         ? prev.filter((g) => g !== reg_num)
//         : [...prev, reg_num]
//     );
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       // Step 1: Submit project
//       const response = await instance.post(
//         `/student/addproject/${userselector.project_type}/${teamselector[0].team_id}/${userselector.reg_num}`,
//         {
//           "project_name": projectName,
//           "cluster": clusterName,
//           "description": description,
//           "outcome": outcome,
//           "hard_soft": core
//         }
//       );
//       console.log("addProject projectdetails.jsx", response);

//       const { message } = response.data;
//       const { project_id } = response.data.data;


//       if (!project_id) throw new Error('Project ID not returned.');

//       alert(message || 'Project added.');

//       // Step 2: Send guide requests
//       await instance.post(`/guide/sent_request_to_guide/${userselector.semester}`, {
//         "from_team_id": teamselector[0].team_id,
//         "project_id": project_id,
//         "project_name": projectName.trim(),
//         "to_guide_reg_num": selectedGuides,
//       });

//       // Step 3: Send expert requests
//       await instance.post(`/sub_expert/sent_request_to_expert/${userselector.semester}`, {
//         "from_team_id": teamselector[0].team_id,
//         "project_id": project_id,
//         "project_name": projectName.trim(),
//         "to_expert_reg_num": selectedExperts,
//       });

//       alert('All requests sent successfully.');

//       // Reset form
//       setProjectName('');
//       setClusterName('');
//       setCore('');
//       setDescription('');
//       setOutcome('');
//       setSelectedExperts([]);
//       setSelectedGuides([]);

//       navigate('/student');

//     } catch (error) {
//       console.error('Submit Error:', error);
//       alert("Failed to submit project. Error: " + response.error.message);


//     }


//   };
//   // Add early return if teamselector is not ready
//   if (!teamselector || !Array.isArray(teamselector)) {
//     return <div className="p-4">Loading team data...</div>;
//   }
//   if (loading) return <div className="p-4">Loading...</div>;

//   return (
//     <>
//       {isSuccess && projectData.length > 0 ? (
//         <div className="max-w-3xl mx-auto mt-10">
//           <h2 className="text-2xl flex justify-center font-semibold text-gray-800 mb-6 border-b pb-3">
//             Project Details
//           </h2>
//           <div className="bg-white shadow-lg rounded-xl p-5 border border-gray-200 max-w-5xl mx-auto">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-x-14 gap-y-4 text-gray-700 bg-white p-4 rounded-lg">
//               <Detail label="Project ID" value={projectData[0].projectId} />
//               <Detail label="Project Name" value={projectData[0].project_name} />
//               <Detail label="Project Type" value={projectData[0].project_type} />
//               <Detail label="Cluster" value={projectData[0].cluster} />
//               <Detail label="Hard/Soft" value={projectData[0].hard_soft} />
//               <Detail label="Posted Date" value={new Date(projectData[0].posted_date).toLocaleDateString()} />
//               <Detail label="Team Lead Reg.no" value={projectData[0].tl_reg_num} />
//               <Detail label="Description" value={projectData[0].description} fullWidth />
//               <Detail label="Outcome" value={projectData[0].outcome} fullWidth />
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div>
//           <h2 className="flex justify-center text-2xl font-bold mb-6">Project Submission</h2>
//           <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 bg-white rounded-lg shadow">
//             <div className="mb-4 bg-white ">
//               <label className="block mb-1 bg-white font-medium">Project Name</label>
//               <input
//                 type="text"
//                 value={projectName}
//                 onChange={(e) => setProjectName(e.target.value)}
//                 className="w-full bg-white  border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 required
//               />
//             </div>

//             <div className='flex col-span-2 gap-4 bg-white'>
//               <div className="mb-4 w-[50%] bg-white ">
//                 <label className="block mb-1  bg-white font-medium">Cluster Name</label>
//                 <select
//                   value={clusterName}
//                   onChange={(e) => { setClusterName(e.target.value); console.log(e.target.value); }}
//                   className="w-full border px-3 py-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   required
//                 >
//                   <option value="" disabled>Select cluster</option>
//                   {uniqueDepartments.map((dept, i) => (
//                     <option key={i} value={dept}>{dept}</option>
//                   ))}
//                 </select>

//               </div>

//               <div className="mb-4 bg-white w-[50%]">
//                 <label className="block mb-1  bg-white  font-medim">Project Type</label>
//                 <select
//                   value={core}
//                   onChange={(e) => setCore(e.target.value)}
//                   className="w-full bg-white  border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   required
//                 >
//                   <option value="" disabled>Select</option>
//                   <option value="hardware">Hardware</option>
//                   <option value="software">Software</option>
//                 </select>
//               </div>
//             </div>

//             <div className="mb-4 bg-white ">
//               <label className="block bg-white  mb-1 font-medium">Project Description</label>
//               <textarea
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 className="w-full  bg-white border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 rows={4}
//                 required
//               />
//             </div>

//             <div className="mb-6 bg-white ">
//               <label className="block mb-1 bg-white  font-medium">Expected Outcome</label>
//               <textarea
//                 value={outcome}
//                 onChange={(e) => setOutcome(e.target.value)}
//                 className="w-full border px-3 py-2 bg-white  rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 rows={3}
//                 required
//               />
//             </div>

//             {/* Subject Experts Dropdown */}
//             <div className="mb-6 bg-white">
//               <h3 className="text-md bg-white font-medium mb-2">Select Subject Experts:</h3>
//               <Select
//                 options={filteredExpertOptions}
//                 isMulti
//                 onChange={handleExpertChange}
//                 value={filteredExpertOptions.filter(option => selectedExperts.includes(option.value))}
//                 placeholder="Select experts..."
//                 className="basic-multi-select bg-white"
//                 classNamePrefix="select"
//                 filterOption={customFilter}
//                 closeMenuOnSelect={false}

//               // <-- keep dropdown open after selection
//               />
//             </div>

//             {/* Guides Dropdown */}
//             <div className="mb-6 bg-white">
//               <h3 className="text-md bg-white font-medium mb-2">Select Guides:</h3>
//               <Select
//                 options={filteredGuideOptions}
//                 isMulti
//                 onChange={handleGuideChange}
//                 value={filteredGuideOptions.filter(option => selectedGuides.includes(option.value))}
//                 placeholder="Select guides..."
//                 className="basic-multi-select"
//                 classNamePrefix="select"
//                 filterOption={customGuideFilter}
//                 closeMenuOnSelect={false}  // <-- keep dropdown open after selection
//               />
//             </div>



//             <div className="text-center bg-white ">
//               <button
//                 type="submit"
//                 className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
//               >
//                 Submit Project
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </>
//   );
// }
// export default Project_Details;













