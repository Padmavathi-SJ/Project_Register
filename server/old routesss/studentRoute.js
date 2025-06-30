const express = require("express");
const { route } = require("./teacherRoute");
const createError = require("http-errors");
// const verifyAccessToken = require("../utils/verifyAccessToken");
const router = express.Router();
const generateWeeklyDeadlines = require("../utils/generateWeeklyDeadlines");
const db = require('../config/db');
const userAuth = require("../middleware/userAuth")
const checkTimeline = require("../middleware/timeLine");
const nodemailer = require("nodemailer");
require("dotenv").config();
const upload = require("../utils/fileUpload");
// Update project type route
// router.put("/profile/update-project-type", userAuth, (req, res, next) => {
//   try {
//     const { project_type, userId } = req.body;
//     if (!userId) return next(createError.BadRequest("User ID not found!"));
//     if (!project_type) return next(createError.BadRequest("Project type is required!"));

//     // First update the project type
//     const updateSql = "UPDATE users SET project_type = ? WHERE id = ?";
//     db.query(updateSql, [project_type, userId], (updateError) => {
//       if (updateError) return next(updateError);

//       // Then fetch the updated user details
//       const selectSql = "SELECT * FROM users WHERE id = ?";
//       db.query(selectSql, [userId], (selectError, result) => {
//         if (selectError) return next(selectError);

//         if (result.length === 0) {
//           return next(createError.NotFound("User not found after update"));
//         }

//         res.status(200).json({
//           success: true,
//           message: "Project type updated successfully",
//           data: result[0]
//         });
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// });
// common to all route -> for jwt auth
router.get("/profile/view", userAuth, (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log("User ID from auth middleware:", userId);
    if (!userId) next(createError.BadRequest("userId not found!"))
    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [userId], (error, result) => {
      if (error) return next(error);

      if (result.length === 0) {
        return next(createError.NotFound("User profile not found"));
      }

      res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: result[0] // Send the user profile data directly
      });
    });
  } catch (error) {
    next(error);
  }
});

router.get("/student/guide_status/:team_id", (req, res, next) => {
  try {
    const { team_id } = req.params;
    // Validate team_id
    if (!team_id) {
      return next(createError.BadRequest('Valid team_id is required!'));
    }

    console.log(`Fetching expert status for team: ${team_id}`);

    const sql = `
      SELECT to_guide_reg_num, status, reason 
      FROM guide_requests 
      WHERE from_team_id = ? `;
    db.query(sql, [team_id], (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return next(createError.InternalServerError('Database query failed'));
      }

      if (results.length === 0) {
        return res.status(200).json({
          message: 'No pending requests found',
          data: []
        });
      }

      return res.status(200).json({
        message: 'Requests retrieved successfully',
        data: results
      });
    });
  } catch (error) {
    next(error.message);
  }
})

router.get("/student/expert_status/:team_id", userAuth, (req, res, next) => {
  try {
    const { team_id } = req.params;

    // Validate team_id
    if (!team_id) {
      return next(createError.BadRequest('Valid team_id is required!'));
    }

    console.log(`Fetching expert status for team: ${team_id}`);

    const sql = `
      SELECT to_expert_reg_num, status, reason 
      FROM sub_expert_requests 
      WHERE from_team_id = ? `;

    db.query(sql, [team_id], (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return next(createError.InternalServerError('Database query failed'));
      }

      if (results.length === 0) {
        return res.status(200).json({
          message: 'No pending requests found',
          data: []
        });
      }

      return res.status(200).json({
        message: 'Requests retrieved successfully',
        data: results
      });
    });

  } catch (error) {
    console.error('Unexpected error in expert_status route:', error);
    next(createError.InternalServerError('An unexpected error occurred'));
  }
});


// adds the connection request in the db -> invite button
// router.post("/student/join_request", userAuth, (req, res, next) => {
//   try {
//     let { from_reg_num, to_reg_num } = req.body;

//     if (!to_reg_num.trim() || from_reg_num === to_reg_num) {
//       return next(createError.BadRequest(`reg_number are not defined!`));
//     }

//     let query1 = "select name, emailId, reg_num, dept from users where reg_num = ?";
//     db.query(query1, [to_reg_num], (error, result) => {
//       if (error) return next(error);
//       if (result.length === 0) return next(createError.NotFound("User not Found!"));
//       let { name, emailId, reg_num, dept } = result[0];
//       if (!name.trim() || !emailId.trim() || !reg_num.trim() || !dept.trim()) return next(createError.BadRequest("User details not found!"));
//       // checks for already a connection request exists or not for me and him
//       let sql = "SELECT * FROM team_requests WHERE (from_reg_num = ? AND to_reg_num = ?) or (to_reg_num = ? and from_reg_num = ?)";
//       db.query(sql, [from_reg_num, to_reg_num, from_reg_num, to_reg_num], (error, result) => {
//         if (error) return next(error);

//         if (result.length > 0) {
//           return res.send(`Connection request already exists with status: ${result[0].status}`);
//         }

//         // checks whether receiver is in another team or team_leader  
//         let checkConnection = "select * from team_requests where (to_reg_num = ? or from_reg_num = ?) and status = 'accept'";
//         db.query(checkConnection, [to_reg_num, to_reg_num], (error, result) => {
//           if (error) return next(error);
//           if (result.length > 0) return next(createError.BadRequest("He is already a member of some other team!"));

//           // checks sender is in another team or team_leader

//           let checkConnectionSender = "select * from team_requests where to_reg_num = ? and status = 'accept'";
//           db.query(checkConnectionSender, [from_reg_num], (error, result) => {
//             if (error) return next(error);
//             if (result.length > 0) return next(createError.BadRequest("sender is already a member of some other team!"));

//             let size = "select * from team_requests where from_reg_num = ? and status = 'accept'";
//             db.query(size, [from_reg_num], (error, result) => {
//               if (error) return next(error);
//               if (result.length >= 3) return next(createError.BadRequest("You can't form a team more than 4 members1"));
//               // validating project_type
//               let query = "SELECT project_type,company_name,semester FROM users WHERE reg_num IN (?,?)";
//               db.query(query, [from_reg_num, to_reg_num], (error, result) => {
//                 if (error) return next(error);
//                 if (result.length != 2) {
//                   return res.status(400).send("One or both students not found.");
//                 }
//                 const type1 = result[0].project_type;
//                 const type2 = result[1].project_type;
//                 const company1 = result[0].company_name;
//                 const company2 = result[1].company_name;
//                 const sem1 = result[0].semester;
//                 const sem2 = result[1].semester;
//                 if (type1 === null || type2 === null) return next(createError.BadRequest("User haven't entered his project_type yet!")); // should be handled by mathan
//                 else if (type1.toLowerCase() !== type2.toLowerCase()) {
//                   return res.status(500).send("BOTH MEMBERS SHOULD BE EITHER INTERNAL OR EXTERNAL!!");
//                 }
//                 else if (type1 === 'external' && type2 === 'external') {
//                   if (company1 != company2) return res.status(500).send("BOTH MEMBERS SHOULD BE OF SAME COMPANY!");
//                 }

