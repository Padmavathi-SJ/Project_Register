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

const sendExpertRequest = async (req, res, next) => {
    const { semester } = req.params;
    const { from_team_id, project_id, project_name, to_expert_reg_num } = req.body;
    console.log(from_team_id, project_id, project_name, to_expert_reg_num);
    try {
        // Validate inputs
        if (!from_team_id || !project_id || !project_name ||
            !Array.isArray(to_expert_reg_num) || to_expert_reg_num.length === 0 ||
            !semester || ![5, 7].includes(Number(semester))) {
            return next(createError(400, "All required fields must be provided and semester must be 5 or 7"));
        }

        // Check expert eligibility
        const eligibleExperts = await checkExpertEligibility(to_expert_reg_num, semester);
        if (eligibleExperts.length === 0) {
            return next(createError(400, "No eligible experts found (maximum projects per semester reached)"));
        }

        // Process requests
        const results = await processExpertRequests(
            from_team_id,
            project_id,
            project_name,
            eligibleExperts,
            semester
        );

        if (results.failedRequests > 0) {
            return next(createError(500, `Failed to send ${results.failedRequests} request(s)`));
        }

        return res.status(201).json({
            success: true,
            message: `${results.successCount} expert request(s) sent successfully`,
            data: {
                team_id: from_team_id,
                project_id,
                experts_requested: eligibleExperts.length
            }
        });

    } catch (error) {
        console.error('Expert request error:', {
            error: error.message,
            endpoint: '/sent_request_to_expert',
            team_id: from_team_id,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, "Failed to process expert requests"));
    }
};

// Helper function to check expert eligibility
async function checkExpertEligibility(expertRegNums, semester) {
    const eligibleExperts = [];

    await Promise.all(expertRegNums.map(async (expertRegNum) => {
        const [results] = await db.query(
            `SELECT team_semester FROM sub_expert_requests 
       WHERE to_expert_reg_num = ? AND status = 'accept'`,
            [expertRegNum]
        );

        const s5 = results.filter(r => r.team_semester === 5).length;
        const s7 = results.filter(r => r.team_semester === 7).length;

        if ((semester == 5 && s5 < 3) || (semester == 7 && s7 < 3)) {
            eligibleExperts.push(expertRegNum);
        }
    }));

    return eligibleExperts;
}

// Helper function to process requests and send emails
async function processExpertRequests(teamId, projectId, projectName, experts, semester) {
    const results = {
        successCount: 0,
        failedRequests: 0
    };

    await Promise.all(experts.map(async (expertRegNum) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert expert request
            const [insertResult] = await connection.query(
                `INSERT INTO sub_expert_requests 
         (from_team_id, project_id, project_name, to_expert_reg_num, team_semester) 
         VALUES (?, ?, ?, ?, ?)`,
                [teamId, projectId, projectName, expertRegNum, semester]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error("Insert failed");
            }

            // Get expert email
            const [emailResult] = await connection.query(
                "SELECT emailId FROM users WHERE reg_num = ? AND role = 'staff'",
                [expertRegNum]
            );

            if (emailResult.length === 0) {
                throw new Error("Expert email not found");
            }

            // Send email
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: emailResult[0].emailId,
                subject: 'Request To Be Project Expert',
                text: `Dear Expert,\n\nTeam ${teamId} has requested you to be their subject expert for project "${projectName}".\n\nPlease login to the system to accept or reject the request.\n\nThank you.`,
            });

            await connection.commit();
            results.successCount++;

        } catch (error) {
            await connection.rollback();
            console.error(`Request failed for expert ${expertRegNum}:`, error.message);
            results.failedRequests++;
        } finally {
            connection.release();
        }
    }));

    return results;
}

