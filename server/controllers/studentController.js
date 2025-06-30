const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const nodemailer = require("nodemailer");

const createError = require('http-errors'); // Added this import
/**
 * Fetch team status and invitations for a student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const fetchTeamStatusAndInvitations = async (req, res) => {
    try {
        const { from_reg_num } = req.body;

        if (!from_reg_num) {
            return errorResponse(res, 400, 'Registration number is required');
        }
        // console.log(from_reg_num, "from_reg_numfrom_reg_num");
        // Step 1: Check if user is in any team (as leader or member)
        const checkTeamSQL = `SELECT team_id, team_conformed, from_reg_num AS teamLeader 
                            FROM team_requests 
                            WHERE (from_reg_num = ? OR reg_num = ?) 
                            AND status = 'accept' 
                            LIMIT 1`;

        const [teamCheckResults] = await db.query(checkTeamSQL, [from_reg_num, from_reg_num]);
        // console.log(teamCheckResults, "teamCheckResults");
        if (teamCheckResults.length > 0 && teamCheckResults[0].team_id) {
            const { team_id, team_conformed, teamLeader } = teamCheckResults[0];

            // Step 2: Fetch all team members
            const fetchTeamSQL = `SELECT * FROM team_requests WHERE team_id = ? AND status = 'accept'`;
            const [teamMembers] = await db.query(fetchTeamSQL, [team_id]);

            if (teamMembers.length === 0) {
                return errorResponse(res, 404, 'Team members not found');
            }

            // Fetch team leader details
            const fetchLeaderSQL = "SELECT * FROM users WHERE reg_num = ?";
            const [leaderDetails] = await db.query(fetchLeaderSQL, [teamLeader]);

            if (!team_conformed) {
                // Team not confirmed yet - fetch pending invitations
                const fetchInvitesSQL = `SELECT * FROM team_requests WHERE from_reg_num = ? AND team_conformed = 0`;
                const [invites] = await db.query(fetchInvitesSQL, [from_reg_num]);

                const pendingInvitations = invites.filter(invite => invite.status !== 'accept');

                return successResponse(res, 200, 'Team status fetched', {
                    teamConformationStatus: 0,
                    teamMembers,
                    pendingInvitations,
                    teamLeader: leaderDetails[0] || null
                });
            } else {
                // Team is confirmed - check for project
                if (teamMembers[0].team_id) {
                    const getProjectSQL = "SELECT project_id, project_name FROM projects WHERE team_id = ?";
                    const [projectResults] = await db.query(getProjectSQL, [teamMembers[0].team_id]);

                    if (projectResults.length > 0) {
                        return successResponse(res, 200, 'Team with project found', {
                            teamConformationStatus: 1,
                            teamMembers,
                            projectId: projectResults[0].project_id,
                            projectName: projectResults[0].project_name,
                            pendingInvitations: [],
                            teamLeader: leaderDetails[0] || null
                        });
                    }
                }

                return successResponse(res, 200, 'Team without project found', {
                    teamConformationStatus: 1,
                    teamMembers,
                    pendingInvitations: [],
                    teamLeader: leaderDetails[0] || null
                });
            }
        } else {
            // User is not in any team - fetch their invitations
            const fetchInvitesSQL = `SELECT * FROM team_requests WHERE from_reg_num = ? AND team_conformed = 0`;
            const [invites] = await db.query(fetchInvitesSQL, [from_reg_num]);
            // console.log(invites, "invitesinvites");
            const pendingInvitations = invites.filter(invite => invite.status !== 'accept');
            const teamMembers = invites.filter(invite => invite.status === 'accept');

            return successResponse(res, 200, 'User invitations fetched', {
                teamConformationStatus: 0,
                teamMembers,
                pendingInvitations,
                teamLeader: null
            });
        }
    } catch (err) {
        console.error('Error fetching team status:', err);
        return errorResponse(res, 500, 'Failed to fetch team status', err);
    }
};

/**
 * Get received team requests for a student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReceivedRequests = async (req, res) => {
    try {
        const { reg_num } = req.params;
        console.log(reg_num, "reg_numreg_numreg_num");
        if (!reg_num) {
            return errorResponse(res, 400, 'Registration number is required');
        }

        // Check if student is already in a team
        const checkTeamSQL = `SELECT * FROM team_requests 
                             WHERE (from_reg_num = ? OR reg_num = ?) 
                             AND status = 'accept'`;

        const [teamCheckResults] = await db.query(checkTeamSQL, [reg_num, reg_num]);
        console.log(teamCheckResults, "checkTeamSQLcheckTeamSQL");
        if (teamCheckResults.length > 0) {
            return errorResponse(res, 400, 'You are already a member of another team');
        }

        // Fetch pending requests
        const getRequestsSQL = `SELECT * FROM team_requests 
                              WHERE to_reg_num = ? 
                              AND status = 'interested'`;

        const [requests] = await db.query(getRequestsSQL, [reg_num]);
        console.log(requests, "requestsrequestsrequests");
        return successResponse(res, 200, 'Received requests fetched successfully', requests);

    } catch (err) {
        console.error('Error fetching received requests:', err);
        return errorResponse(res, 500, 'Failed to fetch received requests', err);
    }
};

/**
 * Update user's project type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProjectType = async (req, res) => {
    try {
        console.log("11111111111111111");
        const { project_type, userId } = req.body;
        console.log(project_type, userId, " project_type, userId project_type, userId");
        // Validate input
        if (!userId) {
            return errorResponse(res, 400, 'User ID is required');
        }
        if (!project_type || !['internal', 'external'].includes(project_type)) {
            return errorResponse(res, 400, 'Valid project type is required (internal/external)');
        }
        console.log("11111111111111111");
        // Update project type
        const updateSql = "UPDATE users SET project_type = ? WHERE id = ?";
        const [updateResult] = await db.query(updateSql, [project_type, userId]);

        if (updateResult.affectedRows === 0) {
            return errorResponse(res, 404, 'User not found');
        }

        // Fetch updated user details
        const selectSql = "SELECT * FROM users WHERE id = ?";
        const [userResult] = await db.query(selectSql, [userId]);

        return successResponse(res, 200, 'Project type updated successfully', userResult[0]);

    } catch (err) {
        console.error('Error updating project type:', err);
        return errorResponse(res, 500, 'Failed to update project type', err);
    }
};

/**
 * Create a team join request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createJoinRequest = async (req, res) => {
    try {
        const { from_reg_num, to_reg_num } = req.body;

        // Input validation
        if (!to_reg_num?.trim() || !from_reg_num?.trim()) {
            return errorResponse(res, 400, 'Registration numbers are required');
        }
        if (from_reg_num === to_reg_num) {
            return errorResponse(res, 400, 'Cannot send request to yourself');
        }

        // Get receiver details
        const [receiver] = await db.query(
            "SELECT name, emailId, reg_num, dept FROM users WHERE reg_num = ?",
            [to_reg_num]
        );
        if (!receiver || receiver.length === 0) {
            return errorResponse(res, 404, 'Receiver not found');
        }
        const { name, emailId, reg_num, dept } = receiver[0];

        // Check for existing requests
        const [existingRequests] = await db.query(
            `SELECT * FROM team_requests 
             WHERE (from_reg_num = ? AND to_reg_num = ?) 
             OR (to_reg_num = ? AND from_reg_num = ?)`,
            [from_reg_num, to_reg_num, from_reg_num, to_reg_num]
        );
        if (existingRequests.length > 0) {
            return successResponse(
                res,
                200,
                `Connection request already exists with status: ${existingRequests[0].status}`,
                { request: existingRequests[0] }
            );
        }

        // Check if receiver is in another team
        const [receiverTeams] = await db.query(
            `SELECT * FROM team_requests 
             WHERE (to_reg_num = ? OR from_reg_num = ?) 
             AND status = 'accept'`,
            [to_reg_num, to_reg_num]
        );
        if (receiverTeams.length > 0) {
            return errorResponse(res, 400, 'Receiver is already in another team');
        }

        // Check if sender is in another team
        const [senderTeams] = await db.query(
            `SELECT * FROM team_requests 
             WHERE to_reg_num = ? AND status = 'accept'`,
            [from_reg_num]
        );
        if (senderTeams.length > 0) {
            return errorResponse(res, 400, 'You are already in another team');
        }

        // Check sender's team size
        const [senderTeamSize] = await db.query(
            `SELECT * FROM team_requests 
             WHERE from_reg_num = ? AND status = 'accept'`,
            [from_reg_num]
        );
        if (senderTeamSize.length >= 3) {
            return errorResponse(res, 400, 'Team cannot have more than 4 members');
        }
        console.log(from_reg_num, to_reg_num, "from_reg_num, to_reg_numfrom_reg_num, to_reg_num");
        // Validate project type compatibility
        const [users] = await db.query(
            `SELECT project_type, company_name, semester 
             FROM users WHERE reg_num IN (?, ?)`,
            [from_reg_num, to_reg_num]
        );
        console.log(users, "users");
        if (users.length !== 2) {
            return errorResponse(res, 400, 'One or both students not found');
        }

        const [sender, receiverUser] = users;
        if (!sender.project_type || !receiverUser.project_type) {
            return errorResponse(res, 400, 'Both users must set their project type');
        }
        if (sender.project_type.toLowerCase() !== receiverUser.project_type.toLowerCase()) {
            return errorResponse(res, 400, 'Both members must be either internal or external');
        }
        if (sender.project_type === 'external' && receiverUser.project_type === 'external') {
            if (sender.company_name !== receiverUser.company_name) {
                return errorResponse(res, 400, 'External members must be from same company');
            }
        }
        if (sender.semester !== receiverUser.semester) {
            return errorResponse(res, 400, 'Cannot send requests to different semesters');
        }

        // Create the request
        const [result] = await db.query(
            `INSERT INTO team_requests 
             (name, emailId, reg_num, dept, from_reg_num, to_reg_num, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, emailId, reg_num, dept, from_reg_num, to_reg_num, 'interested']
        );

        return successResponse(res, 201, 'Request sent successfully', {
            requestId: result.insertId
        });

    } catch (err) {
        console.error('Error creating join request:', err);
        return errorResponse(res, 500, 'Failed to create join request', err);
    }
};
/**
 * Get student details by registration number
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentByRegNum = async (req, res) => {
    try {
        const { reg_num } = req.params;
        console.log(reg_num, "getStudentByRegNum");
        // Validate input
        if (!reg_num?.trim()) {
            return errorResponse(res, 400, 'Registration number is required');
        }

        // Query database
        const [students] = await db.query(
            `SELECT 
                id, 
                name, 
                emailId, 
                reg_num, 
                dept, 
                semester,
                project_type,
                company_name,
                phone_number
             FROM users 
             WHERE reg_num = ?`,
            [reg_num]
        );
        console.log(students, "getStudentByRegNumgetStudentByRegNum");
        if (!students || students.length === 0) {
            return errorResponse(res, 404, 'Student not found');
        }

        // Return success response with student data
        return successResponse(
            res,
            200,
            'Student details retrieved successfully',
            students[0]
        );

    } catch (err) {
        console.error('Error fetching student details:', err);
        return errorResponse(res, 500, 'Failed to fetch student details', err);
    }
};
/**
 * Accept or reject a team request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleTeamRequest = async (req, res) => {
    try {
        const { from_reg_num, to_reg_num, status } = req.params;
        let { reason } = req.body;

        // Validate parameters
        if (!from_reg_num || !to_reg_num || !status) {
            return errorResponse(res, 400, 'Missing required parameters');
        }

        // Validate status
        const validStatuses = ['accept', 'reject'];
        const safeStatus = status.toLowerCase();
        if (!validStatuses.includes(safeStatus)) {
            return errorResponse(res, 400, 'Invalid status (must be accept or reject)');
        }

        // Validate reason for rejection
        if (safeStatus === 'reject' && !reason) {
            return errorResponse(res, 400, 'Reason is required for rejecting requests');
        }

        // Update the request status
        const [updateResult] = await db.query(
            `UPDATE team_requests 
             SET status = ?, reason = ? 
             WHERE to_reg_num = ? 
             AND from_reg_num = ? 
             AND status = 'interested'`,
            [safeStatus, reason || null, to_reg_num, from_reg_num]
        );

        if (updateResult.affectedRows === 0) {
            return errorResponse(res, 400, 'No matching pending request found or already processed');
        }

        // Handle acceptance logic
        if (safeStatus === 'accept') {
            // Get current team size
            const [countResult] = await db.query(
                `SELECT COUNT(*) AS count 
                 FROM team_requests 
                 WHERE from_reg_num = ? 
                 AND status = 'accept'`,
                [from_reg_num]
            );

            const acceptedCount = countResult[0].count;

            // If team is full (3 members + leader = 4), clean up pending requests
            if (acceptedCount >= 3) {
                await db.query(
                    `DELETE FROM team_requests 
                     WHERE from_reg_num = ? 
                     AND status <> 'accept'`,
                    [from_reg_num]
                );

                return successResponse(
                    res,
                    200,
                    'Request accepted. Team is now full. Remaining pending requests were removed.',
                    { teamSize: acceptedCount }
                );
            }

            return successResponse(
                res,
                200,
                'Request accepted successfully',
                { teamSize: acceptedCount }
            );
        }

        // For rejections
        return successResponse(
            res,
            200,
            'Request rejected successfully',
            { reason }
        );

    } catch (err) {
        console.error('Error handling team request:', err);
        return errorResponse(res, 500, 'Failed to process team request', err);
    }
};

/**
 * Confirm a team formation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const confirmTeam = async (req, res) => {
    let connection;
    try {
        const { name, emailId, reg_num, dept, from_reg_num, semester } = req.body;

        // Validate required fields
        const requiredFields = { name, emailId, reg_num, dept, from_reg_num, semester };
        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) {
                return errorResponse(res, 400, `${field} is required`);
            }
        }

        // Get connection for transaction
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Get next team number
        const [countResult] = await connection.query(
            "SELECT COUNT(DISTINCT team_id) AS count FROM teams"
        );
        const teamNumber = countResult[0].count + 1;
        const team_id = `TEAM-${String(teamNumber).padStart(4, "0")}`;

        // Check if user has any accepted team members
        const [teamMembers] = await connection.query(
            `SELECT * FROM team_requests 
             WHERE (from_reg_num = ? OR reg_num = ?) 
             AND status = 'accept'`,
            [from_reg_num, from_reg_num]
        );

        // Handle solo team case
        if (teamMembers.length === 0) {
            // Insert leader into teams table
            await connection.query(
                `INSERT INTO teams (team_id, reg_num, semester, is_leader) 
                 VALUES (?, ?, ?, 1)`,
                [team_id, reg_num, semester]
            );

            // Insert leader into team_requests
            await connection.query(
                `INSERT INTO team_requests 
                 (team_id, name, emailId, reg_num, dept, from_reg_num, to_reg_num, status, team_conformed) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'accept', true)`,
                [team_id, name, emailId, reg_num, dept, from_reg_num, from_reg_num]
            );

            // Cleanup pending requests
            await connection.query(
                `DELETE FROM team_requests 
                 WHERE (from_reg_num = ? OR reg_num = ?) 
                 AND team_conformed = false 
                 AND status <> 'accept' 
                 AND team_id IS NULL`,
                [reg_num, reg_num]
            );

            await connection.commit();
            return successResponse(res, 200, 'Solo team created successfully', { team_id });
        }

        // For teams with multiple members
        // Update team_conformed status
        const [updateResult] = await connection.query(
            `UPDATE team_requests 
             SET team_conformed = true 
             WHERE from_reg_num = ? 
             AND status = 'accept'`,
            [from_reg_num]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return errorResponse(res, 400, 'No team members found to confirm');
        }

        // Insert all team members into teams table
        const [teamMates] = await connection.query(
            `SELECT * FROM team_requests 
             WHERE from_reg_num = ? 
             AND status = 'accept'`,
            [from_reg_num]
        );

        const insertPromises = teamMates.map(member =>
            connection.query(
                `INSERT INTO teams (team_id, reg_num, semester, is_leader) 
                 VALUES (?, ?, ?, ?)`,
                [team_id, member.reg_num, semester, 0]
            )
        );

        await Promise.all(insertPromises);

        // Update team_id for all members
        await connection.query(
            `UPDATE team_requests 
             SET team_id = ? 
             WHERE from_reg_num = ? 
             AND status = 'accept'`,
            [team_id, from_reg_num]
        );

        // Insert team leader
        await connection.query(
            `INSERT INTO teams (team_id, reg_num, is_leader, semester) 
             VALUES (?, ?, ?, ?)`,
            [team_id, reg_num, 1, semester]
        );

        await connection.query(
            `INSERT INTO team_requests 
             (team_id, name, emailId, reg_num, dept, from_reg_num, to_reg_num, status, team_conformed) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'accept', true)`,
            [team_id, name, emailId, reg_num, dept, from_reg_num, from_reg_num]
        );

        // Cleanup pending requests for all team members
        const memberRegNums = teamMates.map(m => m.reg_num);
        memberRegNums.push(reg_num); // Include leader

        await connection.query(
            `DELETE FROM team_requests 
             WHERE (from_reg_num IN (?) OR reg_num IN (?)) 
             AND team_conformed = false 
             AND status <> 'accept' 
             AND team_id IS NULL`,
            [memberRegNums, memberRegNums]
        );

        await connection.commit();
        return successResponse(res, 200, 'Team confirmed successfully', {
            team_id,
            team_size: teamMates.length + 1 // Including leader
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error confirming team:', err);
        return errorResponse(res, 500, 'Failed to confirm team', err);
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Get project details by project ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjectDetails = async (req, res) => {
    try {
        const { project_id } = req.params;

        // Validate input
        if (!project_id) {
            return errorResponse(res, 400, 'Project ID is required');
        }

        // Query database for project details
        const [project] = await db.query(
            `SELECT * FROM projects  WHERE project_id = ?`,
            [project_id]
        );
        // console.log(project, "projectssssssssssssss");
        if (!project || project.length === 0) {
            return errorResponse(res, 404, 'Project not found');
        }

        // Query for team members if needed
        const [teamMembers] = await db.query(
            `SELECT 
                u.name,
                u.reg_num,
                u.dept,
                u.emailId,
                t.is_leader
             FROM teams t
             JOIN users u ON t.reg_num = u.reg_num
             WHERE t.team_id = ?`,
            [project[0].team_id]
        );

        // Query for guide details if needed
        let guide = null;
        if (project[0].guide_id) {
            const [guideResult] = await db.query(
                `SELECT name, email, department 
                 FROM guides 
                 WHERE guide_id = ?`,
                [project[0].guide_id]
            );
            guide = guideResult[0] || null;
        }

        return successResponse(res, 200, 'Project details retrieved successfully', {
            project: project,
            team_members: teamMembers,
            guide_details: guide
        });

    } catch (err) {
        console.error('Error fetching project details:', err);
        return errorResponse(res, 500, 'Failed to fetch project details', err);
    }
};

/**
 * Get upcoming deadlines and timeline for a team
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */

