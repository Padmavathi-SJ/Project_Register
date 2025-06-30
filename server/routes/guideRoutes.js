const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");
const guideController = require('../controllers/guideController');

// Get all timelines
router.post("/sent_request_to_guide/:semester", userAuth, guideController.sendGuideRequest);
router.get("/getrequests/:reg_num", userAuth, guideController.getGuideRequests);
router.get("/fetch_guiding_teams/:guide_id", userAuth, guideController.fetchGuidingTeams);
router.get("/fetch_review_requests/:guide_reg_num", userAuth, guideController.fetchGuideReviewRequests);
router.patch("/accept_reject/:status/:team_id/:semester/:my_id", userAuth, guideController.handleGuideRequest);
router.get("/no_of_weeks_verified/:team_id", userAuth, guideController.getVerifiedWeeksCount);
router.get("/gets_entire_team/:team_id", userAuth, guideController.getTeamDetails);
router.get("/get_queries/:guide_reg_num", userAuth, guideController.getGuideQueries);
router.get("/fetch_completed_reviews/:team_id", userAuth, guideController.fetchCompletedReviews);
router.get("/fetchDeadlines/:team_id", userAuth, guideController.fetchTeamDeadlines);
router.get("/fetch_upcoming_reviews/:guide_reg_num", userAuth, guideController.fetchUpcomingReviews);
router.patch("/add_reply/:query_id", userAuth, guideController.addReplyToQuery);
router.patch("/verify_weekly_logs/:guide_reg_num/:week/:status/:team_id", userAuth, guideController.verifyWeeklyLogs);
router.post("/add_review_details/:request_id/:status/:guide_reg_num/:team_id", userAuth, guideController.handleReviewConfirmation);
router.post("/review/add_team_marks/:guide_reg_num", userAuth, guideController.addTeamReviewMarks);
router.post("/review/add_marks_to_individual/:guide_reg_num/:reg_num", userAuth, guideController.addIndividualReviewMarks);


module.exports = router;