//                 if (sem1 != sem2) return next(createError.BadRequest("You can't send requests to your seniors or juniors!"));

//                 // inserts the request in the request db (only if no existing request)
//                 let sql1 = "INSERT INTO team_requests (name, emailId, reg_num, dept, from_reg_num, to_reg_num, status) VALUES (?,?,?,?,?,?,?)";
//                 let values = [name, emailId, reg_num, dept, from_reg_num, to_reg_num, 'interested'];

//                 db.query(sql1, values, (error, result) => {
//                   if (error) return next(error);  // Use return here to prevent further code execution

//                   return res.send("Request added successfully!");
//                 });
//               })
//             })
//           })
//         })

//       });
//     })

//   } catch (error) {
//     next(error.message);
//   }
// });

// filters the request i received -> notification

// router.get("/student/request_recived/:reg_num", (req, res, next) => {
//   try {
//     const { reg_num } = req.params;
//     if (!reg_num) return next(createError.BadRequest('reg_num not found!'));
//     // checks if he is already a team_member
//     let sql1 = "select * from team_requests where (from_reg_num = ? or to_reg_num = ?) and status = 'accept'";
//     db.query(sql1, [reg_num, reg_num], (error, result) => {
//       if (error) return next(error);
//       if (result.length > 0) return next('You are already a member of another team!')
//       // fetching the requests
//       let sql = "select * from team_requests where to_reg_num = ? and status = 'interested'";
//       db.query(sql, [reg_num], (error, result) => {
//         if (error) return next(error);
//         res.send(result);
//       })
//     })
//   }
//   catch (error) {
//     next(error.message);
//   }
// })

// fetch all the invitations the loggedIn user received

router.get("/student/team_request/:reg_num", userAuth, (req, res, next) => {
  try {
    const { reg_num } = req.params;
    if (!reg_num) return next(createError.BadRequest("reg_num not found!"));
    let sql1 = "SELECT * FROM team_requests WHERE (to_reg_num = ? OR from_reg_num = ?) AND status = 'accept'";
    db.query(sql1, [reg_num, reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length > 0) {
        return res.send("YOU ALREADY A TEAM MEMBER SO YOU CANT SEE THE REQUESTS SENT TO YOU!");
      }
      let sql = "select * from team_requests where to_reg_num = ? and status = 'interested'"
      db.query(sql, [reg_num], (error, result) => {
        if (error) return next(error);
        return res.send(result);
      })
    })
  }
  catch (error) {
    next(error);
  }
})

// accept or reject request -> inside notification
// router.patch("/student/team_request/:status/:to_reg_num/:from_reg_num", userAuth, (req, res, next) => {
//   try {
//     const { from_reg_num, to_reg_num, status } = req.params;
//     let { reason } = req.body; // not validating since it might be null for accept

//     reason = reason ? reason : null;

//     if (!from_reg_num || !to_reg_num || !status)
//       return next(createError.BadRequest("Missing required parameters."));

//     const validStatuses = ['accept', 'reject'];
//     if (!validStatuses.includes(status.toLowerCase())) {
//       return next(createError.BadRequest("Invalid status."));
//     }

//     const safeStatus = status.toLowerCase();

//     if (safeStatus === 'reject' && reason === null) return next(createError.BadRequest('reason not found for rejecting the connection request!'));


//     //  Update the request if it exists and is still 'interested'
//     let updateSQL = `UPDATE team_requests SET status = ?,reason = ? WHERE to_reg_num = ? AND from_reg_num = ? AND status = 'interested'`;

//     db.query(updateSQL, [safeStatus, reason, to_reg_num, from_reg_num], (err, result) => {
//       if (err) return next(err);
//       if (result.affectedRows === 0)
//         return next(createError.BadRequest("No matching pending request found or already processed."));

//       // If accepted, check team size
//       if (safeStatus === 'accept') {
//         const countSQL = `SELECT COUNT(*) AS count FROM team_requests WHERE from_reg_num = ? AND status = 'accept'`;
//         db.query(countSQL, [from_reg_num], (err1, result1) => {
//           if (err1) return next(err1);
//           const acceptedCount = result1[0].count;
//           if (acceptedCount >= 3) {
//             const cleanupSQL = `DELETE FROM team_requests WHERE from_reg_num = ? AND status <> 'accept'`;
//             db.query(cleanupSQL, [from_reg_num], (err2) => {
//               if (err2) return next(err2);
//               return res.send(`Request accepted. Team is now full. Remaining pending requests were removed.`);
//             });
//           } else {
//             return res.send(`Request accepted successfully. Current team size: ${acceptedCount}`);
//           }
//         });
//       } else {
//         return res.send(`Request ${status}ed successfully.`);
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// it checks whether he sent invitations and if sent it is conformed
// router.post("/student/fetch_team_status_and_invitations", (req, res, next) => {
//   try {
//     const { from_reg_num } = req.body; // logged user's reg num

//     if (!from_reg_num) return next(createError.BadRequest("from_reg_num not found!"))

//     // Step 1: Check if user is in any team (as leader or member)
//     const checkTeamSQL = `SELECT team_id, team_conformed, from_reg_num AS teamLeader FROM team_requests WHERE (from_reg_num = ? OR reg_num = ?) AND status = 'accept' LIMIT 1`;

//     db.query(checkTeamSQL, [from_reg_num, from_reg_num], (err1, result1) => {
//       if (err1) return next(err1);

//       if (result1.length > 0 && result1[0].team_id) {
//         const teamId = result1[0].team_id;
//         const isTeamConfirmed = result1[0].team_conformed;
//         const teamLeaderRegNum = result1[0].teamLeader;

//         // Step 2: Fetch all team members (confirmed or not conformed just accepted)
//         const fetchTeamSQL = `SELECT * FROM team_requests WHERE team_id = ? AND status = 'accept'`;
//         db.query(fetchTeamSQL, [teamId], (err2, teamMembers) => {
//           if (err2) return next(err2);
//           if (teamMembers.length === 0) return next(createError.NotFound("team members not found!"));

