const express = require("express");
const router = express.Router();
const db = require('../config/db');
const createError = require('http-errors');


// get logged in user information
router.get('/user/get_my_information/:reg_num', (req, res, next) => {
  try {
    const { reg_num } = req.params;
    if (!reg_num) return next(createError.BadRequest('Reg_num not found!'));
  }
  catch (error) {
    next(error);
  }
})

// says whether he is expert or guide for that team -> gives role
router.get('/user/getRole_guide_or_expert/:reg_num/:team_id', (req, res, next) => {
  try {
    const { reg_num, team_id } = req.params;
    if (!reg_num || !team_id) return next(createError.BadRequest('register number or team_id not found!'));

    const sql = "SELECT guide_reg_num, sub_expert_reg_num FROM teams WHERE team_id = ?";
    db.query(sql, [team_id], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) return next(createError.NotFound('Team not found'));

      const team = result[0];

      if (team.guide_reg_num === reg_num) {
        return res.send('guide');
      } else if (team.sub_expert_reg_num === reg_num) {
        return res.send('sub_expert');
      } else {
        // The user is neither guide nor expert for this team
        return res.status(404).send('User is neither guide nor expert for this team');
      }
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;