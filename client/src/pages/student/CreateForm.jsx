// // // import React from 'react';
// // // import {useDispatch} from "react-redux";
// // // import { addUser } from '../../store/userSlice';

// // // function CreateForm({ createForm, handleCreateChange, handleCreateSubmit, departments, setIsCreateOpen }) {

// // //   return (
// // //     <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 px-4">
// // //       <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
// // //         <h2 className="text-xl font-semibold mb-4 bg-white">New Project Invitation</h2>
// // //         <form onSubmit={handleCreateSubmit} className="space-y-4 bg-white">
// // //           <div className="bg-white">
// // //             <label className="block text-sm font-medium text-gray-700 bg-white">Your Name</label>
// // //             <input
// // //               name="name"
// // //               value={createForm.name}
// // //               onChange={handleCreateChange}
// // //               type="text"
// // //               required
// // //               className="mt-1 bg-white block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-indigo-300"
// // //             />
// // //           </div>
// // //           <div className="bg-white">
// // //             <label className="block text-sm font-medium text-gray-700 bg-white">Your Email</label>
// // //             <input
// // //               name="email"
// // //               value={createForm.email}
// // //               onChange={handleCreateChange}
// // //               type="email"
// // //               required
// // //               className="mt-1 bg-white block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-indigo-300"
// // //             />
// // //           </div>
// // //           <div className="bg-white">
// // //             <label className="block text-sm font-medium text-gray-700 bg-white">Register Number</label>
// // //             <input
// // //               name="registerNumber"
// // //               value={createForm.registerNumber}
// // //               onChange={handleCreateChange}
// // //               type="text"
// // //               required
// // //               className="mt-1 bg-white block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-indigo-300"
// // //             />
// // //           </div>
// // //           <div className="bg-white">
// // //             <label className="block text-sm font-medium text-gray-700 bg-white">Department</label>
// // //             <select
// // //               name="department"
// // //               value={createForm.department}
// // //               required
// // //               className="mt-1 bg-white block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-indigo-300"
// // //               onChange={handleCreateChange}
// // //             >
// // //               <option value="">Select Department</option>
// // //               {departments.map((dept) => (
// // //                 <option key={dept} value={dept}>{dept}</option>
// // //               ))}
// // //             </select>
// // //           </div>
// // //           <div className="mt-6 flex justify-between bg-white space-x-2">
// // //             <button
// // //               type="button"
// // //               onClick={() => setIsCreateOpen(false)}
// // //               className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
// // //             >
// // //               Cancel
// // //             </button>
// // //             <button
// // //               type="submit"
// // //               className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-700 transition"
// // //             >
// // //               Create
// // //             </button>
// // //           </div>
// // //         </form>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // export default CreateForm;
// // //  const [expertsList] = useState([
// // //     'Expert Alpha', 'Expert Beta', 'Expert Gamma', 'Expert Delta', 'Expert Epsilon'
// // //   ]);
// // //   const [guidesList] = useState([
// // //     'Guide One', 'Guide Two', 'Guide Three', 'Guide Four', 'Guide Five'
// // //   ]);
// // {/* <div className="mb-4">
// //               <h3 className="text-lg font-semibold mb-2">Select at least 3 Experts:</h3>
// //               <div className="flex flex-wrap gap-3">
// //                 {expertsList.map((expert) => (
// //                   <button
// //                     key={expert}
// //                     onClick={() => toggleExpertSelection(expert)}
// //                     className={`px-3 py-1 rounded-full border ${
// //                       selectedExperts.includes(expert)
// //                         ? 'bg-purple-500 text-white border-purple-600'
// //                         : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-100'
// //                     }`}
// //                   >
// //                     {expert}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="mb-6">
// //               <h3 className="text-lg font-semibold mb-2">Select at least 3 Guides:</h3>
// //               <div className="flex flex-wrap gap-3">
// //                 {guidesList.map((guide) => (
// //                   <button
// //                     key={guide}
// //                     onClick={() => toggleGuideSelection(guide)}
// //                     className={`px-3 py-1 rounded-full border ${
// //                       selectedGuides.includes(guide)
// //                         ? 'bg-green-600 text-white border-green-600'
// //                         : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-100'
// //                     }`}
// //                   >
// //                     {guide}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div> */}
// // //  const toggleExpertSelection = (expertName) => {
// // //     setSelectedExperts((prev) =>
// // //       prev.includes(expertName) ? prev.filter((e) => e !== expertName) : [...prev, expertName]
// // //     );
// // //   };

