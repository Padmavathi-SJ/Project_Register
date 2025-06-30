const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const xlsx = require('xlsx');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const createError = require('http-errors');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const bulkUploadUsers = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(createError.BadRequest('No file uploaded'));
        }

        // 1. Upload to Cloudinary
        const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "raw",
            folder: "user-uploads"
        });

        // 2. Process the Excel file
        const workbook = xlsx.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const usersData = xlsx.utils.sheet_to_json(worksheet);

        // 3. Validate data
        const requiredFields = ['emailId', 'name', 'role', 'reg_num', 'dept', 'semester', 'phone_number', 'available'];
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
                name: user.name,
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
        (emailId,name, role, reg_num, dept, semester, phone_number, available, created_at) 
        VALUES ?`;

            const values = validUsers.map(user => [
                user.emailId,
                user.name,
                user.role,
                user.reg_num,
                user.dept,
                user.semester,
                user.phone_number,
                user.available,
                user.created_at
            ]);

            const [result] = await db.query(sql, [values]);

            fs.unlinkSync(req.file.path);

            return res.status(200).json({
                success: true,
                message: `${result.affectedRows} users added successfully`,
                cloudinaryUrl: cloudinaryUpload?.secure_url
            });
        } else {
            fs.unlinkSync(req.file.path);
            return next(createError.BadRequest('No valid users to upload'));
        }
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error in bulkUploadUsers:', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
        return next(createError.InternalServerError("Database error"));
    }
};


const getTimelines = async (req, res) => {
    try {
        const sql = "SELECT * FROM timeline";

        // Using promise-based query
        const [results] = await db.query(sql);
        // console.log(results);
        if (!results || results.length === 0) {
            return successResponse(res, 200, 'No timelines found', []);
        }

        successResponse(res, 200, 'Timelines fetched successfully', results);
    } catch (err) {
        console.error('Error fetching timelines:', err);
        errorResponse(res, 500, 'Failed to fetch timelines', err);
    }
};

const getUserNameByRegNum = async (req, res) => {
    try {
        const { reg_num } = req.params;

        // Validate input
        if (!reg_num?.trim()) {
            return errorResponse(res, 400, 'Registration number is required');
        }

        // Query database
        const [users] = await db.query(
            `SELECT 
                name,
                reg_num,
                dept,
                role
             FROM users 
             WHERE reg_num = ?`,
            [reg_num]
        );

        if (!users || users.length === 0) {
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(
            res,
            200,
            'User details retrieved successfully',
            {
                name: users[0].name,
                reg_num: users[0].reg_num,
                department: users[0].dept,
                role: users[0].role
            }
        );

    } catch (err) {
        console.error('Error fetching user name:', err);
        return errorResponse(res, 500, 'Failed to fetch user details', err);
    }
};

const getUsersByRole = async (req, res, next) => {
    try {
        const { role } = req.params;
        const validRoles = ['student', 'admin', 'staff']; // Maintained original roles

        // Input validation (kept original logic)
        const safeRole = role.toLowerCase();
        if (!validRoles.includes(safeRole)) {
            return next(createError.BadRequest("Invalid role!"));
        }

        // Using the exact same SQL query
        const sql = "select * from users where role = ? and available = true";

        const [users] = await db.query(sql, [safeRole]);

        return res.status(200).json({
            success: true,
            message: `Users retrieved successfully`,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('Error in getUsersByRole:', {
            error: error.message,
            role: req.params.role,
            timestamp: new Date().toISOString()
        });
        return next(createError.InternalServerError("Database error"));
    }
};

const getTeamNumbers = async (req, res, next) => {
    try {
        // Maintain original SQL query exactly as provided
        const sql = "select * from teams";

        // Execute query
        const [teams] = await db.query(sql);

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Team data retrieved successfully',
            count: teams.length,
            data: teams
        });

    } catch (error) {
        console.error('Error fetching team numbers:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve team data',
            error: {
                code: 'TEAM_FETCH_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const getProjects = async (req, res, next) => {
    try {
        // Maintain the exact SQL query as provided
        const sql = "select * from projects";

        // Execute the query
        const [projects] = await db.query(sql);

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            count: projects.length,
            data: projects
        });

    } catch (error) {
        console.error('Error fetching projects:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve projects',
            error: {
                code: 'PROJECTS_FETCH_ERROR',
                details: error.message,
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const getSemesterDeadlines = async (req, res, next) => {
    try {
        const { semester } = req.params;

        // Maintain the exact SQL query as provided
        const sql = "SELECT * FROM semester_wise_deadline WHERE semester = ?";

        // Execute the query
        const [results] = await db.query(sql, [semester]);

        // Handle empty results
        if (results.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No deadlines found for this semester',
                data: null
            });
        }

        // Process the data
        const semesterData = results[0];
        const weeks = Array(12).fill('').map((_, index) => {
            return semesterData[`week${index + 1}`] || '';
        });

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Semester deadlines retrieved successfully',
            data: {
                semester: semesterData.semester,
                weeks: weeks
            }
        });

    } catch (error) {
        console.error('Error fetching semester deadlines:', {
            error: error.message,
            stack: error.stack,
            semester: req.params.semester,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve semester deadlines',
            error: {
                code: 'DEADLINES_FETCH_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const insertDeadlinesForAllTeams = async (req, res, next) => {
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
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    details: 'Invalid or past dates provided',
                    weeks: weeks
                }
            });
        }

        // Fetch teams with valid project_id
        const [teams] = await db.query(
            `SELECT team_id, project_id FROM teams WHERE project_id IS NOT NULL AND semester = ?`,
            [semester]
        );

        if (teams.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No teams with project_id found for this semester',
                data: null
            });
        }

        // SQL queries
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

        // Execute operations
        await Promise.all([
            ...teams.map(team =>
                db.query(teamDeadlinesSql, [
                    team.team_id, team.project_id,
                    week1, week2, week3, week4, week5, week6,
                    week7, week8, week9, week10, week11, week12
                ])
            ),
            db.query(semesterDeadlinesSql, [
                semester,
                week1, week2, week3, week4, week5, week6,
                week7, week8, week9, week10, week11, week12
            ])
        ]);

        return res.status(200).json({
            success: true,
            message: 'Deadlines updated successfully for all teams and semester record',
            data: {
                teams_updated: teams.length,
                semester: semester
            }
        });

    } catch (error) {
        console.error('Error inserting deadlines:', {
            error: error.message,
            stack: error.stack,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to update deadlines',
            error: {
                code: 'DEADLINES_UPDATE_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const getTeamMembers = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        if (!team_id) {
            return res.status(400).send('team_id not found!');
        }

        // Keep original SQL exactly as provided
        const sql = "select * from teams where team_id = ?";

        const [result] = await db.query(sql, [team_id]);

        if (result.length === 0) {
            return res.status(404).send('team details not found!');
        }

        return res.send(result);

    } catch (error) {
        next(error);
    }
};


const deleteTimeline = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate input
        if (!id?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Timeline ID is required'
            });
        }

        // Maintain original SQL query exactly as provided
        const sql = "DELETE FROM timeline WHERE id = ?";

        // Execute query
        const [result] = await db.query(sql, [id]);

        // Handle response
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Not found',
                error: 'No timeline found with the provided ID'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Timeline deleted successfully',
            data: {
                deleted_id: id
            }
        });

    } catch (error) {
        console.error('Error deleting timeline:', {
            error: error.message,
            stack: error.stack,
            timeline_id: req.params.id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to delete timeline',
            error: {
                code: 'TIMELINE_DELETE_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const addTimeline = async (req, res, next) => {
    try {
        let { name, start_date, end_date } = req.body;

        // Validate inputs
        if (!name?.trim() || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Name, start_date, and end_date are required'
            });
        }

        // Parse dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        // Validate date range
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'End date must be after start date'
            });
        }

        // Format dates
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        // Insert into database
        const sql = "INSERT INTO timeline (name, start_date, end_date) VALUES (?, ?, ?)";
        const [result] = await db.query(sql, [name.trim(), formattedStartDate, formattedEndDate]);

        if (result.affectedRows === 0) {
            throw new Error('Failed to insert timeline');
        }

        return res.status(201).json({
            success: true,
            message: 'Timeline added successfully',
            data: {
                name,
                start_date: formattedStartDate,
                end_date: formattedEndDate
            }
        });

    } catch (error) {
        console.error('Error adding timeline:', {
            error: error.message,
            stack: error.stack,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to add timeline',
            error: {
                code: 'TIMELINE_ADD_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const getAllProjects = async (req, res, next) => {
    try {
        // Maintain original SQL query exactly as provided
        const sql = "SELECT * FROM projects";

        const [projects] = await db.query(sql);

        return res.status(200).json({
            success: true,
            message: projects.length > 0
                ? 'Projects retrieved successfully'
                : 'No projects found',
            count: projects.length,
            data: projects
        });

    } catch (error) {
        console.error('Error fetching projects:', {
            error: error.message,
            endpoint: '/admin/get_all_projects',
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to retrieve projects'));
    }
};


const getTeamDetails = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        // Validate input with better error message
        if (!team_id?.trim()) {
            return next(createError(400, 'Team ID is required'));
        }

        // Maintain original SQL query exactly as provided
        const sql = "SELECT * FROM team_requests WHERE team_id = ?";

        const [teamDetails] = await db.query(sql, [team_id]);

        if (teamDetails.length === 0) {
            return next(createError(404, 'Team not found'));
        }

        return res.status(200).json({
            success: true,
            message: 'Team details retrieved successfully',
            data: teamDetails
        });

    } catch (error) {
        console.error('Error fetching team details:', {
            error: error.message,
            endpoint: '/admin/get_teams',
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to retrieve team details'));
    }
};


const assignGuideExpert = async (req, res, next) => {
    try {
        const { team_id, role } = req.params;
        const { guideOrexpert_reg_num } = req.body;

        // Input validation (kept original logic)
        if (!team_id || !guideOrexpert_reg_num || !role) {
            return next(createError(400, "Missing team_id, role, or registration number"));
        }

        const validRoles = ['sub_expert', 'guide'];
        if (!validRoles.includes(role)) {
            return next(createError(400, "Invalid role"));
        }

        // Check existing assignment (original query)
        const checkSql = "SELECT * FROM teams WHERE team_id = ? AND (guide_reg_num = ? OR sub_expert_reg_num = ?)";
        const [existingAssignments] = await db.query(checkSql, [team_id, guideOrexpert_reg_num, guideOrexpert_reg_num]);

        if (existingAssignments.length >= 1) {
            return next(createError(400, "This staff already acts as guide or expert for this team"));
        }

        // Update assignment (original query)
        const updateSql = `UPDATE teams SET ${role}_reg_num = ? WHERE team_id = ?`;
        const [updateResult] = await db.query(updateSql, [guideOrexpert_reg_num, team_id]);

        if (updateResult.affectedRows === 0) {
            return next(createError(400, "Registration number not updated"));
        }

        return res.status(200).json({
            success: true,
            message: `${team_id} team's ${role} updated to ${guideOrexpert_reg_num}`
        });

    } catch (error) {
        console.error('Assignment error:', {
            error: error.message,
            endpoint: '/assign_guide_expert',
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, "Failed to process assignment"));
    }
};


