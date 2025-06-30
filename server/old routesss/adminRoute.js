const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const db = require('../config/db');
const userAuth = require("../middleware/userAuth")

const multer = require('multer');
const xlsx = require('xlsx');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer
const upload = multer({ dest: 'uploads/' });

router.post('/bulk-upload-users', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // 1. Upload to Cloudinary (optional - if you want to keep a copy)
    const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "user-uploads"
    });

    // 2. Process the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const usersData = xlsx.utils.sheet_to_json(worksheet);

    // 3. Validate data
    const requiredFields = ['emailId', 'role', 'reg_num', 'dept', 'semester', 'phone_number', 'available'];
    const validUsers = [];
    const errors = [];

    usersData.forEach((user, index) => {
      const rowErrors = [];

      // Check required fields
      requiredFields.forEach(field => {
        if (!user[field]) {
          rowErrors.push(`${field} is required`);
        }
      });

      // Validate email
      if (user.emailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.emailId)) {
        rowErrors.push('Invalid email format');
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 2,
          errors: rowErrors
        });
        return;
      }

      validUsers.push({
        emailId: user.emailId,
        role: user.role,
        reg_num: user.reg_num,
        dept: user.dept,
        semester: parseInt(user.semester) || null,
        phone_number: user.phone_number,
        available: user.available === 'Yes' || user.available === '1' ? 1 : 0,
        created_at: new Date()
      });
    });

    if (errors.length > 0) {
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        message: 'Validation errors found',
        errors,
        cloudinaryUrl: cloudinaryUpload?.secure_url
      });
    }

    // 4. Insert into database
    if (validUsers.length > 0) {
      const sql = `INSERT INTO users 
        (emailId, role, reg_num, dept, semester, phone_number, available, created_at) 
        VALUES ?`;

      const values = validUsers.map(user => [
        user.emailId,
        user.role,
        user.reg_num,
        user.dept,
        user.semester,
        user.phone_number,
        user.available,
        user.created_at
      ]);

      db.query(sql, [values], (error, result) => {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);

        if (error) {
          return res.status(500).json({
            success: false,
            message: 'Database error',
            error: error.message
          });
        }

        res.json({
          success: true,
          message: `${result.affectedRows} users added successfully`,
          cloudinaryUrl: cloudinaryUpload?.secure_url
        });
      });
    } else {
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        success: false,
        message: 'No valid users to upload'
      });
    }
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});



router.post("/admin/adduser", userAuth, (req, res, next) => {
  try {
    const { name, emailId, password, role, dept, reg_num, phone_number, semester, mentor_name, mentor_reg_num, mentor_emailId } = req.body;
    if (!name || !emailId || !password) { // not checking semester since it might be null other than students
      return next(createError.BadRequest("data is missing!"));
    }
    const normalRole = role.toLowerCase();
    const safeSemester = normalRole === "student" ? semester : null;
    const safePhone_number = phone_number ? phone_number : null;
    const validRoles = ['student', 'admin', 'staff'];
    if (!validRoles.includes(normalRole)) {
      return next(createError.BadRequest("invalid role!"));
    }
    if (normalRole === "student") {
      let validSem = [5, 7];
      if (!validSem.includes(semester)) {
        return next(createError.BadRequest("Invalid semester for student!"));
      }
    }
    let sql = "insert into users(name,emailId,password,role,dept,reg_num,phone_number,semester) values(?,?,?,?,?,?,?,?)";
    const values = [name, emailId, password, normalRole, dept, reg_num, safePhone_number, safeSemester];
    db.query(sql, values, (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("rows are not affected!"));
      if (role == 'student') {
        if (!mentor_emailId || !mentor_name || !mentor_reg_num) return next(createError.BadRequest('mentor details are missing!'));
        // check if mentor exist
        let sql1 = "select * from users where role = 'staff' and reg_num = ? and name = ?";
        db.query(sql1, [mentor_reg_num, mentor_name], (error, check) => {
          if (error) return next(error);
          if (check.length === 0) return next(createError.NotFound('mentor not found!'));
          let sql2 = "insert into mentor_mentee (mentee_name,mentee_reg_num,mentee_emailId,mentee_sem,mentor_name,mentor_reg_num,mentor_emailId) values(?,?,?,?,?,?,?)";
          db.query(sql2, [name, reg_num, emailId, safeSemester, mentor_name, mentor_reg_num, mentor_emailId], (error, result) => {
            if (error) return next(error);
            if (result.affectedRows === 0) return next('some rows are not affected!');
            return res.send("user added successfully with mentor admin!");

          })
        })
      }
      else {
        res.send("user added successfully admin!");
      }
    })
  }
  catch (error) {
    next(error);
  }
})

