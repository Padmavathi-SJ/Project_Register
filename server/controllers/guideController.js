const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const nodemailer = require('nodemailer');
const  createError  = require('http-errors');

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

const sendGuideRequest = async (req, res, next) => {
    const { semester } = req.params;
    const { from_team_id, project_id, project_name, to_guide_reg_num } = req.body;

    try {
        // Validate inputs
        if (!from_team_id || !project_id || !project_name ||
            !Array.isArray(to_guide_reg_num) || to_guide_reg_num.length === 0 ||
            !semester || ![5, 7].includes(Number(semester))) {
            return next(createError(400, "All required fields must be provided and semester must be 5 or 7"));
        }

        // Check guide eligibility
        const eligibleGuides = await checkGuideEligibility(to_guide_reg_num, semester);
        if (eligibleGuides.length === 0) {
            return next(createError(400, "No eligible guides found (maximum projects per semester reached)"));
        }

        // Process requests
        const results = await processGuideRequests(
            from_team_id,
            project_id,
            project_name,
            eligibleGuides,
            semester
        );

        if (results.failedRequests > 0) {
            return next(createError(500, `Failed to send ${results.failedRequests} request(s)`));
        }

        return res.status(201).json({
            success: true,
            message: `${results.successCount} guide request(s) sent successfully`,
            data: {
                team_id: from_team_id,
                project_id,
                guides_requested: eligibleGuides.length
            }
        });

    } catch (error) {
        console.error('Guide request error:', {
            error: error.message,
            endpoint: '/sent_request_to_guide',
            team_id: from_team_id,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, "Failed to process guide requests"));
    }
};

// Helper function to check guide eligibility
async function checkGuideEligibility(guideRegNums, semester) {
    const eligibleGuides = [];

    await Promise.all(guideRegNums.map(async (guideRegNum) => {
        const [results] = await db.query(
            `SELECT team_semester FROM guide_requests 
       WHERE to_guide_reg_num = ? AND status = 'accept'`,
            [guideRegNum]
        );

        const s5 = results.filter(r => r.team_semester === 5).length;
        const s7 = results.filter(r => r.team_semester === 7).length;

        if ((semester == 5 && s5 < 3) || (semester == 7 && s7 < 3)) {
            eligibleGuides.push(guideRegNum);
        }
    }));

    return eligibleGuides;
}

// Helper function to process requests and send emails
async function processGuideRequests(teamId, projectId, projectName, guides, semester) {
    const results = {
        successCount: 0,
        failedRequests: 0
    };

    await Promise.all(guides.map(async (guideRegNum) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert guide request
            const [insertResult] = await connection.query(
                `INSERT INTO guide_requests 
         (from_team_id, project_id, project_name, to_guide_reg_num, team_semester) 
         VALUES (?, ?, ?, ?, ?)`,
                [teamId, projectId, projectName, guideRegNum, semester]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error("Insert failed");
            }

            // Get guide email
            const [emailResult] = await connection.query(
                "SELECT emailId FROM users WHERE reg_num = ? AND role = 'staff'",
                [guideRegNum]
            );

            if (emailResult.length === 0) {
                throw new Error("Guide email not found");
            }

            // Send email
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: emailResult[0].emailId,
                subject: 'Request To Accept Invite',
                text: `Dear Guide,\n\nTeam ${teamId} has requested you to be their guide for project "${projectName}".\n\nPlease login to the system to accept or reject the request.\n\nThank you.`,
            });

            await connection.commit();
            results.successCount++;

        } catch (error) {
            await connection.rollback();
            console.error(`Request failed for guide ${guideRegNum}:`, error.message);
            results.failedRequests++;
        } finally {
            connection.release();
        }
    }));

    return results;
}


