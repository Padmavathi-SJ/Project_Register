const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const nodemailer = require("nodemailer");
const db = require('../config/db');
const userAuth = require("../middleware/userAuth");

// gets the request recevied by the guide

router.get("/guide/getrequests/:reg_num", userAuth, (req, res, next) => {
  try {
    let { reg_num } = req.params;
    if (!reg_num) return next(createError.BadRequest('reg_num is not defined!'));
    let sql = "select * from guide_requests where to_guide_reg_num = ? and status = 'interested'";
    db.query(sql, [reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length == 0) res.send("No request` found!");
      else {
        res.send(result);
      }
    })
  }
  catch (error) {
    next(error);
  }
})

// fetches team details, i am acting as the guide

router.get("/guide/fetch_teams/:guide_reg_num", (req, res, next) => {
  try {
    const { guide_reg_num } = req.params;
    if (!guide_reg_num) {
      return next(createError.BadRequest("guide reg num not found!"));
    }
    let sql = "select * from guide_requests where guide_reg_num = ? and status = 'accept'";
    db.query(sql, [expert_id], (error, result) => {
      if (error) return next(error);
      if (result.length == 0) return res.send("No Teams found!");
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// update status -> accept or reject
router.patch("/guide/accept_reject/:status/:team_id/:semester/:my_id", userAuth, (req, res, next) => {
  try {
    const { status, team_id, my_id, semester } = req.params;
    const { reason } = req.body;

    if (status !== "accept" && status !== "reject") {
      return res.status(400).send("Invalid status");
    }

    if (!team_id || !my_id || !semester || !reason) return next(createError.BadRequest("data is missing!"));

    //checks whether he acts as expert or mentor to that particular team
    let sql = "SELECT * FROM sub_expert_requests WHERE to_expert_reg_num = ? AND from_team_id = ? AND status = 'accept' UNION SELECT * FROM guide_requests WHERE to_guide_reg_num = ? AND from_team_id = ? AND status = 'accept'";
    db.query(sql, [my_id, team_id, my_id, team_id], (error, result) => {
      if (error) return next(error);
      if (result.length > 0) return res.status(404).send('Your are already acting as guide or mentor to this team, so you cant accept or reject this request!');

      //Update guide_requests
      let sql1 = "UPDATE guide_requests SET status = ? WHERE to_guide_reg_num = ? AND from_team_id = ? AND status = 'interested'";
      db.query(sql1, [status, my_id, team_id], (error, result) => {
        if (error) return next(error);
        if (result.affectedRows === 0) return res.status(500).send("no rows affected!")

        if (status === "accept") {
          //Count how many teams the guide has
          let sql2 = "SELECT * FROM guide_requests WHERE to_guide_reg_num = ? AND status = 'accept' and team_semester = ?";
          db.query(sql2, [my_id, semester], (error, result) => {
            if (error) return next(error);

            const mentoringTeams = result.length;
            if (mentoringTeams <= 3) {
              // Assign guide to the teams tablew
              let sql3 = "UPDATE teams SET guide_reg_num = ? WHERE team_id = ?";
              db.query(sql3, [my_id, team_id], (error, result) => {
                if (error) return next(error);
                if (result.affectedRows === 0) return res.status(500).send("no rows affected!")
                else {
                  res.send("Status updated successfully and guide assigned!");
                }
              });
            } else {
              //Guide already has 3 projects, mark them as unavailable(false)
              let sql4 = "update users set available = false where reg_num = ?";
              db.query(sql4, [my_id], (error, result) => {
                if (error) return next(error);
                if (result.affectedRows === 0) return res.status(500).send("no rows affected!")

                // remove the requests they got
                let sql5 = "DELETE FROM guide_requests WHERE to_guide_reg_num = ? AND status = 'interested'";
                db.query(sql5, [my_id], (error, result) => {
                  if (error) return next(error);
                  if (result.affectedRows === 0) return res.status(500).send("no rows affected!")
                  res.send("Status updated successfully by removing the guide from guides and guide_requests");
                });
              });
            }
          });
        } else if (status === "reject") {
          // Handle rejection: status already updated in sub_expert_requests
          let rejectSql = "Update guide_requests set reason = ? where from_team_id = ?";
          db.query(rejectSql, [reason, team_id], (error, result) => {
            if (error) return next(error);
            if (result.affectedRows === 0) return next(createError.BadRequest('reason not updated in requests table!'));
            res.send(`${team_id} rejected successfully!`)
          })

        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// sends request to guide
router.post("/guide/sent_request_to_guide/:semester", userAuth, (req, res, next) => {
  try {
    const { semester } = req.params;
    const { from_team_id, project_id, project_name, to_guide_reg_num } = req.body;

    if (!from_team_id || !project_id || !project_name || !Array.isArray(to_guide_reg_num) || to_guide_reg_num.length === 0 || !semester || (semester != 5 && semester != 7)) {
      return res.status(400).json({ message: "Some fields are required" });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });

    let validGuides = [];
    let checked = 0;

    to_guide_reg_num.forEach((guideRegNum, idx) => {
      let checkSql = "SELECT team_semester FROM guide_requests WHERE to_guide_reg_num = ? AND status = 'accept'";
      db.query(checkSql, [guideRegNum], (error, results) => {
        if (error) return next(error);

        let s5 = 0, s7 = 0;
        for (let r of results) {
          if (r.team_semester === 5) s5++;
          else if (r.team_semester === 7) s7++;
        }

        if ((semester == 5 && s5 < 3) || (semester == 7 && s7 < 3)) {
          validGuides.push(guideRegNum);
        }

        checked++; // runs on last index
        if (checked === to_guide_reg_num.length) {
          // All guides checked, now proceed to insert requests
          if (validGuides.length === 0) {
            return res.status(400).json({ message: "No eligible guides found" });
          }

          let completed = 0;
          let errors = false;

          validGuides.forEach((guide) => {
            const insertSql = "INSERT INTO guide_requests (from_team_id, project_id, project_name, to_guide_reg_num,team_semester) VALUES (?, ?, ?, ?, ?)";
            db.query(insertSql, [from_team_id, project_id, project_name, guide, semester], (error, insertResult) => {
              if (error || insertResult.affectedRows === 0) {
                console.error("Insert failed for:", guide, error || "No rows inserted");
                errors = true;
              }

              let emailQuery = "SELECT emailId FROM users WHERE reg_num = ? AND role = 'staff'";
              db.query(emailQuery, [guide], (error, emailResult) => {
                if (error || emailResult.length === 0) {
                  console.error("Email not found for:", guide);
                  errors = true;
                  checkComplete();
                } else {
                  const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: emailResult[0].emailId,
                    subject: 'Request To Accept Invite',
                    text: `Dear Guide,\n\n${from_team_id} team has requested you to be their guide. Please login to the system to accept or reject the request.\n\nThank you.`,
                  };

                  transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                      console.error("Email failed:", err);
                      errors = true;
                    }
                    checkComplete();
                  });
                }
              });

              function checkComplete() {
                completed++;
                if (completed === validGuides.length) {
                  if (errors) {
                    return res.status(500).json({ message: "Some requests or emails failed." });
                  } else {
                    return res.send("Requests sent successfully to all eligible guides!");
                  }
                }
              }
            });
          });
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// conforming review request -> sent by the team, both guide and expert should accept
router.post("/guide/add_review_details/:request_id/:status/:guide_reg_num/:team_id", userAuth, (req, res, next) => {
  try {
    const { project_id, project_name, team_lead, review_date, start_time, reason, review_title } = req.body;
    const { request_id, status, guide_reg_num, team_id } = req.params;
    if (!project_id || !project_name || !team_lead || !review_date || !start_time || !request_id || !status || !team_id || !review_title) {
      return next(createError.BadRequest("data is missing!"));
    }
    const safeStatus = status.toLowerCase();
    const validStatus = ['accept', 'reject'];
    if (!validStatus.includes(safeStatus)) return next(createError.BadRequest('invalid status!'));
    // updating status
    let updatequery = "UPDATE review_requests SET guide_status = ? WHERE request_id = ?";
    db.query(updatequery, [safeStatus, request_id], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("some rows not affected!"));
      if (safeStatus === 'accept') {
        // checking whether expert accepted the review request
        let sql1 = "select expert_status,expert_reg_num,temp_meeting_link from review_requests where request_id = ?";
        db.query(sql1, [request_id], (error, result) => {
          if (error) return next(error);
          if (result.length === 0) return next(createError.BadRequest('expert status not found!'));
          if (result[0].expert_status !== 'accept') {
            return res.send('Guide accepted, but expert has not yet accepted the request!');
          }
          const expert_reg_num = result[0].expert_reg_num;
          const meeting_link = result[0].temp_meeting_link;

          // inserting into scheduled reivews
          let sql = "insert into scheduled_reviews(project_id,project_name,team_lead,review_date,start_time,expert_reg_num,guide_reg_num,team_id,review_title,meeting_link) values(?,?,?,?,?,?,?,?,?,?)";
          db.query(sql, [project_id, project_name, team_lead, review_date, start_time, expert_reg_num, guide_reg_num, team_id, review_title, meeting_link], (error, result) => {
            if (error) return next(error);
            if (result.affectedRows === 0) return next(createError.BadRequest("no rows got affected!"));
            // removing request from the review requests
            let sql1 = "delete from review_requests where request_id = ?";
            db.query(sql1, [request_id], (error, result) => {
              if (error) return next(error);
              return res.send(`${request_id} :- ${status}ed successfully and inserted into the scheduled reviews`);
            })
          })
        })
      }
      else if (safeStatus == 'reject') {
        if (!reason) return next(createError.BadRequest('reason not found!'));
        let rejectSql = "update review_requests set guide_reason = ? where request_id = ?";
        db.query(rejectSql, [reason, request_id], (error, result) => {
          if (error) return next(error);
          if (result.affectedRows === 0) return next(createError.BadRequest('some rows not got affected'));
          return res.send(`${request_id} :- ${status}ed successfully`)

        })
      }
    })
  }
  catch (error) {
    next(error);
  }
})

// fetching the upcoming reviews

router.get('/guide/fetch_upcoming_reviews/:guide_reg_num', (req, res, next) => {
  try {
    const { guide_reg_num } = req.params;
    if (!guide_reg_num) return next(createError.BadRequest('guide register number is undefined!'));
    let sql = `SELECT * FROM scheduled_reviews WHERE guide_reg_num = ? AND (attendance IS NULL OR attendance = '')AND CONCAT(review_date, ' ', start_time) >= NOW() - INTERVAL 3 HOUR;`;

    db.query(sql, [guide_reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('meeting links not found!'));
      return res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// fetch completed reviews

router.get("/guide/fetch_completed_reviews/:team_id", (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('team_id number not found!'));
    let sql = `SELECT * FROM scheduled_reviews WHERE team_id = ? AND attendance NOT IN ('present', 'absent') AND TIMESTAMP(review_date, start_time) <= NOW() AND TIMESTAMP(review_date, start_time) >= NOW() - INTERVAL 2 DAY`;
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return res.send('No completed reviews within a time internal of 2!');
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// fetching the review requests sent by teams

router.get("/guide/fetch_review_requests/:guide_reg_num", userAuth, (req, res, next) => {
  try {
    const { guide_reg_num } = req.params;
    console.log(guide_reg_num, "guide_reg_num");
    if (!guide_reg_num) return next(createError.BadRequest("guide id is undefined!"));
    let sql = "select * from review_requests where guide_reg_num = ? and guide_status = 'interested'";
    db.query(sql, [guide_reg_num], (error, result) => {
      if (error) return next(error);
      return res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// adds detaied marks to rubix -> also inserts total mark for the review guide_mark and expert_mark to the scheduled_Review table
// reivew no -> 1 or 2 -> get from input tag

router.post("/guide/review/add_team_marks/:guide_reg_num", userAuth, (req, res, next) => {
  const { guide_reg_num } = req.params;
  const {
    review_title,
    review_date,
    team_id,
    guide_literature_survey,
    guide_aim,
    guide_scope,
    guide_need_for_study,
    guide_proposed_methodology,
    guide_work_plan,
    guide_remarks
  } = req.body;

  if (
    !review_title || !review_date || !team_id ||
    guide_reg_num == null ||
    guide_literature_survey == null ||
    guide_aim == null ||
    guide_scope == null ||
    guide_need_for_study == null ||
    guide_proposed_methodology == null ||
    guide_work_plan == null ||
    guide_remarks == null
  ) {
    return next(createError.BadRequest("Missing required fields!"));
  }

  const validReview_titles = ['1st_review', '2nd_review', 'optional_review'];
  if (!validReview_titles.includes(review_title))
    return next(createError.BadRequest('Invalid review title!'));

  // marks can be entered within 6 days
  const reviewDate = new Date(review_date);
  const currentDate = new Date();
  const diffInMs = currentDate - reviewDate;
  const diffInHours = diffInMs / (1000 * 60 * 60);
  if (diffInHours > 3) {
    return next(createError.Forbidden('Marks can only be entered within 3 hours after the review.'));
  }


  const formattedDate = new Date(review_date).toISOString().split('T')[0];

  // Check if already added
  const checkSql = "SELECT * FROM review_marks_team WHERE team_id = ? AND review_date = ? AND review_title = ?";
  db.query(checkSql, [team_id, formattedDate, review_title], (error, result) => {
    if (error) return next(error);
    if (result.length > 0 && result[0].total_guide_marks !== null) {
      return next(createError.BadRequest("Review marks already updated!"));
    }

    const total_guide_marks =
      parseInt(guide_literature_survey) +
      parseInt(guide_aim) +
      parseInt(guide_scope) +
      parseInt(guide_need_for_study) +
      parseInt(guide_proposed_methodology) +
      parseInt(guide_work_plan);

    const fetchExpertSql = `SELECT * FROM review_marks_team WHERE review_title = ? AND review_date = ? AND team_id = ? and guide_reg_num = ?`;

    db.query(fetchExpertSql, [review_title, formattedDate, team_id, guide_reg_num], (err, result) => {
      if (err) return next(err);
      if (result.length === 0) {
        // not present so insert
        const insertSql = "insert into review_marks_team (review_title,review_date,team_id,guide_literature_survey,guide_aim,guide_scope,guide_need_for_study, guide_proposed_methodology,guide_work_plan,total_marks,total_guide_marks,guide_remarks) values (?,?,?,?,?,?,?,?,?,?,?,?)";
        const values = [
          review_title,
          formattedDate,
          team_id,
          guide_literature_survey,
          guide_aim,
          guide_scope,
          guide_need_for_study,
          guide_proposed_methodology,
          guide_work_plan,
          total_guide_marks,
          total_guide_marks, // since we are inserting no guide mark present
          guide_remarks,
        ];
        db.query(insertSql, values, (error, result) => {
          if (error) return next(error);
          if (result.affectedRows === 0) return next(createError.InternalServerError("Failed to insert review marks."));
          return res.send({ message: "Guide marks updated successfully!" });
        })
        return;
      }

      const total_expert_marks = result[0].total_expert_marks || 0;
      const total_marks = total_guide_marks + total_expert_marks;

      const updateSql = `
        UPDATE review_marks_team SET
          guide_literature_survey = ?,
          guide_aim = ?,
          guide_scope = ?,
          guide_need_for_study = ?,
          guide_proposed_methodology = ?,
          guide_work_plan = ?,
          total_guide_marks = ?,
          total_marks = ?,
          guide_remarks = ?
        WHERE review_title = ? AND review_date = ? AND team_id = ?
      `;

      const values = [
        guide_literature_survey,
        guide_aim,
        guide_scope,
        guide_need_for_study,
        guide_proposed_methodology,
        guide_work_plan,
        total_guide_marks,
        total_marks,
        guide_remarks,
        review_title,
        formattedDate,
        team_id
      ];

      db.query(updateSql, values, (err, result) => {
        if (err) return next(err);
        if (result.affectedRows === 0) {
          return next(createError.BadRequest("No matching record found to update."));
        }

        res.send({ message: "Guide marks updated successfully!", total_marks });
      });
    });
  });
});

// adds marks to a seperate individual

router.post('/guide/review/add_marks_to_individual/:guide_reg_num/:reg_num', (req, res, next) => {
  try {
    const { guide_reg_num, reg_num } = req.params;
    const { team_id, review_title, review_date, guide_oral_presentation, guide_viva_voce_and_ppt, guide_contributions, total_guide_marks, guide_remarks } = req.body;
    if (!review_title || !review_date || !guide_reg_num || !reg_num || !team_id) return next(createError.BadRequest('guide register number or student register number is missing!'));
    if (!guide_oral_presentation || !guide_viva_voce_and_ppt || !guide_contributions || !total_guide_marks || !guide_remarks) {
      return next(createError.BadRequest('data is missing!'));
    }

    const validReview_titles = ['1st_review', '2nd_review', 'optional_review'];
    if (!validReview_titles.includes(review_title)) {
      return next(createError.BadRequest('Invalid review title!'));
    }

    const reviewDate = new Date(review_date);
    const currentDate = new Date();
    const diffInMs = currentDate - reviewDate;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    if (diffInHours > 3) {
      return next(createError.Forbidden('Marks can only be entered within 3 hours after the review.'));
    }

    const formattedDate = new Date(review_date).toISOString().split('T')[0];

    // check if already added
    const checkSql = "SELECT * FROM review_marks_individual WHERE team_id = ? AND review_date = ? AND review_title = ? and guide_reg_num = ?";
    db.query(checkSql, [team_id, formattedDate, review_title, guide_reg_num], (error, Checkresult) => {
      if (error) return next(error);
      if (Checkresult.length > 0 && Checkresult[0].total_guide_marks !== null) {
        return next(createError.BadRequest("Review marks already updated!"));
      }

      const total_guide_marks = parseInt(guide_oral_presentation) + parseInt(guide_viva_voce_and_ppt) + parseInt(guide_contributions)

      const fetchExpertSql = `SELECT * FROM review_marks_individual WHERE review_title = ? AND review_date = ? AND team_id = ? and guide_reg_num = ?`;
      db.query(fetchExpertSql, [review_title, formattedDate, team_id, guide_reg_num], (err, result) => {
        if (err) return next(err);
        if (result.length === 0) {
          // not present so insert
          const insertSql = `
      INSERT INTO review_marks_individual (
        review_title,
        review_date,
        team_id,
        student_reg_num,
        guide_oral_presentation,
        expert_oral_presentation,
        guide_viva_voce_and_ppt,
        expert_viva_voce_and_ppt,
        guide_contributions,
        expert_contributions,
        total_expert_marks,
        total_guide_marks,
        total_marks,
        guide_remarks,
        guide_reg_num,
        expert_reg_num
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

          const values = [
            review_title,
            formattedDate,
            team_id,
            reg_num,
            guide_oral_presentation,
            0, // expert_oral_presentation default 0 at insert
            guide_viva_voce_and_ppt,
            0, // expert_viva_voce_and_ppt default 0 at insert
            guide_contributions,
            0, // expert_contributions default 0 at insert
            0, // total_expert_marks default 0 at insert
            total_guide_marks,
            total_guide_marks, // total_marks = guide + expert = guide only now
            guide_remarks,
            guide_reg_num,
            null // expert_reg_num unknown initially
          ];


          db.query(insertSql, values, (error, result) => {
            if (error) return next(error);
            if (result.affectedRows === 0) return next(createError.InternalServerError("Failed to insert review marks."));
            return res.send({ message: "Guide marks updated successfully!" });
          })
          return;
        }
        const total_expert_marks = result[0].total_expert_marks || 0;
        const total_marks = total_guide_marks + total_expert_marks;

        const updateSql = `
        UPDATE review_marks_individual SET
          guide_oral_presentation,
          guide_viva_voce_and_ppt,
          guide_contributions,
          total_guide_marks = ?,
          total_marks = ?,
          guide_remarks = ?
        WHERE review_title = ? AND review_date = ? AND team_id = ?
      `;

        const values = [
          guide_oral_presentation,
          guide_viva_voce_and_ppt,
          guide_contributions,
          total_guide_marks,
          total_guide_marks,
          total_marks,
          guide_remarks,
          review_title,
          formattedDate,
          team_id
        ];

        db.query(updateSql, values, (err, result) => {
          if (err) return next(err);
          if (result.affectedRows === 0) {
            return next(createError.BadRequest("No matching record found to update."));
          }

          res.send({ message: "Guide marks updated successfully!", total_marks });
        });
      })
    })
  }
  catch (error) {
    next(error);
  }
})


// adds reply to the query

router.patch("/add_reply/:query_id", userAuth, (req, res, next) => { // after 100 deletes old one
  try {
    const { reply } = req.body;
    const { query_id } = req.params;
    if (!reply) return next(createError.BadRequest("reply not found!"));
    let sql = "UPDATE queries SET reply = ? WHERE query_id = ?;";
    db.query(sql, [reply, query_id], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest("rows are not affected!"));
      res.send("reply added successfully!");
    })
  }
  catch (error) {
    next(error);
  }
})

// fecthes the queries received
router.get("/guide/get_queries/:guide_reg_num", userAuth, (req, res, next) => {
  try {
    const { guide_reg_num } = req.params;
    if (!guide_reg_num) return next(createError.BadRequest("reg_num not found!"));
    let sql = "select * from queries where guide_reg_num = ?";
    db.query(sql, [guide_reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length == 0) return res.send("No queries found!");
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// fetches team details mentored by me -> 1st
router.get("/guide/fetch_guiding_teams/:guide_id", userAuth, (req, res, next) => {
  try {
    const { guide_id } = req.params;
    if (!guide_id) {
      return next(createError.BadRequest("guide id not found!"));
    }

    let sql = "select * from guide_requests where to_guide_reg_num = ? and status = 'accept'";
    db.query(sql, [guide_id], (error, teams) => {
      if (error) return next(error);
      if (teams.length === 0) return res.send("No Teams found!");
      res.send(teams);
    });
  } catch (error) {
    next(error);
  }
});


// fetches the no of weeks verified -> particular team_id

router.get('/guide/no_of_weeks_verified/:team_id', (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('team_id is not defined!'));
    let sql = "SELECT MAX(week_number) AS max_week FROM weekly_logs_verification WHERE team_id = ? and is_verified = true"
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound(`no have been verified for the team :-${team_id}`));
      return res.send(result[0].max_week);
    })
  }
  catch (error) {
    next(error);
  }
})

// fetches the pending verifications that needs to be done by me -> gives only team_id -> 1st
// finds the team_id that is ready for weekly_log verification

router.get('/guide/fetching_pending_verifications/:guide_reg_num', (req, res, next) => {
  try {
    const { guide_reg_num } = req.params;
    if (!guide_reg_num) return next(createError.BadRequest('guide_reg_num not found!'));
    let sql = "select team_id from weekly_logs_verification where guide_reg_num = ? and is_verified = false";
    db.query(sql, [guide_reg_num], (error, team_id) => {
      if (error) return next(error);
      if (team_id.length === 0) return res.send('No pending teams to be verified!');
      res.send(team_id);
    })
  }
  catch (error) {
    next(error);
  }
})

// gets entire team -> details 

router.get('/guide/gets_entire_team/:team_id', (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest('team_id not found!'));

    const sql = `select * from teams where team_id = ?`;

    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('data not found'));
      res.send(result);
    });
  } catch (error) {
    next(error);
  }
});


// verify weekly logs -> 3rd

router.patch("/guide/verify_weekly_logs/:guide_reg_num/:week/:status/:team_id", userAuth, (req, res, next) => {
  try {
    const { guide_reg_num, team_id, week, status } = req.params;
    const { remarks, reason } = req.body;

    if (!guide_reg_num || !team_id || !week)
      return next(createError.BadRequest("guide_reg_num, team_id, week, or remarks is missing!"));

    const safeStatus = status.toLowerCase();
    const validStatus = ['accept', 'reject'];
    if (!validStatus.includes(safeStatus)) {
      return next(createError.BadRequest('invalid status!'));
    }

    if (status === 'reject' && reason.length === 0) {
      return next(createError.BadRequest('reason not found!'));
    }

    const weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12)
      return next(createError.BadRequest("Invalid week number!"));

    // validating guide register number

    const sql = `SELECT guide_reg_num, week${weekNum}_progress AS week_progress FROM teams WHERE team_id = ?`;
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0)
        return next(createError.NotFound("Team not found"));
      if (result[0].guide_reg_num !== guide_reg_num)
        return res.status(403).json({ message: "Guide is not assigned to this team" });

      if (status === 'accept') {
        if (!remarks) return next(createError.BadRequest('remarks is not found!'));
        // Check if already verified
        const checkSql = `SELECT * FROM weekly_logs_verification WHERE team_id = ? AND week_number = ? and is_verified = true`;
        db.query(checkSql, [team_id, weekNum], (error, found) => {
          if (error) return next(error);
          if (found.length > 0)
            return next(createError.Conflict(`Week ${weekNum} has already been verified`));

          const verifiedAt = new Date();
          const insertSql = "update weekly_logs_verification set is_verified = ?,verified_by = ?,verified_at = ?,remarks = ?,status = ? where team_id = ? and week_number = ?";
          db.query(insertSql, [true, guide_reg_num, verifiedAt, remarks, safeStatus, team_id, weekNum], (error, result) => {
            if (error) return next(error);
            if (result.affectedRows === 0)
              return next(createError.BadRequest("Failed to verify week progress"));

            return res.send(`Week ${weekNum} successfully verified by ${guide_reg_num}`);
          });
        });
      }
      else if (status === 'reject') {
        if (!reason) return next(createError.BadRequest('reason not found!'));
        // update reject status
        let rejectSql = "update weekly_logs_verification set status = ?,reason = ? where team_id = ? and week_number = ?";
        db.query(rejectSql, [safeStatus, reason, team_id, weekNum], (error1, result1) => {
          if (error1) return next(error1);
          if (result1.affectedRows === 0) return next(createError.BadRequest('some rows not selected!'));

          // clear the progress in the teams -> for each person
          const clearSql = `update teams set week${weekNum}_progress = null where team_id  = ?`;
          db.query(clearSql, [team_id], (error2, result2) => {
            if (error2) return next(error2);
            if (result2.affectedRows === 0) return next(createError.BadRequest('some rows not affected!'));
            return res.send(`Week ${weekNum} rejected and progress cleared for team ${team_id}`);
          })
        })
      }
    });
  } catch (error) {
    next(error);
  }
});



// checks if already updated
router.get("/guide/checks_already_guide_updated_weekly_progress/:team_id/:week", (req, res, next) => {
  try {
    const { team_id, week } = req.params;
    if (!team_id || !week) return next(createError.BadRequest("data is missing!"));
    let sql = "select is_verified from weekly_logs_verification where team_id = ? and week = ?";
    db.query(sql, [team_id, week], (error, result) => {
      if (error) return next(error);
      res.send(result);
    })
  }
  catch (error) {
    next(error)
  }
})

//fetches all deadlines for a team
router.get("/guide/fetchDeadlines/:team_id", (req, res, next) => {
  try {
    const { team_id } = req.params;
    if (!team_id) return next(createError.BadRequest("team_id not found!"));
    let sql = "select * from weekly_logs_deadlines where team_id = ?";
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})


module.exports = router;