//           const fetchLeaderSQL = "SELECT * FROM users WHERE reg_num = ?";
//           db.query(fetchLeaderSQL, [teamLeaderRegNum], (err3, leaderDetails) => {
//             if (err3) return next(err3);

//             // If team is not confirmed, fetch pending invitations
//             if (!isTeamConfirmed) {
//               const fetchInvitesSQL = `SELECT * FROM team_requests WHERE from_reg_num = ? AND team_conformed = 0`;
//               db.query(fetchInvitesSQL, [from_reg_num], (err4, invites) => {
//                 if (err4) return next(err4);

//                 const pendingInvitations = invites.filter(invite => invite.status !== 'accept');
//                 res.json({
//                   teamConformationStatus: 0,
//                   teamMembers,
//                   pendingInvitations,
//                   teamLeader: leaderDetails[0] || null
//                 });
//               });
//             } else {
//               // team conformed checking whether they got a team id if id exist fetch it
//               if (teamMembers[0].team_id) {
//                 let getProject_id = "select project_id,project_name from projects where team_id = ?";
//                 db.query(getProject_id, [teamMembers[0].team_id], (error, results) => {
//                   if (error) return next(error);

//                   if (results.length > 0) {

//                     const project_id = results[0].project_id;
//                     const project_name = results[0].project_name;

//                     res.json({
//                       teamConformationStatus: 1,
//                       teamMembers,
//                       projectId: project_id,
//                       projectName: project_name,
//                       pendingInvitations: [],
//                       teamLeader: leaderDetails[0] || null,
//                     });


//                   }
//                   else {
//                     res.json({
//                       teamConformationStatus: 1,
//                       teamMembers,
//                       pendingInvitations: [],
//                       teamLeader: leaderDetails[0] || null
//                     });
//                   }
//                 })
//               }
//             }
//           });
//         });
//       } else {
//         // User is not in any confirmed team, fetch invitations they've sent
//         const fetchInvitesSQL = `SELECT * FROM team_requests WHERE from_reg_num = ? AND team_conformed = 0`;

//         db.query(fetchInvitesSQL, [from_reg_num], (err3, invites) => {
//           if (err3) return next(err3);

//           const pendingInvitations = invites.filter(invite => invite.status !== 'accept');
//           const teamMembers = invites.filter(invite => invite.status === 'accept');

//           res.json({
//             teamConformationStatus: 0,
//             teamMembers,
//             pendingInvitations,
//             teamLeader: null
//           });
//         });
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// make the team status -> 1 and assings team id to the team

// if it should be solo team both reg_num should be sent same

// router.patch("/student/team_request/conform_team", userAuth, (req, res, next) => {
//   try {
//     const { name, emailId, reg_num, dept, from_reg_num, semester } = req.body;

//     if (!name || !emailId || !reg_num || !dept || !from_reg_num || !semester) {
//       return next(createError.BadRequest("Some required fields are missing!"));
//     }

//     const countSql = "SELECT distinct COUNT(*) AS count FROM team_requests WHERE team_conformed = true";
//     db.query(countSql, (err, result) => {
//       if (err) return next(err);

//       const teamNumber = result[0].count + 1;
//       const team_id = `TEAM-${String(teamNumber).padStart(4, "0")}`;

//       // Check if this user already has accepted requests 
//       const checkSql = `SELECT * FROM team_requests WHERE (from_reg_num = ? OR to_reg_num = ?) AND status = 'accept'`;
//       db.query(checkSql, [from_reg_num, from_reg_num], (err, rows) => {
//         if (err) return next(err);

//         // Case: No team members, solo team
//         if (rows.length === 0) {
//           // Insert leader into teams table
//           const insertLeaderIntoTeams = `INSERT INTO teams (team_id, reg_num, semester, is_leader) VALUES (?, ?, ?, 1)`;
//           db.query(insertLeaderIntoTeams, [team_id, reg_num, semester], (err) => {
//             if (err) return next(err);
//             if (result.affectedRows === 0) return next(createError.BadRequest('some rows are not affected!'));

//             // Insert leader row into team_requests table
//             const insertLeaderRequest = `
//                 INSERT INTO team_requests (team_id, name, emailId, reg_num, dept, from_reg_num, to_reg_num, status, team_conformed)
//                 VALUES (?, ?, ?, ?, ?, ?, ?, 'accept', true)`;

//             db.query(insertLeaderRequest, [team_id, name, emailId, reg_num, dept, from_reg_num, from_reg_num], (err) => {
//               if (err) return next(err);

//               // Cleanup pending requests for solo member
//               const deletePending = `
//                   DELETE FROM team_requests 
//                   WHERE (from_reg_num = ? OR to_reg_num = ?) 
//                   AND team_conformed = false 
//                   AND status <> 'accept' 
//                   AND team_id IS NULL`;

//               db.query(deletePending, [reg_num, reg_num], (err) => {
//                 if (err) return next(err);

//                 return res.send(`${reg_num} has been added as a solo team, and pending requests were cleaned.`);
//               });
//             });
//           });

//           return;
//         }

//         // Set team_conformed = true for accepted members
//         const updateConfirmSql = `UPDATE team_requests SET team_conformed = true WHERE from_reg_num = ? AND status = 'accept'`;
//         db.query(updateConfirmSql, [from_reg_num], (err, result1) => {
//           if (err) return next(err);
//           if (result1.affectedRows === 0) return res.status(500).send("Could not confirm team.");

//           // fetches the team members to be inserted into the teams table

//           let getSql = "select * from team_requests where from_reg_num = ? AND status = 'accept'";
//           db.query(getSql, [from_reg_num], (error4, teamMates) => {
//             if (error4) return next(error4);
//             if (teamMates.length === 0) return next('team mates not found!');
//             for (let i = 0; i < teamMates.length; i++) {
//               // insert into teams table
//               let insertSql = "insert into teams (team_id, reg_num, semester, is_leader) values (?,?,?,?)";
//               db.query(insertSql, [team_id, teamMates[i].reg_num, semester, 0,], (error, result) => {
//                 if (error) return next(error);
//                 if (result.affectedRows === 0) return next(createError.BadRequest('teamMate is not inserted into the table1'));

//               })
//             }

//             // Step 4: Set team_id for those members
//             const updateIdSql = `UPDATE team_requests SET team_id = ? WHERE from_reg_num = ? AND status = 'accept'`;
//             db.query(updateIdSql, [team_id, from_reg_num], (err, result2) => {
//               if (err) return next(err);
//               if (result2.affectedRows === 0) return res.status(500).send("Could not assign team ID.");

