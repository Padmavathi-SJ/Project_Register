const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");
const generalController = require('../controllers/generalController');


router.get("/getRole_guide_or_expert/:reg_num/:team_id", generalController.getUserRoleForTeam);

module.exports = router;