// // //   const toggleGuideSelection = (guideName) => {
// // //     setSelectedGuides((prev) =>
// // //       prev.includes(guideName) ? prev.filter((g) => g !== guideName) : [...prev, guideName]
// // //     );
// // // //   };
// // //   const [selectedExperts, setSelectedExperts] = useState([]);
// // //   const [selectedGuides, setSelectedGuides] = useState([]);


// //   //  const [userStatus, setUserStatus] = useState('loading');

// //   // function checkUserStatus() {
// //   //   try {
// //   //     if (!teamStatus.teamConformationStatus) {
// //   //       setUserStatus('no_team');
// //   //     } else {
// //   //       const member = teamStatus?.teamMembers?.[0];
// //   //       if (member?.project_id) {
// //   //         setUserStatus('has_project');
// //   //       } else {
// //   //         setUserStatus('no_project');
// //   //       }
// //   //     }
// //   //   } catch (e) {
// //   //     console.error('Invalid teamStatus in store', e);
// //   //     setUserStatus('no_team');
// //   //   }
// //   // }

// //   //  if (userStatus === 'no_team') {
// //   //   return (
// //   //     <div className="flex justify-center items-center mt-20">
// //   //       <h1 className="text-2xl font-bold text-red-500">First Form a Team!!</h1>
// //   //     </div>
// //   //   );
// //   // }

// //  import React, { useState } from "react";
// // import axios from "axios";

// // function GuideRequestActions({ teamId, myId }) {
// //   const [message, setMessage] = useState("");
// //   const [error, setError] = useState("");

// //   // API function inside the component file
// //   async function updateGuideRequestStatus(status, teamId, myId) {
// //     try {
// //       if (status !== "accept" && status !== "reject") {
// //         throw new Error("Invalid status: must be 'accept' or 'reject'");
// //       }
// //       if (!teamId || !myId) {
// //         throw new Error("teamId and myId are required");
// //       }

// //       const url = `/guide/accept_reject/${status}/${teamId}/${myId}`;
// //       const token = localStorage.getItem("token"); // adjust based on your auth system

// //       const response = await axios.patch(
// //         url,
// //         {}, // no request body
// //         {
// //           headers: {
// //             Authorization: `Bearer ${token}`,
// //           },
// //         }
// //       );

// //       return response.data; // success message from backend
// //     } catch (error) {
// //       if (error.response) {
// //         throw new Error(error.response.data || error.response.statusText);
// //       } else {
// //         throw error;
// //       }
// //     }
// //   }

// //   const handleStatusUpdate = async (status) => {
// //     try {
// //       setError("");
// //       setMessage("Processing...");
// //       const result = await updateGuideRequestStatus(status, teamId, myId);
// //       setMessage(result);
// //     } catch (err) {
// //       setError(err.message);
// //       setMessage("");
// //     }
// //   };

// //   return (
// //     <div>
// //       <button onClick={() => handleStatusUpdate("accept")}>Accept</button>
// //       <button onClick={() => handleStatusUpdate("reject")}>Reject</button>

// //       {message && <p style={{ color: "green" }}>{message}</p>}
// //       {error && <p style={{ color: "red" }}>{error}</p>}
// //     </div>
// //   );
// // }

// //  Status: { invitation.status === ('accept' ||'reject')? invitation.status :'pending' }

// // export default GuideRequestActions;

