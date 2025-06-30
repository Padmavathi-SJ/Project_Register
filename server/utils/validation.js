const { errorResponse } = require('./response');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
const isStrongPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

/**
 * Middleware to validate registration input
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
// Add this validation function
const isValidRole = (role) => {
    const validRoles = ['staff', 'student', 'editor', 'admin'];
    return validRoles.includes(role);
};

// Update the validateRegisterInput middleware
const validateRegisterInput = (req, res, next) => {
    const { emailId, password, name, role = 'staff' } = req.body; // Default to 'staff'
    console.log(req.body, "lllllllllll", emailId, password, name, "validation.js");
    if (!emailId || !password || !name) {
        return errorResponse(res, 400, 'Email, password, and name are required');
    }

    if (!isValidEmail(emailId)) {
        return errorResponse(res, 400, 'Invalid email format');
    }

    if (!isStrongPassword(password)) {
        return errorResponse(
            res,
            400,
            'Password must be at least 8 characters long and contain...'
        );
    }

    if (role && !isValidRole(role)) {
        return errorResponse(res, 400, 'Invalid role specified');
    }

    req.body.role = role; // Ensure role is set
    next();
};

/**
 * Middleware to validate login input
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const validateLoginInput = (req, res, next) => {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
        return errorResponse(res, 400, 'Email and password are required');
    }

    if (!isValidEmail(emailId)) {
        return errorResponse(res, 400, 'Invalid email format');
    }

    next();
};

module.exports = {
    validateRegisterInput,
    validateLoginInput,
    isValidEmail,
    isStrongPassword,
};