const getUpcomingDeadlines = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        if (!team_id) {
            return next(createError.BadRequest('Team ID is required'));
        }

        // Maintained your exact SQL query as requested
        const sql = `SELECT 
            wld.team_id,
            CASE 
                WHEN CURDATE() <= wld.week1 THEN wld.week1
                WHEN CURDATE() <= wld.week2 THEN wld.week2
                WHEN CURDATE() <= wld.week3 THEN wld.week3
                WHEN CURDATE() <= wld.week4 THEN wld.week4
                WHEN CURDATE() <= wld.week5 THEN wld.week5
                WHEN CURDATE() <= wld.week6 THEN wld.week6
                WHEN CURDATE() <= wld.week7 THEN wld.week7
                WHEN CURDATE() <= wld.week8 THEN wld.week8
                WHEN CURDATE() <= wld.week9 THEN wld.week9
                WHEN CURDATE() <= wld.week10 THEN wld.week10
                WHEN CURDATE() <= wld.week11 THEN wld.week11
                WHEN CURDATE() <= wld.week12 THEN wld.week12
                ELSE NULL
            END AS current_week_deadline,
            CASE 
                WHEN CURDATE() <= wld.week1 THEN 'week1'
                WHEN CURDATE() <= wld.week2 THEN 'week2'
                WHEN CURDATE() <= wld.week3 THEN 'week3'
                WHEN CURDATE() <= wld.week4 THEN 'week4'
                WHEN CURDATE() <= wld.week5 THEN 'week5'
                WHEN CURDATE() <= wld.week6 THEN 'week6'
                WHEN CURDATE() <= wld.week7 THEN 'week7'
                WHEN CURDATE() <= wld.week8 THEN 'week8'
                WHEN CURDATE() <= wld.week9 THEN 'week9'
                WHEN CURDATE() <= wld.week10 THEN 'week10'
                WHEN CURDATE() <= wld.week11 THEN 'week11'
                WHEN CURDATE() <= wld.week12 THEN 'week12'
                ELSE NULL
            END AS current_week_name,
            t.name AS current_timeline,
            t.start_date AS timeline_start_date,
            t.end_date AS timeline_end_date
            FROM weekly_logs_deadlines wld
            LEFT JOIN timeline t ON (
                CURDATE() BETWEEN t.start_date AND t.end_date 
                AND (t.team_id = ? OR t.team_id IS NULL)
            )
            WHERE wld.team_id = ?;`;

        const [results] = await db.query(sql, [team_id, team_id]);
        // console.log(results, "/show_upcoming_deadline_weekly_logs_and_timeline");
        if (results.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active deadlines found for your team',
                data: null
            });
        }

        // // Format dates for better readability
        // const formattedResults = {
        //     ...results[0],
        //     current_week_deadline: results[0].current_week_deadline
        //         ? new Date(results[0].current_week_deadline).toLocaleDateString()
        //         : null,
        //     timeline_start_date: results[0].timeline_start_date
        //         ? new Date(results[0].timeline_start_date).toLocaleDateString()
        //         : null,
        //     timeline_end_date: results[0].timeline_end_date
        //         ? new Date(results[0].timeline_end_date).toLocaleDateString()
        //         : null,
        //     days_remaining: results[0].current_week_deadline
        //         ? Math.ceil((new Date(results[0].current_week_deadline) - new Date()) / (1000 * 60 * 60 * 24))
        //         : null
        // };
        // console.log(formattedResults, "forrrrrrrrrrr");
        return res.status(200).json({
            success: true,
            message: 'Deadlines retrieved successfully',
            data: results
        });

    } catch (error) {
        console.error('Error fetching deadlines:', {
            error: error.message,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });
        return next(createError.InternalServerError('Failed to fetch deadlines'));
    }
};