// import React, { useState, useEffect } from "react";
// import { useSelector } from "react-redux";
// import ProjectFileUpload from "./ProjectFileUpload";
// import instance from "../../utils/axiosInstance";
// import { Link } from "react-router-dom";

// const Progress_Update = () => {
//   const { reg_num } = useSelector((state) => state.userSlice);
//   const teamSelector = useSelector((state) => state.teamSlice);

//   const [description, setDescription] = useState("");
//   const [canUpdate, setCanUpdate] = useState(false);
//   const [canEdit, setCanEdit] = useState(false);
//   const [currentWeek, setCurrentWeek] = useState("");
//   const [nextWeekToUpdate, setNextWeekToUpdate] = useState("");
//   const [deadlines, setDeadlines] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [currentWeekIndex, setCurrentWeekIndex] = useState(null);
//   const [reviewHistory, setReviewHistory] = useState([]);
//   const [previousWeekStatus, setPreviousWeekStatus] = useState(null);

//   const determineWeekFromDate = async (deadlineData) => {
//     const today = new Date();
//     const todayStr = today.toISOString().split("T")[0];
//     let i = 1;

//     for (; i <= 12; i++) {
//       const weekKey = `week${i}`;
//       const deadlineStr = deadlineData[weekKey];
//       if (!deadlineStr) continue;

//       if (deadlineStr >= todayStr) {
//         setCurrentWeek(`Week ${i}`);
//         setNextWeekToUpdate(weekKey);
//         setCurrentWeekIndex(i);
//         break;
//       }
//     }

//     if (i > 12) {
//       setCanUpdate(false);
//     }
//   };

//   const fetchDeadlinesAndDetermineWeek = async () => {
//     try {
//       const teamId = teamSelector[0]?.team_id;
//       if (!teamId) return;
//       const response = await instance.get(`/guide/fetchDeadlines/${teamId}`);
//       const deadlineData = response.data[0];
//       setDeadlines(deadlineData);
//       await determineWeekFromDate(deadlineData);
//     } catch (error) {
//       console.error("Failed to fetch deadlines:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchReviewHistory = async () => {
//     try {
//       const teamId = teamSelector[0].team_id;
//       const response = await instance.get(`/student/get_review_history/${teamId}`);

//       if (typeof response.data !== "string") {
//         const data = response.data;
//         setReviewHistory(data);

//         const currentWeekNum = currentWeekIndex;
//         const previousWeekKey = currentWeekNum > 1 ? currentWeekNum - 1 : null;

//         const previousReview = data.find((entry) => entry.week_number === previousWeekKey);
//         const currentReview = data.find((entry) => entry.week_number === currentWeekNum);

//         if (previousReview?.status) setPreviousWeekStatus(previousReview.status);

//         if (currentReview) {
//           if (currentReview.status === "reject") {
//             setCanEdit(true);
//             setCanUpdate(false);
//             setDescription(currentReview.progress);
//           } else {
//             setCanEdit(false);
//             setCanUpdate(false);
//           }
//         } else {
//           if (currentWeekNum === 1 || previousReview?.status === "accept") {
//             setCanUpdate(true);
//             setCanEdit(false);
//           } else {
//             setCanUpdate(false);
//             setCanEdit(false);
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Failed to fetch review history:", error);
//     }
//   };

//   const handleSubmit = async () => {
//     const teamId = teamSelector[0].team_id;
//     try {
//       await instance.post(
//         `/student/update_progress/${nextWeekToUpdate}/${reg_num}/${teamId}`,
//         { progress: description }
//       );
//       alert("Progress submitted successfully!");
//       setCanUpdate(false);
//       setCanEdit(false);
//       setDescription("");
//       fetchReviewHistory(); // Refresh status
//     } catch (error) {
//       alert("Failed to submit progress.");
//       console.error(error);
//     }
//   };

