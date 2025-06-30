const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const  createError  = require('http-errors');

const getUserRoleForTeam = async (req, res, next) => {
    try {
        const { reg_num, team_id } = req.params;

        // Validate inputs
        if (!reg_num?.trim() || !team_id?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: 'Registration number and team ID are required'
            });
        }

        // SQL query to get team mentors
        const sql = "SELECT guide_reg_num, sub_expert_reg_num FROM teams WHERE team_id = ?";
        const [teamData] = await db.query(sql, [team_id]);

        // Handle team not found
        if (teamData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Not found',
                error: 'Team not found'
            });
        }

        const team = teamData[0];
        let role = null;

        // Determine role
        if (team.guide_reg_num === reg_num) {
            role = 'guide';
        } else if (team.sub_expert_reg_num === reg_num) {
            role = 'sub_expert';
        }

        // Return response
        if (role) {
            return res.status(200).json({
                success: true,
                message: 'Role retrieved successfully',
                data: {
                    role,
                    team_id
                }
            });
        } else {
            return res.status(200).json({
                success: true,
                message: 'User is neither guide nor expert for this team',
                data: {
                    role: null,
                    team_id
                }
            });
        }

    } catch (error) {
        console.error('Error fetching user role:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to determine user role',
            error: {
                code: 'USER_ROLE_ERROR',
                reference: `ERR-${Date.now()}`
            }
        });
    }
};


module.exports = {
    getUserRoleForTeam,

};
