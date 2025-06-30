const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const db = require('../config/db');

router.post("/teacher/addproject/:project_type", (req, res, next) => {
  try {
    const { project_type } = req.params;
    const { project_name, cluster, description } = req.body;

    if (!project_type || !project_name || !cluster || !description) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    if (project_type != 'INTERNAL' && project_type != 'EXTERNAL') return next(createError.BadRequest("invalid project_type"))

    const sql = "SELECT COUNT(*) AS count FROM projects";
    db.query(sql, (error, result) => {
      if (error) return next(error);

      const project_length = result[0].count + 1;
      const project_id = `P${String(project_length).padStart(4, "0")}`;

      const sql1 = `
        INSERT INTO projects (project_id, project_name, cluster, description, project_type) VALUES (?, ?, ?, ?, ?)`;
      const values = [project_id, project_name, cluster, description, project_type];

      db.query(sql1, values, (error, result) => {
        if (error) return next(error);
        res.send("Project added successfully!");
      });
    });
  } catch (error) {
    next(error.message);
  }
});

router.get("/teacher/fetch_all_projects", (req, res, next) => {
  try {
    let sql = "select * from projects";
    db.query(sql, (error, result) => {
      if (error) return next(error);
      res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

router.get("/teacher/getprojects", (req, res, next) => {
  try {
    let sql = "select * from projects";
    db.query(sql, (error, result) => {
      if (error) return next(error);
      res.send(result);

    })
  }
  catch (error) {
    next(error.message);
  }
})

router.get("/teacher/get_projects_by_cluster/:cluster", (req, res, next) => {
  try {
    let cluster = req.params.cluster;
    let sql = "select * from projects where cluster = ?";
    db.query(sql, [cluster], (error, result) => {
      if (error) return next(error);
      else res.send(result);
    })
  }
  catch (error) {
    next(error);
  }
})

router.get("/teacher/get_projects_by_id/:projectId", (req, res, next) => {
  try {
    const { projectId } = req.params;
    const sql = "SELECT * FROM projects WHERE project_id = ?";
    db.query(sql, [projectId], (error, result) => {
      if (error) return next(error);
      if (result.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.send(result);
    });
  } catch (error) {
    next(error);
  }
});

// Get teams by project
router.get("/teacher/get_teams_by_project/:projectId", (req, res, next) => {
  const projectId = req.params.projectId;
  const sql = `SELECT team_id, team_name FROM teams WHERE project_id = ?`;
  db.query(sql, [projectId], (err, results) => {
    if (err) return next(err);
    res.json(results);
  });
});

// Get team progress by teamId
router.get("/teacher/get_team_progress/:teamId", (req, res, next) => {
  const teamId = req.params.teamId;
  // Example progress data from a 'team_progress' table
  const sql = `SELECT phase_name as name, progress_percentage as progress, details FROM team_progress WHERE team_id = ? ORDER BY phase_number`;
  db.query(sql, [teamId], (err, results) => {
    if (err) return next(err);
    res.json({ phases: results });
  });
});


module.exports = router;