//   const handleEdit = async () => {
//     const teamId = teamSelector[0].team_id;
//     try {
//       await instance.patch(
//         `/student/edit_submitted_progress/${teamId}/${nextWeekToUpdate}_progress/${reg_num}`,
//         { newProgress: description }
//       );
//       alert("Progress updated successfully!");
//       setCanEdit(false);
//       setCanUpdate(false);
//       setDescription("");
//       fetchReviewHistory(); // Refresh status
//     } catch (error) {
//       alert("Failed to edit progress.");
//       console.error(error);
//     }
//   };

//   useEffect(() => {
//     fetchDeadlinesAndDetermineWeek();
//   }, []);

//   useEffect(() => {
//     if (currentWeekIndex !== null) {
//       fetchReviewHistory();
//     }
//   }, [currentWeekIndex]);

//   if (loading) {
//     return <div className="text-center mt-10 text-blue-600 font-semibold">Fetching your progress status...</div>;
//   }

//   return (
//     <div className="p-6 max-w-3xl mx-auto font-sans">
//       <h1 className="text-4xl font-semibold text-center text-gray-900 mb-8">Progress Update</h1>
//       <Link to="/student/week" className="text-blue-600 hover:underline font-medium">
//         View Weekly Logs History
//       </Link>

//       {(!canUpdate && !canEdit && !loading) && (
//         <div className="text-center mt-6 text-green-600 font-semibold">
//           You have already submitted your progress for this week.
//         </div>
//       )}

//       {(canUpdate || canEdit) ? (
//         <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg mt-6">
//           <h2 className="text-2xl font-semibold text-gray-800 mb-3">{currentWeek}</h2>
//           <p className="text-sm text-gray-500 mb-2">
//             Deadline:{" "}
//             <span className="font-medium text-gray-700">
//               {deadlines[nextWeekToUpdate] || "N/A"}
//             </span>
//           </p>
//           {previousWeekStatus && currentWeekIndex !== 1 && (
//             <p className="text-sm text-gray-600 mb-4">
//               Previous Week Status:{" "}
//               <span className="font-semibold text-gray-800">
//                 {previousWeekStatus}
//               </span>
//             </p>
//           )}
//           <textarea
//             className="w-full p-4 border border-gray-300 rounded-xl text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             rows={6}
//             placeholder="Describe your weekly progress here..."
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />
//           <div className="mt-6 text-right">
//             {canEdit ? (
//               <button
//                 onClick={handleEdit}
//                 className="bg-yellow-500 text-white px-6 py-2 rounded-xl hover:bg-yellow-600 transition font-semibold shadow-lg"
//               >
//                 Update Rejected Progress
//               </button>
//             ) : (
//               <button
//                 onClick={handleSubmit}
//                 className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-blue-600 transition font-semibold shadow-lg"
//               >
//                 Submit Progress
//               </button>
//             )}
//           </div>
//         </div>
//       ) : (
//         <div className="text-center mt-10 text-red-600 font-semibold">
//           Cannot update progress now. Either all weeks are completed, or previous week's review not accepted.
//         </div>
//       )}
//     </div>
//   );
// };

// export default Progress_Update;



// import React, { useState, useEffect } from "react";
// import { useSelector } from "react-redux";
// import ProjectFileUpload from "./ProjectFileUpload";
// import instance from "../../utils/axiosInstance";
// import { Link } from "react-router-dom";

// const Progress_Update = () => {
//   const { reg_num } = useSelector((state) => state.userSlice);
//   const teamSelector = useSelector((state) => state.teamSlice);

//   const [description, setDescription] = useState("");
//   const [canUpdate, setCanUpdate] = useState(false);
//   const [canEdit, setCanEdit] = useState(false);
//   const [currentWeek, setCurrentWeek] = useState("");
//   const [nextWeekToUpdate, setNextWeekToUpdate] = useState("");
//   const [deadlines, setDeadlines] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [currentWeekIndex, setCurrentWeekIndex] = useState(null);
//   const [reviewHistory, setReviewHistory] = useState([]);
//   const [previousWeekStatus, setPreviousWeekStatus] = useState(null);