//               // insert leader into the team table
//               let insertTeamLeader = "insert into teams (team_id,reg_num,is_leader, semester) values (?,?,?,?)";
//               db.query(insertTeamLeader, [team_id, reg_num, 1, semester], (error, result) => {
//                 if (error) return next(error);
//                 if (result.affectedRows === 0) return next(createError.BadRequest('some rows are not affected!'));

//                 // Step 5: Insert leader row
//                 const insertLeaderSql = `INSERT INTO team_requests (team_id, name, emailId, reg_num, dept, from_reg_num, to_reg_num, status, team_conformed) VALUES (?, ?, ?, ?, ?, ?, ?, 'accept', true)`;
//                 db.query(insertLeaderSql, [team_id, name, emailId, reg_num, dept, from_reg_num, from_reg_num], (err, result3) => {
//                   if (err) return next(err);
//                   if (result3.affectedRows === 0) return res.status(500).send("Could not insert team leader row.");

//                   // Step 6: Get all members in the new team
//                   const getMembersSql = `
//                    SELECT to_reg_num FROM team_requests 
//                    WHERE team_id = ?
//                  `;
//                   db.query(getMembersSql, [team_id], (err, members) => {
//                     if (err) return next(err);
//                     if (members.length === 0) return next(createError.NotFound("No team members found."));

//                     // Step 7: Cleanup pending requests of each team member
//                     let pending = members.length;
//                     members.forEach(({ to_reg_num }) => {
//                       const deleteSql = `
//                        DELETE FROM team_requests 
//                        WHERE (from_reg_num = ? OR to_reg_num = ?) 
//                        AND team_conformed = false 
//                        AND status <> 'accept' 
//                        AND team_id IS NULL
//                      `;
//                       db.query(deleteSql, [to_reg_num, to_reg_num], (err, delResult) => {
//                         if (err) return next("hai hello" + err);

//                         pending--;
//                         if (pending === 0) {
//                           return res.send("Team confirmed and all pending requests cleaned.");
//                         }
//                       });
//                     });
//                   });
//                 });

//               })
//             })

//           })

//         });
//       });
//     });
//   }
//   catch (error) {
//     next(error);
//   }
// });

// fetches team members
router.get("/student/getTeamDetails/:reg_num", userAuth, (req, res, next) => {
  const { reg_num } = req.params;
  if (!reg_num) return next(createError.BadRequest("reg_num not found!"));
  let sql = `SELECT * FROM team_requests WHERE (from_reg_num = ? OR to_reg_num = ?) AND team_conformed = true`;
  db.query(sql, [reg_num, reg_num,], (error, result) => {
    if (error) return next(error);
    res.send(result);
  })
});

// updates the progress

router.post("/student/update_progress/:week/:reg_num/:team_id", userAuth, (req, res, next) => {
  try {
    const { week, reg_num, team_id } = req.params;
    const { progress } = req.body;

    const validPhases = [
      "week1", "week2", "week3", "week4", "week5", "week6",
      "week7", "week8", "week9", "week10", "week11", "week12"
    ];

    const safeweek = week.toLowerCase();

    // Validation Check
    if (!validPhases.includes(safeweek) || !reg_num || !team_id) {
      return res.status(400).json({ message: "Invalid week name or reg_num missing" });
    }

    // checks if already submmited
    let check = `SELECT ${safeweek}_progress FROM teams WHERE reg_num = ? AND team_id = ?`;
    db.query(check, [reg_num, team_id], (error, results) => {
      if (error) return next(error);

      if (results[0] && results[0][`${safeweek}_progress`] !== null) {
        return res.status(200).send("YOU HAVE ALREADY SUBMITTED YOUR PROGRESS FOR THIS WEEK!");
      }

      // updating progress
      const sql = `UPDATE teams SET ${safeweek}_progress = ? WHERE reg_num = ? and team_id = ?`;

      db.query(sql, [progress, reg_num, team_id], (err, result) => {
        if (err) return next(err);

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "No record found for the provided reg_num." });
        }
        let sql1 = `select ${safeweek}_progress from teams where team_id = ?`;
        db.query(sql1, [team_id], (error, result) => {
          if (error) return next(error);

          // checks whether all members updated progress -> safeweek

          const allMembersUpdated = result.every((member) => member[`${safeweek}_progress`] !== null); // every -> checks whether every element satisfies the given condition, optimised instead of forEach // . -> [] alternative for . notation
          if (allMembersUpdated) {
            // inserts into weekly_logs_verification
            let weekNumber = safeweek.replace(/\D/g, '');
            let insertSql = "INSERT INTO weekly_logs_verification (team_id, week_number) VALUES (?, ?)";
            db.query(insertSql, [team_id, weekNumber], (error, inserted) => {
              if (error) return next(error);
              if (inserted.affectedRows === 0) return next(createError.BadRequest('An error occured while inserting!'));

              let getGuide = "select guide_reg_num from teams where team_id = ?";
              db.query(getGuide, [team_id], (error, result) => {
                if (error) return next(error);
                if (result.length === 0) return next(createError.NotFound("guide reg num not found!"));
                let guide_reg_num = result[0].guide_reg_num;
                let getGuideEmailStudentEmail = "SELECT emailId, role FROM users WHERE reg_num IN (?, ?) AND role IN ('staff', 'student');";
                db.query(getGuideEmailStudentEmail, [guide_reg_num, reg_num], (error, result) => {
                  if (error) return next(error);
                  if (result.length === 0) return next(createError.NotFound("guide email not found!"));
                  let guideEmail = null;
                  let studentEmail = null;

                  result.forEach(user => {
                    if (user.role === 'staff') guideEmail = user.emailId;
                    else if (user.role === 'student') studentEmail = user.emailId;
                  });

                  if (!guideEmail || !studentEmail) {
                    return next(createError.InternalServerError("Could not resolve guide or student email."));
                  }

                  const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      user: process.env.EMAIL_USER,
                      pass: process.env.EMAIL_PASS,
                    },
                  });

                  const mailOptions = {
                    from: `"No Reply" <${process.env.EMAIL_USER}>`,
                    to: guideEmail,
                    subject: `Progress update for ${safeweek} by Team ${team_id}`,
                    replyTo: studentEmail,  // Optional: replies go to student
                    text: `Dear Guide,

                      Team ${team_id} has completed their progress update for ${safeweek}.
                      This submission was triggered by the student with registration number: ${reg_num}.

                      Please check the Project Register for more details.

                      Best regards,
                      Project Management System`
                  };
                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.error("Email Error:", error);
                      return res.status(500).send("Progress updated, but failed to send email.");
                    } else {
                      console.log("Email sent:", info.response);
                      return res.send("Progress updated and email sent successfully!");
                    }
                  });

                })
              })

            })

          }
          else {
            return res.send("Progress updated successfully for this member!");
          }
        })
      });

    });
  } catch (error) {
    next(error);
  }
});

