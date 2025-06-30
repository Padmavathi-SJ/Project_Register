const express = require("express");
const router = express.Router();
const createError = require('http-errors');
const db = require('../config/db');
const userAuth = require('../middleware/userAuth')

//gets all the reg_num and names of mentees

router.get('/mentor/fetch_mentees/:mentor_reg_num', (req, res, next) => {
  try {
    const { mentor_reg_num } = req.params;
    if (!mentor_reg_num) return next(createError.BadRequest('mentor register number not found!'));
    let sql = "select * from mentors_mentees where mentor_reg_num = ?";
    db.query(sql, [mentor_reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('mentees not found!'));
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// gets the optional review request sent to me
router.get('mentor/optional_review/:mentor_reg_num', (req, res, next) => {
  try {
    const { mentor_reg_num } = req.params;
    if (!mentor_reg_num) return next(createError.NotFound('mentor register number not found!'));
    let sql = "select * from optional_review_requests where mentor_reg_num = ? and status = 'pending' and review_date >= current_date()";
    db.query(sql, [mentor_reg_num], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('optional review request not found!'));
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

// accept or reject the optional review_request
router.patch('/mentor/accept_or_reject/:team_id/:mentor_reg_num/:request_id/:status', (req, res, next) => {
  try {
    const { request_id, status, mentor_reg_num, team_id } = req.params;
    const { team_lead, project_id, review_date, start_time, reason } = req.body;
    if (!request_id || !status || !mentor_reg_num || !team_id) return next(createError.BadRequest('request_id or team_id or status or mentor_reg_num not found!'));
    const safeStatus = status.toLowerCase();
    const validStatus = ['accept', 'reject'];
    if (!validStatus.includes(safeStatus)) return next(createError.BadRequest('invalid status type!'));
    let sql = "update optional_review_status set status = ? where request_id = ? and mentor_reg_num = ?";
    db.query(sql, [safeStatus, request_id, mentor_reg_num], (error, result) => {
      if (error) return next(error);
      if (result.affectedRows === 0) return next(createError.BadRequest('an error occured while changing the status!'));

      if (safeStatus === 'accept') {
        // mentor accepted so sent request to expert and guide and expert

        // fetch expert and guide reg_num through team_id and sent request for optional reivew
        let sql1 = "select guide_reg_num,sub_expert_reg_num from teams where team_id = ?";
        db.query(sql1, [team_id], (error1, result1) => {
          if (error1) return next(error1);
          if (result1.length === 0) return next(createError.NotFound('expert and guide register number not found!'));
          const guide_reg_num = result1[0].guide_reg_num;
          const sub_expert_reg_num = result1[0].sub_expert_reg_num;

          // insert into review_requests

          const today = new Date();
          const reviewDate = new Date(review_date);
          today.setHours(0, 0, 0, 0);
          reviewDate.setHours(0, 0, 0, 0);

          if (reviewDate < today) {
            return next(createError.BadRequest("Invalid date! Review date cannot be in the past."));
          }

          const formattedDate = reviewDate.toISOString().split('T')[0];

          const insertSql = `
                INSERT INTO review_requests
                (team_id, project_id, team_lead, review_date, start_time, expert_reg_num, guide_reg_num, review_title)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

          db.query(insertSql, [team_id, project_id, team_lead, formattedDate, start_time, sub_expert_reg_num, guide_reg_num, 'optional'], (error, result) => {
            if (error) return next(error);
            if (result.affectedRows === 0) return res.status(500).json({ message: "Insertion failed!" });
            return res.send(`${formattedDate} - ${start_time}: Review request submitted successfully.`);
          });

        })

      }
      else {
        if (!reason) return next(createError.BadRequest('reason not found!'));
        let reject = "update optional_review_requests set status = 'reject',reason = ? where request_id = ?";
        db.query(reject, [request_id], (error, result) => {
          if (error) return next(error);
          if (result.affectedRows === 0) return next(createError.BadRequest('an error occured while rejecting'))
          res.send('optional review rejected successfully!')
        })
      }
    })
  }
  catch (error) {
    next(error);
  }
})

module.exports = router;