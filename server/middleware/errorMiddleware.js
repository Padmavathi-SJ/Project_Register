const { errorResponse } = require('../utils/response');

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, 401, 'Invalid token');
    }

    // Handle token expiration
    if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Token expired');
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return errorResponse(res, 400, 'Validation error', err.errors);
    }

    // Handle duplicate key errors (MySQL)
    if (err.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 409, 'Duplicate entry', {
            field: err.sqlMessage.split("'")[1] || 'unknown',
        });
    }

    // Default error response
    errorResponse(
        res,
        err.statusCode || 500,
        err.message || 'Internal Server Error'
    );
};

module.exports = errorHandler;