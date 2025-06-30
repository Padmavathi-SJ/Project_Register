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

// router.get("/guide/fetchDeadlines/:team_id",(req,res,next) => {
//   try{
//     const{team_id} = req.params;
//     if(!team_id)return next(createError.BadRequest("team_id not found!"));
//     let sql = "select * from weekly_logs_deadlines where team_id = ?";
//     db.query(sql,[team_id],(error,result) =>{
//       if(error)return next(error);
//       res.send(result);
//     })
//   }
//   catch(error)
//   {
//     next(error);
//   }
// })

// router.get('/student/get_review_history/:team_id',(req,res,next) => {
//   try{
//     const{team_id} = req.params;
//     if(!team_id)return next(createError.BadRequest('team id not defined!'));
//     let sql = "select * from weekly_logs_verification where team_id = ?";
//     db.query(sql,[team_id],(error,result) => {
//       if(error)return next(error);
//       if(result.length === 0)return res.send('weekly logs history for your team is not found!');
//       res.send(result);
//     })
//   }
//   catch(error)
//   {
//     next(error);
//   }
// })

// router.post("/student/update_progress/:week/:reg_num/:team_id",userAuth, (req, res, next) => {
//   try {
//     const { week, reg_num, team_id } = req.params;
//     const { progress } = req.body;

//       const validPhases = [
//         "week1", "week2", "week3", "week4", "week5", "week6",
//         "week7", "week8", "week9", "week10", "week11", "week12"
//       ];

//       const safeweek = week.toLowerCase();

//       // Validation Check
//       if (!validPhases.includes(safeweek) || !reg_num || !team_id) {
//         return res.status(400).json({ message: "Invalid week name or reg_num missing" });
//       }

//       // checks if already submmited
//       let check = `SELECT ${safeweek}_progress FROM teams WHERE reg_num = ? AND team_id = ?`;
//       db.query(check, [reg_num, team_id], (error, results) => {
//         if (error) return next(error);

//         if (results[0] && results[0][`${safeweek}_progress`] !== null) {
//           return res.status(200).send("YOU HAVE ALREADY SUBMITTED YOUR PROGRESS FOR THIS WEEK!");
//         }

//       // updating progress
//       const sql = `UPDATE teams SET ${safeweek}_progress = ? WHERE reg_num = ? and team_id = ?`;

//       db.query(sql, [progress, reg_num,team_id], (err, result) => {
//         if (err) return next(err);

//         if (result.affectedRows === 0) {
//           return res.status(404).json({ message: "No record found for the provided reg_num." });
//         }
//         let sql1 = `select ${safeweek}_progress from teams where team_id = ?`;
//         db.query(sql1,[team_id],(error,result) => {
//           if(error)return next(error);

//           // checks whether all members updated progress -> safeweek

//           const allMembersUpdated = result.every((member) => member[`${safeweek}_progress`] !== null); // every -> checks whether every element satisfies the given condition, optimised instead of forEach // . -> [] alternative for . notation
//           if(allMembersUpdated)
//           {
//             // inserts into weekly_logs_verification
//             let weekNumber = safeweek.replace(/\D/g, ''); 
//             let insertSql = "INSERT INTO weekly_logs_verification (team_id, week_number) VALUES (?, ?)";
//             db.query(insertSql,[team_id,weekNumber],(error,inserted) => {
//               if(error)return next(error);
//               if(inserted.affectedRows === 0)return next(createError.BadRequest('An error occured while inserting!'));

//               let getGuide = "select guide_reg_num from teams where team_id = ?";
//               db.query(getGuide,[team_id],(error,result) => {
//               if(error)return next(error);
//               if(result.length === 0)return next(createError.NotFound("guide reg num not found!"));
//               let guide_reg_num = result[0].guide_reg_num;
//               let getGuideEmailStudentEmail = "SELECT emailId, role FROM users WHERE reg_num IN (?, ?) AND role IN ('staff', 'student');";
//                 db.query(getGuideEmailStudentEmail,[guide_reg_num,reg_num],(error,result) => {
//                   if(error)return next(error);
//                   if(result.length === 0)return next(createError.NotFound("guide email not found!"));
//                   let guideEmail = null;
//                   let studentEmail = null;

