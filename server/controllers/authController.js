const jwt = require('jsonwebtoken');
const User = require('../models/User');
// const pool = require('../config/db');
const db = require('../config/db');
const redisClient = require('../config/redis');
const { successResponse, errorResponse } = require('../utils/response');
const { jwt: jwtConfig } = require('../config/envConfig');
const passport = require('passport'); // Add this line
/**
 * Generate JWT tokens
 * @param {object} user - User object
 * @returns {object} Tokens object with access and refresh tokens
 */
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, emailId: user.emailId },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
    );

    const refreshToken = jwt.sign(
        { userId: user.id },
        jwtConfig.secret,
        { expiresIn: jwtConfig.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
};

/**
 * Set tokens as HTTP-only cookies
 * @param {object} res - Express response object
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
// const setTokenCookies = (res, accessToken, refreshToken) => {
//     const accessTokenExpiry = new Date(
//         Date.now() + 15 * 60 * 1000
//     ); // 15 minutes
//     const refreshTokenExpiry = new Date(
//         Date.now() + 7 * 24 * 60 * 60 * 1000
//     ); // 7 days
//     console.log(accessToken, "accessToken");
//     res.cookie('accessToken', accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         expires: accessTokenExpiry,
//     });

//     res.cookie('refreshToken', refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         expires: refreshTokenExpiry,
//         path: '/api/auth/refresh',
//     });
// };

const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // For development, allow cross-site cookies
    const sameSiteSetting = isProduction ? 'none' : 'lax';

    // Access Token Cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction, // true in production (requires HTTPS)
        sameSite: sameSiteSetting,
        maxAge: 15 * 60 * 1000, // 15 minutes
        domain: process.env.COOKIE_DOMAIN || 'localhost'
    });

    // Refresh Token Cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: sameSiteSetting,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: process.env.COOKIE_DOMAIN || 'localhost'
    });
};

/**
 * Register a new user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const register = async (req, res) => {
    try {
        const { emailId, password, name, reg_num, role = 'staff' } = req.body; // Default to 'staff'
        // Check if user already exists
        const existingUser = await User.findByEmail(emailId);
        if (existingUser) {
            return errorResponse(res, 409, 'Email already in use');
        }

        // Create new user
        const user = await User.create(emailId, password, name, reg_num, role);
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Update user with refresh token
        await User.updateRefreshToken(user.id, refreshToken);

        // Set tokens as cookies
        setTokenCookies(res, accessToken, refreshToken);

        // Return success response (excluding sensitive data)
        successResponse(res, 201, 'User registered successfully', {
            user: user,
        });
    } catch (err) {
        errorResponse(res, 500, 'Registration failed', err);
    }
};

/**
 * Login user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */

const loginUser = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        // Basic validation
        if (!emailId || !password) {
            return errorResponse(res, 400, 'Email and password are required');
        }

        const user = await User.findByEmail(emailId);
        if (!user) {
            return errorResponse(res, 401, 'Invalid email or password');
        }

        // Handle OAuth users
        if (user.google_id) {
            return errorResponse(res, 401, 'Please sign in with Google');
        }

        // Handle non-OAuth users with plaintext check
        if (!user.password || user.password !== password.trim()) {
            return errorResponse(res, 401, 'Invalid email or password');
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);
        await User.updateRefreshToken(user.id, refreshToken);
        setTokenCookies(res, accessToken, refreshToken);

        // Return user data (without sensitive info)
        const { password: _, refreshToken: __, ...safeUser } = user;
        successResponse(res, 200, 'Login successful', {
            user: safeUser
        });

    } catch (err) {
        console.error('Login error:', err);
        errorResponse(res, 500, 'Login failed');
    }
};

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        const user = await User.findByEmail(emailId);
        
        if (!user) {
            return errorResponse(res, 401, 'Invalid email or password');
        }

        // Skip password check for OAuth users
        if (user.google_id && !password) {
            return errorResponse(res, 401, 'Please sign in with Google');
        }

        if (!user.google_id) {
            const isPasswordValid = await User.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return errorResponse(res, 401, 'Invalid email or password');
            }
        }

        // Verify password
        const isPasswordValid = await User.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return errorResponse(res, 401, 'Invalid email or password');
        }
        const reg_num = user.reg_num;
        const roles = {
            sub_expert_reg_num: null,
            guide_reg_num: null,
            mentor_reg_num: null
        };

        // First query - teams
        const [teamResults] = await db.query(
            "SELECT sub_expert_reg_num, guide_reg_num FROM teams WHERE reg_num = ?",
            [reg_num]
        );

        if (teamResults.length > 0) {
            roles.sub_expert_reg_num = teamResults[0].sub_expert_reg_num;
            roles.guide_reg_num = teamResults[0].guide_reg_num;
        }

        // Second query - mentors_mentees (executes only after first query completes)
        const [mentorResults] = await db.query(
            "SELECT mentor_reg_num FROM mentors_mentees WHERE mentee_reg_num = ?",
            [reg_num]
        );

        if (mentorResults.length > 0) {
            roles.mentor_reg_num = mentorResults[0].mentor_reg_num;
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);
        // Update user with refresh token
        await User.updateRefreshToken(user.id, refreshToken);

        // Set tokens as cookies
        setTokenCookies(res, accessToken, refreshToken);
        const { password: _pwd, refreshToken: _token, ...safeUser } = user;
        console.log(safeUser, "logincontroller");
        // Return success response (excluding sensitive data)
        successResponse(res, 200, 'Login successful', {
            user: { ...safeUser, ...roles },
        });
    } catch (err) {
        errorResponse(res, 500, 'Login failed', err);
    }
};

