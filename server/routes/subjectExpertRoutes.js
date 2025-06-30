const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");
const subjectExpertController = require('../controllers/subjectExpertController');

// Get all timelines
router.post("/sent_request_to_expert/:semester", subjectExpertController.sendExpertRequest);
router.get("/getrequests/:reg_num", subjectExpertController.getExpertRequests);
router.get("/fetch_teams/:expert_id", subjectExpertController.fetchExpertTeams);
router.get("/fetch_review_requests/:expert_reg_num", subjectExpertController.fetchReviewRequests);
router.get("/fetch_completed_reviews/:team_id", subjectExpertController.fetchCompletedReviews);
router.get("/fetch_upcoming_reviews/:expert_reg_num", subjectExpertController.fetchExpertUpcomingReviews);
router.patch("/accept_reject/:status/:team_id/:semester/:my_id", subjectExpertController.handleExpertRequest);
router.patch("/mark_end_time/:review_id", subjectExpertController.markReviewEndTime);
router.post("/add_review_details/:request_id/:status/:expert_reg_num/:team_id", subjectExpertController.handleExpertReviewConfirmation);
router.post("/review/add_team_marks/:expert_reg_num", subjectExpertController.addExpertTeamReviewMarks);
router.post("/review/add_marks_to_individual/:expert_reg_num/:reg_num", subjectExpertController.addExpertMarksToIndividual);


module.exports = router;