const getGuideRequests = async (req, res, next) => {
    try {
        const { reg_num } = req.params;

        // Validate input
        if (!reg_num?.trim()) {
            return next(createError(400, 'Registration number is required'));
        }

        // Maintained original SQL query exactly as provided
        const sql = "SELECT * FROM guide_requests WHERE to_guide_reg_num = ? AND status = 'interested'";

        const [requests] = await db.query(sql, [reg_num]);

        if (requests.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No pending requests found',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pending requests retrieved successfully',
            data: requests
        });

    } catch (error) {
        console.error('Error fetching guide requests:', {
            error: error.message,
            reg_num: req.params.reg_num,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to retrieve guide requests'));
    }
};
const fetchGuidingTeams = async (req, res, next) => {
    try {
        const { guide_id } = req.params;

        // Validate input
        if (!guide_id?.trim()) {
            return next(createError(400, 'Guide ID is required'));
        }

        // Maintain original SQL query exactly as provided
        const sql = "SELECT * FROM guide_requests WHERE to_guide_reg_num = ? AND status = 'accept'";

        const [teams] = await db.query(sql, [guide_id]);

        if (teams.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No currently guiding teams found',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Guiding teams retrieved successfully',
            count: teams.length,
            data: teams
        });

    } catch (error) {
        console.error('Error fetching guiding teams:', {
            error: error.message,
            guide_id: req.params.guide_id,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to retrieve guiding teams'));
    }
};
const fetchGuideReviewRequests = async (req, res, next) => {
    try {
        const { guide_reg_num } = req.params;

        // Validate input with better error message
        if (!guide_reg_num?.trim()) {
            return next(createError(400, 'Guide registration number is required'));
        }

        // Maintain original SQL query exactly as provided
        const sql = `
            SELECT * 
            FROM review_requests 
            WHERE guide_reg_num = ? 
            AND guide_status = 'interested'
        `;

        const [requests] = await db.query(sql, [guide_reg_num]);

        return res.status(200).json({
            success: true,
            message: requests.length > 0
                ? 'Pending review requests retrieved successfully'
                : 'No pending review requests found',
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching guide review requests:', {
            error: error.message,
            endpoint: '/guide/fetch_review_requests',
            guide_reg_num: req.params.guide_reg_num,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to fetch review requests'));
    }
};
const handleGuideRequest = async (req, res, next) => {
    try {
        const { status, team_id, my_id, semester } = req.params;
        const { reason } = req.body;

        // Validate inputs
        if (!['accept', 'reject'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                error: 'Status must be either "accept" or "reject"'
            });
        }

        if (!team_id || !my_id || !semester || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Missing required data',
                error: 'team_id, my_id, semester, and reason are all required'
            });
        }

        // Check if already acting as expert or guide
        const checkSql = `
            SELECT * FROM sub_expert_requests 
            WHERE to_expert_reg_num = ? AND from_team_id = ? AND status = 'accept' 
            UNION 
            SELECT * FROM guide_requests 
            WHERE to_guide_reg_num = ? AND from_team_id = ? AND status = 'accept'
        `;
        const [existingRoles] = await db.query(checkSql, [my_id, team_id, my_id, team_id]);

        if (existingRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Conflict detected',
                error: 'You are already acting as guide or expert to this team'
            });
        }

        // Update request status
        const updateSql = `
            UPDATE guide_requests 
            SET status = ? 
            WHERE to_guide_reg_num = ? AND from_team_id = ? AND status = 'interested'
        `;
        const [updateResult] = await db.query(updateSql, [status, my_id, team_id]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No request found',
                error: 'No matching guide request found to update'
            });
        }

        if (status === 'accept') {
            // Check current mentoring load
            const countSql = `
                SELECT * FROM guide_requests 
                WHERE to_guide_reg_num = ? AND status = 'accept' AND team_semester = ?
            `;
            const [currentProjects] = await db.query(countSql, [my_id, semester]);

            if (currentProjects.length > 3) {
                // Exceeded limit - make unavailable and clear pending requests
                await db.query(`
                    UPDATE users 
                    SET available = false 
                    WHERE reg_num = ?
                `, [my_id]);

                await db.query(`
                    DELETE FROM guide_requests 
                    WHERE to_guide_reg_num = ? AND status = 'interested'
                `, [my_id]);

                return res.status(200).json({
                    success: true,
                    message: 'Request accepted but you have reached maximum projects',
                    details: 'You have been marked as unavailable and pending requests cleared'
                });
            } else {
                // Assign as guide
                await db.query(`
                    UPDATE teams 
                    SET guide_reg_num = ? 
                    WHERE team_id = ?
                `, [my_id, team_id]);

                return res.status(200).json({
                    success: true,
                    message: 'Request accepted and guide assigned successfully',
                    data: {
                        team_id,
                        guide_id: my_id,
                        semester
                    }
                });
            }
        } else {
            // Handle rejection
            await db.query(`
                UPDATE guide_requests 
                SET reason = ? 
                WHERE from_team_id = ?
            `, [reason, team_id]);

            return res.status(200).json({
                success: true,
                message: 'Request rejected successfully',
                data: {
                    team_id,
                    reason
                }
            });
        }

    } catch (error) {
        console.error('Error in handleGuideRequest:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: {
                code: 'GUIDE_REQUEST_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const getVerifiedWeeksCount = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        // Validate input
        if (!team_id?.trim()) {
            return next(createError(400, {
                success: false,
                message: 'Team ID is required',
                error: {
                    details: 'team_id parameter is missing or empty'
                }
            }));
        }

        // SQL query to get maximum verified week number
        const sql = `
            SELECT COALESCE(MAX(week_number), 0) AS verified_weeks_count 
            FROM weekly_logs_verification 
            WHERE team_id = ? AND is_verified = true
        `;

        // Execute query
        const [result] = await db.query(sql, [team_id]);

        // Return response
        return res.status(200).json({
            success: true,
            message: 'Verified weeks count retrieved successfully',
            data: {
                team_id,
                verified_weeks_count: result[0].verified_weeks_count
            }
        });

    } catch (error) {
        console.error('Error in getVerifiedWeeksCount:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            timestamp: new Date().toISOString()
        });

        return next(createError(500, {
            success: false,
            message: 'Failed to retrieve verified weeks count',
            error: {
                details: 'Internal server error',
                reference: `ERR-${Date.now()}`
            }
        }));
    }
};