/**
 * Check if a student has accepted team invitations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkAcceptedStatus = async (req, res, next) => {
    try {
        const { reg_num } = req.params;

        if (!reg_num) {
            return next(createError.BadRequest('Registration number is required'));
        }

        // Maintaining your exact SQL query as requested
        const sql = "SELECT * FROM team_requests WHERE (to_reg_num = ? OR from_reg_num = ?) AND status = 'accepted'";

        const [requests] = await db.query(sql, [reg_num, reg_num]);

        if (requests.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No accepted team requests found',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Accepted team requests retrieved successfully',
            data: requests
        });

    } catch (error) {
        console.error('Error checking accepted status:', {
            error: error.message,
            reg_num: req.params.reg_num,
            timestamp: new Date().toISOString()
        });
        return next(createError.InternalServerError('Failed to check accepted status'));
    }
};

/**
 * Get guide request status for a team
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGuideStatus = async (req, res) => {
    try {
        const { team_id } = req.params;

        // Validate input
        if (!team_id) {
            return errorResponse(res, 400, 'Valid team_id is required');
        }

        // Original query maintained exactly as provided
        const sql = `
            SELECT to_guide_reg_num, status, reason 
            FROM guide_requests 
            WHERE from_team_id = ?`;

        const [results] = await db.query(sql, [team_id]);

        return successResponse(
            res,
            200,
            results.length > 0
                ? 'Guide requests retrieved successfully'
                : 'No guide requests found',
            {
                team_id,
                count: results.length,
                requests: results
            }
        );

    } catch (err) {
        console.error('Error fetching guide status:', err);
        return errorResponse(res, 500, 'Failed to fetch guide status');
    }
};
/**
 * Get subject expert request status for a team
 * @param {Object} req - Express request object 
 * @param {Object} res - Express response object
 */