// brings whether weekly logs accepted or not
// filter recent status through verified at date and time
router.get("/student/get_accept_or_reject_status/:team_id/:week_number", (req, res, next) => {
  try {
    const { team_id, week_number } = req.params;
    if (!team_id || !week_number) return next(createError.BadRequest('team_id or week number is not defined!'));
    let sql = "select * from weekly_logs_verification where team_id = ? and week_number = ?";
    db.query(sql, [team_id, week_number], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('status not found!'));
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})


// brings the details of the project through project_id 
router.get("/student/get_project_details/:project_id", userAuth, (req, res, next) => {
  try {
    const { project_id } = req.params;
    if (!project_id) next(createError.BadRequest("project_Id not found!"))
    let sql = "select * from projects where project_id = ?";
    db.query(sql, [project_id], (error, result) => {
      if (error) next(error);
      if (result.length === 0) return next(createError.NotFound('project details not found!'));
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// updates the project type

router.patch("/student/alter_project_type/:reg_num/:type", userAuth, (req, res, next) => {
  try {
    const { type, reg_num } = req.params;
    let { company_name, company_address, company_contact } = req.body;
    const safeType = type.toLowerCase();
    const validTypes = ["internal", "external"];
    if (!validTypes.includes(safeType)) {
      return next(createError.BadRequest("invalid type!"))
    }
    if (safeType == 'internal') {
      company_name = null,
        company_address = null,
        company_contact = null
    }
    else {
      if (!company_name.trim() || !company_address.trim() || !company_contact.trim()) return next(createError.BadRequest("External project requires complete company details."));
    }
    let sql = "update users set project_type = ?,company_name = ?,company_address = ?,company_contact = ? where reg_num = ?";
    db.query(sql, [safeType, company_name, company_address, company_contact, reg_num], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("changes not got updated!"));
      res.send(`Project Type updated successfully to ${type}`);
    })
  }
  catch (error) {
    next(error);
  }
})

// checks whether the user have given project_type -> INTERNAL OR EXTERNAL
router.get("/student/get_project_type/:reg_num", (req, res, next) => {
  try {
    const { reg_num } = req.params;
    if (!reg_num) {
      next(createError.BadRequest("reg_num not found!"));
    }
    let sql = "select project_type from users where reg_num = ?";
    db.query(sql, [reg_num], (error, result) => {
      if (error) return next(error);
      if (!result[0].project_type) return res.send("user haven't set their register number!");
      res.send(result[0].project_type);
    })
  }
  catch (error) {
    next(error);
  }
})

// gets history of weekly_logs_verification
router.get('/student/get_review_history/:team_id', (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('team id not defined!'));
    let sql = "select * from weekly_logs_verification where team_id = ?";
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// checks whether particular week progress is posted or not
router.get('/student/checks_whether_log_updated/:team_id/:week/:reg_num', (req, res, next) => {
  try {
    const { team_id, week, reg_num } = req.params;
    if (!team_id || !week || !reg_num) return next(createError.BadRequest('team_id or reg_num or week is not found!'));
    const weekNumber = parseInt(week);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 12) {
      return next(createError.BadRequest('Week number must be between 1 and 12'));
    }
    let sql = `select week${week}_progress from teams where team_id = ? and reg_num = ?`;
    db.query(sql, [team_id, reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length === 0 || result[0][`week${weekNumber}_progress`] === null) {
        return res.send('Not updated!');
      }
      res.send('Already Updated!');
    })
  }
  catch (error) {
    next(error)
  }
})

// get name by register number
router.get('/student/get_name_by_reg_number/:reg_num', (req, res, next) => {
  try {
    const { reg_num } = req.params;
    if (!reg_num) return next(createError.BadRequest('registser number not found!'));
    let sql = "select name from users where reg_num = ?";
    db.query(sql, [reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('student name not found!'));
      res.send(result[0].name);
    })
  }
  catch (error) {
    next(error);
  }
})

// send request to mentor for optional review -> if missed any one of the review

router.post('/send_request_for_optional_review/:mentor_reg_num', (req, res, next) => {
  try {
    const { mentor_reg_num } = req.params;
    if (!mentor_reg_num) return next(createError.BadRequest('mentor register number not found!'));

  }
  catch (error) {
    next(error);
  }
})

// checks whether the student have already added the progress for the particular week

// router.get("/student/gets_progress_of_mine/:week/:reg_num",(req,res,next) => {
//   try{
//     const{week,reg_num} = req.params;
//     if(!week || !reg_num)return next(createError.BadRequest("week or reg_num not found!"));
//     const column = `week${week}_progress`;
//     const sql = `SELECT ?? FROM team_requests WHERE reg_num = ? AND team_conformed = 1`;
//     db.query(sql,[column,reg_num],(error,result) => {
//       if(error)return next(error);
//       if(result.length === 0)return next(createError.NotFound("progress not found!"));
//       res.send(result);
//     })
//   }
//   catch(error)
//   {
//     next(error);
//   }
// })

// adds the query in the query table

router.post("/student_query/:team_member/:guide_reg_num", userAuth, (req, res, next) => {
  try {
    const { team_id, project_id, query } = req.body;
    const { team_member, guide_reg_num } = req.params;

    if (!project_id || !team_id || !team_member || !query || !guide_reg_num) {
      return next(createError.BadRequest("Required parameters are missing!"));
    }

    // Step 1: Fetch project name using project_id
    const getProjectNameSql = "SELECT project_name FROM projects WHERE project_id = ?";
    db.query(getProjectNameSql, [project_id], (err, rows) => {
      if (err) return next(err);

      if (rows.length === 0) {
        return next(createError.NotFound("Project not found!"));
      }

      const project_name = rows[0].project_name;

      // Step 2: Insert the query into the queries table
      const insertQuerySql = `
        INSERT INTO queries (team_id, project_id, project_name, team_member, query, guide_reg_num)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuerySql, [team_id, project_id, project_name, team_member, query, guide_reg_num], (err, result) => {
        if (err) return next(err);

        // Step 3: Delete older answered queries, keeping only the latest 5
        const deleteOldSql = `
          DELETE FROM queries 
          WHERE query_id IN (
            SELECT query_id FROM (
              SELECT query_id 
              FROM queries 
              WHERE team_id = ? AND reply IS NOT NULL
              ORDER BY created_at DESC
              LIMIT 18446744073709551615 OFFSET 5
            ) AS temp
          )
        `;

        db.query(deleteOldSql, [team_id], (err2) => {
          if (err2) return next(err2);

          // Step 4: Send a success response
          res.send("Query added successfully!");
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// gets student details by reg_num

// router.get("/student/get_student_details_by_regnum/:reg_num", userAuth, (req, res, next) => {
//   try {
//     const { reg_num } = req.params;
//     if (!reg_num) return next(createError.BadRequest("reg_num not found!!"));
//     let sql = "select * from users where reg_num = ?";
//     db.query(sql, [reg_num], (error, result) => {
//       if (error) return next(error);
//       res.send(result);
//     })
//   }
//   catch (error) {
//     next(error);
//   }
// })

// gets team details using the team_id

// router.get("/student/getTeamdetails_using_team_id/:team_id",userAuth,(req,res,next) => {
//   try{
//     const{team_id} = req.body;
//     if(!team_id) return next(createError.BadRequest("team_id is not defined!!"));
//     let sql = "select * from team_request where team_id = ?";
//     db.query(sql,[team_id],(error,result) => {
//       if(error)return next(error);
//       res.send(result);
//     })
//   }
//   catch(error)
//   {
//     next(error);
//   }
// })

//fetch queries sent by my team

router.get("/student/get_queries_sent_by_my_team/:team_id", userAuth, (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest("team_id not found!!"));
    let sql = "select * from queries where team_id = ?";
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// checks whether he is already a member of another team

router.get("/student/check_accepted_status/:reg_num", userAuth, (req, res, next) => {
  try {
    const { reg_num } = req.params;
    let sql = "SELECT * FROM team_requests WHERE (to_reg_num = ? OR from_reg_num = ?) AND status = 'accepted'";
    db.query(sql, [reg_num, reg_num], (error, result) => {
      if (error) return next(error);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})


// inserts the project into project table
// project_type should come frontend -> redux -> userSlice
// only team_member can post the project
// -> send the project_type from redux not input tag

router.post("/student/addproject/:project_type/:team_id/:reg_num", userAuth, (req, res, next) => {
  try {
    let { project_type, reg_num, team_id } = req.params;
    let { project_name, cluster, description, outcome, hard_soft } = req.body;

    project_type = project_type.toLowerCase();
    hard_soft = hard_soft.toLowerCase();

    const validTypes = ['internal', 'external', 'hardware', 'software'];

    if (!project_type.trim() || !project_name.trim() || !cluster.trim() || !description.trim() || !reg_num.trim() || !team_id) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    if (!validTypes.includes(project_type) || !validTypes.includes(hard_soft)) return next(createError.BadRequest("invalid project_type"))

    // checks whether he is a team_leader -> to post project

    let query = "select is_leader from teams where team_id = ? and reg_num = ?";
    db.query(query, [team_id, reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.BadRequest("You are not a TEAM LEADER!"));
      if (result.length > 1) return next(createError.BadRequest("You have more than one team!"));

      // checks whether he already posted projects

      let query1 = "select * from projects where tl_reg_num = ?";
      db.query(query1, [reg_num], (error, result) => {
        if (error) return next(error);
        if (result.length > 0) return next(createError.BadRequest("The team already posted a project!"));

        // geneating project_id

        const sql = "SELECT COUNT(*) AS count FROM projects";
        db.query(sql, (error, result) => {
          if (error) return next(error);

          const project_length = result[0].count + 1;
          const project_id = `P${String(project_length).padStart(4, "0")}`;

          // inserting into projects

          const sql1 = ` INSERT INTO projects (project_id,project_name,project_type,cluster,description,outcome,hard_soft,tl_reg_num,team_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const values = [project_id, project_name, project_type, cluster, description, outcome, hard_soft, reg_num, team_id];
          db.query(sql1, values, (error, result) => {
            if (error) return next(error);
            if (result.affectedRows === 0) return next(createError.BadRequest("an error occured silently!"));

            // inserts the project_id to the team in teams table
            let insertSql = "UPDATE teams SET project_id = ? WHERE team_id = ?";
            db.query(insertSql, [project_id, team_id], (error, result) => {
              if (error) return next(error);
              if (result.affectedRows === 0) return next(createError.BadRequest("no rows inserted!"));
              res.json({
                "message": "project added successfully!",
                "team_id": team_id,
                "project_id": project_id,
                "project_name": project_name
              });

            })
          })
        });
      })

    })
  } catch (error) {
    next(error.message);
  }
});