// inserts deadlines for all teams at a time
// router.post('/admin/insert_deadlines_for_all_teams', async (req, res, next) => {
//   try {
//     const { week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12 } = req.body.data;
//     console.log(week1, "week 1");
//     const weeks = [week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12];
//     console.log(weeks, "weeks");
//     // Function to check if a string is a valid future date
//     function isValidFutureDate(dateStr) {
//       const date = new Date(dateStr);
//       const today = new Date();

//       // Check if it's a valid date and not in the past
//       return (
//         !isNaN(date.getTime()) &&  // Valid date
//         date.toDateString() !== "Invalid Date" &&
//         date >= new Date(today.toDateString()) // Not in the past
//       );
//     }

//     const allValid = weeks.every(isValidFutureDate);

//     if (!allValid) {
//       return next(createError.BadRequest('Some deadlines are invalid or in the past!'));
//     }


//     // Step 1: Fetch all team_id and project_id
//     const [teams] = await db.promise().query('SELECT team_id, project_id FROM teams where is_leader=1');
//     console.log(teams, "team");
//     if (teams.length === 0) {
//       return next(createError.NotFound('No team_id and project_id found!'));
//     }

//     // Step 2: Build insert queries
//     const insertPromises = teams.map(({ team_id, project_id }) => {
//       const sql = `
//         INSERT INTO weekly_logs_deadlines (
//           team_id, project_id,
//           week1, week2, week3, week4, week5, week6,
//           week7, week8, week9, week10, week11, week12
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//       const values = [
//         team_id, project_id,
//         week1, week2, week3, week4, week5, week6,
//         week7, week8, week9, week10, week11, week12
//       ];
//       console.log(values, "values");
//       return db.promise().query(sql, values);
//     });

//     // Step 3: Wait for all insertions
//     await Promise.all(insertPromises);
//     console.log(insertPromises, "insertPromises");
//     res.status(200).send({ message: 'Deadlines inserted for all teams.' });

//   } catch (error) {
//     next(error);
//   }
// });
// router.post('/admin/insert_deadlines_for_all_teams', async (req, res, next) => {
//   try {
//     const { week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12 } = req.body.data;
//     const { semester } = req.body;
//     const weeks = [week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12];
//     console.log(semester, "sesmmsmmsm");
//     // Validate dates
//     const isValidFutureDate = (dateStr) => {
//       const date = new Date(dateStr);
//       const today = new Date();
//       return !isNaN(date.getTime()) && date >= new Date(today.toDateString());
//     };

//     if (!weeks.every(isValidFutureDate)) {
//       return next(createError.BadRequest('Invalid or past dates!'));
//     }

//     // Fetch teams with valid project_id
//     const [teams] = await db.promise().query(
//       `SELECT team_id, project_id FROM teams WHERE project_id IS NOT NULL AND semester=${semester}`
//     );
//     console.log(teams, teams.length, "team");
//     if (teams.length === 0) {
//       return next(createError.NotFound('No teams with project_id found!'));
//     }

//     // Insert or update deadlines
//     const sql = `
//       INSERT INTO weekly_logs_deadlines (
//         team_id, project_id, week1, week2, week3, week4, week5, week6,
//         week7, week8, week9, week10, week11, week12
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       ON DUPLICATE KEY UPDATE
//         week1 = VALUES(week1),
//         week2 = VALUES(week2),
//         week3 = VALUES(week3),
//         week4 = VALUES(week4),
//         week5 = VALUES(week5),
//         week6 = VALUES(week6),
//         week7 = VALUES(week7),
//         week8 = VALUES(week8),
//         week9 = VALUES(week9),
//         week10 = VALUES(week10),
//         week11 = VALUES(week11),
//         week12 = VALUES(week12)
//     `;