//   const determineWeekFromDate = async (deadlineData) => {
//     const today = new Date();
//     const todayStr = today.toISOString().split("T")[0];
//     let i = 1;

//     for (; i <= 12; i++) {
//       const weekKey = `week${i}`;
//       const deadlineStr = deadlineData[weekKey];
//       if (!deadlineStr) continue;

//       if (deadlineStr >= todayStr) {
//         setCurrentWeek(`Week ${i}`);
//         setNextWeekToUpdate(weekKey);
//         setCurrentWeekIndex(i);
//         break;
//       }
//     }

//     if (i > 12) {
//       setCanUpdate(false);
//     }
//   };

//   const fetchDeadlinesAndDetermineWeek = async () => {
//     try {
//       const teamId = teamSelector[0]?.team_id;
//       if (!teamId) return;
//       const response = await instance.get(`/guide/fetchDeadlines/${teamId}`);
//       const deadlineData = response.data[0];
//       setDeadlines(deadlineData);
//       await determineWeekFromDate(deadlineData);
//     } catch (error) {
//       console.error("Failed to fetch deadlines:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchReviewHistory = async () => {
//     try {
//       const teamId = teamSelector[0].team_id;
//       const response = await instance.get(`/student/get_review_history/${teamId}`);

//       if (typeof response.data !== "string") {
//         const data = response.data;
//         setReviewHistory(data);

//         const currentWeekNum = currentWeekIndex;
//         const previousWeekKey = currentWeekNum > 1 ? currentWeekNum - 1 : null;

//         const previousReview = data.find((entry) => entry.week_number === previousWeekKey);
//         const currentReview = data.find((entry) => entry.week_number === currentWeekNum);

//         if (previousReview?.status) setPreviousWeekStatus(previousReview.status);

//         if (currentReview) {
//           if (currentReview.status === "reject") {
//             setCanEdit(true);
//             setCanUpdate(false);
//             setDescription(currentReview.progress);
//           } else {
//             setCanEdit(false);
//             setCanUpdate(false);
//           }
//         } else {
//           if (currentWeekNum === 1 || previousReview?.status === "accept") {
//             setCanUpdate(true);
//             setCanEdit(false);
//           } else {
//             setCanUpdate(false);
//             setCanEdit(false);
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Failed to fetch review history:", error);
//     }
//   };

//   const handleSubmit = async () => {
//     const teamId = teamSelector[0].team_id;
//     try {
//       await instance.post(
//         `/student/update_progress/${nextWeekToUpdate}/${reg_num}/${teamId}`,
//         { progress: description }
//       );
//       alert("Progress submitted successfully!");
//       setCanUpdate(false);
//       setCanEdit(false);
//       setDescription("");
//       fetchReviewHistory(); // Refresh status
//     } catch (error) {
//       alert("Failed to submit progress.");
//       console.error(error);
//     }
//   };

//   const handleEdit = async () => {
//     const teamId = teamSelector[0].team_id;
//     try {
//       await instance.patch(
//         `/student/edit_submitted_progress/${teamId}/${nextWeekToUpdate}_progress/${reg_num}`,
//         { newProgress: description }
//       );
//       alert("Progress updated successfully!");
//       setCanEdit(false);
//       setCanUpdate(false);
//       setDescription("");
//       fetchReviewHistory(); // Refresh status
//     } catch (error) {
//       alert("Failed to edit progress.");
//       console.error(error);
//     }
//   };

//   useEffect(() => {
//     fetchDeadlinesAndDetermineWeek();
//   }, []);

//   useEffect(() => {
//     if (currentWeekIndex !== null) {
//       fetchReviewHistory();
//     }
//   }, [currentWeekIndex]);

//   if (loading) {
//     return <div className="text-center mt-10 text-blue-600 font-semibold">Fetching your progress status...</div>;
//   }