// sends the review request to the expert and guide => once in a month
// reason will be for optional review
router.post("/student/send_review_request/:team_id/:project_id/:reg_num", userAuth, upload, (req, res, next) => {
  try {
    const { team_id, project_id, reg_num } = req.params;
    const { project_name, team_lead, review_date, start_time, isOptional, reason, mentor_reg_num } = req.body;

    const files = req.files;
    const file = files?.report?.[0] || files?.ppt?.[0] || files?.outcome?.[0];

    if (!team_id || !project_id || !project_name || !team_lead || !review_date || !start_time || !reg_num) {
      return next(createError.BadRequest("Some parameters are missing!"));
    }

    if (!file) {
      return next(createError.BadRequest("At least one file (report/ppt/outcome) must be uploaded."));
    }

    const filePath = file.path;
    const today = new Date();
    const reviewDate = new Date(review_date);
    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);

    if (reviewDate < today) {
      return next(createError.BadRequest("Invalid date! Review date cannot be in the past."));
    }

    const formattedDate = reviewDate.toISOString().split('T')[0];

    const sqlLeader = "SELECT is_leader FROM teams WHERE team_id = ? AND reg_num = ?";
    db.query(sqlLeader, [team_id, reg_num], (err0, leaderResult) => {
      if (err0) return next(err0);
      if (leaderResult.length === 0 || !leaderResult[0].is_leader) {
        return res.status(403).send("Only team leader can request for a review.");
      }

      const sqlMentors = "SELECT guide_reg_num, sub_expert_reg_num FROM teams WHERE team_id = ?";
      db.query(sqlMentors, [team_id], (err1, mentors) => {
        if (err1) return next(err1);
        if (mentors.length === 0) return next(createError.BadRequest("Mentor or expert info not found."));

        const expert_reg_num = mentors[0].sub_expert_reg_num;
        const guide_reg_num = mentors[0].guide_reg_num;

        const sqlReviews = "SELECT * FROM scheduled_reviews WHERE team_id = ?";
        db.query(sqlReviews, [team_id], (err2, pastReviews) => {
          if (err2) return next(err2);
          if (pastReviews.length >= 2 && review_title !== 'optional') {
            return next(createError.BadRequest("Your team already completed 2 reviews."));
          }

          const proceed = (review_title) => {
            if (review_title !== '1st_review' && review_title !== '2nd_review' && review_title !== 'optional') {
              return next(createError.BadRequest("Invalid review title."));
            }

            const checkDuplicate = `
              SELECT * FROM review_requests 
              WHERE review_title = ? AND team_id = ? AND guide_status = 'interested' AND expert_status = 'interested'
            `;
            db.query(checkDuplicate, [review_title, team_id], (err0, res0) => {
              if (err0) return next(err0);
              if (res0.length > 0) {
                return next(createError.BadRequest(`${title} already sent and the guide, expert yet to verify requests`));

                return next(createError.BadRequest(`${review_title} already sent and the guide, expert yet to verify requests`));
              }

              let weekToCheck = 0;
              if (review_title === "1st_review") weekToCheck = 3;
              else if (review_title === "2nd_review") weekToCheck = 6;

              if (review_title === "1st_review" || review_title === "2nd_review") {
                const sqlVerifyWeek = "SELECT * FROM weekly_logs_verification WHERE week_number = ? AND is_verified = true AND team_id = ?";
                db.query(sqlVerifyWeek, [weekToCheck, team_id], (err3, verifyResult) => {
                  if (err3) return next(err3);
                  if (verifyResult.length === 0) {
                    return res.send(`Week ${weekToCheck} log not verified.`);
                  }

                  const sqlCheckDuplicate = `
                    SELECT * FROM review_requests 
                    WHERE review_date = ? AND start_time = ? AND expert_reg_num = ? AND guide_reg_num = ? AND team_id = ?
                  `;
                  db.query(sqlCheckDuplicate, [formattedDate, start_time, expert_reg_num, guide_reg_num, team_id], (err4, existingReqs) => {
                    if (err4) return next(err4);
                    if (existingReqs.length > 0) {
                      return res.send("Review request already exists for this slot.");
                    }

                    const sqlInsertReview = `
                      INSERT INTO review_requests 
                      (team_id, project_id, project_name, team_lead, review_date, start_time, expert_reg_num, guide_reg_num, review_title, file)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    db.query(sqlInsertReview, [
                      team_id, project_id, project_name, team_lead,
                      formattedDate, start_time, expert_reg_num, guide_reg_num,
                      review_title, filePath
                    ], (err5, insertRes) => {
                      if (err5) return next(err5);
                      return res.send(`${formattedDate} - ${start_time}: ${review_title} submitted successfully.`);
                    });
                  });
                });
              } else {
                const sqlCheckOptional = `
                  SELECT * FROM optional_review_requests 
                  WHERE team_id = ? AND review_date = ? AND start_time = ? AND mentor_reg_num = ?
                `;
                db.query(sqlCheckOptional, [team_id, formattedDate, start_time, mentor_reg_num], (err6, optCheck) => {
                  if (err6) return next(err6);
                  if (optCheck.length > 0) {
                    return res.send("Already sent optional review request for this slot.");
                  }

                  const sqlInsertOptional = `
                    INSERT INTO optional_review_requests 
                    (team_id, project_id, team_lead, review_date, start_time, mentor_reg_num, reason, status, file)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `;
                  db.query(sqlInsertOptional, [
                    team_id, project_id, team_lead, formattedDate, start_time,
                    mentor_reg_num, reason, 'pending', filePath
                  ], (err7, result7) => {
                    if (err7) return next(err7);
                    return res.send("Optional review request sent successfully to mentor.");
                  });
                });
              }
            });
          };

          if (isOptional === "optional") {
            if (pastReviews.length !== 1) {
              return res.send("Optional review only allowed after completing any one review.");
            }

            const sqlDeadline = "SELECT week8 FROM weekly_logs_deadlines WHERE team_id = ?";
            db.query(sqlDeadline, [team_id], (err8, weekRes) => {
              if (err8) return next(err8);
              if (!weekRes.length || !weekRes[0].week8) {
                return next(createError.NotFound("Week 8 deadline not found."));
              }

              const week8 = new Date(weekRes[0].week8);
              week8.setHours(0, 0, 0, 0);

              if (today < week8) {
                return next(createError.BadRequest("Cannot apply for optional review before Week 8 deadline."));
              }

              proceed("optional");
            });
          } else {
            let review_title = "";
            if (pastReviews.length === 0) {
              review_title = "1st_review";
            } else if (pastReviews.length === 1) {
              review_title = "2nd_review";
            } else {
              return next(createError.BadRequest("Your team already completed 2 reviews."));
            }
            proceed(review_title);
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
});


// fetches the history of review requests sent by my team -> tl
router.get('/student/get_review_request_history/:team_id', (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('Team id not found!'));
    let sql = "select * from review_requests where team_id = ?";
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// fetches the scheduled reviews for my team                            

router.get("/student/schedule_review/:project_id", userAuth, (req, res, next) => {
  try {
    const project_id = req.params.project_id;

    if (!project_id) {
      return next(createError.BadRequest("Project ID is required"));
    }

    const query = `SELECT * FROM project_registor.scheduled_reviews WHERE project_id = ?`;

    db.query(query, [project_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) {
        return res.status(404).json({ message: "No review found for the given project ID" });
      }
      return res.json(result);
    });
  } catch (err) {
    next(err);
  }
});

// fetches the upcoming reviews for my team

router.get('/student/fetch_upcoming_reviews/:team_id', (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('team is undefined!'));
    let sql = `SELECT * FROM scheduled_reviews WHERE expert_reg_num = ? AND (attendance IS NULL OR attendance = '')AND CONCAT(review_date, ' ', start_time) >= NOW() - INTERVAL 3 HOUR;`;
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('meeting links not found!'));
      return res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// fetches guide-expert for a particular team
router.get('/student/get_guide_expert/:team_id/:role', (req, res, next) => {
  try {
    const { team_id, role } = req.params;
    if (!team_id || !role) return next(createError.BadRequest('team id or role is undefined!'));
    const safeRole = role.toLowerCase();
    const validRoles = ['guide', 'sub_expert'];
    if (!validRoles.includes(safeRole)) return next(createError.BadRequest('invalid role!'));
    let sql = `select ${role}_reg_num from teams where team_id = ?`;
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.BadRequest('register number not found!!'));
      // gets the name from users table
      let sql1 = "select name from users where reg_num = ?";
      db.query(sql1, [reg_num], (error, result) => {
        if (error) return next(error);
        if (result.length === 0) return next(createError[404]);
        res.send(result);
      })
    })

  }
  catch (error) {
    next(error);
  }
})

// challenge review -> requested by the team_leader 
// review_id -> not satisfied review's id
router.post('/student/challenge_review/request/:team_id/:project_id/:reg_num/:review_id', (req, res, next) => {
  try {
    const { team_id, project_id, reg_num, review_id } = req.params;
    if (!team_id || !reg_num || !review_id) return next(createError.BadRequest('team_id or reg_num or review_id is not defined!'));

    // Step 1: Check if student is team leader
    let sql0 = "SELECT is_leader FROM teams WHERE team_id = ? AND reg_num = ?";
    db.query(sql0, [team_id, reg_num], (error0, result0) => {
      if (error0) return next(error0);
      if (result0.length === 0) return next(createError.NotFound('student leader status not found!'));
      if (!result0[0].is_leader) return res.send('YOU CANT REQUEST FOR CHALLENGE REVIEW, ONLY YOUR TEAM LEADER CAN APPLY FOR IT');

      // Step 2: Validate date (within 7 days)
      let sql1 = "SELECT * FROM scheduled_reviews WHERE review_id = ?";
      db.query(sql1, [review_id], (error1, result1) => {
        if (error1) return next(error1);
        if (result1.length === 0) return next(createError.NotFound('review_date not found'));

        const review_date = new Date(result1[0].review_date);
        const today = new Date();
        review_date.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffInDays = (today - review_date) / (1000 * 60 * 60 * 24);

        if (diffInDays > 7) {
          return next(createError.BadRequest('Challenge review time limit exceeded!'));
        }

        // Step 3: Check if marks were updated
        let sql2 = 'SELECT * FROM review_marks_team WHERE team_id = ? AND review_title = ? AND review_date = ?';
        db.query(sql2, [team_id, result1[0].review_title, result1[0].review_date], (error2, result2) => {
          if (error2) return next(error2);
          if (result2.length === 0) return next(createError.BadRequest('Since guide or expert have not updated marks for your team, you cannot request for challenge review'));

          // Step 4: Insert into challenge_review_requests
          let sql3 = "INSERT INTO challenge_review_requests (team_id, project_id, team_lead, status) VALUES (?, ?, ?, ?)";
          db.query(sql3, [team_id, project_id, reg_num, 'pending'], (error3, result3) => {
            if (error3) return next(error3);
            if (result3.affectedRows === 0) return next(createError.BadRequest('error occurred while inserting for challenge review!'));
            res.send(`Optional review request sent to admin`);
          });
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// edit already updated progress 
// week will be from 1st api's response

router.patch('/student/edit_submitted_progress/:team_id/:week/:reg_num', (req, res, next) => {
  try {
    const { team_id, week, reg_num } = req.params;
    const { newProgress } = req.body;
    if (!team_id || !week || !reg_num || !newProgress) {
      return next(createError.BadRequest('parameters not found!'));
    }

    const weekNumber = parseInt(week);

    if (weekNumber < 1 || weekNumber > 12 || isNaN(weekNumber)) {
      return next(createError.BadRequest("Invalid week field!"));
    }

    let sql = `update teams set week${weekNumber}_progress = ? where reg_num = ? and team_id = ?`;
    db.query(sql, [newProgress, reg_num, team_id], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest('failed to update!'));

      // update progress, so again change guide status from rejected to interested
      let sql0 = "update weekly_logs_verification set status = ? where team_id = ? and week_number = ?";
      db.query(sql0, ['interested', team_id, weekNumber], (error0, result0) => {
        if (error0) return next(error0);
        if (result0.affectedRows === 0) return next(createError.BadRequest('some rows not affected!'));
        res.send('progress updated successfully!');
      })
    })
  }
  catch (error) {
    next(error);
  }
})

// to show upcoming deadline for student page
router.get('/student/show_upcoming_deadline_weekly_logs_and_timeline/:team_id', (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('team id not found!'));
    let sql = `SELECT 
    wld.team_id,
    CASE 
        WHEN CURDATE() <= wld.week1 THEN wld.week1
        WHEN CURDATE() <= wld.week2 THEN wld.week2
        WHEN CURDATE() <= wld.week3 THEN wld.week3
        WHEN CURDATE() <= wld.week4 THEN wld.week4
        WHEN CURDATE() <= wld.week5 THEN wld.week5
        WHEN CURDATE() <= wld.week6 THEN wld.week6
        WHEN CURDATE() <= wld.week7 THEN wld.week7
        WHEN CURDATE() <= wld.week8 THEN wld.week8
        WHEN CURDATE() <= wld.week9 THEN wld.week9
        WHEN CURDATE() <= wld.week10 THEN wld.week10
        WHEN CURDATE() <= wld.week11 THEN wld.week11
        WHEN CURDATE() <= wld.week12 THEN wld.week12
        ELSE NULL
    END AS current_week_deadline,
    CASE 
        WHEN CURDATE() <= wld.week1 THEN 'week1'
        WHEN CURDATE() <= wld.week2 THEN 'week2'
        WHEN CURDATE() <= wld.week3 THEN 'week3'
        WHEN CURDATE() <= wld.week4 THEN 'week4'
        WHEN CURDATE() <= wld.week5 THEN 'week5'
        WHEN CURDATE() <= wld.week6 THEN 'week6'
        WHEN CURDATE() <= wld.week7 THEN 'week7'
        WHEN CURDATE() <= wld.week8 THEN 'week8'
        WHEN CURDATE() <= wld.week9 THEN 'week9'
        WHEN CURDATE() <= wld.week10 THEN 'week10'
        WHEN CURDATE() <= wld.week11 THEN 'week11'
        WHEN CURDATE() <= wld.week12 THEN 'week12'
        ELSE NULL
    END AS current_week_name,
    t.name AS current_timeline,
    t.start_date AS timeline_start_date,
    t.end_date AS timeline_end_date
    FROM weekly_logs_deadlines wld
    LEFT JOIN timeline t ON (
        CURDATE() BETWEEN t.start_date AND t.end_date 
        AND (t.team_id = ? OR t.team_id IS NULL)
    )
    WHERE wld.team_id = ?;`
    db.query(sql, [team_id, team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return res.send('No active deadlines for your team!');
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})


module.exports = router;