const getTeamDetails = async (req, res, next) => {
    try {
        const { team_id } = req.params;

        // Validate input
        if (!team_id?.trim()) {
            return next(createError(400, 'Team ID is required'));
        }

        // SQL query to get team details
        const sql = `SELECT * FROM teams WHERE team_id = ?`;

        // Execute query
        const [teamData] = await db.query(sql, [team_id]);

        // Handle no results case
        if (teamData.length === 0) {
            return next(createError(404, `No team found with ID: ${team_id}`));
        }

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Team details retrieved successfully',
            data: teamData  // Return single object since team_id should be unique
        });

    } catch (error) {
        console.error('Error fetching team details:', {
            error: error.message,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to retrieve team details'));
    }
};

const getGuideQueries = async (req, res, next) => {
    try {
        const { guide_reg_num } = req.params;

        // Validate input
        if (!guide_reg_num?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    guide_reg_num: 'Guide registration number is required'
                }
            });
        }

        // Maintain original SQL query exactly as provided
        const sql = "select * from queries where guide_reg_num = ?";

        // Execute query
        const [queries] = await db.query(sql, [guide_reg_num]);

        // Handle response
        if (queries.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No queries found for this guide',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Queries retrieved successfully',
            count: queries.length,
            data: queries
        });

    } catch (error) {
        console.error('Error fetching guide queries:', {
            error: error.message,
            guide_reg_num: req.params.guide_reg_num,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve queries',
            error: {
                code: 'QUERY_FETCH_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const addReplyToQuery = async (req, res, next) => {
    try {
        const { reply } = req.body;
        const { query_id } = req.params;

        // Validate inputs
        if (!reply?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Reply content is required'
            });
        }

        // Maintain original SQL query exactly as provided
        const sql = "UPDATE queries SET reply = ? WHERE query_id = ?";

        // Execute query
        const [result] = await db.query(sql, [reply, query_id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Operation failed',
                error: 'No matching query found to update'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Reply added successfully'
        });

    } catch (error) {
        console.error('Error adding reply:', {
            error: error.message,
            query_id: req.params.query_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to add reply',
            error: {
                code: 'REPLY_ADD_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const fetchCompletedReviews = async (req, res, next) => {
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

        // SQL query to fetch completed reviews
        const sql = `
            SELECT 
                sr.*,
                t.team_name,
                t.guide_reg_num
            FROM scheduled_reviews sr
            JOIN teams t ON sr.team_id = t.team_id
            WHERE sr.team_id = ? 
            AND sr.attendance NOT IN ('present', 'absent')
            AND TIMESTAMP(sr.review_date, sr.start_time) <= NOW()
            AND TIMESTAMP(sr.review_date, sr.start_time) >= NOW() - INTERVAL 2 DAY
            ORDER BY sr.review_date DESC, sr.start_time DESC
        `;

        // Execute query
        const [reviews] = await db.query(sql, [team_id]);

        // Handle response
        if (reviews.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No pending reviews found within the last 2 days',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pending reviews retrieved successfully',
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        console.error('Error in fetchCompletedReviews:', {
            error: error.message,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve pending reviews',
            error: {
                code: 'REVIEW_FETCH_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const fetchTeamDeadlines = async (req, res, next) => {
    try {
        const { team_id } = req.params;

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

        // Maintain original SQL query exactly as provided
        const sql = "SELECT * FROM weekly_logs_deadlines WHERE team_id = ?";

        // Execute query
        const [deadlines] = await db.query(sql, [team_id]);

        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Team deadlines retrieved successfully',
            data: deadlines.length > 0 ? deadlines : null
        });

    } catch (error) {
        console.error('Error fetching team deadlines:', {
            error: error.message,
            stack: error.stack,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve team deadlines',
            error: {
                code: 'DEADLINES_FETCH_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const verifyWeeklyLogs = async (req, res, next) => {
    try {
        const { guide_reg_num, team_id, week, status } = req.params;
        const { remarks, reason } = req.body;

        // Validate inputs
        if (!guide_reg_num?.trim() || !team_id?.trim() || !week?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Guide registration number, team ID, and week are required'
            });
        }

        const safeStatus = status.toLowerCase();
        const validStatus = ['accept', 'reject'];
        if (!validStatus.includes(safeStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Status must be either "accept" or "reject"'
            });
        }

        if (safeStatus === 'reject' && !reason?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Reason is required for rejection'
            });
        }

        const weekNum = parseInt(week);
        if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Week number must be between 1 and 12'
            });
        }

        if (safeStatus === 'accept' && !remarks?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Remarks are required for acceptance'
            });
        }

        // Validate guide assignment
        const [teamData] = await db.query(
            `SELECT guide_reg_num, week${weekNum}_progress AS week_progress 
             FROM teams 
             WHERE team_id = ?`,
            [team_id]
        );

        if (teamData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
                error: `No team found with ID: ${team_id}`
            });
        }

        if (teamData[0].guide_reg_num !== guide_reg_num) {
            return res.status(403).json({
                success: false,
                message: 'Authorization error',
                error: 'Guide is not assigned to this team'
            });
        }

        // Handle verification based on status
        if (safeStatus === 'accept') {
            // Check if already verified
            const [existingVerification] = await db.query(
                `SELECT * FROM weekly_logs_verification 
                 WHERE team_id = ? AND week_number = ? AND is_verified = true`,
                [team_id, weekNum]
            );

            if (existingVerification.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Conflict',
                    error: `Week ${weekNum} has already been verified`
                });
            }

            // Update verification
            const verifiedAt = new Date();
            const [updateResult] = await db.query(
                `UPDATE weekly_logs_verification 
                 SET is_verified = ?, verified_by = ?, verified_at = ?, remarks = ?, status = ?
                 WHERE team_id = ? AND week_number = ?`,
                [true, guide_reg_num, verifiedAt, remarks, safeStatus, team_id, weekNum]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error('Failed to verify week progress');
            }

            return res.status(200).json({
                success: true,
                message: `Week ${weekNum} successfully verified`,
                data: {
                    verified_by: guide_reg_num,
                    verified_at: verifiedAt,
                    remarks: remarks
                }
            });

        } else { // status === 'reject'
            // Update verification status and reason
            const [rejectResult] = await db.query(
                `UPDATE weekly_logs_verification 
                 SET status = ?, reason = ?
                 WHERE team_id = ? AND week_number = ?`,
                [safeStatus, reason, team_id, weekNum]
            );

            if (rejectResult.affectedRows === 0) {
                throw new Error('Failed to update verification status');
            }

            // Clear progress for all team members
            const [clearResult] = await db.query(
                `UPDATE teams 
                 SET week${weekNum}_progress = NULL 
                 WHERE team_id = ?`,
                [team_id]
            );

            if (clearResult.affectedRows === 0) {
                throw new Error('Failed to clear team progress');
            }

            return res.status(200).json({
                success: true,
                message: `Week ${weekNum} rejected and progress cleared`,
                data: {
                    team_id: team_id,
                    week: weekNum,
                    reason: reason
                }
            });
        }

    } catch (error) {
        console.error('Error verifying weekly logs:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to verify weekly logs',
            error: {
                code: 'VERIFICATION_ERROR',
                details: error.message,
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const handleReviewConfirmation = async (req, res, next) => {
    try {
        const { project_id, project_name, team_lead, review_date, start_time, reason, review_title } = req.body;
        const { request_id, status, guide_reg_num, team_id } = req.params;

        // Validate inputs
        if (!project_id?.trim() || !project_name?.trim() || !team_lead?.trim() ||
            !review_date || !start_time || !request_id?.trim() ||
            !status?.trim() || !team_id?.trim() || !review_title?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'All required fields must be provided'
            });
        }

        const safeStatus = status.toLowerCase();
        const validStatus = ['accept', 'reject'];
        if (!validStatus.includes(safeStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Status must be either "accept" or "reject"'
            });
        }

        if (safeStatus === 'reject' && !reason?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Reason is required for rejection'
            });
        }

        // Update guide status (maintaining original SQL)
        const updatequery = "UPDATE review_requests SET guide_status = ? WHERE request_id = ?";
        const [updateResult] = await db.query(updatequery, [safeStatus, request_id]);

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Update failed',
                error: 'No rows were affected'
            });
        }

        if (safeStatus === 'accept') {
            // Check expert status (maintaining original SQL)
            const sql1 = "SELECT expert_status, expert_reg_num, temp_meeting_link FROM review_requests WHERE request_id = ?";
            const [expertStatusResult] = await db.query(sql1, [request_id]);

            if (expertStatusResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Not found',
                    error: 'Review request not found'
                });
            }

            if (expertStatusResult[0].expert_status !== 'accept') {
                return res.status(200).json({
                    success: true,
                    message: 'Guide accepted, waiting for expert confirmation',
                    data: {
                        expert_status: expertStatusResult[0].expert_status
                    }
                });
            }

            // Insert into scheduled reviews (maintaining original SQL)
            const expert_reg_num = expertStatusResult[0].expert_reg_num;
            const meeting_link = expertStatusResult[0].temp_meeting_link;

            const insertSql = `
                INSERT INTO scheduled_reviews
                (project_id, project_name, team_lead, review_date, start_time, 
                 expert_reg_num, guide_reg_num, team_id, review_title, meeting_link)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [insertResult] = await db.query(insertSql, [
                project_id, project_name, team_lead, review_date, start_time,
                expert_reg_num, guide_reg_num, team_id, review_title, meeting_link
            ]);

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to schedule review');
            }

            // Remove from review requests (maintaining original SQL)
            const deleteSql = "DELETE FROM review_requests WHERE request_id = ?";
            await db.query(deleteSql, [request_id]);

            return res.status(200).json({
                success: true,
                message: 'Review scheduled successfully',
                data: {
                    request_id,
                    review_date,
                    start_time,
                    participants: {
                        guide: guide_reg_num,
                        expert: expert_reg_num
                    }
                }
            });

        } else { // status === 'reject'
            // Update rejection reason (maintaining original SQL)
            const rejectSql = "UPDATE review_requests SET guide_reason = ? WHERE request_id = ?";
            const [rejectResult] = await db.query(rejectSql, [reason, request_id]);

            if (rejectResult.affectedRows === 0) {
                throw new Error('Failed to update rejection reason');
            }

            return res.status(200).json({
                success: true,
                message: 'Review request rejected',
                data: {
                    request_id,
                    reason
                }
            });
        }

    } catch (error) {
        console.error('Error confirming review request:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to process review confirmation',
            error: {
                code: 'REVIEW_CONFIRMATION_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const fetchUpcomingReviews = async (req, res, next) => {
    try {
        const { guide_reg_num } = req.params;
        console.log(guide_reg_num, "upvomming reviews");
        // Validate input
        if (!guide_reg_num?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    guide_reg_num: 'Guide registration number is required'
                }
            });
        }

        // Maintain original SQL query exactly as provided
        const sql = `
            SELECT * FROM scheduled_reviews 
            WHERE guide_reg_num = ? 
            AND (attendance IS NULL OR attendance = '')
            AND CONCAT(review_date, ' ', start_time) >= NOW() - INTERVAL 3 HOUR
        `;

        // Execute query
        const [reviews] = await db.query(sql, [guide_reg_num]);

        // Handle response
        if (reviews.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No upcoming reviews found',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Upcoming reviews retrieved successfully',
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        console.error('Error fetching upcoming reviews:', {
            error: error.message,
            stack: error.stack,
            guide_reg_num: req.params.guide_reg_num,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve upcoming reviews',
            error: {
                code: 'UPCOMING_REVIEWS_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const addTeamReviewMarks = async (req, res, next) => {
    try {
        const { guide_reg_num } = req.params;
        const {
            review_title,
            review_date,
            team_id,
            guide_literature_survey,
            guide_aim,
            guide_scope,
            guide_need_for_study,
            guide_proposed_methodology,
            guide_work_plan,
            guide_remarks
        } = req.body;

        // Validate required fields
        if (!review_title || !review_date || !team_id ||
            guide_reg_num == null ||
            guide_literature_survey == null ||
            guide_aim == null ||
            guide_scope == null ||
            guide_need_for_study == null ||
            guide_proposed_methodology == null ||
            guide_work_plan == null ||
            guide_remarks == null) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'All required fields must be provided'
            });
        }

        // Validate review title
        const validReviewTitles = ['1st_review', '2nd_review', 'optional_review'];
        if (!validReviewTitles.includes(review_title)) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Invalid review title'
            });
        }

        // Validate time window (3 hours)
        const reviewDate = new Date(review_date);
        const currentDate = new Date();
        const diffInMs = currentDate - reviewDate;
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours > 33) {
            return res.status(403).json({
                success: false,
                message: 'Time window exceeded',
                error: 'Marks can only be entered within 33 hours after the review'
            });
        }

        const formattedDate = reviewDate.toISOString().split('T')[0];

        // Check if marks already exist (maintaining original SQL)
        const [existingMarks] = await db.query(
            "SELECT * FROM review_marks_team WHERE team_id = ? AND review_date = ? AND review_title = ?",
            [team_id, formattedDate, review_title]
        );

        if (existingMarks.length > 0 && existingMarks[0].total_guide_marks !== null) {
            return res.status(400).json({
                success: false,
                message: 'Operation failed',
                error: 'Review marks already updated'
            });
        }

        // Calculate total marks
        const totalGuideMarks =
            parseInt(guide_literature_survey) +
            parseInt(guide_aim) +
            parseInt(guide_scope) +
            parseInt(guide_need_for_study) +
            parseInt(guide_proposed_methodology) +
            parseInt(guide_work_plan);

        // Check if expert marks exist (maintaining original SQL)
        const [expertMarks] = await db.query(
            "SELECT * FROM review_marks_team WHERE review_title = ? AND review_date = ? AND team_id = ? AND guide_reg_num = ?",
            [review_title, formattedDate, team_id, guide_reg_num]
        );

        if (expertMarks.length === 0) {
            // Insert new record (maintaining original SQL)
            const [insertResult] = await db.query(
                `INSERT INTO review_marks_team (
                    review_title, review_date, team_id, guide_literature_survey,
                    guide_aim, guide_scope, guide_need_for_study, guide_proposed_methodology,
                    guide_work_plan, total_marks, total_guide_marks, guide_remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    review_title, formattedDate, team_id, guide_literature_survey,
                    guide_aim, guide_scope, guide_need_for_study, guide_proposed_methodology,
                    guide_work_plan, totalGuideMarks, totalGuideMarks, guide_remarks
                ]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to insert review marks');
            }

            return res.status(200).json({
                success: true,
                message: 'Guide marks added successfully',
                data: {
                    total_marks: totalGuideMarks
                }
            });
        } else {
            // Update existing record (maintaining original SQL)
            const totalExpertMarks = expertMarks[0].total_expert_marks || 0;
            const totalMarks = totalGuideMarks + totalExpertMarks;

            const [updateResult] = await db.query(
                `UPDATE review_marks_team SET
                    guide_literature_survey = ?,
                    guide_aim = ?,
                    guide_scope = ?,
                    guide_need_for_study = ?,
                    guide_proposed_methodology = ?,
                    guide_work_plan = ?,
                    total_guide_marks = ?,
                    total_marks = ?,
                    guide_remarks = ?
                WHERE review_title = ? AND review_date = ? AND team_id = ?`,
                [
                    guide_literature_survey, guide_aim, guide_scope,
                    guide_need_for_study, guide_proposed_methodology,
                    guide_work_plan, totalGuideMarks, totalMarks,
                    guide_remarks, review_title, formattedDate, team_id
                ]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error('Failed to update review marks');
            }

            return res.status(200).json({
                success: true,
                message: 'Guide marks updated successfully',
                data: {
                    total_marks: totalMarks
                }
            });
        }

    } catch (error) {
        console.error('Error adding team review marks:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to process review marks',
            error: {
                code: 'REVIEW_MARKS_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const addIndividualReviewMarks = async (req, res, next) => {
    try {
        const { guide_reg_num, reg_num } = req.params;
        const {
            team_id,
            review_title,
            review_date,
            guide_oral_presentation,
            guide_viva_voce_and_ppt,
            guide_contributions,
            guide_remarks
        } = req.body;

        // Validate required fields
        const requiredFields = {
            review_title,
            review_date,
            guide_reg_num,
            reg_num,
            team_id,
            guide_oral_presentation,
            guide_viva_voce_and_ppt,
            guide_contributions,
            guide_remarks
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => value == null)
            .map(([field]) => field);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate review title
        const validReviewTitles = ['1st_review', '2nd_review', 'optional_review'];
        if (!validReviewTitles.includes(review_title)) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Invalid review title'
            });
        }

        // Validate time window (3 hours)
        const reviewDate = new Date(review_date);
        const currentDate = new Date();
        const diffInMs = currentDate - reviewDate;
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours > 33) {
            return res.status(403).json({
                success: false,
                message: 'Time window exceeded',
                error: 'Marks can only be entered within 33 hours after the review'
            });
        }

        const formattedDate = reviewDate.toISOString().split('T')[0];

        // Calculate total guide marks
        const totalGuideMarks =
            parseInt(guide_oral_presentation) +
            parseInt(guide_viva_voce_and_ppt) +
            parseInt(guide_contributions);

        // Check if marks already exist
        const [existingMarks] = await db.query(
            `SELECT * FROM review_marks_individual 
             WHERE team_id = ? AND review_date = ? AND review_title = ? AND guide_reg_num = ?`,
            [team_id, formattedDate, review_title, guide_reg_num]
        );

        if (existingMarks.length > 0 && existingMarks[0].total_guide_marks !== null) {
            return res.status(400).json({
                success: false,
                message: 'Operation failed',
                error: 'Review marks already updated'
            });
        }

        // Check if expert marks exist
        const [studentMarks] = await db.query(
            `SELECT * FROM review_marks_individual 
             WHERE review_title = ? AND review_date = ? AND team_id = ? AND student_reg_num = ?`,
            [review_title, formattedDate, team_id, reg_num]
        );

        if (studentMarks.length === 0) {
            // Insert new record
            const [insertResult] = await db.query(
                `INSERT INTO review_marks_individual (
                    review_title, review_date, team_id, student_reg_num,
                    guide_oral_presentation, expert_oral_presentation,
                    guide_viva_voce_and_ppt, expert_viva_voce_and_ppt,
                    guide_contributions, expert_contributions,
                    total_expert_marks, total_guide_marks, total_marks,
                    guide_remarks, guide_reg_num, expert_reg_num
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    review_title, formattedDate, team_id, reg_num,
                    guide_oral_presentation, 0, // expert_oral_presentation default 0
                    guide_viva_voce_and_ppt, 0, // expert_viva_voce_and_ppt default 0
                    guide_contributions, 0, // expert_contributions default 0
                    0, // total_expert_marks default 0
                    totalGuideMarks,
                    totalGuideMarks, // total_marks = guide only initially
                    guide_remarks,
                    guide_reg_num,
                    null // expert_reg_num initially null
                ]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to insert review marks');
            }

            return res.status(200).json({
                success: true,
                message: 'Individual marks added successfully',
                data: {
                    total_marks: totalGuideMarks
                }
            });
        } else {
            // Update existing record
            const totalExpertMarks = studentMarks[0].total_expert_marks || 0;
            const totalMarks = totalGuideMarks + totalExpertMarks;

            const [updateResult] = await db.query(
                `UPDATE review_marks_individual SET
                    guide_oral_presentation = ?,
                    guide_viva_voce_and_ppt = ?,
                    guide_contributions = ?,
                    total_guide_marks = ?,
                    total_marks = ?,
                    guide_remarks = ?
                WHERE review_title = ? AND review_date = ? AND team_id = ? AND student_reg_num = ?`,
                [
                    guide_oral_presentation,
                    guide_viva_voce_and_ppt,
                    guide_contributions,
                    totalGuideMarks,
                    totalMarks,
                    guide_remarks,
                    review_title,
                    formattedDate,
                    team_id,
                    reg_num
                ]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error('Failed to update review marks');
            }

            return res.status(200).json({
                success: true,
                message: 'Individual marks updated successfully',
                data: {
                    total_marks: totalMarks
                }
            });
        }

    } catch (error) {
        console.error('Error adding individual review marks:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to process review marks',
            error: {
                code: 'INDIVIDUAL_REVIEW_MARKS_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};






module.exports = {
    sendGuideRequest,
    getGuideRequests,
    fetchGuidingTeams,
    fetchGuideReviewRequests,
    getVerifiedWeeksCount,
    getTeamDetails,
    getGuideQueries,
    addReplyToQuery,
    fetchCompletedReviews,
    handleGuideRequest,
    fetchTeamDeadlines,
    verifyWeeklyLogs,
    handleReviewConfirmation,
    fetchUpcomingReviews,
    addTeamReviewMarks,
    addIndividualReviewMarks,


};