//   return (
//     <div className="p-6 max-w-3xl mx-auto font-sans">
//       <h1 className="text-4xl font-semibold text-center text-gray-900 mb-8">Progress Update</h1>
//       <Link to="/student/week" className="text-blue-600 hover:underline font-medium">
//         View Weekly Logs History
//       </Link>

//       {(!canUpdate && !canEdit && !loading) && (
//         <div className="text-center mt-6 text-green-600 font-semibold">
//           You have already submitted your progress for this week.
//         </div>
//       )}

//       {(canUpdate || canEdit) ? (
//         <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg mt-6">
//           <h2 className="text-2xl font-semibold text-gray-800 mb-3">{currentWeek}</h2>
//           <p className="text-sm text-gray-500 mb-2">
//             Deadline:{" "}
//             <span className="font-medium text-gray-700">
//               {deadlines[nextWeekToUpdate] || "N/A"}
//             </span>
//           </p>
//           {previousWeekStatus && currentWeekIndex !== 1 && (
//             <p className="text-sm text-gray-600 mb-4">
//               Previous Week Status:{" "}
//               <span className="font-semibold text-gray-800">
//                 {previousWeekStatus}
//               </span>
//             </p>
//           )}
//           <textarea
//             className="w-full p-4 border border-gray-300 rounded-xl text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             rows={6}
//             placeholder="Describe your weekly progress here..."
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />
//           <div className="mt-6 text-right">
//             {canEdit ? (
//               <button
//                 onClick={handleEdit}
//                 className="bg-yellow-500 text-white px-6 py-2 rounded-xl hover:bg-yellow-600 transition font-semibold shadow-lg"
//               >
//                 Update Rejected Progress
//               </button>
//             ) : (
//               <button
//                 onClick={handleSubmit}
//                 className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-blue-600 transition font-semibold shadow-lg"
//               >
//                 Submit Progress
//               </button>
//             )}
//           </div>
//         </div>
//       ) : (
//         <div className="text-center mt-10 text-red-600 font-semibold">
//           Cannot update progress now. Either all weeks are completed, or previous week's review not accepted.
//         </div>
//       )}
//     </div>
//   );
// };

// export default Progress_Update;