//     await Promise.all(
//       teams.map((team) =>
//         db.promise().query(sql, [
//           team.team_id, team.project_id,
//           week1, week2, week3, week4, week5, week6,
//           week7, week8, week9, week10, week11, week12
//         ])
//       )
//     );

//     res.status(200).send({ message: 'Deadlines updated for all teams.' });
//   } catch (error) {
//     console.error('Database error:', error);
//     next(error);
//   }
// });
// updates deadline for all teams

router.post('/admin/insert_deadlines_for_all_teams', async (req, res, next) => {
  try {
    const { week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12 } = req.body.data;
    const { semester } = req.body;
    const weeks = [week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12];

    // Validate dates
    const isValidFutureDate = (dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      return !isNaN(date.getTime()) && date >= new Date(today.toDateString());
    };

    if (!weeks.every(isValidFutureDate)) {
      return next(createError.BadRequest('Invalid or past dates!'));
    }

    // Fetch teams with valid project_id
    const [teams] = await db.promise().query(
      `SELECT team_id, project_id FROM teams WHERE project_id IS NOT NULL AND semester=${semester}`
    );

    if (teams.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No teams with project_id found for this semester!'
      });
    }

    // Insert or update deadlines for all teams
    const teamDeadlinesSql = `
      INSERT INTO weekly_logs_deadlines (
        team_id, project_id, week1, week2, week3, week4, week5, week6,
        week7, week8, week9, week10, week11, week12
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        week1 = VALUES(week1),
        week2 = VALUES(week2),
        week3 = VALUES(week3),
        week4 = VALUES(week4),
        week5 = VALUES(week5),
        week6 = VALUES(week6),
        week7 = VALUES(week7),
        week8 = VALUES(week8),
        week9 = VALUES(week9),
        week10 = VALUES(week10),
        week11 = VALUES(week11),
        week12 = VALUES(week12)
    `;

    // Insert or update semester-wise deadlines
    const semesterDeadlinesSql = `
  INSERT INTO semester_wise_deadline (
    semester, week1, week2, week3, week4, week5, week6,
    week7, week8, week9, week10, week11, week12
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    week1 = VALUES(week1),
    week2 = VALUES(week2),
    week3 = VALUES(week3),
    week4 = VALUES(week4),
    week5 = VALUES(week5),
    week6 = VALUES(week6),
    week7 = VALUES(week7),
    week8 = VALUES(week8),
    week9 = VALUES(week9),
    week10 = VALUES(week10),
    week11 = VALUES(week11),
    week12 = VALUES(week12)
`;

    // Execute both operations in parallel
    await Promise.all([
      // Update deadlines for all teams
      Promise.all(
        teams.map((team) =>
          db.promise().query(teamDeadlinesSql, [
            team.team_id, team.project_id,
            week1, week2, week3, week4, week5, week6,
            week7, week8, week9, week10, week11, week12
          ])
        )
      ),
      // Update semester-wise deadlines
      db.promise().query(semesterDeadlinesSql, [
        semester,
        week1, week2, week3, week4, week5, week6,
        week7, week8, week9, week10, week11, week12
      ])
    ]);

    res.status(200).json({
      success: true,
      message: 'Deadlines updated for all teams and semester record.'
    });
  } catch (error) {
    console.error('Database error:', error);
    next(error);
  }
});

// Add this to your backend routes
router.get('/admin/get_semester_deadlines/:semester', async (req, res, next) => {
  try {
    const { semester } = req.params;

    const [results] = await db.promise().query(
      `SELECT * FROM semester_wise_deadline WHERE semester = ?`,
      [semester]
    );

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        data: null, // Return null if no deadlines exist for this semester
        message: 'No deadlines found for this semester'
      });
    }

    const semesterData = results[0];
    const weeks = Array(12).fill('').map((_, index) => {
      return semesterData[`week${index + 1}`] || '';
    });

    res.status(200).json({
      success: true,
      data: {
        semester: semesterData.semester,
        weeks: weeks
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    next(error);
  }
});