const getExpertRequests = async (req, res, next) => {
    try {
        const { reg_num } = req.params;

        // Validate input
        if (!reg_num?.trim()) {
            return next(createError(400, 'Expert registration number is required'));
        }

        // Maintain original SQL query exactly as provided
        const sql = "SELECT * FROM sub_expert_requests WHERE to_expert_reg_num = ? AND status = 'interested'";

        const [requests] = await db.query(sql, [reg_num]);

        if (requests.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No pending expert requests found',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pending expert requests retrieved successfully',
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching expert requests:', {
            error: error.message,
            reg_num: req.params.reg_num,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to retrieve expert requests'));
    }
};

const fetchExpertTeams = async (req, res, next) => {
    try {
        const { expert_id } = req.params;

        // Validate input
        if (!expert_id?.trim()) {
            return next(createError(400, 'Expert ID is required'));
        }

        // Maintain original SQL query exactly as provided
        const sql = "SELECT * FROM sub_expert_requests WHERE to_expert_reg_num = ? AND status = 'accept'";

        const [teams] = await db.query(sql, [expert_id]);

        if (teams.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No teams currently assigned to this expert',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Expert teams retrieved successfully',
            count: teams.length,
            data: teams
        });

    } catch (error) {
        console.error('Error fetching expert teams:', {
            error: error.message,
            expert_id: req.params.expert_id,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to retrieve expert teams'));
    }
};
const fetchReviewRequests = async (req, res, next) => {
    try {
        const { expert_reg_num } = req.params;
        console.log(expert_reg_num, "expert_reg_num");
        // Validate input
        if (!expert_reg_num?.trim()) {
            return next(createError(400, 'Expert registration number is required'));
        }

        // Maintain original SQL query exactly as provided
        const sql = "SELECT * FROM review_requests WHERE expert_reg_num = ? AND expert_status = 'interested'";

        const [requests] = await db.query(sql, [expert_reg_num]);
        console.log(requests, "[[[[[[[[[[[[]]]]]]]]]]]]]]");
        return res.status(200).json({
            success: true,
            message: requests.length > 0
                ? 'Review requests retrieved successfully'
                : 'No pending review requests found',
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching review requests:', {
            error: error.message,
            expert_reg_num: req.params.expert_reg_num,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to retrieve review requests'));
    }
};

const handleExpertRequest = async (req, res, next) => {
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

        // Check if already acting as guide or mentor
        const checkSql = `
            SELECT * FROM guide_requests 
            WHERE to_guide_reg_num = ? AND from_team_id = ? AND status = 'accept' 
            UNION 
            SELECT * FROM sub_expert_requests 
            WHERE to_expert_reg_num = ? AND from_team_id = ? AND status = 'accept'
        `;
        const [existingRoles] = await db.query(checkSql, [my_id, team_id, my_id, team_id]);

        if (existingRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Conflict detected',
                error: 'You are already acting as guide or mentor to this team'
            });
        }

        // Update request status
        const updateSql = `
            UPDATE sub_expert_requests 
            SET status = ? 
            WHERE to_expert_reg_num = ? AND from_team_id = ? AND status = 'interested'
        `;
        const [updateResult] = await db.query(updateSql, [status, my_id, team_id]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No request found',
                error: 'No matching expert request found to update'
            });
        }

        if (status === 'accept') {
            // Check current mentoring load
            const countSql = `
                SELECT * FROM sub_expert_requests 
                WHERE to_expert_reg_num = ? AND status = 'accept' AND team_semester = ?
            `;
            const [currentProjects] = await db.query(countSql, [my_id, semester]);

            if (currentProjects.length > 3) {
                // Exceeded limit - make unavailable and clear pending requests
                await db.query(`
                    UPDATE users 
                    SET available = false 
                    WHERE reg_num = ? AND role = 'staff'
                `, [my_id]);

                await db.query(`
                    DELETE FROM sub_expert_requests 
                    WHERE to_expert_reg_num = ? AND status = 'interested'
                `, [my_id]);

                return res.status(200).json({
                    success: true,
                    message: 'Request accepted but you have reached maximum projects',
                    details: 'You have been marked as unavailable and pending requests cleared'
                });
            } else {
                // Assign as expert
                await db.query(`
                    UPDATE teams 
                    SET sub_expert_reg_num = ? 
                    WHERE team_id = ?
                `, [my_id, team_id]);

                return res.status(200).json({
                    success: true,
                    message: 'Request accepted and expert assigned successfully',
                    data: {
                        team_id,
                        expert_id: my_id,
                        semester
                    }
                });
            }
        } else {
            // Handle rejection
            await db.query(`
                UPDATE sub_expert_requests 
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
        console.error('Error in handleExpertRequest:', {
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
                code: 'EXPERT_REQUEST_ERROR',
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
                    team_id: 'Team ID is required and cannot be empty'
                }
            });
        }

        // SQL query to fetch completed reviews
        const sql = `
            SELECT * FROM scheduled_reviews 
            WHERE team_id = ? 
            AND attendance IS NULL 
            AND TIMESTAMP(review_date, start_time) <= CURRENT_TIMESTAMP 
            AND review_date >= CURDATE() - INTERVAL 2 DAY
            ORDER BY review_date DESC, start_time DESC
        `;

        // Execute query
        const [reviews] = await db.query(sql, [team_id]);

        // Handle response
        if (reviews.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No completed reviews found within the last 2 days',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Completed reviews retrieved successfully',
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        console.error('Error fetching completed reviews:', {
            error: error.message,
            stack: error.stack,
            team_id: req.params.team_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve completed reviews',
            error: {
                code: 'REVIEW_FETCH_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const handleExpertReviewConfirmation = async (req, res, next) => {
    try {
        const { project_id, project_name, team_lead, review_date, start_time, review_title, reason, temp_meeting_link } = req.body;
        const { request_id, status, expert_reg_num, team_id } = req.params;

        // Validate inputs
        const missingFields = [];
        if (!project_id?.trim()) missingFields.push('project_id');
        if (!project_name?.trim()) missingFields.push('project_name');
        if (!team_lead?.trim()) missingFields.push('team_lead');
        if (!review_date) missingFields.push('review_date');
        if (!start_time) missingFields.push('start_time');
        if (!request_id?.trim()) missingFields.push('request_id');
        if (!status?.trim()) missingFields.push('status');
        if (!team_id?.trim()) missingFields.push('team_id');
        if (!review_title?.trim()) missingFields.push('review_title');
        if (status.toLowerCase() === 'accept' && !temp_meeting_link) missingFields.push('temp_meeting_link');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: `Missing required fields: ${missingFields.join(', ')}`
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

        // Update expert status (maintaining original SQL)
        const updatequery = "UPDATE review_requests SET expert_status = ?, temp_meeting_link = ? WHERE request_id = ?";
        const [updateResult] = await db.query(updatequery, [safeStatus, temp_meeting_link, request_id]);

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Update failed',
                error: 'No review request found to update'
            });
        }

        if (safeStatus === 'accept') {
            // Check guide status (maintaining original SQL)
            const sql1 = "SELECT guide_status, guide_reg_num, temp_meeting_link FROM review_requests WHERE request_id = ?";
            const [guideStatusResult] = await db.query(sql1, [request_id]);

            if (guideStatusResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Not found',
                    error: 'Review request not found'
                });
            }

            if (guideStatusResult[0].guide_status !== 'accept') {
                return res.status(200).json({
                    success: true,
                    message: 'Expert accepted, waiting for guide confirmation',
                    data: {
                        guide_status: guideStatusResult[0].guide_status
                    }
                });
            }

            // Insert into scheduled reviews (maintaining original SQL)
            const guide_reg_num = guideStatusResult[0].guide_reg_num;
            const meeting_link = guideStatusResult[0].temp_meeting_link;

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
                    },
                    meeting_link
                }
            });

        } else { // status === 'reject'
            // Update rejection reason (maintaining original SQL)
            const rejectSql = "UPDATE review_requests SET expert_reason = ? WHERE request_id = ?";
            const [rejectResult] = await db.query(rejectSql, [reason, request_id]);

            if (rejectResult.affectedRows === 0) {
                throw new Error('Failed to update rejection reason');
            }

            return res.status(200).json({
                success: true,
                message: 'Review request rejected by expert',
                data: {
                    request_id,
                    reason
                }
            });
        }

    } catch (error) {
        console.error('Error processing expert review confirmation:', {
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
                code: 'EXPERT_REVIEW_CONFIRMATION_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const fetchExpertUpcomingReviews = async (req, res, next) => {
    try {
        const { expert_reg_num } = req.params;

        // Validate input
        if (!expert_reg_num?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    expert_reg_num: 'Expert registration number is required'
                }
            });
        }

        // Maintain original SQL query exactly as provided
        const sql = `
            SELECT * FROM scheduled_reviews 
            WHERE expert_reg_num = ? 
            AND (attendance IS NULL OR attendance = '')
            AND CONCAT(review_date, ' ', start_time) >= NOW() - INTERVAL 3 HOUR
            ORDER BY review_date ASC, start_time ASC
        `;

        // Execute query
        const [reviews] = await db.query(sql, [expert_reg_num]);

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
        console.error('Error fetching upcoming expert reviews:', {
            error: error.message,
            stack: error.stack,
            expert_reg_num: req.params.expert_reg_num,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve upcoming reviews',
            error: {
                code: 'EXPERT_REVIEWS_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const markReviewEndTime = async (req, res, next) => {
    try {
        const { review_id } = req.params;
        const { end_time } = req.body;

        // Validate inputs
        if (!review_id?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Review ID is required'
            });
        }

        if (!end_time?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'End time is required'
            });
        }

        // Validate time format (HH:MM:SS)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
        if (!timeRegex.test(end_time)) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Invalid time format. Use HH:MM:SS'
            });
        }

        // Check review exists and get scheduled time
        const sql0 = "SELECT review_date, start_time FROM scheduled_reviews WHERE review_id = ?";
        const [reviewData] = await db.query(sql0, [review_id]);

        if (reviewData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Not found',
                error: 'Review session not found'
            });
        }

        const { review_date, start_time } = reviewData[0];
        const scheduledTime = new Date(`${review_date}T${start_time}`);
        const now = new Date();

        // Validate time window (3 hours)
        const diffInMs = now - scheduledTime;
        const threeHoursInMs = 3 * 60 * 60 * 1000;

        if (diffInMs > threeHoursInMs) {
            return res.status(400).json({
                success: false,
                message: 'Time window exceeded',
                error: 'Cannot update end time after 3 hours from scheduled start'
            });
        }

        // Update end time
        const sql = "UPDATE scheduled_reviews SET end_time = ? WHERE review_id = ?";
        const [updateResult] = await db.query(sql, [end_time, review_id]);

        if (updateResult.affectedRows === 0) {
            throw new Error('Failed to update end time');
        }

        return res.status(200).json({
            success: true,
            message: 'End time updated successfully',
            data: {
                review_id,
                end_time,
                updated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error marking review end time:', {
            error: error.message,
            stack: error.stack,
            review_id: req.params.review_id,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to update end time',
            error: {
                code: 'END_TIME_UPDATE_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};
const addExpertTeamReviewMarks = async (req, res, next) => {
    try {
        const { expert_reg_num } = req.params;
        const {
            review_title,
            review_date,
            team_id,
            expert_literature_survey,
            expert_aim,
            expert_scope,
            expert_need_for_study,
            expert_proposed_methodology,
            expert_work_plan,
            expert_remarks
        } = req.body;

        // Validate required fields
        const requiredFields = {
            review_title,
            review_date,
            team_id,
            expert_literature_survey,
            expert_aim,
            expert_scope,
            expert_need_for_study,
            expert_proposed_methodology,
            expert_work_plan,
            expert_remarks
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

        if (diffInHours > 3) {
            return res.status(403).json({
                success: false,
                message: 'Time window exceeded',
                error: 'Marks can only be entered within 3 hours after the review'
            });
        }

        const formattedDate = reviewDate.toISOString().split('T')[0];

        // Calculate total marks
        const totalExpertMarks =
            parseInt(expert_literature_survey) +
            parseInt(expert_aim) +
            parseInt(expert_scope) +
            parseInt(expert_need_for_study) +
            parseInt(expert_proposed_methodology) +
            parseInt(expert_work_plan);

        // Check if marks already exist
        const [existingMarks] = await db.query(
            "SELECT * FROM review_marks_team WHERE team_id = ? AND review_date = ? AND review_title = ? AND expert_reg_num = ?",
            [team_id, formattedDate, review_title, expert_reg_num]
        );

        if (existingMarks.length > 0 && existingMarks[0].total_expert_marks !== null) {
            return res.status(400).json({
                success: false,
                message: 'Operation failed',
                error: 'Review marks already updated'
            });
        }

        // Check if guide marks exist
        const [guideMarks] = await db.query(
            "SELECT * FROM review_marks_team WHERE review_title = ? AND review_date = ? AND team_id = ?",
            [review_title, formattedDate, team_id]
        );

        if (guideMarks.length === 0) {
            // Insert new record
            const [insertResult] = await db.query(
                `INSERT INTO review_marks_team (
                    review_title, review_date, team_id, expert_literature_survey,
                    expert_aim, expert_scope, expert_need_for_study, expert_proposed_methodology,
                    expert_work_plan, total_marks, total_expert_marks, expert_remarks, expert_reg_num
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    review_title, formattedDate, team_id, expert_literature_survey,
                    expert_aim, expert_scope, expert_need_for_study, expert_proposed_methodology,
                    expert_work_plan, totalExpertMarks, totalExpertMarks, expert_remarks, expert_reg_num
                ]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to insert review marks');
            }

            return res.status(200).json({
                success: true,
                message: 'Expert marks added successfully',
                data: {
                    total_marks: totalExpertMarks
                }
            });
        } else {
            // Update existing record
            const totalGuideMarks = guideMarks[0].total_guide_marks || 0;
            const totalMarks = totalGuideMarks + totalExpertMarks;

            const [updateResult] = await db.query(
                `UPDATE review_marks_team SET
                    expert_literature_survey = ?,
                    expert_aim = ?,
                    expert_scope = ?,
                    expert_need_for_study = ?,
                    expert_proposed_methodology = ?,
                    expert_work_plan = ?,
                    total_expert_marks = ?,
                    total_marks = ?,
                    expert_remarks = ?,
                    expert_reg_num = ?
                WHERE review_title = ? AND review_date = ? AND team_id = ?`,
                [
                    expert_literature_survey, expert_aim, expert_scope,
                    expert_need_for_study, expert_proposed_methodology,
                    expert_work_plan, totalExpertMarks, totalMarks,
                    expert_remarks, expert_reg_num, review_title, formattedDate, team_id
                ]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error('Failed to update review marks');
            }

            return res.status(200).json({
                success: true,
                message: 'Expert marks updated successfully',
                data: {
                    total_marks: totalMarks
                }
            });
        }

    } catch (error) {
        console.error('Error adding expert team review marks:', {
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
                code: 'EXPERT_REVIEW_MARKS_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};

const addExpertMarksToIndividual = async (req, res, next) => {
    try {
        const { expert_reg_num, reg_num } = req.params;
        const {
            team_id,
            review_title,
            review_date,
            expert_oral_presentation,
            expert_viva_voce_and_ppt,
            expert_contributions,
            expert_remarks
        } = req.body;

        // Validate required fields
        if (!review_title?.trim() || !review_date || !expert_reg_num?.trim() || !reg_num?.trim() || !team_id?.trim()) {
            return next(createError(400, 'Expert register number, student register number, or team ID is missing'));
        }

        if (!expert_oral_presentation || !expert_viva_voce_and_ppt || !expert_contributions || !expert_remarks) {
            return next(createError(400, 'Required marks data is missing'));
        }

        // Validate review title
        const validReviewTitles = ['1st_review', '2nd_review', 'optional_review'];
        if (!validReviewTitles.includes(review_title)) {
            return next(createError(400, 'Invalid review title'));
        }

        // Validate review date (within 3 hours)
        const reviewDate = new Date(review_date);
        const currentDate = new Date();
        const diffInHours = (currentDate - reviewDate) / (1000 * 60 * 60);

        if (diffInHours > 3) {
            return next(createError(403, 'Marks can only be entered within 3 hours after the review'));
        }

        const formattedDate = reviewDate.toISOString().split('T')[0];
        const total_expert_marks = parseInt(expert_oral_presentation) +
            parseInt(expert_viva_voce_and_ppt) +
            parseInt(expert_contributions);

        // Check if marks already exist
        const checkSql = `
            SELECT * FROM review_marks_individual 
            WHERE team_id = ? 
            AND review_date = ? 
            AND review_title = ? 
            AND expert_reg_num = ?
        `;

        const [existingMarks] = await db.query(checkSql, [
            team_id,
            formattedDate,
            review_title,
            expert_reg_num
        ]);

        if (existingMarks.length > 0 && existingMarks[0].total_expert_marks !== null) {
            return next(createError(400, 'Expert review marks already updated'));
        }

        if (existingMarks.length === 0) {
            // Insert new record
            const insertSql = `
                INSERT INTO review_marks_individual (
                    review_title,
                    review_date,
                    team_id,
                    student_reg_num,
                    guide_oral_presentation,
                    expert_oral_presentation,
                    guide_viva_voce_and_ppt,
                    expert_viva_voce_and_ppt,
                    guide_contributions,
                    expert_contributions,
                    total_expert_marks,
                    total_guide_marks,
                    total_marks,
                    guide_remarks,
                    expert_remarks,
                    guide_reg_num,
                    expert_reg_num
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const insertValues = [
                review_title,
                formattedDate,
                team_id,
                reg_num,
                0, // guide_oral_presentation default
                expert_oral_presentation,
                0, // guide_viva_voce_and_ppt default
                expert_viva_voce_and_ppt,
                0, // guide_contributions default
                expert_contributions,
                total_expert_marks,
                0, // total_guide_marks default
                total_expert_marks, // total_marks = expert only initially
                null, // guide_remarks initially null
                expert_remarks,
                null, // guide_reg_num initially null
                expert_reg_num
            ];

            const [insertResult] = await db.query(insertSql, insertValues);

            if (insertResult.affectedRows === 0) {
                return next(createError(500, 'Failed to insert expert review marks'));
            }

            return res.status(200).json({
                success: true,
                message: 'Expert marks added successfully',
                data: {
                    total_marks: total_expert_marks
                }
            });
        } else {
            // Update existing record
            const total_guide_marks = existingMarks[0].total_guide_marks || 0;
            const total_marks = total_guide_marks + total_expert_marks;

            const updateSql = `
                UPDATE review_marks_individual SET
                    expert_oral_presentation = ?,
                    expert_viva_voce_and_ppt = ?,
                    expert_contributions = ?,
                    total_expert_marks = ?,
                    total_marks = ?,
                    expert_remarks = ?
                WHERE review_title = ? 
                AND review_date = ? 
                AND team_id = ?
                AND expert_reg_num = ?
            `;

            const updateValues = [
                expert_oral_presentation,
                expert_viva_voce_and_ppt,
                expert_contributions,
                total_expert_marks,
                total_marks,
                expert_remarks,
                review_title,
                formattedDate,
                team_id,
                expert_reg_num
            ];

            const [updateResult] = await db.query(updateSql, updateValues);

            if (updateResult.affectedRows === 0) {
                return next(createError(404, 'No matching record found to update'));
            }

            return res.status(200).json({
                success: true,
                message: 'Expert marks updated successfully',
                data: {
                    total_marks
                }
            });
        }
    } catch (error) {
        console.error('Error adding expert marks:', {
            error: error.message,
            params: req.params,
            body: req.body,
            timestamp: new Date().toISOString()
        });
        return next(createError(500, 'Failed to process expert marks'));
    }
};


module.exports = {
    sendExpertRequest,
    getExpertRequests,
    fetchExpertTeams,
    fetchReviewRequests,
    handleExpertRequest,
    fetchCompletedReviews,
    handleExpertReviewConfirmation,
    fetchExpertUpcomingReviews,
    markReviewEndTime,
    addExpertTeamReviewMarks,
    addExpertMarksToIndividual,

};
