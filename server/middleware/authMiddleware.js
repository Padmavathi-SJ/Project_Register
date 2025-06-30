const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { errorResponse } = require('../utils/response');
const { jwt: jwtConfig } = require('../config/envConfig');

/**
 * Middleware to verify JWT access token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const verifyAccessToken = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies.accessToken;
        if (!token) {
            return errorResponse(res, 401, 'Access token not provided');
        }

        // Verify token
        const decoded = jwt.verify(token, jwtConfig.secret);
        // Check if user exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return errorResponse(res, 401, 'User not found');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 401, 'Access token expired');
        }
        return errorResponse(res, 401, 'Invalid access token');
    }
};

/**
 * Middleware to verify refresh token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const verifyRefreshToken = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies.refreshToken;

        if (!token) {
            return errorResponse(res, 401, 'Refresh token not provided');
        }

        // Check if token is in Redis (invalidated tokens)
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return errorResponse(res, 401, 'Refresh token invalidated');
        }

        // Verify token
        const decoded = jwt.verify(token, jwtConfig.secret);

        // Check if user exists and token matches
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== token) {
            return errorResponse(res, 401, 'Invalid refresh token');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 401, 'Refresh token expired');
        }
        return errorResponse(res, 401, 'Invalid refresh token');
    }
};


module.exports = {
    verifyAccessToken,
    verifyRefreshToken,

};