/**
 * Refresh access token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const refreshToken = async (req, res) => {
    try {
        const user = req.user;

        // Generate new tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Update user with new refresh token
        await User.updateRefreshToken(user.id, refreshToken);

        // Invalidate old refresh token in Redis
        await redisClient.setEx(
            `blacklist:${req.cookies.refreshToken}`,
            Math.floor(7 * 24 * 60 * 60), // 7 days in seconds
            'invalidated'
        );

        // Set new tokens as cookies
        setTokenCookies(res, accessToken, refreshToken);

        successResponse(res, 200, 'Token refreshed successfully');
    } catch (err) {
        errorResponse(res, 500, 'Token refresh failed', err);
    }
};

/**
 * Logout user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (refreshToken) {
            // Invalidate refresh token in Redis
            await redisClient.setEx(
                `blacklist:${refreshToken}`,
                Math.floor(7 * 24 * 60 * 60), // 7 days in seconds
                'invalidated'
            );

            // Clear refresh token from user record
            await User.updateRefreshToken(req.user.id, null);
        }

        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

        successResponse(res, 200, 'Logout successful');
    } catch (err) {
        errorResponse(res, 500, 'Logout failed', err);
    }
};

/**
 * Protected route example
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const protectedRoute = async (req, res) => {
    const reg_num = req.user.reg_num;
    const roles = {
        sub_expert_reg_num: null,
        guide_reg_num: null,
        mentor_reg_num: null
    };
	
    console.log(reg_num)
    console.log(roles)

    // First query - teams
    const [teamResults] = await db.query(
        "SELECT sub_expert_reg_num, guide_reg_num FROM teams WHERE reg_num = ?",
        [reg_num]
    );

    if (teamResults.length > 0) {
        roles.sub_expert_reg_num = teamResults[0].sub_expert_reg_num;
        roles.guide_reg_num = teamResults[0].guide_reg_num;
    }

    // Second query - mentors_mentees (executes only after first query completes)
    const [mentorResults] = await db.query(
        "SELECT mentor_reg_num FROM mentors_mentees WHERE mentee_reg_num = ?",
        [reg_num]
    );

    if (mentorResults.length > 0) {
        roles.mentor_reg_num = mentorResults[0].mentor_reg_num;
    }
    const { password: _pwd, refreshToken: _token, ...safeUser } = req.user;
    console.log(safeUser, "safeuser protected");
    successResponse(res, 200, 'Access granted to protected route', {
        // user: {
        //     id: req.user.id,
        //     emailId: req.user.emailId,
        //     reg_num: req.user.reg_num,
        //     name: req.user.name,
        //     role: req.user.role
        // },
        user: { ...safeUser, ...roles },
    });
};

/**
 * Initiate Google OAuth login
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const googleAuth = (req, res) => {
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false, // We'll handle session ourselves
    })(req, res);
};

/**
 * Google OAuth callback
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const googleAuthCallback = async (req, res, next) => {
    passport.authenticate(
        'google',
        { session: false, failureRedirect: '/api/auth/failure' },
        async (err, user) => {
            try {
                // Handle the custom redirect error
                if (err?.redirectTo) {
                    return res.redirect(err.redirectTo);
                }
                if (err || !user) {
                    return errorResponse(res, 401, 'Google authentication failed');
                }

                // Generate tokens (same as regular login)
                const { accessToken, refreshToken } = generateTokens(user);

                // Update user with refresh token
                await User.updateRefreshToken(user.id, refreshToken);

                // Set tokens as cookies
                setTokenCookies(res, accessToken, refreshToken);

                // Redirect to frontend with tokens in cookies
                // Or return JSON response if it's an API call
                // console.log(user.reg_num, "reg_numberrrrrrrrrrr");
                if (req.headers.accept?.includes('application/json')) {
                    return successResponse(res, 200, 'Google login successful', {
                        user: {
                            id: user.id,
                            emailId: user.emailId,
                            name: user.name,
                            reg_num: user.reg_num,
                            role: user.role,
                        },
                    });
                }

                // For web flow, redirect to frontend
                res.redirect(`${process.env.FRONTEND_URL}`);
            } catch (error) {
                next(error);
            }
        }
    )(req, res, next);
};

/**
 * Authentication failure handler
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
// const authFailure = (req, res) => {
//     errorResponse(res, 401, 'Authentication failed');
// };
const authFailure = (req, res) => {
    // Redirect to frontend with error message
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=authentication_failed`);
};

module.exports = {
    register,
    loginUser,
    login,
    refreshToken,
    logout,
    protectedRoute,
    googleAuth,
    googleAuthCallback,
    authFailure,
};
