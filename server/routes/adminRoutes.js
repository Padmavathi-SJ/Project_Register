const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");
const adminController = require('../controllers/adminController');
const multer = require('multer');

// Configure Multer
const upload = multer({ dest: 'uploads/' });

// Get all timelines
router.get("/get_timelines", userAuth, adminController.getTimelines);
router.get("/get_name/:reg_num", userAuth, adminController.getUserNameByRegNum);
router.get("/get_users/:role", userAuth, adminController.getUsersByRole);
router.get("/show_team_numbers/", userAuth, adminController.getTeamNumbers);
router.get("/teacher/getprojects", userAuth, adminController.getProjects);
router.get("/get_semester_deadlines/:semester", userAuth, adminController.getSemesterDeadlines);
router.get("/get_team_members/:team_id", userAuth, adminController.getTeamMembers);
router.get("/get_all_projects", userAuth, adminController.getAllProjects);
router.get("/get_teams/:team_id", userAuth, adminController.getTeamDetails);
router.post("/insert_deadlines_for_all_teams", userAuth, adminController.insertDeadlinesForAllTeams);
router.patch("/assign_guide_expert/:team_id/:role", userAuth, adminController.assignGuideExpert);
router.patch("/update_timeline_id/:id", userAuth, adminController.updateTimeline);
router.delete("/remove_timeline/:id", userAuth, adminController.deleteTimeline);
router.post("/addTimeLine", userAuth, adminController.addTimeline);
router.post('/bulk-upload-users', upload.single('file'), adminController.bulkUploadUsers);


// Use the controller for the route
// router.post('/bulk-upload-users', upload.single('file'), bulkUploadUsers);

module.exports = router;
