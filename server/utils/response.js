/**
 * Standard success response format
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {object} [data] - Optional response data
 */
const successResponse = (res, statusCode, message, data = {}) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Standard error response format
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {object} [errors] - Optional error details
 */
const errorResponse = (res, statusCode, message, errors = {}) => {
    res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};

module.exports = {
    successResponse,
    errorResponse,
};