const updateTimeline = async (req, res, next) => {
    try {
        const { id } = req.params;
        let { start_date, end_date } = req.body;

        // Validation (same as original)
        if (!start_date || !end_date) return next(createError(400, "Dates are required"));
        if (!id) return next(createError(400, "Timeline ID is required"));

        // Date processing (same as original)
        let date1 = new Date(start_date);
        let date2 = new Date(end_date);
        date1.setHours(0, 0, 0, 0);
        date2.setHours(0, 0, 0, 0);
        if (date1 > date2) return next(createError(400, "Invalid date range"));
        start_date = date1.toISOString().split('T')[0];
        end_date = date2.toISOString().split('T')[0];

        // Using your exact SQL query
        const sql = "UPDATE timeline SET start_date = ?, end_date = ?, cron_executed = false WHERE id = ?";

        const [result] = await db.query(sql, [start_date, end_date, id]);

        if (result.affectedRows === 0) {
            return next(createError(400, "No timeline found with that ID"));
        }

        return res.status(200).json({
            success: true,
            message: "Timeline updated successfully",
            data: {
                id,
                start_date,
                end_date
            }
        });

    } catch (error) {
        console.error('Timeline update error:', error.message);
        return next(createError(500, "Failed to update timeline"));
    }
};


module.exports = {
    getTimelines,
    getUserNameByRegNum,
    getUsersByRole,
    getTeamNumbers,
    getProjects,
    getSemesterDeadlines,
    insertDeadlinesForAllTeams,
    getTeamMembers,
    deleteTimeline,
    addTimeline,
    bulkUploadUsers,
    getAllProjects,
    getTeamDetails,
    assignGuideExpert,
    updateTimeline,

};