//                   result.forEach(user => {
//                     if (user.role === 'staff') guideEmail = user.emailId;
//                     else if (user.role === 'student') studentEmail = user.emailId;
//                   });

//                   if (!guideEmail || !studentEmail) {
//                     return next(createError.InternalServerError("Could not resolve guide or student email."));
//                   }

//                   const transporter = nodemailer.createTransport({
//                     service: "gmail",
//                     auth: {
//                       user: process.env.EMAIL_USER, 
//                       pass: process.env.EMAIL_PASS,
//                     },
//                   });

//                     const mailOptions = {
//                       from: `"No Reply" <${process.env.EMAIL_USER}>`,
//                       to: guideEmail,
//                       subject: `Progress update for ${safeweek} by Team ${team_id}`,
//                       replyTo: studentEmail,  // Optional: replies go to student
//                       text: `Dear Guide,

//                       Team ${team_id} has completed their progress update for ${safeweek}.
//                       This submission was triggered by the student with registration number: ${reg_num}.

//                       Please check the Project Register for more details.

//                       Best regards,
//                       Project Management System`
//                   };
//                     transporter.sendMail(mailOptions, (error, info) => {
//                     if (error) {
//                       console.error("Email Error:", error);
//                       return res.status(500).send("Progress updated, but failed to send email.");
//                     } else {
//                       console.log("Email sent:", info.response);
//                       return res.send("Progress updated and email sent successfully!");
//                     }
//                   }); 
                
//                 })
//               })

//             })

//           }
//           else {
//             return res.send("Progress updated successfully for this member!");
//           }
//         })
//       });

//       });
//     } catch (error) {
//       next(error);
//     }
//   });

// router.post('/student/challenge_review/request/:team_id/:project_id/:reg_num/:review_id', (req, res, next) => {
//   try {
//     const { team_id, project_id, reg_num, review_id } = req.params;
//     if (!team_id || !reg_num || !review_id) return next(createError.BadRequest('team_id or reg_num or review_id is not defined!'));

//     // Step 1: Check if student is team leader
//     let sql0 = "SELECT is_leader FROM teams WHERE team_id = ? AND reg_num = ?";
//     db.query(sql0, [team_id, reg_num], (error0, result0) => {
//       if (error0) return next(error0);
//       if (result0.length === 0) return next(createError.NotFound('student leader status not found!'));
//       if (!result0[0].is_leader) return res.send('YOU CANT REQUEST FOR CHALLENGE REVIEW, ONLY YOUR TEAM LEADER CAN APPLY FOR IT');

//       // Step 2: Validate date (within 7 days)
//       let sql1 = "SELECT * FROM scheduled_reviews WHERE review_id = ?";
//       db.query(sql1, [review_id], (error1, result1) => {
//         if (error1) return next(error1);
//         if (result1.length === 0) return next(createError.NotFound('review_date not found'));

//         const review_date = new Date(result1[0].review_date);
//         const today = new Date();
//         review_date.setHours(0, 0, 0, 0);
//         today.setHours(0, 0, 0, 0);
//         const diffInDays = (today - review_date) / (1000 * 60 * 60 * 24);

//         if (diffInDays > 7) {
//           return next(createError.BadRequest('Challenge review time limit exceeded!'));
//         }

//         // Step 3: Check if marks were updated
//         let sql2 = 'SELECT * FROM review_marks_team WHERE team_id = ? AND review_title = ? AND review_date = ?';
//         db.query(sql2, [team_id, result1[0].review_title, result1[0].review_date], (error2, result2) => {
//           if (error2) return next(error2);
//           if (result2.length === 0) return next(createError.BadRequest('Since guide or expert have not updated marks for your team, you cannot request for challenge review'));

//           // Step 4: Insert into challenge_review_requests
//           let sql3 = "INSERT INTO challenge_review_requests (team_id, project_id, team_lead, status) VALUES (?, ?, ?, ?)";
//           db.query(sql3, [team_id, project_id, reg_num, 'pending'], (error3, result3) => {
//             if (error3) return next(error3);
//             if (result3.affectedRows === 0) return next(createError.BadRequest('error occurred while inserting for challenge review!'));
//             res.send(`Optional review request sent to admin`);
//           });
//         });
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // show already submitted progress -> to update => 1st
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

// // edit already updated progress => 2nd
// // week will be from 1st api's response

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