// router.get('/student/view_submitted_progress/:team_id/:reg_num/:week',(req,res,next) => {
//   try{
//     const{reg_num,week,team_id} = req.params;
//     if(!team_id || !reg_num || !week)return next(createError.BadRequest('some parameters are missing!'));
//     let sql = `SELECT
//                 t.team_id,
//                 t.reg_num,
//                 CASE
//                   WHEN t.week12_progress IS NOT NULL AND (w12.is_verified IS NULL OR w12.is_verified = 0) THEN 'week12_progress'
//                   WHEN t.week11_progress IS NOT NULL AND (w11.is_verified IS NULL OR w11.is_verified = 0) THEN 'week11_progress'
//                   WHEN t.week10_progress IS NOT NULL AND (w10.is_verified IS NULL OR w10.is_verified = 0) THEN 'week10_progress'
//                   WHEN t.week9_progress IS NOT NULL AND (w9.is_verified IS NULL OR w9.is_verified = 0) THEN 'week9_progress'
//                   WHEN t.week8_progress IS NOT NULL AND (w8.is_verified IS NULL OR w8.is_verified = 0) THEN 'week8_progress'
//                   WHEN t.week7_progress IS NOT NULL AND (w7.is_verified IS NULL OR w7.is_verified = 0) THEN 'week7_progress'
//                   WHEN t.week6_progress IS NOT NULL AND (w6.is_verified IS NULL OR w6.is_verified = 0) THEN 'week6_progress'
//                   WHEN t.week5_progress IS NOT NULL AND (w5.is_verified IS NULL OR w5.is_verified = 0) THEN 'week5_progress'
//                   WHEN t.week4_progress IS NOT NULL AND (w4.is_verified IS NULL OR w4.is_verified = 0) THEN 'week4_progress'
//                   WHEN t.week3_progress IS NOT NULL AND (w3.is_verified IS NULL OR w3.is_verified = 0) THEN 'week3_progress'
//                   WHEN t.week2_progress IS NOT NULL AND (w2.is_verified IS NULL OR w2.is_verified = 0) THEN 'week2_progress'
//                   WHEN t.week1_progress IS NOT NULL AND (w1.is_verified IS NULL OR w1.is_verified = 0) THEN 'week1_progress'
//                   ELSE 'No unverified progress'
//                 END AS last_unverified_week
//               FROM teams t
//               LEFT JOIN weekly_logs_verification w1 ON t.team_id = w1.team_id AND w1.week_number = 1
//               LEFT JOIN weekly_logs_verification w2 ON t.team_id = w2.team_id AND w2.week_number = 2
//               LEFT JOIN weekly_logs_verification w3 ON t.team_id = w3.team_id AND w3.week_number = 3
//               LEFT JOIN weekly_logs_verification w4 ON t.team_id = w4.team_id AND w4.week_number = 4
//               LEFT JOIN weekly_logs_verification w5 ON t.team_id = w5.team_id AND w5.week_number = 5
//               LEFT JOIN weekly_logs_verification w6 ON t.team_id = w6.team_id AND w6.week_number = 6
//               LEFT JOIN weekly_logs_verification w7 ON t.team_id = w7.team_id AND w7.week_number = 7
//               LEFT JOIN weekly_logs_verification w8 ON t.team_id = w8.team_id AND w8.week_number = 8
//               LEFT JOIN weekly_logs_verification w9 ON t.team_id = w9.team_id AND w9.week_number = 9
//               LEFT JOIN weekly_logs_verification w10 ON t.team_id = w10.team_id AND w10.week_number = 10
//               LEFT JOIN weekly_logs_verification w11 ON t.team_id = w11.team_id AND w11.week_number = 11
//               LEFT JOIN weekly_logs_verification w12 ON t.team_id = w12.team_id AND w12.week_number = 12
//               WHERE t.reg_num = '?';`;
//     db.query(sql,[reg_num],(error,result) => { // week name
//       if(error)return next(error);
//       if(result.length === 0)return next(result[0].last_unverified_week);
//       const progressColumn = result[0].last_unverified_week;

//       if (progressColumn === 'No unverified progress') {
//         return res.send({ message: 'All weeks verified or no progress submitted.' });
//       }

//       let sql1 = `SELECT ${progressColumn} AS progress FROM teams WHERE team_id = ?`;
//       db.query(sql,[team_id],(error1,result1) => { // week progress
//         if(error1)return next(error1);
//         if(result.length === 0)return next(createError.NotFound('weekly progress not found!'));
//         res.status(200).json({"message":"progress fetches successfully","progress":result1[0].progress,"week_name":progressColumn});
//       })

//     })
//   }
//   catch(error)
//   {
//     next(error);
//   }
// })

// router.patch('/student/edit_submitted_progress/:team_id/:week/:reg_num',(req,res,next) => {
//   try{
//     const{team_id,week,reg_num} = req.params;
//     const{newProgress} = req.body;
//     if(!team_id || !week || !reg_num || !newProgress)
//     {
//       return next(createError.BadRequest('parameters not found!'));
//     }
//     const allowedWeeks = ["week1_progress", "week2_progress", "week3_progress", "week4_progress", "week5_progress", "week6_progress", "week7_progress", "week8_progress", "week9_progress", "week10_progress", "week11_progress", "week12_progress"];

//     if (!allowedWeeks.includes(week)) {
//       return next(createError.BadRequest("Invalid week field!"));
//     }

//     let sql = `update teams set ${week} = ? where reg_num = ? and team_id = ?`;
//     db.query(sql,[newProgress,reg_num,team_id],(error,result) => {
//       if(error)return next(error);
//       if(result.affectedRows === 0)return next(createError.BadRequest('failed to update!'));
//       res.send('progress updated successfully!');
//     })
//   }
//   catch(error)
//   {
//     next(error);
//   }
// })