const getExpertStatus = async (req, res, next) => {
    try {
        const { team_id } = req.params;
        // console.log(team_id);
        // Validate input
        if (!team_id?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    team_id: 'Team ID is required and cannot be empty'
                }
            });
        }

        console.log(`Fetching expert status for team: ${team_id}`);

        // SQL query to fetch expert requests
        const sql = `
            SELECT to_expert_reg_num, status, reason 
            FROM sub_expert_requests 
            WHERE from_team_id = ?
        `;

        // Execute query
        const [requests] = await db.query(sql, [team_id]);
        console.log(requests.length, "resss");
        // Handle response
        if (requests.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No expert requests found for this team',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Expert requests retrieved successfully',
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching expert status:', {
            error: error.message,
            stack: error.stack,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve expert requests',
            error: {
                code: 'EXPERT_STATUS_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const getTeamDetails = async (req, res, next) => {
    try {
        const { reg_num } = req.params;

        if (!reg_num) {
            return next(createError.BadRequest("Registration number is required"));
        }

        const sql = `
            SELECT * 
            FROM team_requests 
            WHERE (from_reg_num = ? OR to_reg_num = ?) 
            AND team_conformed = true`;

        const [teamDetails] = await db.query(sql, [reg_num, reg_num]);

        if (teamDetails.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No team found for this user',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Team details retrieved successfully',
            data: teamDetails
        });

    } catch (error) {
        console.error('Error fetching team details:', error);
        return next(createError.InternalServerError('Failed to retrieve team details'));
    }
};
const addProject = async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        let { project_type, reg_num, team_id } = req.params;
        let { project_name, cluster, description, outcome, hard_soft } = req.body;

        // Input validation and normalization
        project_type = project_type.toLowerCase();
        hard_soft = hard_soft.toLowerCase();
        const validTypes = ['internal', 'external'];

        // Validate required fields
        if (!project_type.trim() || !project_name.trim() || !cluster.trim() ||
            !description.trim() || !reg_num.trim() || !team_id.trim()) {
            return next(createError.BadRequest("All required fields must be provided"));
        }
        console.log(validTypes.includes(project_type), "project type");
        // Validate project types
        if (!validTypes.includes(project_type)) {
            return next(createError.BadRequest("Invalid project type or category"));
        }

        await connection.beginTransaction();

        // Check team leadership (original query maintained)
        const [leadership] = await connection.query(
            "SELECT is_leader FROM teams WHERE team_id = ? AND reg_num = ?",
            [team_id, reg_num]
        );

        if (leadership.length === 0) {
            await connection.rollback();
            return next(createError.BadRequest("You are not a team leader"));
        }
        if (leadership.length > 1) {
            await connection.rollback();
            return next(createError.BadRequest("Multiple team leadership records found"));
        }

        // Check existing projects (original query maintained)
        const [existingProjects] = await connection.query(
            "SELECT * FROM projects WHERE tl_reg_num = ?",
            [reg_num]
        );

        if (existingProjects.length > 0) {
            await connection.rollback();
            return next(createError.BadRequest("Your team already has a project"));
        }

        // Generate project ID (original logic maintained)
        const [countResult] = await connection.query("SELECT COUNT(*) AS count FROM projects");
        const project_id = `P${String(countResult[0].count + 1).padStart(4, "0")}`;

        // Insert project (original query maintained)
        await connection.query(
            `INSERT INTO projects 
             (project_id, project_name, project_type, cluster, description, outcome, hard_soft, tl_reg_num, team_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [project_id, project_name, project_type, cluster, description, outcome, hard_soft, reg_num, team_id]
        );

        // Update team (original query maintained)
        await connection.query(
            "UPDATE teams SET project_id = ? WHERE team_id = ?",
            [project_id, team_id]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: {
                project_id,
                project_name,
                team_id
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Project creation error:', {
            error: error.message,
            endpoint: '/addproject',
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });
        return next(createError.InternalServerError("Project creation failed"));
    } finally {
        connection.release();
    }
};

const getStudentNameByRegNumber = async (req, res, next) => {
    try {
        const { reg_num } = req.params;

        // Validate input
        if (!reg_num?.trim()) {
            return next(createError(400, {
                success: false,
                message: 'Registration number is required',
                error: {
                    details: 'reg_num parameter is missing or empty'
                }
            }));
        }

        // SQL query to get student name
        const sql = `SELECT name FROM users WHERE reg_num = ? AND role = 'student'`;

        // Execute query
        const [result] = await db.query(sql, [reg_num]);

        // Handle no results case
        if (result.length === 0) {
            return next(createError(404, {
                success: false,
                message: 'Student not found',
                error: {
                    details: `No student found with registration number: ${reg_num}`,
                    suggestion: 'Please check the registration number and try again'
                }
            }));
        }

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Student name retrieved successfully',
            data: {
                reg_num,
                name: result[0].name
            }
        });

    } catch (error) {
        console.error('Error in getStudentNameByRegNumber:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            timestamp: new Date().toISOString()
        });

        return next(createError(500, {
            success: false,
            message: 'Failed to retrieve student name',
            error: {
                details: 'Internal server error',
                reference: `ERR-${Date.now()}`
            }
        }));
    }
};
const getReviewHistory = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        // Validate input
        if (!team_id?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    team_id: 'Team ID is required'
                }
            });
        }

        // Maintain original SQL query exactly as provided
        const sql = "select * from weekly_logs_verification where team_id = ?";

        // Execute query
        const [reviews] = await db.query(sql, [team_id]);

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Review history retrieved successfully',
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        console.error('Error fetching review history:', {
            error: error.message,
            stack: error.stack,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve review history',
            error: {
                code: 'REVIEW_HISTORY_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const checkLogUpdateStatus = async (req, res, next) => {
    try {
        const { team_id, week, reg_num } = req.params;

        // Validate inputs
        if (!team_id?.trim() || !week?.trim() || !reg_num?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'team_id, week, and reg_num are all required'
            });
        }

        const weekNumber = parseInt(week);
        if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 12) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Week number must be between 1 and 12'
            });
        }

        // Maintain original SQL query structure
        const sql = `SELECT week${week}_progress FROM teams WHERE team_id = ? AND reg_num = ?`;

        // Execute query
        const [result] = await db.query(sql, [team_id, reg_num]);

        // Determine response
        const isUpdated = result.length > 0 && result[0][`week${weekNumber}_progress`] !== null;

        return res.status(200).json({
            success: true,
            message: 'Log status checked successfully',
            data: {
                isUpdated,
                status: isUpdated ? 'Already Updated' : 'Not updated'
            }
        });

    } catch (error) {
        console.error('Error checking log update status:', {
            error: error.message,
            params: req.params,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to check log update status',
            error: {
                code: 'LOG_STATUS_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const updateProgress = async (req, res, next) => {
    try {
        const { week, reg_num, team_id } = req.params;
        const { progress } = req.body;

        // Validate inputs
        const validPhases = Array.from({ length: 12 }, (_, i) => `week${i + 1}`);
        const safeweek = week.toLowerCase();

        if (!validPhases.includes(safeweek) || !reg_num?.trim() || !team_id?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Invalid week name or missing registration/team information'
            });
        }

        // Check if already submitted
        const checkSql = `SELECT ${safeweek}_progress FROM teams WHERE reg_num = ? AND team_id = ?`;
        const [checkResults] = await db.query(checkSql, [reg_num, team_id]);

        if (checkResults[0]?.[`${safeweek}_progress`] !== null) {
            return res.status(200).json({
                success: true,
                message: 'Progress already submitted for this week',
                data: {
                    alreadySubmitted: true
                }
            });
        }

        // Update progress
        const updateSql = `UPDATE teams SET ${safeweek}_progress = ? WHERE reg_num = ? AND team_id = ?`;
        const [updateResult] = await db.query(updateSql, [progress, reg_num, team_id]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No record found',
                error: 'No matching team member found'
            });
        }

        // Check if all members have updated
        const weekNumber = safeweek.replace(/\D/g, '');
        const checkAllSql = `SELECT ${safeweek}_progress FROM teams WHERE team_id = ?`;
        const [teamProgress] = await db.query(checkAllSql, [team_id]);

        const allMembersUpdated = teamProgress.every(member => member[`${safeweek}_progress`] !== null);

        if (!allMembersUpdated) {
            return res.status(200).json({
                success: true,
                message: 'Progress updated successfully for this member',
                data: {
                    allMembersUpdated: false
                }
            });
        }

        // All members have updated - create verification record
        const [insertResult] = await db.query(
            "INSERT INTO weekly_logs_verification (team_id, week_number) VALUES (?, ?)",
            [team_id, weekNumber]
        );

        if (insertResult.affectedRows === 0) {
            throw new Error('Failed to create verification record');
        }

        // Get guide and student emails
        const [guideResult] = await db.query(
            "SELECT guide_reg_num FROM teams WHERE team_id = ?",
            [team_id]
        );

        if (!guideResult.length) {
            throw new Error('Guide not found for team');
        }

        const guide_reg_num = guideResult[0].guide_reg_num;
        const [emailResults] = await db.query(
            "SELECT emailId, role FROM users WHERE reg_num IN (?, ?) AND role IN ('staff', 'student')",
            [guide_reg_num, reg_num]
        );

        const guideEmail = emailResults.find(u => u.role === 'staff')?.emailId;
        const studentEmail = emailResults.find(u => u.role === 'student')?.emailId;

        if (!guideEmail || !studentEmail) {
            throw new Error('Could not resolve guide or student email');
        }

        // Send notification email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Project Management System" <${process.env.EMAIL_USER}>`,
            to: guideEmail,
            subject: `Progress update for ${safeweek} by Team ${team_id}`,
            replyTo: studentEmail,
            text: `Dear Guide,

Team ${team_id} has completed their progress update for ${safeweek}.
This submission was triggered by the student with registration number: ${reg_num}.

Please check the Project Register for more details.

Best regards,
Project Management System`
        };

        await transporter.sendMail(mailOptions);
        console.log("Notification email sent to guide");

        return res.status(200).json({
            success: true,
            message: 'Progress updated and notification sent',
            data: {
                allMembersUpdated: true,
                emailSent: true
            }
        });

    } catch (error) {
        console.error('Error updating progress:', {
            error: error.message,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to update progress',
            error: {
                code: 'PROGRESS_UPDATE_ERROR',
                details: error.message,
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const getTeamQueries = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        if (!team_id) {
            return res.status(400).send("team_id not found!!");
        }

        const sql = "select * from queries where team_id = ?";
        const [result] = await db.query(sql, [team_id]);

        res.send(result);

    } catch (error) {
        next(error);
    }
};
const submitStudentQuery = async (req, res, next) => {
    try {
        const { team_id, project_id, query } = req.body;
        const { team_member, guide_reg_num } = req.params;
        console.log("submitStudentQuerysubmitStudentQuery");
        // Validate inputs
        if (!project_id?.trim() || !team_id?.trim() || !team_member?.trim() ||
            !query?.trim() || !guide_reg_num?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'All fields are required: project_id, team_id, team_member, query, guide_reg_num'
            });
        }

        // Step 1: Fetch project name (maintaining original SQL)
        const getProjectNameSql = "SELECT project_name FROM projects WHERE project_id = ?";
        const [projectRows] = await db.query(getProjectNameSql, [project_id]);

        if (projectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
                error: `No project found with ID: ${project_id}`
            });
        }

        const project_name = projectRows[0].project_name;

        // Step 2: Insert query (maintaining original SQL)
        const insertQuerySql = `
            INSERT INTO queries (team_id, project_id, project_name, team_member, query, guide_reg_num)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [insertResult] = await db.query(insertQuerySql,
            [team_id, project_id, project_name, team_member, query, guide_reg_num]);

        if (insertResult.affectedRows === 0) {
            throw new Error('Failed to insert query');
        }

        // Step 3: Delete older answered queries (maintaining original SQL)
        const deleteOldSql = `
            DELETE FROM queries 
            WHERE query_id IN (
                SELECT query_id FROM (
                    SELECT query_id 
                    FROM queries 
                    WHERE team_id = ? AND reply IS NOT NULL
                    ORDER BY created_at DESC
                    LIMIT 18446744073709551615 OFFSET 5
                ) AS temp
            )
        `;
        await db.query(deleteOldSql, [team_id]);

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Query submitted successfully',
            data: {
                query_id: insertResult.insertId,
                project_name: project_name,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error submitting student query:', {
            error: error.message,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to submit query',
            error: {
                code: 'QUERY_SUBMISSION_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const getReviewRequestHistory = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        // Validate input
        if (!team_id?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    team_id: 'Team ID is required'
                }
            });
        }

        // Maintain original SQL query exactly as provided
        const sql = "SELECT * FROM review_requests WHERE team_id = ?";

        // Execute query
        const [requests] = await db.query(sql, [team_id]);

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Review request history retrieved successfully',
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching review request history:', {
            error: error.message,
            stack: error.stack,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve review request history',
            error: {
                code: 'REVIEW_HISTORY_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const sendReviewRequest = async (req, res, next) => {
    try {
        const { team_id, project_id, reg_num } = req.params;
        const { project_name, team_lead, review_date, start_time, isOptional, reason, mentor_reg_num } = req.body;
        const files = req.files;
        const file = files?.report?.[0] || files?.ppt?.[0] || files?.outcome?.[0];

        // Validate inputs
        if (!team_id?.trim() || !project_id?.trim() || !project_name?.trim() ||
            !team_lead?.trim() || !review_date || !start_time || !reg_num?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Required parameters are missing'
            });
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'At least one file (report/ppt/outcome) must be uploaded'
            });
        }

        const filePath = file.path;
        const today = new Date();
        const reviewDate = new Date(review_date);
        today.setHours(0, 0, 0, 0);
        reviewDate.setHours(0, 0, 0, 0);

        if (reviewDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Review date cannot be in the past'
            });
        }

        const formattedDate = reviewDate.toISOString().split('T')[0];

        // Check if user is team leader (maintaining original SQL)
        const sqlLeader = "SELECT is_leader FROM teams WHERE team_id = ? AND reg_num = ?";
        const [leaderResult] = await db.query(sqlLeader, [team_id, reg_num]);

        if (leaderResult.length === 0 || !leaderResult[0].is_leader) {
            return res.status(403).json({
                success: false,
                message: 'Authorization error',
                error: 'Only team leader can request a review'
            });
        }

        // Get mentor info (maintaining original SQL)
        const sqlMentors = "SELECT guide_reg_num, sub_expert_reg_num FROM teams WHERE team_id = ?";
        const [mentors] = await db.query(sqlMentors, [team_id]);

        if (mentors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Not found',
                error: 'Mentor or expert info not found'
            });
        }

        const expert_reg_num = mentors[0].sub_expert_reg_num;
        const guide_reg_num = mentors[0].guide_reg_num;

        // Check past reviews (maintaining original SQL)
        const sqlReviews = "SELECT * FROM scheduled_reviews WHERE team_id = ?";
        const [pastReviews] = await db.query(sqlReviews, [team_id]);

        if (pastReviews.length >= 2 && isOptional !== "optional") {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Your team already completed 2 reviews'
            });
        }

        const proceed = async (review_title) => {
            if (review_title !== '1st_review' && review_title !== '2nd_review' && review_title !== 'optional') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    error: 'Invalid review title'
                });
            }

            // Check duplicate requests (maintaining original SQL)
            const checkDuplicate = `
                SELECT * FROM review_requests 
                WHERE review_title = ? AND team_id = ? AND guide_status = 'interested' AND expert_status = 'interested'
            `;
            const [res0] = await db.query(checkDuplicate, [review_title, team_id]);

            if (res0.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    error: `${review_title} already sent and pending verification`
                });
            }

            if (review_title === "1st_review" || review_title === "2nd_review") {
                const weekToCheck = review_title === "1st_review" ? 1 : 6;

                // Check week verification (maintaining original SQL)
                const sqlVerifyWeek = "SELECT * FROM weekly_logs_verification WHERE week_number = ? AND is_verified = true AND team_id = ?";
                const [verifyResult] = await db.query(sqlVerifyWeek, [weekToCheck, team_id]);

                if (verifyResult.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Validation error',
                        error: `Week ${weekToCheck} log not verified`
                    });
                }

                // Check duplicate slot (maintaining original SQL)
                const sqlCheckDuplicate = `
                    SELECT * FROM review_requests 
                    WHERE review_date = ? AND start_time = ? AND expert_reg_num = ? AND guide_reg_num = ? AND team_id = ?
                `;
                const [existingReqs] = await db.query(sqlCheckDuplicate, [
                    formattedDate, start_time, expert_reg_num, guide_reg_num, team_id
                ]);

                if (existingReqs.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Validation error',
                        error: 'Review request already exists for this slot'
                    });
                }

                // Insert review request (maintaining original SQL)
                const sqlInsertReview = `
                    INSERT INTO review_requests 
                    (team_id, project_id, project_name, team_lead, review_date, start_time, expert_reg_num, guide_reg_num, review_title, file)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const [insertRes] = await db.query(sqlInsertReview, [
                    team_id, project_id, project_name, team_lead,
                    formattedDate, start_time, expert_reg_num, guide_reg_num,
                    review_title, filePath
                ]);

                return res.status(200).json({
                    success: true,
                    message: 'Review request submitted successfully',
                    data: {
                        review_title,
                        review_date: formattedDate,
                        start_time
                    }
                });

            } else { // Optional review
                // Check duplicate optional (maintaining original SQL)
                const sqlCheckOptional = `
                    SELECT * FROM optional_review_requests 
                    WHERE team_id = ? AND review_date = ? AND start_time = ? AND mentor_reg_num = ?
                `;
                const [optCheck] = await db.query(sqlCheckOptional, [
                    team_id, formattedDate, start_time, mentor_reg_num
                ]);

                if (optCheck.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Validation error',
                        error: 'Already sent optional review request for this slot'
                    });
                }

                // Insert optional review (maintaining original SQL)
                const sqlInsertOptional = `
                    INSERT INTO optional_review_requests 
                    (team_id, project_id, team_lead, review_date, start_time, mentor_reg_num, reason, status, file)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const [result7] = await db.query(sqlInsertOptional, [
                    team_id, project_id, team_lead, formattedDate, start_time,
                    mentor_reg_num, reason, 'pending', filePath
                ]);

                return res.status(200).json({
                    success: true,
                    message: 'Optional review request sent successfully',
                    data: {
                        mentor_reg_num,
                        review_date: formattedDate,
                        start_time
                    }
                });
            }
        };

        if (isOptional === "optional") {
            if (pastReviews.length !== 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    error: 'Optional review only allowed after completing one review'
                });
            }

            // Check week 8 deadline (maintaining original SQL)
            const sqlDeadline = "SELECT week8 FROM weekly_logs_deadlines WHERE team_id = ?";
            const [weekRes] = await db.query(sqlDeadline, [team_id]);

            if (!weekRes.length || !weekRes[0].week8) {
                return res.status(404).json({
                    success: false,
                    message: 'Not found',
                    error: 'Week 8 deadline not found'
                });
            }

            const week8 = new Date(weekRes[0].week8);
            week8.setHours(0, 0, 0, 0);

            if (today < week8) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    error: 'Cannot apply for optional review before Week 8 deadline'
                });
            }

            await proceed("optional");
        } else {
            let review_title = "";
            if (pastReviews.length === 0) {
                review_title = "1st_review";
            } else if (pastReviews.length === 1) {
                review_title = "2nd_review";
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    error: 'Your team already completed 2 reviews'
                });
            }
            await proceed(review_title);
        }

    } catch (error) {
        console.error('Error submitting review request:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to submit review request',
            error: {
                code: 'REVIEW_REQUEST_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const fetchStudentUpcomingReviews = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        // Validate input
        if (!team_id?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    team_id: 'Team ID is required'
                }
            });
        }

        // Maintain original SQL query exactly as provided
        const sql = `
            SELECT * FROM scheduled_reviews 
            WHERE team_id = ? 
            AND (attendance IS NULL OR attendance = '')
            AND CONCAT(review_date, ' ', start_time) >= NOW() - INTERVAL 3 HOUR
            ORDER BY review_date ASC, start_time ASC
        `;

        // Execute query
        const [reviews] = await db.query(sql, [team_id]);

        // Handle response
        if (reviews.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No upcoming reviews found for your team',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Upcoming team reviews retrieved successfully',
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        console.error('Error fetching upcoming team reviews:', {
            error: error.message,
            stack: error.stack,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve upcoming reviews',
            error: {
                code: 'TEAM_REVIEWS_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};




module.exports = {
    fetchTeamStatusAndInvitations,
    getReceivedRequests,
    updateProjectType,
    createJoinRequest,
    getStudentByRegNum,
    handleTeamRequest,
    confirmTeam,
    getProjectDetails,
    getUpcomingDeadlines,
    checkAcceptedStatus,
    getGuideStatus,
    getExpertStatus,
    getTeamDetails,
    addProject,
    getStudentNameByRegNumber,
    getReviewHistory,
    checkLogUpdateStatus,
    updateProgress,
    getTeamQueries,
    submitStudentQuery,
    getReviewRequestHistory,
    sendReviewRequest,
    fetchStudentUpcomingReviews

};