router.patch('/admin/update_deadline_for_all_teams', (req, res, next) => {
  try {
    const { week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12 } = req.body;

    const weeks = [week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12];

    // Function to check if a string is a valid future date
    function isValidFutureDate(dateStr) {
      const date = new Date(dateStr);
      const today = new Date();

      // Check if it's a valid date and not in the past
      return (
        !isNaN(date.getTime()) &&  // Valid date
        date.toDateString() !== "Invalid Date" &&
        date >= new Date(today.toDateString()) // Not in the past
      );
    }

    const allValid = weeks.every(isValidFutureDate);

    if (!allValid) {
      return next(createError.BadRequest('Some deadlines are invalid or in the past!'));
    }

    let sql = "update weekly_logs_deadlines set week1 = ?, week2 = ?, week3 = ?, week4 = ?, week5 = ?, week6 = ?, week7 = ?, week8 = ?, week9 = ?, week10 = ?, week11 = ?, week12 = ?";
    db.query(sql, [week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError[402]('an error occured while updating!'));
      res.send('deadlines updated successfully!');

    })
  }
  catch (error) {
    next(error);
  }
})

// updates the weekly deadlines for a specific team -> for a single week(all weeks wont be updated) ->  did'not updated weekly logs
router.patch("/admin/update_deadline/:week/:team_id", userAuth, (req, res, next) => {
  try {
    const { week, team_id } = req.params;
    let { newDeadline } = req.body;
    // console.log(week, "weeeeeeeeeeeeekkkkkkk");
    if (!week || !team_id || !newDeadline) return next(createError.BadRequest("week, team_id, or newDeadline is missing!"));
    // validating date and week
    newDeadline = new Date(newDeadline);
    let today = new Date();
    today.setHours(0, 0, 0, 0) //removes the time
    newDeadline.setHours(0, 0, 0, 0);
    const allowedWeeks = [
      "week1", "week2", "week3", "week4", "week5",
      "week6", "week7", "week8", "week9", "week10",
      "week11", "week12"
    ];
    // console.log(allowedWeeks.includes(week));
    if (!allowedWeeks.includes(week)) {
      return next(createError.BadRequest("Invalid week column name!"));
    }
    // console.log(today > newDeadline, ">>>>>>>>>>.");
    if (today > newDeadline) return next(createError.BadRequest("Invalid date!"));
    const year = newDeadline.getFullYear();
    const month = String(newDeadline.getMonth() + 1).padStart(2, '0');
    const day = String(newDeadline.getDate()).padStart(2, '0');
    newDeadline = `${year}-${month}-${day}`;

    // checks if deadlines exists -> to update
    let sql1 = "select * from weekly_logs_deadlines where team_id = ?";
    db.query(sql1, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.BadRequest(`deadlines not exist!`));
      let sql = `update weekly_logs_deadlines set \`${week}\` = ? where team_id = ?`;
      db.query(sql, [newDeadline, team_id], (error, result) => {
        if (error) return next(error);
        if (result.affectedRows === 0) return next(createError.BadRequest("some rows are not affected!"));
        res.status(200).json({ "message": `${week} deadline updated to ${newDeadline}` });
      })
    })
  }
  catch (error) {
    next(error);
  }
})

