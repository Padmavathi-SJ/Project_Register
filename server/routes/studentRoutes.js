const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");
const studentController = require('../controllers/studentController');
const upload = require("../utils/fileUpload");

// Get all timelines
router.post("/fetch_team_status_and_invitations", userAuth, studentController.fetchTeamStatusAndInvitations);
router.get("/request_recived/:reg_num", userAuth, studentController.getReceivedRequests);
router.put("/profile/update-project-type", userAuth, studentController.updateProjectType);
router.post("/join_request", userAuth, studentController.createJoinRequest);
router.get("/get_student_details_by_regnum/:reg_num", userAuth, studentController.getStudentByRegNum);
router.patch("/team_request/:status/:to_reg_num/:from_reg_num", userAuth, studentController.handleTeamRequest);
router.patch("/team_request/conform_team", userAuth, studentController.confirmTeam);
router.get("/get_project_details/:project_id", userAuth, studentController.getProjectDetails);
router.get("/show_upcoming_deadline_weekly_logs_and_timeline/:team_id", userAuth, studentController.getUpcomingDeadlines);
router.get("/check_accepted_status/:reg_num", userAuth, studentController.checkAcceptedStatus);
router.get("/guide_status/:team_id", userAuth, studentController.getGuideStatus);
router.get("/expert_status/:team_id", userAuth, studentController.getExpertStatus);
router.get("/getTeamDetails/:reg_num", userAuth, studentController.getTeamDetails);
router.post("/addproject/:project_type/:team_id/:reg_num", userAuth, studentController.addProject);
router.get("/get_name_by_reg_number/:reg_num", userAuth, studentController.getStudentNameByRegNumber);
router.get("/get_review_history/:team_id", userAuth, studentController.getReviewHistory);
router.get("/checks_whether_log_updated/:team_id/:week/:reg_num", userAuth, studentController.getReviewHistory);
router.get("/fetch_upcoming_reviews/:team_id", userAuth, studentController.fetchStudentUpcomingReviews);
router.get("/get_queries_sent_by_my_team/:team_id", userAuth, studentController.getTeamQueries);
router.get("/get_review_request_history/:team_id", userAuth, studentController.getReviewRequestHistory);
router.post("/update_progress/:week/:reg_num/:team_id", userAuth, studentController.updateProgress);
router.post("/student_query/:team_member/:guide_reg_num", userAuth, studentController.submitStudentQuery);
router.post("/send_review_request/:team_id/:project_id/:reg_num", userAuth, upload, studentController.sendReviewRequest);



module.exports = router;