// fetches the challenge_review_request sent by teams
router.get('/admin/challenge_review/get_requests', (req, res, next) => {
  try {
    let sql = "select * from challenge_review_requests where status = 'pending'";
    db.query(sql, (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return res.send(`No pending review requests found!`);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

//get all projects
router.get('/admin/get_all_projects', (req, res, next) => {
  try {
    let sql = "select * from projects";
    db.query(sql, (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return res.send(`No projects are updated!`);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})


// accept or reject the challenge review
router.patch('/admin/challenge_review/accept_or_reject/:status/:request_id', (req, res, next) => {
  try {
    const { status, request_id } = req.params;
    if (!status || !request_id) return next(createError.BadRequest('status or request id not found!'));
    const safeStatus = status.toLowerCase();
    const validStatus = ['accept', 'reject'];
    if (!validStatus.includes(safeStatus)) return next(createError.BadRequest('invalid status!'));
    let sql = "update challenge_review_requests set status = ? where request_id = ?";
    db.query(sql, [status, request_id], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest('No rows were affected!'));
      res.send(`${request_id} :- ${status}ed`);
    })
  }
  catch (error) {
    next(error);
  }
})

//fetches the available guides and experts who does not have slot on that day
// once the admin selects the date -> this api should be immediately called =x=
router.get('/admin/challenge_review/get_available_guides_experts/:review_date', (req, res, next) => {
  try {
    const { review_date } = req.params;
    if (!review_date) return next(createError.BAd)
    // fetch all guides and experts
    let sql = "select name,reg_num from users where role = 'staff'";
    db.query(sql, (error, staffs) => {
      if (error) return next(error);
      if (staffs.length === 0) return next(createError.NotFound('staffs not found!'));
      // staffs who dont have slot on that day
      let sql1 = `SELECT name, reg_num FROM users WHERE role = 'staff' AND reg_num NOT IN (SELECT guide_reg_num FROM scheduled_reviews WHERE review_date = ? UNION SELECT expert_reg_num FROM scheduled_reviews WHERE review_date = ?)`;
      db.query(sql1, [review_date, review_date], (error, result) => {
        if (error) return next(error);
        if (result.length === 0) return res.send('No staffs are available');
        res.send(result);
      })
    })
  }
  catch (error) {
    next(error);
  }
})


// assign expert and guide for challenge_review_requests
router.patch('/admin/challenge_review/:request_id/:guide_reg_num/:expert_reg_num', (req, res, next) => {
  try {
    const { request_id, guide_reg_num, expert_reg_num } = req.params;
    const { project_id, team_lead, review_date, start_time, team_id, review_title } = req.body;

    if (!request_id || !guide_reg_num || !expert_reg_num || !project_id || !team_lead || !review_date || !start_time || !team_id || !review_title) {
      return next(createError.BadRequest('Some required data is missing'));
    }

    // Assigning expert and guide
    let sql = "UPDATE challenge_review_requests SET status = 'accept', date = ?, start_time = ?, temp_expert = ?, temp_guide = ? WHERE request_id = ?";
    db.query(sql, [review_date, start_time, guide_reg_num, expert_reg_num, request_id], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest('An error occurred while updating the challenge review request!'));

      // Insert into scheduled_reviews
      let sql1 = "INSERT INTO scheduled_reviews (project_id, team_lead, review_date, start_time, team_id, expert_reg_num, guide_reg_num, review_title) VALUES (?,?,?,?,?,?,?,?)";
      db.query(sql1, [project_id, team_lead, review_date, start_time, team_id, expert_reg_num, guide_reg_num, review_title], (error1, result1) => {
        if (error1) return next(error1);
        if (result1.affectedRows === 0) return next(createError.BadRequest('An error occurred while scheduling the review!'));
        res.send(`Challenge request accepted and review scheduled with new guide and expert!`);
      });
    });
  } catch (error) {
    next(error);
  }
});


// get project through project_id

// router.get("/admin/getproject_by_team_id/:project_id",userAuth,(req,res,next) => {
//   try{
//    const{project_id} = req.params;
//    if(!project_id)return next("project_id not found");
//    let sql = "select * from projects where project_id = ?";
//    db.query(sql,[project_id],(error,result) => {
//     if(error)return next(error);
//     return res.send(result);
//    })
//   }
//   catch(error)
//   {
//     next(error);
//   }
// })

// fetch users based on role

router.get("/admin/get_users/:role", userAuth, (req, res, next) => {
  try {
    const { role } = req.params;
    const validRoles = ['student', 'admin', 'staff'];
    const safeRole = role.toLowerCase();
    if (!validRoles.includes(safeRole)) {
      return next(createError.BadRequest("Invalid role!"))
    }
    let sql = "select * from users where role = ? and available = true";
    db.query(sql, [safeRole], (error, result) => {
      if (error) return next(error);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// remove users

router.delete("/admin/removeuser/:emailId/:reg_num/:role", userAuth, (req, res, next) => {
  try {
    const { emailId, reg_num, role } = req.params;
    if (!emailId || !reg_num || !role) return createError.BadRequest("parameters are misssing!");
    const validRoles = ['student', 'admin', 'staff'];
    const safeRole = role.toLowerCase();
    if (!validRoles.includes(safeRole)) return next(createError.BadRequest("invalid role!"));
    let sql = "delete from users where emailId = ? and reg_num = ? and role = ?";
    db.query(sql, [emailId, reg_num, safeRole], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("rows are not affected!"));
      res.send("user deleted successfully !")
    })
  }
  catch (error) {
    next(error);
  }
})

// adds timeline to the timeline table

router.post("/admin/addTimeLine", userAuth, (req, res, next) => {
  try {
    let { name, start_date, end_date } = req.body;
    if (!name.trim() || !start_date || !end_date) {
      return next(createError.BadRequest("name or start_date or end_date is undefined!"));
    }
    let time1 = new Date(start_date);
    let time2 = new Date(end_date);
    if (time1 > time2) return next(createError.BadRequest("Invalid time range!"));
    let sql = "INSERT INTO timeline (name, start_date, end_date) VALUES (?, ?, ?)";
    start_date = time1.toISOString().split('T')[0];
    end_date = time2.toISOString().split('T')[0];
    db.query(sql, [name, start_date, end_date], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("rows are not affected!"));
      res.send("Timeline added successfully to the timeline table!!");
    })
  }
  catch (error) {
    next(error);
  }
})


// fetches the timelines

router.get("/admin/get_timelines", userAuth, (req, res, next) => {
  try {
    console.log("[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[");
    let sql = "select * from timeline";
    db.query(sql, (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("rows are not affected!"));
      // console.log(result, "[[[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]]]]]]]]]]]]");
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// deletes the timeline

router.delete("/admin/remove_timeline/:id", userAuth, (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(createError.BadRequest("id not found!"));
    let sql = "delete from timeline where id = ?";
    db.query(sql, [id], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("rows are not affected!"));
      res.send(`${id}st timeline successfully deleted from timelines!`);
    })
  }
  catch (error) {
    next(error)
  }
})

// updates the whole timeline -> whole timeline (not team_specific)

router.patch("/admin/update_timeline_id/:id", userAuth, (req, res, next) => {
  try {
    const { id } = req.params;
    let { start_date, end_date } = req.body;
    if (!start_date || !end_date) return next(createError.BadRequest("req.body is missing!"))
    let date1 = new Date(start_date);
    let date2 = new Date(end_date);
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    if (date1 > date2) return next(createError.BadRequest("Invalid date"))
    start_date = date1.toISOString().split('T')[0];
    end_date = date2.toISOString().split('T')[0];
    if (!id) return next(createError.BadRequest("Timeline ID is missing in URL."));
    let sql = "UPDATE timeline SET start_date = ?, end_date = ?, cron_executed = false WHERE id = ?";
    db.query(sql, [start_date, end_date, id], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("rows are not affected!"));
      res.status(200).json({
        message: "Timeline updated successfully.",
        id,
        start_date,
        end_date
      });
    })
  }
  catch (error) {
    next(error);
  }
})

// updates whole timeline [team-specific]
router.patch("/admin/update_team_timeline/:team_id/:timelinename", userAuth, (req, res, next) => {
  try {
    const { team_id, timelinename } = req.params;
    let { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return next(createError.BadRequest("Start and end dates are required."));
    }

    if (!team_id || !timelinename) return next(createError.BadRequest('some fields are missing!'))

    start_date = new Date(start_date);
    end_date = new Date(end_date);
    start_date.setHours(0, 0, 0, 0);
    end_date.setHours(0, 0, 0, 0);

    if (start_date > end_date) {
      return next(createError.BadRequest("Start date cannot be after end date."));
    }

    start_date = start_date.toISOString().split('T')[0];
    end_date = end_date.toISOString().split('T')[0];

    const sql = `
      UPDATE timeline 
      SET start_date = ?, end_date = ?, cron_executed = false 
      WHERE team_id = ? AND name = ?
    `;

    db.query(sql, [start_date, end_date, team_id], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) {
        return next(createError.BadRequest("No timeline found for the team."));
      }

      res.status(200).json({
        message: "Team-specific timeline updated successfully.",
        "team_id": team_id,
        "start_date": start_date,
        "end_date": end_date
      });
    });
  } catch (error) {
    next(error);
  }
});

// // assign or update -> guide or expert for a paritcular team 
router.patch("/admin/assign_guide_expert/:team_id/:role", (req, res, next) => {
  try {
    const { team_id, role } = req.params;
    const { guideOrexpert_reg_num } = req.body;

    if (!team_id || !guideOrexpert_reg_num || !role) {
      return next(createError.BadRequest("Missing team_id, role, or registration number."));
    }

    const validRoles = ['sub_expert', 'guide'];
    if (!validRoles.includes(role)) {
      return next(createError.BadRequest("Invalid role!"));
    }

    // checks whether the person already acts as expert or mentor or guide for this particular team
    let checkSql = "SELECT * FROM teams WHERE team_id = ? AND (guide_reg_num = ? OR sub_expert_reg_num = ?)";
    db.query(checkSql, [team_id, guideOrexpert_reg_num, guideOrexpert_reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length >= 1) return next(createError.BadRequest('This staff already acts as guide or expert or mentor for this particular team!'));
      //updating
      let updateSql = `update teams set ${role}_reg_num = ? where team_id = ?`;
      db.query(updateSql, [guideOrexpert_reg_num, team_id], (error, result) => {
        if (error) return next(error);
        if (result.affectedRows === 0) return next(createError.BadRequest('Reg_num not updated!'));
        res.send(`${team_id} teams ${role} has updated as ${guideOrexpert_reg_num}`);
      })
    })
  } catch (error) {
    next(error);
  }
});

// // gets all projects 

// router.get("/admin/get_all_projects", (req, res, next) => {
//   try {
//     let sql = "SELECT team_id FROM team_requests";
//     db.query(sql, (error, result) => {
//       if (error) return next(error);

//       if (result.length === 0) {
//         return next(createError.NotFound("project not found!"))
//       }

//       res.send(result);
//     });
//   } catch (error) {
//     next(error);

//   }
// });

// gets the upcoming reviews

router.get('/admin/gets_all_the_upcoming_scheduled_review', (req, res, next) => {
  try {
    let sql = "select * from scheduled_reviews and review_date >= current_date()";
    db.query(sql, (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('review details not found!'));
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// fetches the reviews that are happening now ==> as a filter
router.get('/admin/fetch_current_reviews', (req, res, next) => {
  try {
    let sql = `SELECT * FROM scheduled_reviews WHERE review_date = CURRENT_DATE AND start_time BETWEEN CURRENT_TIMESTAMP() AND DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 2 HOUR);`
    db.query(sql, (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('reveiws not found!'));
      return res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})



// fetch team_members by team id
router.get("/admin/get_team_members/:team_id", (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('team_id not found!'));
    let sql = "select * from teams where team_id = ?";
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('team details not found!'));
      return res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

router.get("/admin/show_team_numbers/", (req, res, next) => {
  try {
    let sql = "select * from teams ";
    db.query(sql, (error, result) => {
      if (error) return next(error);
      return res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

router.get("/admin/get_name/:reg_num", (req, res, next) => {
  try {
    const { reg_num } = req.params;
    if (!reg_num) return next(createError.BadRequest('reg_num not found!'));
    let sql = "select name from users where reg_num = ?";
    db.query(sql, [reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('name not found!'));
      return res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})


router.get("/admin/get_teams/:team_id", (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('team_id not found!'));
    let sql = "select * from team_requests where team_id = ?";
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('name not found!'));
      return res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

module.exports = router;